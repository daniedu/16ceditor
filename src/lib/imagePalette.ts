import { ColorScheme } from "./types";
import {
  rgbToHex, hexToRgb, rgbToHsl, hslToRgb, contrastRatio,
  rgbToLab, labToRgb, deltaE2000,
} from "./color";

export type ExtractAlgorithm =
  | "kmeans"
  | "median-cut"
  | "histogram"
  | "octree"
  | "monochrome"
  | "vibrant"
  | "muted"
  | "dominant"
  | "high-contrast"
  | "complementary"
  | "quicktheme"
  | "pywal"
  | "pywal-colorz"
  | "pywal-colorthief"
  | "wallust-kmeans"
  | "wallust-ansi";

export const ALGORITHM_LABELS: Record<ExtractAlgorithm, string> = {
  kmeans: "K-Means Clustering",
  "median-cut": "Median Cut",
  histogram: "Histogram Peak",
  octree: "Octree Quantization",
  monochrome: "Monochrome + Accent",
  vibrant: "Vibrant (Material)",
  muted: "Muted / Pastel",
  dominant: "Dominant Color",
  "high-contrast": "High Contrast",
  complementary: "Complementary",
  quicktheme: "Quicktheme (Perceptual)",
  pywal: "Pywal (IM Unique Colors)",
  "pywal-colorz": "Pywal · colorz (K-Means)",
  "pywal-colorthief": "Pywal · ColorThief (YIQ)",
  "wallust-kmeans": "wallust K-Means (Lab/ΔE)",
  "wallust-ansi": "wallust ANSI (HSV TTY)",
};

/** Extractors whose output is an ANSI0-15 slot palette (mapped straight into Base16). */
const ANSI_SLOT_ALGORITHMS: Set<ExtractAlgorithm> = new Set([
  "pywal", "pywal-colorz", "pywal-colorthief", "wallust-kmeans", "wallust-ansi",
]);

function rgbLuminance(r: number, g: number, b: number): number {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function colorDistance(a: number[], b: number[]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function samplePixels(
  img: HTMLImageElement,
  maxSamples: number,
): number[][] {
  const maxSize = 400;
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const step = Math.max(
    1,
    Math.floor(Math.sqrt((w * h) / maxSamples)),
  );

  const pixels: number[][] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a < 128) continue;
      pixels.push([r, g, b]);
    }
  }

  return pixels;
}

function sortByLuminance(
  colors: number[][],
): number[][] {
  return colors.sort((a, b) => {
    const la = rgbLuminance(a[0], a[1], a[2]);
    const lb = rgbLuminance(b[0], b[1], b[2]);
    return la - lb;
  });
}

function chromaticity(c: number[]): number {
  const r = c[0],
    g = c[1],
    b = c[2];
  const mean = (r + g + b) / 3;
  return (
    Math.abs(r - mean) + Math.abs(g - mean) + Math.abs(b - mean)
  );
}

function colorsToScheme(colors: number[][], name: string): ColorScheme {
  const sorted = sortByLuminance(colors);

  const neutrals = sorted.slice(0, 8);
  const accents = sorted
    .slice(8)
    .sort((a, b) => chromaticity(b) - chromaticity(a));

  const assign = (idx: number, list: number[][]): string => {
    const c = list[idx % list.length];
    return rgbToHex(c[0], c[1], c[2]);
  };

  return {
    name: name || "From Image",
    base00: assign(0, neutrals),
    base01: assign(1, neutrals),
    base02: assign(2, neutrals),
    base03: assign(3, neutrals),
    base04: assign(4, neutrals),
    base05: assign(5, neutrals),
    base06: assign(6, neutrals),
    base07: assign(7, neutrals),
    base08: assign(0, accents),
    base09: assign(1, accents),
    base0A: assign(2, accents),
    base0B: assign(3, accents),
    base0C: assign(4, accents),
    base0D: assign(5, accents),
    base0E: assign(6, accents),
    base0F: assign(7, accents),
  };
}

// -- K-Means --

