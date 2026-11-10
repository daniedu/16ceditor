/**
 * Port of recol's colour scheme generator (https://github.com/nlkli/recol).
 *
 * recol derives a terminal theme from media by shelling out to FFmpeg's
 * `palettegen` filter and then applying its own theme-derivation logic
 * (`recol-lib/src/theme.rs`). This file reproduces both stages in TypeScript:
 *
 * 1. FFmpeg palettegen — median cut (Heckbert 1982) over an image histogram,
 *    working in an integer OkLab approximation. Ported from
 *    `libavfilter/vf_palettegen.c` + `libavfilter/palette.c`
 *    (FFmpeg, LGPL-2.1 — see https://github.com/FFmpeg/FFmpeg).
 * 2. recol theme derivation — polarity detection, bg/fg/ANSI role assignment,
 *    Lab lightness anchoring, WCAG contrast loops and a final text-normalize
 *    pass (recol-lib, MIT — see https://github.com/nlkli/recol).
 *
 * Differences vs. recol: instead of spawning ffmpeg, the histogram is built
 * once here and both max_colors=5/10 runs share it — identical to recol's two
 * ffmpeg passes over the same pixels.
 */

import { ColorScheme } from "./types";

//#region ── FFmpeg libavfilter/palette.c port (integer OkLab helpers) ────────
// LGPL-2.1: ported from libavfilter/palette.c + palette.h

const K = 65535; // (1 << 16) - 1
const K2 = K * K; // ≈ 4.3e9, far below 2^53 — exact in JS doubles
const P = 511; // (1 << 9) - 1

/** sRGB EOTF table from palette.c:
 *  f(x) = x < 0.04045 ? x/12.92 : ((x+0.055)/1.055)^2.4, remapped to [0;K]. */
const srgb2linear: Int32Array = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    const f = x < 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    t[i] = Math.round(f * K);
  }
  return t;
})();

/** sRGB OETF table downsampled to 9-bit resolution, as in palette.c:
 *  f(x) = x·12.92 below the linear threshold, else 1.055·x^(1/2.4)−0.055. */
const linear2srgb: Uint8Array = (() => {
  const t = new Uint8Array(P + 1);
  for (let i = 0; i <= P; i++) {
    const x = i / P;
    const f = x < 0.0031308 ? x * 12.92 : Math.pow(x, 1 / 2.4) * 1.055 - 0.055;
    t[i] = Math.round(f * 255);
  }
  return t;
})();

/** C-style integer division (truncation toward zero). Operands stay far
 *  below 2^53, so the double `Math.trunc(a / b)` is exact. */
function cDiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

/** div_round64 from palette.c: division with round-half adjustment —
 *  C: (a^b) < 0 ? (a - b/2)/b : (a + b/2)/b, where b/2 is integer division. */
function divRound64(a: number, b: number): number {
  const halfB = cDiv(b, 2);
  return ((a < 0) !== (b < 0)) ? cDiv(a - halfB, b) : cDiv(a + halfB, b);
}

/** cbrt01_int from palette.c: integer cube-root approximation on [0;1].
 *  The comment paraphrases Björn Ottosson's (`@bjhott` in the Oklab work). */
function cbrt01Int(x: number): number {
  // Approximation curve is for the [0;1] range
  if (x <= 0) return 0;
  if (x >= K) return K;

  // Initial approximation: x³ - 2.19893x² + 2.01593x + 0.219407
  const t1 = cDiv(x * (x + -144107), K);
  const t2 = cDiv(x * (t1 + 132114), K);
  let u = t2 + 14379;

  // Refine with 2 Halley iterations: uₙ₊₁ = uₙ(2x+uₙ³)/(x+2uₙ³)
  for (let i = 0; i < 2; i++) {
    const u3 = u * u * u;
    const den = x + cDiv(2 * u3 + K2 / 2, K2);
    u = cDiv(u * (2 * x + cDiv(u3 + K2 / 2, K2)) + cDiv(den, 2), den);
  }

  return u;
}

export interface OklabInt {
  /** L* in [0;K] (integer OkLab approximation scale) */
  L: number;
  a: number;
  b: number;
}

