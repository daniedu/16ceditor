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

export type SemanticRole =
  | "bg" | "container" | "input" | "muted"
  | "darkFg" | "fg" | "lightFg" | "lightBg"
  | "red" | "orange" | "yellow" | "green" | "cyan" | "blue" | "magenta" | "brown";

export type RoleMapping = Record<SemanticRole, BaseKey>;

export const DEFAULT_ROLE_MAPPING: RoleMapping = {
  bg: "base00", container: "base01", input: "base02", muted: "base03",
  darkFg: "base04", fg: "base05", lightFg: "base06", lightBg: "base07",
  red: "base08", orange: "base09", yellow: "base0A", green: "base0B",
  cyan: "base0C", blue: "base0D", magenta: "base0E", brown: "base0F",
};

export const ROLE_LABELS: Record<SemanticRole, string> = {
  bg: "Background", container: "Container", input: "Input", muted: "Muted",
  darkFg: "Dark FG", fg: "Foreground", lightFg: "Light FG", lightBg: "Light BG",
  red: "Red", orange: "Orange", yellow: "Yellow", green: "Green",
  cyan: "Cyan", blue: "Blue", magenta: "Magenta", brown: "Brown",
};

export const ROLE_GROUPS: { label: string; roles: SemanticRole[] }[] = [
  { label: "Backgrounds", roles: ["bg", "container", "input", "muted"] },
  { label: "Foregrounds", roles: ["darkFg", "fg", "lightFg", "lightBg"] },
  { label: "Accents", roles: ["red", "orange", "yellow", "green", "cyan", "blue", "magenta", "brown"] },
];