function kMeans(
  pixels: number[][],
  k: number,
  maxIterations: number,
): number[][] {
  const dim = pixels[0].length;
  const min = pixels[0].slice();
  const max = pixels[0].slice();
  for (const p of pixels) {
    for (let i = 0; i < dim; i++) {
      if (p[i] < min[i]) min[i] = p[i];
      if (p[i] > max[i]) max[i] = p[i];
    }
  }

  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    const c: number[] = new Array(dim);
    for (let d = 0; d < dim; d++) {
      c[d] = min[d] + Math.random() * (max[d] - min[d]);
    }
    centroids.push(c);
  }

  const assignments = new Uint32Array(pixels.length);
  const accum: number[][] = Array.from({ length: k }, () => new Array(dim));
  const counts = new Uint32Array(k);

  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      let bestDist = Infinity;
      let bestIdx = 0;
      const px = pixels[i];
      for (let j = 0; j < k; j++) {
        const dist = colorDistance(px, centroids[j]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = j;
        }
      }
      assignments[i] = bestIdx;
    }

    for (let j = 0; j < k; j++) {
      const a = accum[j];
      for (let d = 0; d < dim; d++) {
        a[d] = 0;
      }
    }
    counts.fill(0);

    for (let i = 0; i < pixels.length; i++) {
      const a = assignments[i];
      const px = pixels[i];
      const dst = accum[a];
      for (let d = 0; d < dim; d++) {
        dst[d] += px[d];
      }
      counts[a]++;
    }

    let changed = false;
    for (let j = 0; j < k; j++) {
      const dst = accum[j];
      if (counts[j] > 0) {
        const inv = 1 / counts[j];
        for (let d = 0; d < dim; d++) {
          dst[d] *= inv;
        }
      } else {
        const src = centroids[j];
        for (let d = 0; d < dim; d++) {
          dst[d] = src[d];
        }
      }
      let dist = 0;
      const src = centroids[j];
      for (let d = 0; d < dim; d++) {
        const diff = dst[d] - src[d];
        dist += diff * diff;
      }
      if (dist > 1) changed = true;
    }

    for (let j = 0; j < k; j++) {
      const tmp = centroids[j];
      centroids[j] = accum[j];
      accum[j] = tmp;
    }

    if (!changed) break;
  }

  return centroids;
}

function extractKMeans(pixels: number[][], _k: number): number[][] {
  return kMeans(pixels, 16, 20);
}

// -- Median Cut --

function medianCutExtract(pixels: number[][], k: number): number[][] {
  const n = pixels.length;
  const indices = new Uint32Array(n);
  for (let i = 0; i < n; i++) indices[i] = i;

  interface Range { start: number; end: number }
  const boxes: Range[] = [{ start: 0, end: n }];

  while (boxes.length < k) {
    const box = boxes.shift()!;
    const len = box.end - box.start;
    if (len < 2) { boxes.push(box); break; }

    const dims = [Infinity, Infinity, Infinity];
    const maxs = [-Infinity, -Infinity, -Infinity];
    for (let i = box.start; i < box.end; i++) {
      const px = pixels[indices[i]];
      if (px[0] < dims[0]) dims[0] = px[0];
      if (px[0] > maxs[0]) maxs[0] = px[0];
      if (px[1] < dims[1]) dims[1] = px[1];
      if (px[1] > maxs[1]) maxs[1] = px[1];
      if (px[2] < dims[2]) dims[2] = px[2];
      if (px[2] > maxs[2]) maxs[2] = px[2];
    }

    const ranges = [maxs[0]-dims[0], maxs[1]-dims[1], maxs[2]-dims[2]];
    const channel = ranges[0] >= ranges[1]
      ? (ranges[0] >= ranges[2] ? 0 : 2)
      : (ranges[1] >= ranges[2] ? 1 : 2);

    const sub = indices.subarray(box.start, box.end);
    sub.sort((a, b) => pixels[a][channel] - pixels[b][channel]);

    const mid = box.start + Math.floor(len / 2);
    boxes.push({ start: box.start, end: mid });
    boxes.push({ start: mid, end: box.end });
  }

  return boxes.map((box) => {
    const sum = [0, 0, 0];
    const len = box.end - box.start;
    for (let i = box.start; i < box.end; i++) {
      const px = pixels[indices[i]];
      sum[0] += px[0]; sum[1] += px[1]; sum[2] += px[2];
    }
    return [sum[0] / len, sum[1] / len, sum[2] / len];
  });
}

// -- Histogram Peak --

