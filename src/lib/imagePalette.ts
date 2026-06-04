import { ColorScheme } from "./types";

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

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
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

export async function extractPalette(file: File): Promise<ColorScheme> {
  const img = await loadImage(file);
  const pixels = samplePixels(img, 2000);
  const colors = kMeans(pixels, 16, 20);
  const sorted = sortByLuminance(colors);

  const neutrals = sorted.slice(0, 8);
  const accents = sorted
    .slice(8)
    .sort((a, b) => chromaticity(b) - chromaticity(a));

  const assign = (idx: number, list: number[][]): string => {
    const c = list[idx % list.length];
    return rgbToHex(c[0], c[1], c[2]);
  };

  const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

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
