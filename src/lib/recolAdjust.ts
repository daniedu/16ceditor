/**
 * Port of recol's colour-adjustment system (https://github.com/nlkli/recol,
 * recol-lib/src/adjustments.rs — MIT license).
 *
 * recol applies adjustments like `red.sat=20,b=10` to groups of terminal
 * colors (bg/fg/selection/cursor/palette/red/green/…). This panel adapts the
 * same twelve adjustments to the site's Base16 model:
 *
 *   recol group        ≈  Base16 selection here
 *   ───────────────       ─────────────────────────
 *   All                  all 16 base colours
 *   Palette (pal)        accents base08–base0F
 *   bg / fg              base00 / base05
 *   red…pink             base08…base0F (per colour)
 *
 * Semantics are ported verbatim from recol's implementation, including the
 * signed ranges (-100..100) and the HSL/HSV/Lab spaces recol uses per
 * adjustment.
 */

import { BaseKey, ColorScheme, BASE_KEYS } from "./types";
import { hexToRgb } from "./color";
import {
  RecolColor,
  colorFromRgb8,
  colorToHex,
  recolFromHsl,
  recolFromHsv,
  recolHsl,
  recolHsv,
  recolFromLab,
  recolLab,
  recolShade,
} from "./recol";

export type RecolGroup =
  | "all"
  | "neutrals"
  | "accents"
  | "bg" | "fg"
  | "red" | "orange" | "yellow" | "green"
  | "cyan" | "blue" | "magenta" | "brown";

export type RecolAdjustKind =
  | "exposure"
  | "fade"
  | "brightness"
  | "gamma"
  | "contrast"
  | "saturation"
  | "vibrance"
  | "hue"
  | "temperature"
  | "tint"
  | "normalize"
  | "invert";

export type NormalizeChannel = "l" | "c" | "both";

export interface RecolAdjust {
  kind: RecolAdjustKind;
  group: RecolGroup;
  /** -100..100 semantics as in recol (clamped). Parsed but unused for invert. */
  value: number;
  channel?: NormalizeChannel;
}

export const GROUP_KEYS: Record<RecolGroup, BaseKey[]> = {
  all: BASE_KEYS,
  neutrals: ["base00", "base01", "base02", "base03", "base04", "base05", "base06", "base07"],
  accents: ["base08", "base09", "base0A", "base0B", "base0C", "base0D", "base0E", "base0F"],
  bg: ["base00"],
  fg: ["base05"],
  red: ["base08"],
  orange: ["base09"],
  yellow: ["base0A"],
  green: ["base0B"],
  cyan: ["base0C"],
  blue: ["base0D"],
  magenta: ["base0E"],
  brown: ["base0F"],
};

export const RECOL_GROUPS: { id: RecolGroup; label: string }[] = [
  { id: "all", label: "All" },
  { id: "neutrals", label: "Neutrals" },
  { id: "accents", label: "Accents" },
  { id: "bg", label: "Background" },
  { id: "fg", label: "Foreground" },
  { id: "red", label: "Red" },
  { id: "orange", label: "Orange" },
  { id: "yellow", label: "Yellow" },
  { id: "green", label: "Green" },
  { id: "cyan", label: "Cyan" },
  { id: "blue", label: "Blue" },
  { id: "magenta", label: "Magenta" },
  { id: "brown", label: "Brown" },
];

export const RECOL_ADJUST_KINDS: { kind: RecolAdjustKind; label: string; desc: string }[] = [
  { kind: "exposure", label: "Exposure", desc: "Photo exposure: scales linear light (±1 stop)" },
  { kind: "fade", label: "Fade", desc: "Blend raw RGB toward black (−) or white (+)" },
  { kind: "brightness", label: "Brightness", desc: "Shift HSL lightness uniformly" },
  { kind: "gamma", label: "Gamma", desc: "Nonlinear midtone curve; black/white stay fixed" },
  { kind: "contrast", label: "Contrast", desc: "Spread lightness around pivot 50 (recol CLI parity: + reduces contrast)" },
  { kind: "saturation", label: "Saturation", desc: "Scale HSV saturation uniformly" },
  { kind: "vibrance", label: "Vibrance", desc: "Boost weakly saturated colors; protects grays + vivid accents" },
  { kind: "hue", label: "Hue", desc: "Rotate hue by up to ±180°" },
  { kind: "temperature", label: "Temperature", desc: "Shift along blue↔yellow (Lab b*)" },
  { kind: "tint", label: "Tint", desc: "Shift along green↔magenta (Lab a*)" },
  { kind: "normalize", label: "Normalize", desc: "Pull colors toward the group's mean lightness/chroma" },
  { kind: "invert", label: "Invert", desc: "Flip lightness (dark↔light derivation); value ignored" },
];