function histogramExtract(pixels: number[][], k: number): number[][] {
  const bins = 16;
  const histogram = new Map<number, number>();

  for (const px of pixels) {
    const r = Math.floor(px[0] / (256 / bins));
    const g = Math.floor(px[1] / (256 / bins));
    const b = Math.floor(px[2] / (256 / bins));
    const key = (r << 10) | (g << 5) | b;
    histogram.set(key, (histogram.get(key) || 0) + 1);
  }

  const entries = Array.from(histogram.entries());
  entries.sort((a, b) => b[1] - a[1]);

  const radius = 2;
  const selected: number[] = [];

  for (const [key] of entries) {
    const r = (key >> 10) & 0x1f;
    const g = (key >> 5) & 0x1f;
    const b = key & 0x1f;

    let tooClose = false;
    for (const s of selected) {
      const sr = (s >> 10) & 0x1f;
      const sg = (s >> 5) & 0x1f;
      const sb = s & 0x1f;
      const dr = sr - r;
      const dg = sg - g;
      const db = sb - b;
      if (dr * dr + dg * dg + db * db <= radius * radius) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    selected.push(key);
    if (selected.length >= k) break;
  }

  return selected.map((key) => {
    const r = (key >> 10) & 0x1f;
    const g = (key >> 5) & 0x1f;
    const b = key & 0x1f;
    const step = 256 / bins;
    return [r * step + step / 2, g * step + step / 2, b * step + step / 2];
  });
}

// -- Octree Quantization --

class OctreeNode {
  children: (OctreeNode | null)[] = new Array(8).fill(null);
  count = 0;
  r = 0;
  g = 0;
  b = 0;
  isLeaf = false;
}

class Octree {
  root = new OctreeNode();
  leafCount = 0;
  reducible: OctreeNode[][] = Array.from({ length: 8 }, () => []);

  private addColor(node: OctreeNode, r: number, g: number, b: number, level: number) {
    if (level === 8) {
      node.count++;
      node.r += r;
      node.g += g;
      node.b += b;
      if (!node.isLeaf) {
        node.isLeaf = true;
        this.leafCount++;
      }
      return;
    }

    const rBit = (r >> (7 - level)) & 1;
    const gBit = (g >> (7 - level)) & 1;
    const bBit = (b >> (7 - level)) & 1;
    const idx = (rBit << 2) | (gBit << 1) | bBit;

    if (!node.children[idx]) {
      node.children[idx] = new OctreeNode();
      this.reducible[level].push(node.children[idx]!);
    }

    this.addColor(node.children[idx]!, r, g, b, level + 1);
  }

  private reduce() {
    for (let level = 7; level >= 0; level--) {
      const nodes = this.reducible[level];
      if (nodes.length === 0) continue;

      const node = nodes.pop()!;
      for (let i = 0; i < 8; i++) {
        const child = node.children[i];
        if (!child) continue;
        node.count += child.count;
        node.r += child.r;
        node.g += child.g;
        node.b += child.b;
        if (child.isLeaf) this.leafCount--;
        node.children[i] = null;
      }
      node.isLeaf = true;
      node.isLeaf;
      this.leafCount++;
      return;
    }
  }

  insert(r: number, g: number, b: number) {
    this.addColor(this.root, r, g, b, 0);
  }

  reduceTo(maxLeaves: number) {
    while (this.leafCount > maxLeaves) {
      this.reduce();
    }
  }

  getPalette(k: number): number[][] {
    const leaves: { r: number; g: number; b: number; count: number }[] = [];

    const traverse = (node: OctreeNode) => {
      if (node.isLeaf) {
        leaves.push({
          r: node.r / node.count,
          g: node.g / node.count,
          b: node.b / node.count,
          count: node.count,
        });
        return;
      }
      for (const child of node.children) {
        if (child) traverse(child);
      }
    };

    traverse(this.root);
    leaves.sort((a, b) => b.count - a.count);

    return leaves.slice(0, k).map((l) => [l.r, l.g, l.b]);
  }
}

function octreeExtract(pixels: number[][], k: number): number[][] {
  const tree = new Octree();
  for (const px of pixels) {
    tree.insert(px[0], px[1], px[2]);
  }
  tree.reduceTo(k);
  return tree.getPalette(k);
}

// -- Monochrome + Accent --

function findDominantHue(pixels: number[][]): number {
  const hueBuckets = new Array(36).fill(0);
  for (const px of pixels) {
    const { h } = rgbToHsl(px[0], px[1], px[2]);
    const bucket = Math.floor(h / 10) % 36;
    hueBuckets[bucket]++;
  }
  const maxBucket = hueBuckets.indexOf(Math.max(...hueBuckets));
  return maxBucket * 10;
}

function extractMonochrome(pixels: number[][], _k: number): number[][] {
  const dominantHue = findDominantHue(pixels);
  const grayscaleLevels = [0, 36, 72, 108, 144, 180, 216, 255];
  const baseColors = grayscaleLevels.map(v => [v, v, v]);
  const accentColors = [0, 30, 60, 120, 180, 240, 300, 0].map((offset, i) => {
    const h = (dominantHue + offset) % 360;
    const s = i === 7 ? 40 : 70 + (i % 3) * 5;
    const l = i === 7 ? 45 : 50 + (i % 3) * 5;
    return hslToRgb(h, s, l);
  });
  return [...baseColors, ...accentColors];
}

// -- Vibrant Extraction --

function extractVibrant(pixels: number[][], k: number): number[][] {
  const vibrant = pixels.filter(([r, g, b]) => {
    const { s, l } = rgbToHsl(r, g, b);
    return s > 40 && l > 20 && l < 80;
  });
  if (vibrant.length < 16) return kMeans(pixels, 16, 20);
  const sorted = [...vibrant].sort((a, b) => {
    const { s: sa } = rgbToHsl(a[0], a[1], a[2]);
    const { s: sb } = rgbToHsl(b[0], b[1], b[2]);
    return sb - sa;
  });
  return sorted.slice(0, Math.min(k, sorted.length));
}

// -- Muted/Pastel Extraction --

function extractMuted(pixels: number[][], k: number): number[][] {
  const muted = pixels.filter(([r, g, b]) => {
    const { s, l } = rgbToHsl(r, g, b);
    return s < 30 && l > 15 && l < 85;
  });
  if (muted.length < 16) return kMeans(pixels, 16, 20);
  return kMeans(muted, k, 20).map(([r, g, b]) => {
    const { h, s, l } = rgbToHsl(Math.round(r), Math.round(g), Math.round(b));
    return hslToRgb(h, Math.min(s, 20), Math.max(15, Math.min(80, l)));
  });
}

// -- Dominant Color Extraction --

function extractDominant(pixels: number[][], k: number): number[][] {
  const clusters = kMeans(pixels, 16, 20);
  const dominant = clusters.reduce((best, c) => {
    const count = pixels.filter(p => {
      const d2 = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
      return d2 < 5000;
    }).length;
    return count > (best.count || 0) ? { color: c, count } : best;
  }, { color: clusters[0], count: 0 });

  const { h } = rgbToHsl(Math.round(dominant.color[0]), Math.round(dominant.color[1]), Math.round(dominant.color[2]));
  const neutrals = [5, 15, 25, 35, 55, 70, 82, 92].map(l => hslToRgb(h, 10 + (l < 40 ? l * 0.4 : 20 - l * 0.15), l));
  const accents = [0, 30, 60, 120, 180, 210, 270, 0].map((offset, i) => {
    const ah = (h + offset) % 360;
    const s = i === 7 ? 40 : 70;
    const l = i === 7 ? 45 : 55;
    return hslToRgb(ah, s, l);
  });
  return [...neutrals, ...accents];
}

// -- High Contrast Extraction --

function adjustLightness(hex: string, delta: number): string {
  const [r, g, b] = hexToRgb(hex);
  let { h, s, l } = rgbToHsl(r, g, b);
  l = Math.max(0, Math.min(100, l + delta));
  return rgbToHex(...hslToRgb(h, s, l));
}

function extractHighContrast(pixels: number[][], k: number): number[][] {
  const colors = kMeans(pixels, 16, 20);
  const sorted = sortByLuminance(colors);
  const hexes = sorted.map(c => rgbToHex(c[0], c[1], c[2]));

  let base = hexes.slice(0, 8);
  let accents = hexes.slice(8);

  for (let i = 1; i < base.length; i++) {
    while (contrastRatio(base[i - 1], base[i]) < 2.0) {
      base[i] = adjustLightness(base[i], 5);
    }
  }
  while (contrastRatio(base[0], base[7]) < 7.0) {
    base[0] = adjustLightness(base[0], -3);
    base[7] = adjustLightness(base[7], 3);
  }
  accents = accents.map(a => {
    let c = a;
    while (contrastRatio(c, base[0]) < 4.5) {
      c = adjustLightness(c, 5);
    }
    return c;
  });
  const all = [...base, ...accents];
  return all.map(h => { const [r, g, b] = hexToRgb(h); return [r, g, b]; });
}

// -- Complementary Extraction --

function extractComplementary(pixels: number[][], _k: number): number[][] {
  const hues = pixels.map(([r, g, b]) => Math.floor(rgbToHsl(r, g, b).h / 10) * 10);
  const uniqueHues = [...new Set(hues)].sort((a, b) => a - b);

  let bestPair = [0, 180];
  let bestScore = 0;
  for (let i = 0; i < uniqueHues.length; i++) {
    for (let j = i + 1; j < uniqueHues.length; j++) {
      const diff = Math.abs(uniqueHues[i] - uniqueHues[j]);
      const score = 1 - Math.abs(diff - 180) / 180;
      if (score > bestScore) {
        bestScore = score;
        bestPair = [uniqueHues[i], uniqueHues[j]];
      }
    }
  }

  const [hue1, hue2] = bestPair;
  const neutrals = [10, 18, 25, 35, 55, 70, 82, 92].map(l => hslToRgb(hue1, l < 40 ? 20 + l * 0.3 : 25 - l * 0.15, l));
  const accents = [0, 0, 60, 120, 180, 210, 270, 0].map((offset, i) => {
    const baseHue = i % 2 === 0 ? hue1 : hue2;
    const ah = (baseHue + offset) % 360;
    const s = i === 7 ? 40 : 70;
    const l = i === 7 ? 45 : 55;
    return hslToRgb(ah, s, l);
  });
  return [...neutrals, ...accents];
}

// -- Quicktheme (Perceptual K-Means) --

function computeClusterCounts(
  pixels: number[][],
  centroids: number[][],
): number[] {
  const counts = new Array(centroids.length).fill(0);
  for (const p of pixels) {
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let j = 0; j < centroids.length; j++) {
      const dl = p[0] - centroids[j][0];
      const da = p[1] - centroids[j][1];
      const db = p[2] - centroids[j][2];
      const dist = dl * dl + da * da + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = j;
      }
    }
    counts[bestIdx]++;
  }
  return counts;
}

