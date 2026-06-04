export type HexColor = string;

export interface ColorScheme {
  name: string;
  author?: string;
  slug?: string;
  sourceImage?: string;
  base00: HexColor;
  base01: HexColor;
  base02: HexColor;
  base03: HexColor;
  base04: HexColor;
  base05: HexColor;
  base06: HexColor;
  base07: HexColor;
  base08: HexColor;
  base09: HexColor;
  base0A: HexColor;
  base0B: HexColor;
  base0C: HexColor;
  base0D: HexColor;
  base0E: HexColor;
  base0F: HexColor;
}

export type BaseKey = keyof Omit<ColorScheme, "name" | "author" | "slug" | "sourceImage">;

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ThemeIssue {
  type: "saturation" | "contrast" | "luminance" | "harmony";
  severity: "warning" | "error" | "info";
  message: string;
  color?: HexColor;
  suggestion?: HexColor;
}

export interface ExportFormat {
  id: string;
  label: string;
  extension: string;
  generate: (scheme: ColorScheme) => string;
  mime: string;
}

export type ViewTab = "previews" | "editor" | "analysis" | "generate";