/** ff_srgb_u8_to_oklab_int: 24-bit sRGB → integer OkLab approximation. */
export function srgbU8ToOklabInt(srgb: number): OklabInt {
  const r = srgb2linear[(srgb >>> 16) & 0xff];
  const g = srgb2linear[(srgb >>> 8) & 0xff];
  const b = srgb2linear[srgb & 0xff];

  // Note: lms can actually be slightly over K due to rounded coefficients
  const l = cDiv(27015 * r + 35149 * g + 3372 * b + K / 2, K);
  const m = cDiv(13887 * r + 44610 * g + 7038 * b + K / 2, K);
  const s = cDiv(5787 * r + 18462 * g + 41286 * b + K / 2, K);

  const l_ = cbrt01Int(l);
  const m_ = cbrt01Int(m);
  const s_ = cbrt01Int(s);

  return {
    L: divRound64(13792 * l_ + 52010 * m_ - 267 * s_, K),
    a: divRound64(129628 * l_ - 159158 * m_ + 29530 * s_, K),
    b: divRound64(1698 * l_ + 51299 * m_ - 52997 * s_, K),
  };
}

/** ff_oklab_int_to_srgb_u8: integer OkLab → 24-bit sRGB. */
export function oklabIntToSrgbU8(c: OklabInt): number {
  const l_ = c.L + divRound64(25974 * c.a, K) + divRound64(14143 * c.b, K);
  const m_ = c.L + divRound64(-6918 * c.a, K) + divRound64(-4185 * c.b, K);
  const s_ = c.L + divRound64(-5864 * c.a, K) + divRound64(-84638 * c.b, K);

  const l = cDiv(l_ * l_ * l_, K2);
  const m = cDiv(m_ * m_ * m_, K2);
  const s = cDiv(s_ * s_ * s_, K2);

  const r = linearIntToSrgbU8(cDiv(267169 * l + -216771 * m + 15137 * s + K / 2, K));
  const g = linearIntToSrgbU8(cDiv(-83127 * l + 171030 * m + -22368 * s + K / 2, K));
  const b = linearIntToSrgbU8(cDiv(-275 * l + -46099 * m + 111909 * s + K / 2, K));

  return (r << 16) | (g << 8) | b;
}

/** ff_linear_int_to_srgb_u8: 16-bit linear light → 8-bit sRGB via a 9-bit LUT. */
function linearIntToSrgbU8(x: number): number {
  if (x <= 0) return 0;
  if (x >= K) return 0xff;
  const xP = x * P;
  const i = cDiv(xP, K);
  const m = xP - i * K;
  const y0 = linear2srgb[i];
  const y1 = linear2srgb[i + 1];
  return cDiv(m * (y1 - y0) + K / 2, K) + y0;
}

//#endregion

//#region ── FFmpeg vf_palettegen.c port (median cut in OkLab ints) ───────────
// LGPL-2.1: ported from get_palette_frame / compute_box_stats / split_box.

interface ColorRef {
  color: number; // packed 0xRRGGBB
  L: number;
  a: number;
  b: number;
  count: number;
}

interface RangeBox {
  start: number; // index in refs
  len: number; // number of referenced colors
  sortedBy: number; // major axis the range is already sorted by (-1 = none)
  avg: OklabInt;
  weight: number; // sum of all the weights
  cutScore: number; // how likely the box is to be cut (higher = more likely)
  majorAxis: number; // sort order id for cutting (see CMP_KEYS)
}

// cmp key orders, indexed by the id returned from sort3id():
// IDs in FFmpeg: XYZ=Lab, XZY=Lba, ZXY=bLa, YXZ=aLb, ZYX=baL, YZX=abL
const CMP_KEYS: [keyof OklabInt, keyof OklabInt, keyof OklabInt][] = [
  ["L", "a", "b"],
  ["L", "b", "a"],
  ["b", "L", "a"],
  ["a", "L", "b"],
  ["b", "a", "L"],
  ["a", "b", "L"],
];

/**
 * Return an identifier for the order of x, y, z (from higher to lower),
 * preferring x over y and y over z in case of equality.
 */
function sort3id(x: number, y: number, z: number): number {
  if (x >= y) {
    if (y >= z) return 0; // XYZ
    if (x >= z) return 1; // XZY
    return 2; // ZXY
  }
  if (x >= z) return 3; // YXZ
  if (y >= z) return 5; // YZX
  return 4; // ZYX
}