function deltaE2000Lab(lab1: number[], lab2: number[]): number {
  return deltaE2000(
    { l: lab1[0], a: lab1[1], b: lab1[2] },
    { l: lab2[0], a: lab2[1], b: lab2[2] },
  );
}

function selectFromClusters(
  dominantLab: number[],
  clusters: number[][],
  counts: number[],
  minDistance: number,
  maxDistance: number,
  minLightnessContrast: number,
): number[][] {
  const [dr, dg, db] = labToRgb(dominantLab[0], dominantLab[1], dominantLab[2]);
  const colors: number[][] = [[dr, dg, db]];
  const colorLabValues: number[][] = [dominantLab];

  let foregroundPicked = false;
  let currentMinDistance = minDistance;
  let currentLightnessContrast = minLightnessContrast;

  const sortedIndices = clusters
    .map((_, i) => i)
    .sort((a, b) => counts[b] - counts[a]);

  while (true) {
    if (currentMinDistance < 0) break;

    for (const idx of sortedIndices) {
      if (colors.length >= 16) break;

      const prospectLab = clusters[idx];
      const distances = colorLabValues.map(existing =>
        deltaE2000Lab(prospectLab, existing),
      );

      const sorted = [...distances].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const minimum = sorted[0];

      const lightnessContrast =
        Math.abs(prospectLab[0] - colorLabValues[0][0]);

      const properDistance =
        median > currentMinDistance &&
        minimum > currentMinDistance / 3.0 &&
        distances[0] > currentMinDistance * 2.0 &&
        distances.every(d => d < maxDistance) &&
        lightnessContrast >= currentLightnessContrast;

      if (!properDistance) continue;

      const bgDist = deltaE2000Lab(prospectLab, colorLabValues[0]);
      if (bgDist < currentMinDistance * 2.0) break;

      const [pr, pg, pb] = labToRgb(
        prospectLab[0],
        prospectLab[1],
        prospectLab[2],
      );

      if (
        !foregroundPicked &&
        deltaE2000Lab(prospectLab, colorLabValues[0]) >=
          currentMinDistance * 3.0
      ) {
        colors.splice(1, 0, [pr, pg, pb]);
        colorLabValues.splice(1, 0, prospectLab);
        foregroundPicked = true;
      } else {
        colors.push([pr, pg, pb]);
        colorLabValues.push(prospectLab);
      }
    }

    currentMinDistance -= 2.0;
    if (currentMinDistance <= 2.0) {
      currentLightnessContrast = 0.0;
    }
  }

  return colors;
}