/** Ephemeral engine helpers (mirror recol's adjustment formulas). */

/** Clamps an adjustment value to recol's standard [-100, 100] input range. */
const pct = (v: number) => Math.max(-100, Math.min(100, v));

/** TEMP_TINT_SCALE from recol: maps -100..100 onto a perceptually reasonable
 *  Lab a-star/b-star excursion (empirically ~±80 covers the practical gamut). */
const TEMP_TINT_SCALE = 0.8;

type Mapper = (c: RecolColor) => RecolColor;

const srgbDecode = (c: number) => (c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92);
const srgbEncode = (c: number) => (c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : c * 12.92);

const exposureMapper = (v: number): Mapper => {
  const factor = Math.pow(2, pct(v) / 100.0);
  return ({ r, g, b }) => ({
    r: srgbEncode(Math.min(1, Math.max(0, srgbDecode(r) * factor))),
    g: srgbEncode(Math.min(1, Math.max(0, srgbDecode(g) * factor))),
    b: srgbEncode(Math.min(1, Math.max(0, srgbDecode(b) * factor))),
  });
};

const fadeMapper = (v: number): Mapper => {
  const shift = pct(v) / 100.0;
  return (c) => recolShade(c, shift);
};

const brightnessMapper = (v: number): Mapper => {
  const delta = pct(v);
  return (c) => {
    const { h, s, l } = recolHsl(c);
    return recolFromHsl(h, s, Math.min(100, Math.max(0, l + delta)));
  };
};

const gammaMapper = (v: number): Mapper => {
  // v = 100 -> exponent 0.5 (brighten midtones); v = -100 -> 2.0 (darken)
  const exponent = Math.pow(2, -pct(v) / 100.0);
  return (c) => {
    const { h, s, l } = recolHsl(c);
    const normalized = Math.min(1, Math.max(0, l / 100.0));
    return recolFromHsl(h, s, Math.min(100, Math.max(0, Math.pow(normalized, exponent) * 100.0)));
  };
};

const contrastMapper = (v: number): Mapper => {
  // Maps -100..100 onto a spread factor of 0.0..2.0 around pivot 50.
  // (Recol CLI parity: positive input *reduces* contrast.)
  const factor = pct(-v) / 100.0 + 1.0;
  const pivot = 50.0;
  return (c) => {
    const { h, s, l } = recolHsl(c);
    return recolFromHsl(h, s, Math.min(100, Math.max(0, pivot + (l - pivot) * factor)));
  };
};

const saturationMapper = (v: number): Mapper => {
  const val = pct(v);
  return (c) => {
    const { h, s, v: value } = recolHsv(c);
    const newS =
      val >= 0.0 ? s + (100.0 - s) * (val / 100.0) : s + s * (val / 100.0);
    return recolFromHsv(h, newS, value);
  };
};

const vibranceMapper = (v: number): Mapper => {
  const amount = pct(v) / 100.0;
  return (c) => {
    const { h, s, v: value } = recolHsv(c);
    // Parabolic weight: zero at s=0 (protects grays) and s=100 (protects
    // already-vivid accents), peaking at s=50.
    const weight = 4.0 * (s / 100.0) * (1.0 - s / 100.0);
    const delta =
      amount >= 0.0 ? (100.0 - s) * amount * weight : s * amount * weight;
    return recolFromHsv(h, Math.min(100.0, Math.max(0.0, s + delta)), value);
  };
};

const hueMapper = (v: number): Mapper => {
  const degrees = (pct(v) / 100.0) * 180.0;
  return (c) => {
    const { h, s, v: value } = recolHsv(c);
    return recolFromHsv(h + degrees, s, value);
  };
};

const temperatureMapper = (v: number): Mapper => {
  const shift = pct(v) * TEMP_TINT_SCALE;
  return (c) => {
    const { L, a, b } = recolLab(c);
    return recolFromLab(L, a, b + shift);
  };
};

const tintMapper = (v: number): Mapper => {
  // Positive shifts toward magenta, negative toward green.
  const shift = pct(v) * TEMP_TINT_SCALE;
  return (c) => {
    const { L, a, b } = recolLab(c);
    return recolFromLab(L, a + shift, b);
  };
};