function computeBoxStats(refs: ColorRef[], box: RangeBox): void {
  // Compute average color (weighted by count), in integer OkLab space
  let sL = 0, sa = 0, sb = 0;
  box.weight = 0;
  for (let i = box.start; i < box.start + box.len; i++) {
    const ref = refs[i];
    sL += ref.L * ref.count;
    sa += ref.a * ref.count;
    sb += ref.b * ref.count;
    box.weight += ref.count;
  }
  box.avg = {
    L: Math.trunc(sL / box.weight),
    a: Math.trunc(sa / box.weight),
    b: Math.trunc(sb / box.weight),
  };

  // Compute squared error of each color channel
  let eL = 0, eA = 0, eB = 0;
  for (let i = box.start; i < box.start + box.len; i++) {
    const ref = refs[i];
    const dL = ref.L - box.avg.L;
    const da = ref.a - box.avg.a;
    const db = ref.b - box.avg.b;
    eL += dL * dL * ref.count;
    eA += da * da * ref.count;
    eB += db * db * ref.count;
  }

  // Define the best axis candidate for cutting the box
  box.majorAxis = sort3id(eL, eA, eB);

  // The box that has the axis with the biggest error amongst all boxes will
  // be cut down
  box.cutScore = Math.max(eL, eA, eB);
}

function cmpRefsWithin(keys: [keyof OklabInt, keyof OklabInt, keyof OklabInt]) {
  return (a: ColorRef, b: ColorRef): number => {
    for (const k of keys) {
      const d = a[k] - b[k];
      if (d < 0) return -1;
      if (d > 0) return 1;
    }
    return 0;
  };
}

/**
 * Main function implementing the Median Cut Algorithm defined by Paul Heckbert
 * in Color Image Quantization for Frame Buffer Display (1982) — the FFmpeg
 * palettegen variant, operating in integer OkLab space.
 */
export function palettegen(refsIn: ColorRef[], maxColors: number): ColorRef[] {
  maxColors = Math.max(2, Math.min(256, maxColors));
  const refs = refsIn;

  const boxes: RangeBox[] = [];
  const first: RangeBox = {
    start: 0, len: refs.length, sortedBy: -1,
    avg: { L: 0, a: 0, b: 0 }, weight: 0, cutScore: 0, majorAxis: 0,
  };
  computeBoxStats(refs, first);
  boxes.push(first);
  let nbBoxes = 1;

  for (;;) {
    // Find the next box to split: pick the one with the highest cut score
    let bestBoxId = -1;
    let maxScore = -1;
    if (nbBoxes === maxColors) break;
    for (let boxId = 0; boxId < nbBoxes; boxId++) {
      const box = boxes[boxId];
      if (box.len >= 2 && box.cutScore > maxScore) {
        bestBoxId = boxId;
        maxScore = box.cutScore;
      }
    }
    if (bestBoxId < 0) break;

    const box = boxes[bestBoxId];

    // Sort the range by its major axis if it's not already sorted
    if (box.sortedBy !== box.majorAxis) {
      const sub = refs.slice(box.start, box.start + box.len);
      sub.sort(cmpRefsWithin(CMP_KEYS[box.majorAxis]));
      for (let j = 0; j < sub.length; j++) refs[box.start + j] = sub[j];
      box.sortedBy = box.majorAxis;
    }

    // Locate the median where to split.
    const median = Math.floor((box.weight + 1) / 2);
    let weight = 0;
    let i = box.start;
    const stop = box.start + box.len - 2;
    // If you have 2 boxes, the maximum is actually #0: you must have at
    // least 1 color on each side of the split, hence the -2.
    for (; i < stop; i++) {
      weight += refs[i].count;
      if (weight > median) break;
    }

    // Split given box in two at position i. The original box becomes the left
    // part of the split, and the new index box is the right part.
    const newBox: RangeBox = {
      start: i + 1, len: 0, sortedBy: box.sortedBy,
      avg: { L: 0, a: 0, b: 0 }, weight: 0, cutScore: 0, majorAxis: 0,
    };
    newBox.len = box.start + box.len - newBox.start;
    box.len -= newBox.len;
    nbBoxes++;
    boxes.push(newBox);
    computeBoxStats(refs, box);
    computeBoxStats(refs, newBox);
  }

  // Write the palette: each box becomes its average color in OkLab converted
  // to sRGB, then the palette is sorted ascending by its packed RGB value.
  return boxes
    .slice(0, nbBoxes)
    .map((b) => ({ color: oklabIntToSrgbU8(b.avg) }))
    .sort((a, b) => a.color - b.color)
    .map((o) => {
      const lab = srgbU8ToOklabInt(o.color);
      return { color: o.color, L: lab.L, a: lab.a, b: lab.b, count: 1 };
    });
}