function nudgeLightness(
  colors: number[][],
  minLightnessContrast: number,
): void {
  if (colors.length < 3 || minLightnessContrast <= 0) return;

  const bgLab = rgbToLab(colors[0][0], colors[0][1], colors[0][2]);
  const bgL = bgLab.l;

  for (let i = 2; i < colors.length; i++) {
    const c = colors[i];
    const lab = rgbToLab(c[0], c[1], c[2]);
    const diff = Math.abs(lab.l - bgL);

    if (diff < minLightnessContrast) {
      const needed = minLightnessContrast - diff;
      lab.l = bgL < 50
        ? Math.min(100, lab.l + needed)
        : Math.max(0, lab.l - needed);

      const [r, g, b] = labToRgb(lab.l, lab.a, lab.b);
      colors[i] = [r, g, b];
    }
  }
}

function extractQuicktheme(pixels: number[][], _k: number): number[][] {
  const labPixels = pixels.map(p => {
    const lab = rgbToLab(p[0], p[1], p[2]);
    return [lab.l, lab.a, lab.b];
  });

  const k4Centroids = kMeans(labPixels, 4, 20);
  const k4Counts = computeClusterCounts(labPixels, k4Centroids);

  const sorted4 = k4Centroids
    .map((c, i) => ({ centroid: c, count: k4Counts[i] }))
    .sort((a, b) => b.count - a.count);

  let dominantLab = sorted4[0].centroid;
  for (const option of sorted4) {
    const white = [100, 0, 0];
    const distToWhite = deltaE2000Lab(option.centroid, white);
    if (distToWhite > 20) {
      dominantLab = option.centroid;
      break;
    }
  }

  const k = Math.min(64, labPixels.length);
  const k128Centroids = kMeans(labPixels, k, 10);
  const k128Counts = computeClusterCounts(labPixels, k128Centroids);

  const colors = selectFromClusters(
    dominantLab,
    k128Centroids,
    k128Counts,
    12,
    100,
    25,
  );

  nudgeLightness(colors, 25);

  while (colors.length < 16) {
    const pad = colors[colors.length % colors.length];
    colors.push([...pad]);
  }

  return colors.slice(0, 16);
}

