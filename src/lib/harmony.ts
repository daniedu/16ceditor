import { ColorScheme, ThemeIssue } from "./types";
import { hexToHsl, hslToHex, contrastRatio, wcagLevel, toneDown } from "./color";

export function analyzeScheme(scheme: ColorScheme): ThemeIssue[] {
  const issues: ThemeIssue[] = [];

  const accents = [
    { key: "base08", label: "Red" },
    { key: "base09", label: "Orange" },
    { key: "base0A", label: "Yellow" },
    { key: "base0B", label: "Green" },
    { key: "base0C", label: "Cyan" },
    { key: "base0D", label: "Blue" },
    { key: "base0E", label: "Magenta" },
    { key: "base0F", label: "Brown" },
  ] as const;

  for (const { key, label } of accents) {
    const hex = scheme[key];
    const hsl = hexToHsl(hex);
    if (hsl.s > 85) {
      const fixed = toneDown(hex, 0.35);
      issues.push({
        type: "saturation",
        severity: "warning",
        message: `${label} (${key}) is very saturated (${hsl.s.toFixed(0)}%)`,
        color: hex,
        suggestion: fixed,
      });
    }
  }

  const pairs: [string, string, string][] = [
    [scheme.base00, scheme.base05, "bg↔fg"],
    [scheme.base01, scheme.base05, "surface↔fg"],
    [scheme.base02, scheme.base05, "selection bg↔fg"],
    [scheme.base00, scheme.base0D, "bg↔blue accent"],
    [scheme.base01, scheme.base08, "surface↔red"],
  ];
  for (const [bg, fg, label] of pairs) {
    const ratio = contrastRatio(bg, fg);
    const level = wcagLevel(ratio);
    if (level === "fail") {
      issues.push({
        type: "contrast",
        severity: "error",
        message: `${label} contrast ${ratio.toFixed(1)}:1 (fails AA)`,
        color: fg,
      });
    } else if (level === "AA") {
      issues.push({
        type: "contrast",
        severity: "info",
        message: `${label} contrast ${ratio.toFixed(1)}:1 (AA)`,
        color: fg,
      });
    }
  }

  const bases = ["base00", "base01", "base02", "base03", "base04", "base05", "base06", "base07"] as const;
  for (let i = 1; i < bases.length; i++) {
    const prev = hexToHsl(scheme[bases[i - 1]]);
    const curr = hexToHsl(scheme[bases[i]]);
    if (curr.l <= prev.l) {
      issues.push({
        type: "luminance",
        severity: "warning",
        message: `${bases[i]} luminance (${curr.l.toFixed(0)}%) ≤ ${bases[i - 1]} (${prev.l.toFixed(0)}%)`,
        color: scheme[bases[i]],
      });
    }
  }

  return issues;
}

export function generateHarmonies(hex: string): string[] {
  const hsl = hexToHsl(hex);
  const results: string[] = [];
  const offsets = [60, 120, 180, -60, -120];
  for (const offset of offsets) {
    let h = (hsl.h + offset + 360) % 360;
    if (h === hsl.h && offset !== 0) h = (h + 1) % 360;
    results.push(hslToHex(h, Math.max(30, hsl.s), Math.max(20, Math.min(80, hsl.l))));
  }
  return results;
}

export function generateBrightVariants(scheme: ColorScheme): string[] {
  const brightKeys = ["base08", "base09", "base0A", "base0B", "base0C", "base0D", "base0E", "base0F"] as const;
  return brightKeys.map(k => {
    const hsl = hexToHsl(scheme[k]);
    return hslToHex(hsl.h, Math.max(0, hsl.s - 10), Math.min(100, hsl.l + 28));
  });
}
