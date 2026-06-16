export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

export function hexToHsl(hex: string) {
  return rgbToHsl(...hexToRgb(hex));
}

export function hslToHex(h: number, s: number, l: number) {
  return rgbToHex(...hslToRgb(h, s, l));
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function wcagLevel(ratio: number): "AAA" | "AA" | "fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
}

export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 + amount;
  return rgbToHex(r * f, g * f, b * f);
}

export function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amount;
  return rgbToHex(r * f, g * f, b * f);
}

export function saturate(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, Math.min(100, hsl.s * (1 + amount)), hsl.l);
}

export function desaturate(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, hsl.s * (1 - amount), hsl.l);
}

export function toneDown(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  const s = hsl.s * (1 - amount);
  const l = hsl.l + (50 - hsl.l) * amount * 0.3;
  return hslToHex(hsl.h, Math.max(0, s), Math.max(0, Math.min(100, l)));
}

export function adjustBrightnessForAnsi(hex: string, isBright: boolean): string {
  if (isBright) {
    const hsl = hexToHsl(hex);
    return hslToHex(hsl.h, Math.max(0, hsl.s - 10), Math.min(100, hsl.l + 25));
  }
  return hex;
}

export function pickColorFromImage(
  img: HTMLImageElement,
  clientX: number,
  clientY: number,
): string | null {
  const rect = img.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  if (localX < 0 || localX > rect.width || localY < 0 || localY > rect.height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const px = Math.round((localX / rect.width) * img.naturalWidth);
  const py = Math.round((localY / rect.height) * img.naturalHeight);
  const data = ctx.getImageData(Math.min(px, img.naturalWidth - 1), Math.min(py, img.naturalHeight - 1), 1, 1).data;
  if (data[3] < 128) return null;
  return rgbToHex(data[0], data[1], data[2]);
}

// -- Perceptual Color Spaces (LAB/LCH) --

export function rgbToLinear(c: number): number {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function linearToRgb(c: number): number {
  return c <= 0.0031308
    ? Math.round(12.92 * c * 255)
    : Math.round((1.055 * (c ** (1 / 2.4)) - 0.055) * 255);
}

export function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  const rL = rgbToLinear(r);
  const gL = rgbToLinear(g);
  const bL = rgbToLinear(b);

  let x = rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375;
  let y = rL * 0.2126729 + gL * 0.7151522 + bL * 0.0721750;
  let z = rL * 0.0193339 + gL * 0.1191920 + bL * 0.9503041;

  const D65 = { x: 0.95047, y: 1.00000, z: 1.08883 };
  x /= D65.x;
  y /= D65.y;
  z /= D65.z;

  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116);

  const L = (116 * f(y)) - 16;
  const a = 500 * (f(x) - f(y));
  const bVal = 200 * (f(y) - f(z));

  return { l: L, a, b: bVal };
}

export function labToLch(l: number, a: number, b: number): { l: number; c: number; h: number } {
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return { l, c, h };
}

export function hexToLab(hex: string) {
  return rgbToLab(...hexToRgb(hex));
}

export function labToRgb(l: number, a: number, b: number): [number, number, number] {
  const D65 = { x: 0.95047, y: 1.00000, z: 1.08883 };
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const f = (t: number) => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  };

  const x = f(fx) * D65.x;
  const y = f(fy) * D65.y;
  const z = f(fz) * D65.z;

  const rL = x *  3.2404542 + y * -1.5371385 + z * -0.4985314;
  const gL = x * -0.9692660 + y *  1.8760108 + z *  0.0415560;
  const bL = x *  0.0556434 + y * -0.2040259 + z *  1.0572252;

  return [
    linearToRgb(rL),
    linearToRgb(gL),
    linearToRgb(bL),
  ];
}

export function deltaE2000(lab1: { l: number; a: number; b: number }, lab2: { l: number; a: number; b: number }): number {
  const [L1, a1, b1] = [lab1.l, lab1.a, lab1.b];
  const [L2, a2, b2] = [lab2.l, lab2.a, lab2.b];

  const avgL = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const avgCp = (C1p + C2p) / 2;

  let h1p = Math.atan2(b1, a1p) * (180 / Math.PI);
  if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) * (180 / Math.PI);
  if (h2p < 0) h2p += 360;

  const avgHp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;

  const T = 1 - 0.17 * Math.cos((avgHp - 30) * Math.PI / 180)
    + 0.24 * Math.cos((2 * avgHp) * Math.PI / 180)
    + 0.32 * Math.cos((3 * avgHp + 6) * Math.PI / 180)
    - 0.20 * Math.cos((4 * avgHp - 63) * Math.PI / 180);

  let dh = h2p - h1p;
  if (Math.abs(dh) > 180) dh += h2p > h1p ? -360 : 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh / 2) * Math.PI / 180);

  const dL = L2 - L1;
  const dCp = C2p - C1p;

  const SL = 1 + (0.015 * (avgL - 50) ** 2) / Math.sqrt(20 + (avgL - 50) ** 2);
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;

  const tVal = (avgHp - 275) / 25;
  const dTheta = 30 * Math.exp(-(tVal * tVal));
  const RC = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin(2 * dTheta * Math.PI / 180);

  return Math.sqrt(
    (dL / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH)
  );
}

// -- Gamma Correction --

export function applyGamma(hex: string, gamma: number): string {
  const [r, g, b] = hexToRgb(hex);
  const correct = (c: number) => {
    c = c / 255;
    c = Math.pow(c, 1 / gamma);
    return Math.round(Math.max(0, Math.min(255, c * 255)));
  };
  return rgbToHex(correct(r), correct(g), correct(b));
}

// -- Color Blindness Simulation --

export type ColorBlindnessType = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

const cbMatrices: Record<ColorBlindnessType, number[][]> = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525],
  ],
  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
  ],
};

export function simulateColorBlindness(hex: string, type: ColorBlindnessType): string {
  const [r, g, b] = hexToRgb(hex);
  const m = cbMatrices[type];
  const rNew = Math.round(r * m[0][0] + g * m[0][1] + b * m[0][2]);
  const gNew = Math.round(r * m[1][0] + g * m[1][1] + b * m[1][2]);
  const bNew = Math.round(r * m[2][0] + g * m[2][1] + b * m[2][2]);
  return rgbToHex(
    Math.max(0, Math.min(255, rNew)),
    Math.max(0, Math.min(255, gNew)),
    Math.max(0, Math.min(255, bNew)),
  );
}