const invertMapper = (): Mapper => (c) => {
  const { h, s, l } = recolHsl(c);
  return recolFromHsl(h, s, 100.0 - l);
};

/** Apply one recol adjustment to a set of colors. Colors outside the group's
 *  selection are passed through unchanged. */
function applyAdjustToColors(
  colors: Map<BaseKey, RecolColor>,
  keys: BaseKey[],
  adj: RecolAdjust,
): void {
  if (adj.kind === "normalize") {
    // Pull every color in the group toward the group's average lightness
    // and/or chroma, reducing balance differences within the palette.
    const strength = pct(adj.value) / 100.0;
    const samples = keys.map((k) => recolHsl(colors.get(k)!));
    if (!samples.length) return;
    const meanL = samples.reduce((acc, { l }) => acc + l, 0) / samples.length;
    const meanS = samples.reduce((acc, { s }) => acc + s, 0) / samples.length;
    keys.forEach((k, i) => {
      const { h, s, l } = samples[i];
      const newL =
        adj.channel === "c" ? l : Math.min(100, Math.max(0, l + (meanL - l) * strength));
      const newS =
        adj.channel === "l" ? s : Math.min(100, Math.max(0, s + (meanS - s) * strength));
      colors.set(k, recolFromHsl(h, newS, newL));
    });
    return;
  }

  const mapper: Mapper = (() => {
    switch (adj.kind) {
      case "exposure": return exposureMapper(adj.value);
      case "fade": return fadeMapper(adj.value);
      case "brightness": return brightnessMapper(adj.value);
      case "gamma": return gammaMapper(adj.value);
      case "contrast": return contrastMapper(adj.value);
      case "saturation": return saturationMapper(adj.value);
      case "vibrance": return vibranceMapper(adj.value);
      case "hue": return hueMapper(adj.value);
      case "temperature": return temperatureMapper(adj.value);
      case "tint": return tintMapper(adj.value);
      case "invert": return invertMapper();
    }
  })();

  for (const k of keys) colors.set(k, mapper(colors.get(k)!));
}

/** `group` needs at least one key in GROUP_KEYS. */
export function applyOneRecolAdjust(
  scheme: ColorScheme,
  adj: RecolAdjust,
): ColorScheme {
  const keys = GROUP_KEYS[adj.group] ?? [];
  const colors = new Map<BaseKey, RecolColor>();
  for (const k of keys) {
    const [r, g, b] = hexToRgb(scheme[k]);
    colors.set(k, colorFromRgb8(r, g, b));
  }
  applyAdjustToColors(colors, keys, adj);

  const out: ColorScheme = { ...scheme };
  for (const k of keys) (out as unknown as Record<string, string>)[k] = colorToHex(colors.get(k)!);
  return out;
}

/** Apply a stack of recol adjustments sequentially (recol semantics:
 *  each adjustment operates on the result of the previous one). */
export function applyRecolAdjusts(scheme: ColorScheme, adjusts: RecolAdjust[]): ColorScheme {
  let cur = scheme;
  for (const adj of adjusts) cur = applyOneRecolAdjust(cur, adj);
  return cur;
}

//#region ── recol-style spec strings (`red.sat=20,b=10,nb=50`) ───────────────

const KIND_SPECS: { kind: RecolAdjustKind; spec: string; aliases: string[] }[] = [
  { kind: "brightness", spec: "b", aliases: ["b", "brightness"] },
  { kind: "exposure", spec: "e", aliases: ["e", "exposure"] },
  { kind: "contrast", spec: "c", aliases: ["c", "contrast"] },
  { kind: "saturation", spec: "s", aliases: ["s", "sat", "saturation"] },
  { kind: "vibrance", spec: "v", aliases: ["v", "vib", "vibrance"] },
  { kind: "hue", spec: "h", aliases: ["h", "hue"] },
  { kind: "temperature", spec: "t", aliases: ["t", "temp", "temperature"] },
  { kind: "tint", spec: "ti", aliases: ["ti", "tint"] },
  { kind: "gamma", spec: "g", aliases: ["g", "gamma"] },
  { kind: "fade", spec: "f", aliases: ["f", "fade"] },
  { kind: "invert", spec: "i", aliases: ["i", "invert"] },
  { kind: "normalize", spec: "n", aliases: ["n", "norm", "normalize", "nb", "norm-both", "nc", "norm-chroma"] },
];

