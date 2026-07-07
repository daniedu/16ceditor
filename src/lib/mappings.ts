import { ColorScheme, RoleMapping, DEFAULT_ROLE_MAPPING } from "./types";
import { adjustBrightnessForAnsi } from "./color";

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

export function schemeToAnsi(s: ColorScheme, mapping: RoleMapping = DEFAULT_ROLE_MAPPING): AnsiColors {
  return {
    black: s[mapping.bg],
    red: s[mapping.red],
    green: s[mapping.green],
    yellow: s[mapping.yellow],
    blue: s[mapping.blue],
    magenta: s[mapping.magenta],
    cyan: s[mapping.cyan],
    white: s[mapping.fg],
    brightBlack: adjustBrightnessForAnsi(s[mapping.muted], true),
    brightRed: adjustBrightnessForAnsi(s[mapping.red], true),
    brightGreen: adjustBrightnessForAnsi(s[mapping.green], true),
    brightYellow: adjustBrightnessForAnsi(s[mapping.yellow], true),
    brightBlue: adjustBrightnessForAnsi(s[mapping.blue], true),
    brightMagenta: adjustBrightnessForAnsi(s[mapping.magenta], true),
    brightCyan: adjustBrightnessForAnsi(s[mapping.cyan], true),
    brightWhite: adjustBrightnessForAnsi(s[mapping.lightFg], true),
  };
}

export interface GtkColors {
  bg: string;
  fg: string;
  base: string;
  text: string;
  selectedBg: string;
  selectedFg: string;
  tooltipBg: string;
  tooltipFg: string;
  buttonBg: string;
  buttonFg: string;
  border: string;
  shadow: string;
}

export function schemeToGtk(s: ColorScheme, mapping: RoleMapping = DEFAULT_ROLE_MAPPING): GtkColors {
  return {
    bg: s[mapping.bg],
    fg: s[mapping.fg],
    base: s[mapping.container],
    text: s[mapping.fg],
    selectedBg: s[mapping.blue],
    selectedFg: s[mapping.lightBg],
    tooltipBg: s[mapping.input],
    tooltipFg: s[mapping.fg],
    buttonBg: s[mapping.input],
    buttonFg: s[mapping.fg],
    border: s[mapping.muted],
    shadow: s[mapping.bg],
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
  tooltipBase: string;
  tooltipText: string;
  disabled: string;
}

export function schemeToQt(s: ColorScheme, mapping: RoleMapping = DEFAULT_ROLE_MAPPING): QtColors {
  return {
    window: s[mapping.bg],
    windowText: s[mapping.fg],
    base: s[mapping.container],
    text: s[mapping.fg],
    button: s[mapping.input],
    buttonText: s[mapping.fg],
    highlight: s[mapping.blue],
    highlightedText: s[mapping.lightBg],
    tooltipBase: s[mapping.input],
    tooltipText: s[mapping.fg],
    disabled: s[mapping.muted],
  };
}