/** ff_lowbias32 from libavutil/hash.h — the histogram bucket hash. */
function lowbias32(x: number): number {
  let h = x >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return h;
}

const HIST_MASK = (1 << 15) - 1; // HIST_SIZE (1<<15) buckets, matching FFmpeg

/**
 * Build the palettegen histogram: unique colors with counts, enumerated in
 * the same bucket order `load_color_refs` produces (hash buckets 0..HIST_SIZE,
 * entries in first-encounter order within each bucket).
 */
export function buildHistogram(data: Uint8ClampedArray): ColorRef[] {
  // Pass 1: unique colors with counts in first-encounter order.
  const counts = new Map<number, number>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 250) continue; // treat near-transparent pixels as absent
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Pass 2: distribute unique colors into ff_lowbias32 hash buckets (entries
  // keep first-encounter order within each bucket).
  const buckets: ColorRef[][] = new Array(HIST_MASK + 1);
  for (const color of counts.keys()) {
    const bucket = (buckets[lowbias32(color) & HIST_MASK] ??= []);
    bucket.push({ color, L: 0, a: 0, b: 0, count: 0 });
  }

  // Load color refs in bucket order (matches load_color_refs' crawl order).
  const refs: ColorRef[] = [];
  for (const bucket of buckets) {
    if (!bucket) continue;
    for (const ref of bucket) {
      const lab = srgbU8ToOklabInt(ref.color);
      ref.L = lab.L;
      ref.a = lab.a;
      ref.b = lab.b;
      ref.count = counts.get(ref.color)!;
      refs.push(ref);
    }
  }
  return refs;
}

//#endregion

//#region ── recol Colour engine (recol-lib/src/color.rs port) ────────────────
// MIT: https://github.com/nlkli/recol — sRGB-float color with HSL/HSV and
// CIE L*a*b* (D65, Lindbloom matrices) conversions matching recol exactly.

export interface RecolColor {
  r: number;
  g: number;
  b: number;
}

function clamp01(v: number): number {
  return Number.isNaN(v) ? 0 : Math.min(1, Math.max(0, v));
}

function newColor(r: number, g: number, b: number): RecolColor {
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b) };
}

export function colorFromRgb8(r: number, g: number, b: number): RecolColor {
  return newColor(r / 255, g / 255, b / 255);
}

export function colorToHex(c: RecolColor): string {
  const byte = (v: number) => Math.round(v * 255) & 0xff;
  return "#" + ((byte(c.r) << 16) | (byte(c.g) << 8) | byte(c.b)).toString(16).padStart(6, "0");
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Inverse of srgbToLinear; unclamped (clamped later by newColor). */
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : Math.pow(c, 1 / 2.4) * 1.055 - 0.055;
}

// D65 reference white (Lindbloom's D65 sRGB matrices).
const D65_WHITE_X = 0.95047;
const D65_WHITE_Y = 1.0000001;
const D65_WHITE_Z = 1.08883;

// Exact CIE constants: ε = (6/29)³, κ = (29/3)³.
const LAB_EPSILON = 216.0 / 24389.0;
const LAB_KAPPA = 24389.0 / 27.0;

function labNonlinearity(t: number): number {
  return t > LAB_EPSILON ? Math.cbrt(t) : (LAB_KAPPA * t + 16.0) / 116.0;
}

function labNonlinearityInverse(t: number): number {
  const cubed = t * t * t;
  return cubed > LAB_EPSILON ? cubed : (116.0 * t - 16.0) / LAB_KAPPA;
}

/** CIE L*a*b* (D65) in f64 precision, as in recol Color::lab(). */
export function recolLab(c: RecolColor): { L: number; a: number; b: number } {
  const r = srgbToLinear(c.r), g = srgbToLinear(c.g), b = srgbToLinear(c.b);

  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / D65_WHITE_X;
  const y = (0.2126729 * r + 0.7151522 * g + 0.072175 * b) / D65_WHITE_Y;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / D65_WHITE_Z;

  const fx = labNonlinearity(x), fy = labNonlinearity(y), fz = labNonlinearity(z);
  return { L: 116.0 * fy - 16.0, a: 500.0 * (fx - fy), b: 200.0 * (fy - fz) };
}