const CHANNEL_BY_SPEC: Record<string, NormalizeChannel> = {
  n: "l", norm: "l", normalize: "l",
  nb: "both", "norm-both": "both",
  nc: "c", "norm-chroma": "c",
};

const GROUP_DICT: Record<string, RecolGroup> = {
  all: "all",
  "nt": "neutrals", neutrals: "neutrals", neutral: "neutrals",
  "ac": "accents", accents: "accents", accent: "accents", pal: "accents",
  bg: "bg", fg: "fg",
  red: "red", orange: "orange", yellow: "yellow", green: "green",
  cyan: "cyan", blue: "blue", magenta: "magenta", brown: "brown", pink: "brown",
};

function groupForToken(token: string): RecolGroup | undefined {
  return GROUP_DICT[token];
}

function kindForSpec(spec: string): { kind: RecolAdjustKind; channel?: NormalizeChannel } | undefined {
  for (const k of KIND_SPECS) {
    const specLower = spec.toLowerCase();
    if (!k.aliases.includes(specLower)) continue;
    if (k.kind === "normalize") return { kind: "normalize", channel: CHANNEL_BY_SPEC[specLower] ?? "l" };
    return { kind: k.kind };
  }
  return undefined;
}

/** Serialize an adjustment stack to recol-style spec text. */
export function adjustsToSpec(adjusts: RecolAdjust[]): string {
  const part = (adj: RecolAdjust): string => {
    const info = KIND_SPECS.find((k) => k.kind === adj.kind)!;
    let specName = adj.kind === "normalize" ? (adj.channel === "c" ? "nc" : adj.channel === "both" ? "nb" : "n") : info.spec;
    const groupPrefix = adj.group === "all" ? "" : `${adj.group}.`;
    return `${groupPrefix}${specName}=${adj.kind === "invert" ? Math.round(adj.value) || 1 : Math.round(adj.value)}`;
  };
  return adjusts.map(part).join(",");
}

/** Parse recol-style spec text (`--adjust` argument) into adjustments.
 *  Unparsable parts are collected in `errors` (expected while a user types). */
export function parseRecolSpec(spec: string): { adjusts: RecolAdjust[]; errors: string[] } {
  const adjusts: RecolAdjust[] = [];
  const errors: string[] = [];
  for (const raw of spec.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq <= 0) { errors.push(part); continue; }
    const value = Number(part.slice(eq + 1).trim());
    if (Number.isNaN(value)) { errors.push(part); continue; }

    let groupToken = "all";
    let kindToken = part.slice(0, eq).trim();
    const dot = kindToken.indexOf(".");
    if (dot > 0) {
      groupToken = kindToken.slice(0, dot).trim();
      kindToken = kindToken.slice(dot + 1).trim();
    }
    const group = groupToken.toLowerCase() === "all"
      ? "all" as RecolGroup
      : groupForToken(groupToken.toLowerCase());
    const kind = kindForSpec(kindToken);
    if (!group) { errors.push(part); continue; }
    if (!kind) { errors.push(part); continue; }
    adjusts.push({ kind: kind.kind, group, value, channel: kind.channel });
  }
  return { adjusts, errors };
}

//#endregion

export function normalizeChannelLabel(ch: NormalizeChannel): string {
  return ch === "l" ? "Lightness" : ch === "c" ? "Chroma" : "Both";
}

/** Describe an adjustment for display (`Red · Saturation +20`). */
export function describeAdjust(adj: RecolAdjust): string {  const kindLabel = RECOL_ADJUST_KINDS.find((k) => k.kind === adj.kind)?.label ?? adj.kind;
  const groupLabel = RECOL_GROUPS.find((g) => g.id === adj.group)?.label ?? adj.group;
  if (adj.kind === "invert") return `${groupLabel} · ${kindLabel}`;
  const channel = adj.kind === "normalize" ? (adj.channel === "c" ? " (chroma)" : adj.channel === "both" ? " (both)" : " (light)") : "";
  const sign = adj.value > 0 ? "+" : "";
  return `${groupLabel} · ${kindLabel}${channel} ${sign}${Math.round(adj.value)}`;
}

/** Whether a raw value would change anything for the given kind. */
export function isAdjustNoop(adj: RecolAdjust): boolean {
  // Recol's Invert ignores the value entirely — the flip always applies.
  if (adj.kind === "invert") return false;
  return pct(adj.value) === 0;
}
