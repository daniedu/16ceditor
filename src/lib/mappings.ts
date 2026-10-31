import { ColorScheme, RoleMapping, DEFAULT_ROLE_MAPPING, AnsiSlotMap, DEFAULT_TERMINAL_ANSI } from "./types";
import { hexToRgb } from "./color";

export interface AnsiColors {
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

const ANSI_TO_COLOR: [keyof AnsiColors, keyof AnsiSlotMap][] = [
  ["black", "color0"],
  ["red", "color1"],
  ["green", "color2"],
  ["yellow", "color3"],
  ["blue", "color4"],
  ["magenta", "color5"],
  ["cyan", "color6"],
  ["white", "color7"],
  ["brightBlack", "color8"],
  ["brightRed", "color9"],
  ["brightGreen", "color10"],
  ["brightYellow", "color11"],
  ["brightBlue", "color12"],
  ["brightMagenta", "color13"],
  ["brightCyan", "color14"],
  ["brightWhite", "color15"],
];

export function schemeToAnsi(s: ColorScheme, ansiMap: AnsiSlotMap = DEFAULT_TERMINAL_ANSI): AnsiColors {
  const result = {} as AnsiColors;
  for (const [colorKey, slot] of ANSI_TO_COLOR) {
    result[colorKey] = s[ansiMap[slot]];
  }
  return result;
}

export type ConsoleColors = AnsiColors;

export function schemeToConsole(s: ColorScheme, ansiMap: AnsiSlotMap): ConsoleColors {
  return schemeToAnsi(s, ansiMap);
}

export interface GtkColors {
  windowBg: string;
  windowFg: string;
  viewBg: string;
  viewFg: string;
  headerbarBg: string;
  headerbarFg: string;
  headerbarBorder: string;
  sidebarBg: string;
  sidebarFg: string;
  cardBg: string;
  cardFg: string;
  popoverBg: string;
  popoverFg: string;
  accent: string;
  accentFg: string;
  destructive: string;
  destructiveFg: string;
  success: string;
  successFg: string;
  warning: string;
  warningFg: string;
  error: string;
  errorFg: string;
  scrollbarOutline: string;
  scrollbar: string;
  border: string;
  shade: string;
}

export function schemeToGtk(s: ColorScheme, mapping: RoleMapping = DEFAULT_ROLE_MAPPING): GtkColors {
  const b01 = s[mapping.container];
  const [r, g, b] = hexToRgb(b01);
  return {
    windowBg: s[mapping.bg],
    windowFg: s[mapping.fg],
    viewBg: s[mapping.bg],
    viewFg: s[mapping.fg],
    headerbarBg: b01,
    headerbarFg: s[mapping.fg],
    headerbarBorder: `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 0.7)`,
    sidebarBg: b01,
    sidebarFg: s[mapping.fg],
    cardBg: b01,
    cardFg: s[mapping.fg],
    popoverBg: b01,
    popoverFg: s[mapping.fg],
    accent: s[mapping.blue],
    accentFg: s[mapping.bg],
    destructive: s[mapping.red],
    destructiveFg: s[mapping.bg],
    success: s[mapping.green],
    successFg: s[mapping.bg],
    warning: s[mapping.magenta],
    warningFg: s[mapping.bg],
    error: s[mapping.red],
    errorFg: s[mapping.bg],
    scrollbarOutline: s[mapping.scrollbar],
    scrollbar: s[mapping.scrollbar],
    border: s[mapping.muted],
    shade: "rgba(0, 0, 0, 0.07)",
  };
}

export interface QtColors {
  window: string;
  windowText: string;
  base: string;
  text: string;
  button: string;
  buttonText: string;
  highlight: string;
  highlightedText: string;
  inactiveHighlight: string;
  link: string;
  linkVisited: string;
  tooltipBase: string;
  tooltipText: string;
  disabled: string;
}

export function schemeToQt(s: ColorScheme, mapping: RoleMapping = DEFAULT_ROLE_MAPPING): QtColors {
  return {
    window: s[mapping.container],
    windowText: s[mapping.fg],
    base: s[mapping.bg],
    text: s[mapping.fg],
    button: s[mapping.scrollbar],
    buttonText: s[mapping.fg],
    highlight: s[mapping.magenta],
    highlightedText: s[mapping.bg],
    inactiveHighlight: s[mapping.muted],
    link: s[mapping.blue],
    linkVisited: s[mapping.magenta],
    tooltipBase: s[mapping.bg],
    tooltipText: s[mapping.fg],
    disabled: s[mapping.darkFg],
  };
}