/** L*a*b* → unclamped linear sRGB. */
function labToLinear(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16.0) / 116.0;
  const fx = a / 500.0 + fy;
  const fz = fy - b / 200.0;

  const x = D65_WHITE_X * labNonlinearityInverse(fx);
  const y = D65_WHITE_Y * labNonlinearityInverse(fy);
  const z = D65_WHITE_Z * labNonlinearityInverse(fz);

  return [
    3.2404548360214083 * x - 1.5371388501025751 * y - 0.49853154686848089 * z,
    -0.96926638987565372 * x + 1.8760109288424913 * y + 0.041556082346673524 * z,
    0.055643419604213658 * x - 0.20402585426769815 * y + 1.0572251624579287 * z,
  ];
}

function labInGamut(L: number, a: number, b: number): boolean {
  const TOL = 1e-6;
  const [r, g, bl] = labToLinear(L, a, b);
  return (
    r >= -TOL && r <= 1 + TOL &&
    g >= -TOL && g <= 1 + TOL &&
    bl >= -TOL && bl <= 1 + TOL
  );
}

/** L*a*b* (D65) → colour, clipping out-of-gamut channels (recol from_lab). */
export function recolFromLab(L: number, a: number, b: number): RecolColor {
  const [r, g, bl] = labToLinear(L, a, b);
  return newColor(linearToSrgb(r), linearToSrgb(g), linearToSrgb(bl));
}

/** L*a*b* → colour, mapping out-of-gamut values by bisecting chroma at
 *  constant lightness and hue (recol from_lab_gamut_mapped). */
export function recolFromLabGamutMapped(L: number, a: number, b: number): RecolColor {
  if (!Number.isFinite(L) || !Number.isFinite(a) || !Number.isFinite(b)) {
    return recolFromLab(L, a, b);
  }
  if (L <= 0.0) return newColor(0, 0, 0);
  if (L >= 100.0) return newColor(1, 1, 1);
  if (labInGamut(L, a, b)) return recolFromLab(L, a, b);

  const chroma = Math.hypot(a, b);
  const cosH = a / chroma, sinH = b / chroma;

  let inside = 0.0, outside = chroma;
  for (let i = 0; i < 32; i++) {
    const mid = 0.5 * (inside + outside);
    if (labInGamut(L, mid * cosH, mid * sinH)) inside = mid;
    else outside = mid;
  }
  return recolFromLab(L, inside * cosH, inside * sinH);
}

function wrapDegrees(degrees: number): number {
  const wrapped = ((degrees % 360.0) + 360.0) % 360.0;
  return wrapped >= 360.0 ? 0.0 : wrapped;
}

function hueAndExtremes(c: RecolColor): { h: number; min: number; max: number } {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  const delta = max - min;
  let hue = 0.0;
  if (delta !== 0.0) {
    if (max === c.r) hue = 60.0 * ((c.g - c.b) / delta);
    else if (max === c.g) hue = 60.0 * ((c.b - c.r) / delta + 2.0);
    else hue = 60.0 * ((c.r - c.g) / delta + 4.0);
    hue = wrapDegrees(hue);
  }
  return { h: hue, min, max };
}

/** (hue °, saturation %, value %) — recol Color::hsv(). */
export function recolHsv(c: RecolColor): { h: number; s: number; v: number } {
  const { h, min, max } = hueAndExtremes(c);
  const saturation = max === 0.0 ? 0.0 : (max - min) / max;
  return { h, s: saturation * 100.0, v: max * 100.0 };
}

/** (hue °, saturation %, lightness %) — recol Color::hsl(). */
export function recolHsl(c: RecolColor): { h: number; s: number; l: number } {
  const { h, min, max } = hueAndExtremes(c);
  const lightness = (max + min) / 2.0;
  const delta = max - min;
  const saturation =
    delta === 0.0 ? 0.0 : delta / (1.0 - Math.abs(2.0 * lightness - 1.0));
  return { h, s: saturation * 100.0, l: lightness * 100.0 };
}

/** recol Color::from_hsv. */
export function recolFromHsv(h: number, s: number, v: number): RecolColor {
  h = wrapDegrees(h);
  s = Math.min(100.0, Math.max(0.0, s)) / 100.0;
  v = Math.min(100.0, Math.max(0.0, v)) / 100.0;

  const channel = (n: number) => {
    const k = (((n + h / 60.0) % 6.0) + 6.0) % 6.0;
    // Rust: Min(4.0-k, k).Clamp(0.0, 1.0)
    const m = Math.min(4.0 - k, k);
    return v - v * s * Math.max(0.0, Math.min(1.0, m));
  };

  return newColor(channel(5.0), channel(3.0), channel(1.0));
}

