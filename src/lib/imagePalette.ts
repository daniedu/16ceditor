import { ColorScheme } from "./types";

export type ExtractAlgorithm = "kmeans" | "median-cut" | "histogram" | "octree";

export const ALGORITHM_LABELS: Record<ExtractAlgorithm, string> = {
  kmeans: "K-Means Clustering",
  "median-cut": "Median Cut",
  histogram: "Histogram Peak",
  octree: "Octree Quantization",
};

function rgbToLuminance(r: number, g: number, b: number): number {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
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
    const la = rgbToLuminance(a[0], a[1], a[2]);
    const lb = rgbToLuminance(b[0], b[1], b[2]);
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

  let centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    const c: number[] = [];
    for (let d = 0; d < dim; d++) {
      c.push(min[d] + Math.random() * (max[d] - min[d]));
    }
    centroids.push(c);
  }

  const assignments = new Uint32Array(pixels.length);

  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      let bestDist = Infinity;
      let bestIdx = 0;
      for (let j = 0; j < k; j++) {
        const dist = colorDistance(pixels[i], centroids[j]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = j;
        }
      }
      assignments[i] = bestIdx;
    }

    const newCentroids: number[][] = Array.from({ length: k }, () =>
      new Array(dim).fill(0),
    );
    const counts = new Uint32Array(k);
    for (let i = 0; i < pixels.length; i++) {
      const a = assignments[i];
      for (let d = 0; d < dim; d++) {
        newCentroids[a][d] += pixels[i][d];
      }
      counts[a]++;
    }

    let changed = false;
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        for (let d = 0; d < dim; d++) {
          newCentroids[j][d] /= counts[j];
        }
      } else {
        newCentroids[j] = centroids[j].slice();
      }
      if (colorDistance(newCentroids[j], centroids[j]) > 1) changed = true;
    }

    centroids = newCentroids;
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

  insert(r: number, g: number, b: number, maxLeaves: number) {
    this.addColor(this.root, r, g, b, 0);
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
    tree.insert(px[0], px[1], px[2], k);
  }
  return tree.getPalette(k);
}

// -- Main entry point --

const extractors: Record<ExtractAlgorithm, (pixels: number[][], k: number) => number[][]> = {
  kmeans: extractKMeans,
  "median-cut": medianCutExtract,
  histogram: histogramExtract,
  octree: octreeExtract,
};

export async function extractPalette(
  file: File,
  algorithm: ExtractAlgorithm = "kmeans",
): Promise<ColorScheme> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);
  const pixels = samplePixels(img, 2000);
  const extractor = extractors[algorithm];
  const colors = extractor(pixels, 16);

  const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

  if (colors.length < 16) {
    const padding = 16 - colors.length;
    for (let i = 0; i < padding; i++) {
      colors.push(colors[i % colors.length]);
    }
  }

  return {
    ...colorsToScheme(colors.slice(0, 16), name || "From Image"),
    sourceImage: dataUrl,
  };
}