// -- Pywal-family & wallust helpers (ported from the reference implementations) --

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d !== 0) {
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, mx === 0 ? 0 : d / mx, mx];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) { r = c; g = x; }
  else if (hp < 2) { r = x; g = c; }
  else if (hp < 3) { g = c; b = x; }
  else if (hp < 4) { g = x; b = c; }
  else if (hp < 5) { r = x; b = c; }
  else { r = c; b = x; }
  const m = v - c;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function yiq(c: number[]): number {
  return (299 * c[0] + 587 * c[1] + 114 * c[2]) / 1000;
}

function pywalLighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function pywalDarken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function pywalBlend(a: string, b: string): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex((r1 + r2) / 2, (g1 + g2) / 2, (b1 + b2) / 2);
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}
/** Map a 16-slot ANSI (color0..color15) palette onto a Base16 scheme, deriving the grey ramp. */
function ansi16ToScheme(hexes: string[], name: string, sourceImage?: string): ColorScheme {
  const c = (i: number): string => hexes[Math.min(Math.max(i, 0), 15)] || hexes[0];
  return {
    name,
    base00: c(0),
    base01: mix(c(0), c(8), 0.45),
    base02: c(8),
    base03: mix(c(8), c(7), 0.35),
    base04: mix(c(8), c(7), 0.7),
    base05: c(7),
    base06: mix(c(7), c(15), 0.5),
    base07: c(15),
    base08: c(1),
    base09: c(9),
    base0A: c(3),
    base0B: c(2),
    base0C: c(6),
    base0D: c(4),
    base0E: c(5),
    base0F: c(15) === c(7) ? c(9) : mix(c(9), c(0), 0.3),
    ...(sourceImage ? { sourceImage } : {}),
  };
}

// -- Pywal `wal` backend: ImageMagick -unique-colors emulation + pywal's adjust() --

function extractPywal(pixels: number[][], _k: number, light: boolean): number[][] {
  let palette: number[][] = [];
  for (let i = 0; i < 20; i++) {
    palette = octreeExtract(pixels, 16 + i);
    if (palette.length >= 16) break;
  }
  while (palette.length < 16) palette.push(palette[palette.length - 1] || [128, 128, 128]);
  // ImageMagick -unique-colors output is ordered dark -> light; keep that ordering via YIQ.
  const cols = [...palette].sort((a, b) => yiq(a) - yiq(b));
  const hexes = cols.map((c) => rgbToHex(c[0], c[1], c[2]));
  const raw = [hexes[0], ...hexes.slice(8, 16), ...hexes.slice(8, 15)];

  if (light) {
    raw[0] = pywalLighten(hexes[15], 0.85);
    raw[7] = hexes[0];
    raw[8] = pywalDarken(hexes[15], 0.4);
    raw[15] = hexes[0];
  } else {
    if (raw[0][1] !== "0") raw[0] = pywalDarken(raw[0], 0.4);
    raw[7] = pywalBlend(raw[7], "#EEEEEE");
    raw[8] = pywalDarken(raw[7], 0.3);
    raw[15] = pywalBlend(raw[15], "#EEEEEE");
  }
  return raw.map((h) => [...hexToRgb(h)]);
}

// -- Pywal `colorz` backend: K-Means (n=6) + generic_adjust --

function extractPywalColorz(pixels: number[][], _k: number, light: boolean): number[][] {
  const cols = kMeans(pixels, 6, 20).map((c) => rgbToHex(c[0], c[1], c[2]));
  const filler = cols[cols.length - 1] || "#333333";
  while (cols.length < 6) cols.push(filler);
  const raw: string[] = [
    cols[0], ...cols, "#FFFFFF", "#000000", ...cols, "#FFFFFF",
  ];
  if (light) {
    raw[0] = pywalLighten(raw[0], 0.95);
    raw[7] = pywalDarken(raw[0], 0.75);
    raw[8] = pywalDarken(raw[0], 0.25);
    raw[15] = raw[7];
  } else {
    raw[0] = pywalDarken(raw[0], 0.8);
    raw[7] = pywalLighten(raw[0], 0.75);
    raw[8] = pywalLighten(raw[0], 0.25);
    raw[15] = raw[7];
  }
  return raw.map((h) => [...hexToRgb(h)]);
}

// -- Pywal `colorthief` backend: 8-color聚类, YIQ sort, duplicated across rows --

function extractPywalColorthief(pixels: number[][], _k: number, light: boolean): number[][] {
  let cols = kMeans(pixels, 8, 40);
  cols = [...cols].sort((a, b) => yiq(a) - yiq(b));
  const hexes = cols.map((c) => rgbToHex(c[0], c[1], c[2]));
  const raw = [...hexes, ...hexes];
  if (light) {
    raw[0] = pywalLighten(hexes[0], 0.9);
    raw[7] = pywalDarken(hexes[0], 0.75);
  } else {
    raw[0] = pywalDarken(hexes[0], 0.8);
    raw[7] = pywalLighten(hexes[0], 0.6);
  }
  raw[8] = pywalLighten(hexes[0], 0.2);
  raw[15] = raw[7];
  return raw.map((h) => [...hexToRgb(h)]);
}