/** recol Color::from_hsl. */
export function recolFromHsl(h: number, s: number, l: number): RecolColor {
  h = wrapDegrees(h);
  s = Math.min(100.0, Math.max(0.0, s)) / 100.0;
  l = Math.min(100.0, Math.max(0.0, l)) / 100.0;

  const amplitude = s * Math.min(l, 1.0 - l);
  const channel = (n: number) => {
    const k = (((n + h / 30.0) % 12.0) + 12.0) % 12.0;
    const t = Math.min(9.0 - k, k - 3.0);
    return l - amplitude * Math.max(-1.0, Math.min(1.0, t));
  };

  return newColor(channel(0.0), channel(8.0), channel(4.0));
}

/** Relative luminance (WCAG 2.x). */
export function recolLuminance(c: RecolColor): number {
  const r = srgbToLinear(c.r), g = srgbToLinear(c.g), b = srgbToLinear(c.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio in [1.0, 21.0]. */
export function recolContrast(a: RecolColor, b: RecolColor): number {
  const la = recolLuminance(a), lb = recolLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Linear interpolation in gamma-encoded sRGB (recol blend()). */
export function recolBlend(a: RecolColor, b: RecolColor, f: number): RecolColor {
  return newColor(a.r + (b.r - a.r) * f, a.g + (b.g - a.g) * f, a.b + (b.b - a.b) * f);
}

/** Linear interpolation in CIE L*a*b* (recol blend_lab()). */
export function recolBlendLab(a: RecolColor, b: RecolColor, f: number): RecolColor {
  const la = recolLab(a), lb = recolLab(b);
  return recolFromLabGamutMapped(
    la.L + (lb.L - la.L) * f,
    la.a + (lb.a - la.a) * f,
    la.b + (lb.b - la.b) * f,
  );
}

/** Lighten (amount > 0) / darken (< 0) by blending toward white/black in
 *  gamma-encoded sRGB (recol shade()). */
export function recolShade(c: RecolColor, amount: number): RecolColor {
  const target = amount >= 0 ? 1.0 : 0.0;
  return recolBlend(c, newColor(target, target, target), Math.abs(amount));
}

/** Adjust HSV *value* by delta percentage points (recol adjust_value()). */
export function recolAdjustValue(c: RecolColor, delta: number): RecolColor {
  const { h, s, v } = recolHsv(c);
  return recolFromHsv(h, s, v + delta);
}

/** Adjust HSV *saturation* by delta percentage points (recol adjust_saturation()). */
export function recolAdjustSaturation(c: RecolColor, delta: number): RecolColor {
  const { h, s, v } = recolHsv(c);
  return recolFromHsv(h, s + delta, v);
}

//#endregion

//#region ── recol Theme::from_media (recol-lib/src/theme.rs port) ────────────
// MIT: https://github.com/nlkli/recol

export interface AnsiColors {
  black: RecolColor;
  red: RecolColor;
  green: RecolColor;
  yellow: RecolColor;
  blue: RecolColor;
  magenta: RecolColor;
  cyan: RecolColor;
  white: RecolColor;
  /** Derived: blend_lab(red, yellow, 50%) — not part of the binary storage. */
  orange: RecolColor;
  /** Derived: blend_lab(white, red, 55.5%) with L* anchored to red. */
  pink: RecolColor;
}

export interface RecolTheme {
  isLight: boolean;
  bg: RecolColor;
  fg: RecolColor;
  selectionBg: RecolColor;
  selectionFg: RecolColor;
  cursorBg: RecolColor;
  cursorFg: RecolColor;
  base: AnsiColors;
  bright: AnsiColors;
}

/** ThemeAdjustment::Normalize(..., Lightness): pull the group colors toward
 *  their mean HSL lightness by `strengthPct`% (0–100). */
function normalizeLightness(colors: RecolColor[], strengthPct: number): RecolColor[] {
  const strength = strengthPct / 100.0;
  const hsls = colors.map((c) => recolHsl(c));
  const meanL = hsls.reduce((acc, { l }) => acc + l, 0.0) / hsls.length;
  return colors.map((c, i) => {
    const { h, s, l } = hsls[i];
    const newL = Math.min(100.0, Math.max(0.0, l + (meanL - l) * strength));
    return recolFromHsl(h, s, newL);
  });
}

/**
 * Derive a full recol theme from two palettegen palettes:
 * `p5` = palettegen(max_colors=5), `p10` = palettegen(max_colors=10).
 * Faithful port of `Theme::from_media` (recol-lib/src/theme.rs).
 */
export function deriveRecolTheme(p5: RecolColor[], p10: RecolColor[]): RecolTheme {
  const labL = (c: RecolColor) => recolLab(c).L;

  const isLight = (labL(p5[0]) + labL(p5[4])) * 0.5 > 50.0;

  let bg: RecolColor, fg: RecolColor, curBg: RecolColor, selBg: RecolColor;
  let curFg: RecolColor, selFg: RecolColor;
  if (isLight) {
    bg = p5[4]; fg = p5[0]; curBg = p5[1]; selBg = p5[3]; curFg = p5[3]; selFg = p5[2];
  } else {
    bg = p5[0]; fg = p5[4]; curBg = p5[3]; selBg = p5[1]; curFg = p5[2]; selFg = p5[3];
  }

  // Anchor cursor/selection foreground lightness to the background's L*
  {
    const targetL = labL(bg);
    const cf = recolLab(curFg);
    curFg = recolFromLab(targetL, cf.a, cf.b);
    const sf = recolLab(selFg);
    selFg = recolFromLab(targetL, sf.a, sf.b);
  }

  let palette: RecolColor[] = isLight
    ? [p10[1], p10[2], p10[3], p10[4], p10[5], p10[6], p10[7], p10[8]]
    : [p10[8], p10[7], p10[6], p10[5], p10[4], p10[3], p10[2], p10[1]];

  const targetL = isLight
    ? (labL(p10[4]) + labL(p10[5])) * 0.5
    : (labL(p10[6]) + labL(p10[5])) * 0.5;
  const shadeFactorStep = isLight ? -0.05 : 0.05;

  palette = palette.map((c) => {
    const { a, b } = recolLab(c);
    let adjusted = recolAdjustSaturation(recolFromLab(targetL, a, b), 2.0);
    let n = 0;
    while (recolContrast(adjusted, bg) < 3.0 && n < 99) {
      adjusted = recolAdjustSaturation(adjusted, 1.0);
      adjusted = recolShade(adjusted, shadeFactorStep);
      n++;
    }
    return adjusted;
  });

  let n = 0;
  while (recolContrast(fg, bg) < 6.0 && n < 99) {
    fg = recolShade(fg, shadeFactorStep);
    n++;
  }

  let black: RecolColor, white: RecolColor;
  if (isLight) {
    curBg = recolAdjustValue(curBg, -9.0);
    curFg = recolShade(curFg, 0.3);
    black = p10[9];
    white = fg;
  } else {
    curBg = recolAdjustValue(curBg, 9.0);
    curFg = recolShade(curFg, -0.3);
    black = p10[0];
    white = fg;
  }
  bg = recolAdjustSaturation(bg, -3.0);

  const [red, green, yellow, blue, magenta, cyan, orange, pink] = palette;

  const brightFactor = isLight ? -17.0 : 15.0;
  const bright = (c: RecolColor) => recolAdjustValue(c, brightFactor);

  const base: AnsiColors = { black, red, green, yellow, blue, magenta, cyan, white, orange, pink };
  const brights: AnsiColors = {
    black: bright(black),
    red: bright(red),
    green: bright(green),
    yellow: bright(yellow),
    blue: bright(blue),
    magenta: bright(magenta),
    cyan: bright(cyan),
    white: bright(white),
    orange: bright(orange),
    pink: bright(pink),
  };

  // Final recol step: Normalize(Text, 21, Lightness) over
  // [fg, sel.fg, cur.fg, base(10), bright(10)] — matching select order.
  const textColors = [
    fg, selFg, curFg,
    base.black, base.red, base.green, base.yellow, base.blue,
    base.magenta, base.cyan, base.white, base.orange, base.pink,
    brights.black, brights.red, brights.green, brights.yellow, brights.blue,
    brights.magenta, brights.cyan, brights.white, brights.orange, brights.pink,
  ];
  const normalized = normalizeLightness(textColors, 21.0);

  return {
    isLight,
    bg,
    fg: normalized[0],
    selectionBg: selBg,
    selectionFg: normalized[1],
    cursorBg: curBg,
    cursorFg: normalized[2],
    base: {
      black: normalized[3],
      red: normalized[4],
      green: normalized[5],
      yellow: normalized[6],
      blue: normalized[7],
      magenta: normalized[8],
      cyan: normalized[9],
      white: normalized[10],
      orange: normalized[11],
      pink: normalized[12],
    },
    bright: {
      black: normalized[13],
      red: normalized[14],
      green: normalized[15],
      yellow: normalized[16],
      blue: normalized[17],
      magenta: normalized[18],
      cyan: normalized[19],
      white: normalized[20],
      orange: normalized[21],
      pink: normalized[22],
    },
  };
}

//#endregion

//#region ── Image → recol theme → Base16 scheme ─────────────────────────────

export interface PreparedImage {
  data: Uint8ClampedArray; // RGBA bytes of the (full-resolution) image
  refs: ColorRef[]; // palettegen histogram, reused for both max_colors runs
}

/** Build the palettegen histogram once (shared by both max_colors runs). */
export function preparePalettegen(imageData: Uint8ClampedArray): PreparedImage {
  return { data: imageData, refs: buildHistogram(imageData) };
}

function palettegenColors(refs: ColorRef[], maxColors: number): RecolColor[] {
  return palettegen(refs, maxColors).map((r) =>
    colorFromRgb8((r.color >>> 16) & 0xff, (r.color >>> 8) & 0xff, r.color & 0xff),
  );
}

function padPalette(colors: RecolColor[], size: number): RecolColor[] {
  // palettegen returns fewer boxes than requested only when the image has
  // too few unique colors; pad by repeating the last color.
  const out = colors.slice();
  while (out.length < size) {
    const next = out[out.length - 1] ?? colorFromRgb8(128, 128, 128);
    out.push(next);
  }
  return out.slice(0, size);
}

/** recol's `palettegen_from_media`: two passes (max_colors 5 and 10). */
export function palettegenPair(prepared: PreparedImage): { p5: RecolColor[]; p10: RecolColor[] } {
  const p5 = padPalette(palettegenColors(prepared.refs, 5), 5);
  const p10 = padPalette(palettegenColors(prepared.refs, 10), 10);
  return { p5, p10 };
}

/** Map a recol theme onto this site's Base16 colour scheme.
 *  recol's eight accents (red…pink) map onto base08–base0F; the neutral
 *  ramp extends bg toward fg (perceptual Lab blend, keeping the bg hue),
 *  and base06/07 progress the fg toward its bright variant. */
export function recolThemeToBase16(
  theme: RecolTheme,
  name: string,
  sourceImage?: string,
): ColorScheme {
  const { bg, fg, base } = theme;
  const base01 = recolBlendLab(bg, fg, 0.1);
  const base02 = recolBlendLab(bg, fg, 0.2);
  const base03 = recolBlendLab(bg, fg, 0.42);
  const base04 = recolBlendLab(bg, fg, 0.72);
  const base06 = recolBlendLab(fg, theme.bright.white, 0.5);
  const base07 = theme.bright.white;

  const scheme: ColorScheme = {
    name,
    base00: colorToHex(bg),
    base01: colorToHex(base01),
    base02: colorToHex(base02),
    base03: colorToHex(base03),
    base04: colorToHex(base04),
    base05: colorToHex(fg),
    base06: colorToHex(base06),
    base07: colorToHex(base07),
    base08: colorToHex(base.red),
    base09: colorToHex(base.orange),
    base0A: colorToHex(base.yellow),
    base0B: colorToHex(base.green),
    base0C: colorToHex(base.cyan),
    base0D: colorToHex(base.blue),
    base0E: colorToHex(base.magenta),
    base0F: colorToHex(base.pink),
  };
  if (sourceImage) (scheme as { sourceImage?: string }).sourceImage = sourceImage;
  return scheme;
}

/** recol image-to-theme generator entry point for this site. */
export function extractRecolScheme(
  prepared: PreparedImage,
  name: string,
  sourceImage?: string,
): ColorScheme {
  const { p5, p10 } = palettegenPair(prepared);
  const theme = deriveRecolTheme(p5, p10);
  return recolThemeToBase16(theme, name || "recol", sourceImage);
}

//#endregion
