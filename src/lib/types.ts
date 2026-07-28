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

export const BASE_KEYS: BaseKey[] = [
  "base00","base01","base02","base03","base04","base05","base06","base07",
  "base08","base09","base0A","base0B","base0C","base0D","base0E","base0F",
];

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

export type ViewTab = "previews" | "editor" | "analysis" | "generate" | "settings";

export type SemanticRole =
  | "bg" | "container" | "scrollbar" | "muted"
  | "darkFg" | "fg" | "lightFg" | "lightBg"
  | "red" | "orange" | "yellow" | "green" | "cyan" | "blue" | "magenta" | "brown";

export type RoleMapping = Record<SemanticRole, BaseKey>;

export const DEFAULT_ROLE_MAPPING: RoleMapping = {
  bg: "base00", container: "base01", scrollbar: "base02", muted: "base03",
  darkFg: "base04", fg: "base05", lightFg: "base06", lightBg: "base07",
  red: "base08", orange: "base09", yellow: "base0A", green: "base0B",
  cyan: "base0C", blue: "base0D", magenta: "base0E", brown: "base0F",
};

export const ROLE_LABELS: Record<SemanticRole, string> = {
  bg: "Background", container: "Container", scrollbar: "Scrollbar", muted: "Muted",
  darkFg: "Dark FG", fg: "Foreground", lightFg: "Light FG", lightBg: "Light BG",
  red: "Red", orange: "Orange", yellow: "Yellow", green: "Green",
  cyan: "Cyan", blue: "Blue", magenta: "Magenta", brown: "Brown",
};

export const ROLE_GROUPS: { label: string; roles: SemanticRole[] }[] = [
  { label: "Backgrounds", roles: ["bg", "container", "scrollbar", "muted"] },
  { label: "Foregrounds", roles: ["darkFg", "fg", "lightFg", "lightBg"] },
  { label: "Accents", roles: ["red", "orange", "yellow", "green", "cyan", "blue", "magenta", "brown"] },
];

export type AnsiSlot = `color${0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15}`;

export const ANSI_SLOTS: AnsiSlot[] = [
  "color0","color1","color2","color3","color4","color5","color6","color7",
  "color8","color9","color10","color11","color12","color13","color14","color15",
];

export const ANSI_LABELS: Record<AnsiSlot, string> = {
  color0: "Black", color1: "Red", color2: "Green", color3: "Yellow",
  color4: "Blue", color5: "Magenta", color6: "Cyan", color7: "White",
  color8: "Bright Black", color9: "Bright Red", color10: "Bright Green", color11: "Bright Yellow",
  color12: "Bright Blue", color13: "Bright Magenta", color14: "Bright Cyan", color15: "Bright White",
};

export type AnsiSlotMap = Record<AnsiSlot, BaseKey>;

export const DEFAULT_TERMINAL_ANSI: AnsiSlotMap = {
  color0: "base00", color1: "base08", color2: "base0B", color3: "base0A",
  color4: "base0D", color5: "base0E", color6: "base0C", color7: "base05",
  color8: "base02", color9: "base08", color10: "base0B", color11: "base0A",
  color12: "base0D", color13: "base0E", color14: "base0C", color15: "base07",
};

export const DEFAULT_CONSOLE_ANSI: AnsiSlotMap = {
  color0: "base00", color1: "base08", color2: "base0B", color3: "base0A",
  color4: "base0D", color5: "base0E", color6: "base0C", color7: "base05",
  color8: "base03", color9: "base08", color10: "base0B", color11: "base0A",
  color12: "base0D", color13: "base0E", color14: "base0C", color15: "base07",
};

export interface TerminalAppearance {
  cursor: BaseKey;
  cursorText: BaseKey;
  selectionBg: BaseKey;
  selectionFg: BaseKey;
}

export const DEFAULT_TERMINAL_APPEARANCE: TerminalAppearance = {
  cursor: "base05",
  cursorText: "base00",
  selectionBg: "base03",
  selectionFg: "base05",
};

export interface ColorSettings {
  terminal: { ansi: AnsiSlotMap; appearance: TerminalAppearance };
  console: { ansi: AnsiSlotMap };
}

export const DEFAULT_COLOR_SETTINGS: ColorSettings = {
  terminal: { ansi: DEFAULT_TERMINAL_ANSI, appearance: DEFAULT_TERMINAL_APPEARANCE },
  console: { ansi: DEFAULT_CONSOLE_ANSI },
};