// -- wallust `kmeans` palette: Lab clustering, ΔE dedup, even sampling, +10L bright black --

function extractWallustKmeans(pixels: number[][], _k: number, light: boolean): number[][] {
  const labPixels = pixels.map((p) => {
    const lab = rgbToLab(p[0], p[1], p[2]);
    return [lab.l, lab.a, lab.b];
  });

  const centroids = kMeans(labPixels, 16, 20).sort((a, b) => a[0] - b[0]);

  const deduped: number[][] = [];
  for (const c of centroids) {
    const prev = deduped[deduped.length - 1];
    if (prev && deltaE2000({ l: prev[0], a: prev[1], b: prev[2] }, { l: c[0], a: c[1], b: c[2] }) < 10) continue;
    deduped.push(c);
  }
  const n = Math.max(1, deduped.length);
  const sample = (i: number): number[] => {
    const idx = n === 1 ? 0 : Math.floor((i * (n - 1)) / 7);
    const lab = deduped[idx];
    return [...labToRgb(lab[0], lab[1], lab[2])];
  };
  const c: number[][] = [0, 1, 2, 3, 4, 5, 6, 7].map(sample);

  const brightBlack = (from: number[], invert: boolean): number[] => {
    const lab = rgbToLab(Math.round(from[0]), Math.round(from[1]), Math.round(from[2]));
    const l = invert ? Math.max(0, lab.l - 10) : Math.min(100, lab.l + 10);
    return [...labToRgb(l, lab.a, lab.b)];
  };

  if (light) {
    const rs = [...c].reverse();
    return [rs[0], ...rs.slice(1, 7), rs[7], brightBlack(rs[0], true), ...rs.slice(1, 7), rs[7]];
  }
  return [c[0], ...c.slice(1, 7), c[7], brightBlack(c[0], false), ...c.slice(1, 7), c[7]];
}

// -- wallust `ansi` palette: HSV hue classification into TTY slots (ported from ansi.rs) --

type HueRange = { hueStart: number; hueEnd: number; satDef: number; valDef: number };
const WALLUST_RANGES: Record<string, HueRange> = {
  red:     { hueStart: 0,   hueEnd: 60,  satDef: 0.9, valDef: 0.65 },
  yellow:  { hueStart: 60,  hueEnd: 120, satDef: 0.9, valDef: 0.75 },
  green:   { hueStart: 120, hueEnd: 180, satDef: 0.8, valDef: 0.65 },
  cyan:    { hueStart: 180, hueEnd: 210, satDef: 0.8, valDef: 0.75 },
  blue:    { hueStart: 210, hueEnd: 280, satDef: 0.9, valDef: 0.55 },
  magenta: { hueStart: 280, hueEnd: 360, satDef: 0.8, valDef: 0.7 },
};
const DARK_RANGES: Record<string, HueRange> = {
  red:     { ...WALLUST_RANGES.red,     valDef: 0.45 },
  yellow:  { ...WALLUST_RANGES.yellow,  valDef: 0.55 },
  green:   { ...WALLUST_RANGES.green,   valDef: 0.45 },
  cyan:    { ...WALLUST_RANGES.cyan,    valDef: 0.55 },
  blue:    { ...WALLUST_RANGES.blue,    valDef: 0.35 },
  magenta: { ...WALLUST_RANGES.magenta, valDef: 0.5 },
};
const W_T = 0.5; // trust in ANSI defaults vs image colors

function wallustAvg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function wallustGetColor(specs: [number, number, number][], range: HueRange): [number, number, number] {
  const hues: number[] = [], sats: number[] = [], vals: number[] = [];
  const kept = specs.filter((spec) => {
    const [h, s, v] = spec;
    if (h >= range.hueStart && h <= range.hueEnd) {
      hues.push(h); sats.push(s); vals.push(v);
      return false; // drain matched pixels so slots can't reuse them
    }
    return true;
  });
  specs.length = 0;
  for (const k of kept) specs.push(k);

  const hue = hues.length
    ? W_T * (range.hueStart + range.hueEnd) / 2 + (1 - W_T) * wallustAvg(hues)
    : (range.hueStart + range.hueEnd) / 2;
  const sat = sats.length
    ? W_T * range.satDef + (1 - W_T) * wallustAvg(sats)
    : range.satDef;
  const val = vals.length
    ? W_T * range.valDef + (1 - W_T) * wallustAvg(vals)
    : range.valDef;

  return hsvToRgb(hue, sat, val);
}

