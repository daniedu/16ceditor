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