function extractWallustAnsi(pixels: number[][], _k: number, light: boolean): number[][] {
  const specs: [number, number, number][] = pixels.map((p) => rgbToHsv(p[0], p[1], p[2]));

  const darkV = 0.05, lightyV = 0.95;

  const black = (() => {
    const found = specs.find(([, , v]) => v < darkV);
    if (found) return hsvToRgb(found[0], found[1] * 0.3, found[2]);
    return hsvToRgb(
      wallustAvg(specs.map((s) => s[0])),
      (wallustAvg(specs.map((s) => s[1]))) / 3,
      (7 * darkV + wallustAvg(specs.map((s) => s[2]))) / 8,
    );
  })();

  const gray = (() => {
    const found = specs.find(([, , v]) => v > lightyV);
    if (found) return hsvToRgb(found[0], found[1] * 0.3, found[2]);
    return hsvToRgb(
      wallustAvg(specs.map((s) => s[0])),
      wallustAvg(specs.map((s) => s[1])) / 3,
      (4 * lightyV + wallustAvg(specs.map((s) => s[2]))) / 5,
    );
  })();

  const ranges = light ? DARK_RANGES : WALLUST_RANGES;
  const red = wallustGetColor(specs, ranges.red);
  const yellow = wallustGetColor(specs, ranges.yellow);
  const green = wallustGetColor(specs, ranges.green);
  const cyan = wallustGetColor(specs, ranges.cyan);
  const blue = wallustGetColor(specs, ranges.blue);
  const magenta = wallustGetColor(specs, ranges.magenta);

  // palette-crate fixed-factor lighten/darken on the HSV value component
  const fixV = (rgb: number[], delta: number): [number, number, number] => {
    const [h, s, v] = rgbToHsv(rgb[0] as number, rgb[1] as number, rgb[2] as number);
    return hsvToRgb(h, s, Math.max(0, Math.min(1, v + delta)));
  };

  if (light) {
    return [
      [...fixV(black, 0)], // color0 = black
      [...red], [...green], [...yellow], [...blue], [...magenta], [...cyan],
      [...fixV(gray, -0.1)], // color7 = gray darkened
      [...fixV(black, 0.1)], // color8
      [...red], [...green], [...yellow], [...blue], [...magenta], [...cyan],
      [...gray], // color15
    ];
  }
  return [
    [...fixV(black, 0.1)], // color0 = black lightened
    [...red], [...green], [...yellow], [...blue], [...magenta], [...cyan],
    [...gray], // color7 = gray
    [...fixV(black, 0.25)], // color8
    [...red], [...green], [...yellow], [...blue], [...magenta], [...cyan],
    [...gray], // color15
  ];
}

// -- Main entry point --

const extractors: Record<ExtractAlgorithm, (pixels: number[][], k: number, light: boolean) => number[][]> = {
  kmeans: (p, k) => extractKMeans(p, k),
  "median-cut": (p, k) => medianCutExtract(p, k),
  histogram: (p, k) => histogramExtract(p, k),
  octree: (p, k) => octreeExtract(p, k),
  monochrome: (p, k) => extractMonochrome(p, k),
  vibrant: (p, k) => extractVibrant(p, k),
  muted: (p, k) => extractMuted(p, k),
  dominant: (p, k) => extractDominant(p, k),
  "high-contrast": (p, k) => extractHighContrast(p, k),
  complementary: (p, k) => extractComplementary(p, k),
  quicktheme: (p, k) => extractQuicktheme(p, k),
  pywal: extractPywal,
  "pywal-colorz": extractPywalColorz,
  "pywal-colorthief": extractPywalColorthief,
  "wallust-kmeans": extractWallustKmeans,
  "wallust-ansi": extractWallustAnsi,
};

const pixelCache = new WeakMap<File, Promise<{ dataUrl: string; pixels: number[][] }>>();

export async function extractPalette(
  file: File,
  algorithm: ExtractAlgorithm = "kmeans",
  light = false,
): Promise<ColorScheme> {
  let promise = pixelCache.get(file);
  if (!promise) {
    promise = (async () => {
      const dataUrl = await fileToDataUrl(file);
      const img = await loadImage(dataUrl);
      const pixels = samplePixels(img, 2000);
      return { dataUrl, pixels };
    })();
    pixelCache.set(file, promise);
  }
  const { dataUrl, pixels } = await promise;
  const extractor = extractors[algorithm];
  const colors = extractor(pixels, 16, light);

  const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

  if (colors.length < 16) {
    const padding = 16 - colors.length;
    for (let i = 0; i < padding; i++) {
      colors.push(colors[i % colors.length] || [128, 128, 128]);
    }
  }

  if (ANSI_SLOT_ALGORITHMS.has(algorithm)) {
    const hexes = colors.slice(0, 16).map((c) => rgbToHex(c[0], c[1], c[2]));
    return ansi16ToScheme(hexes, name || "From Image", dataUrl);
  }

  return {
    ...colorsToScheme(colors.slice(0, 16), name || "From Image"),
    sourceImage: dataUrl,
  };
}
