import { ColorScheme } from "./types";
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

export function schemeToAnsi(s: ColorScheme): AnsiColors {
  return {
    black: s.base00,
    red: s.base08,
    green: s.base0B,
    yellow: s.base0A,
    blue: s.base0D,
    magenta: s.base0E,
    cyan: s.base0C,
    white: s.base05,
    brightBlack: adjustBrightnessForAnsi(s.base03, true),
    brightRed: adjustBrightnessForAnsi(s.base08, true),
    brightGreen: adjustBrightnessForAnsi(s.base0B, true),
    brightYellow: adjustBrightnessForAnsi(s.base0A, true),
    brightBlue: adjustBrightnessForAnsi(s.base0D, true),
    brightMagenta: adjustBrightnessForAnsi(s.base0E, true),
    brightCyan: adjustBrightnessForAnsi(s.base0C, true),
    brightWhite: adjustBrightnessForAnsi(s.base06, true),
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

export function schemeToGtk(s: ColorScheme): GtkColors {
  return {
    bg: s.base00,
    fg: s.base05,
    base: s.base01,
    text: s.base05,
    selectedBg: s.base0D,
    selectedFg: s.base07,
    tooltipBg: s.base02,
    tooltipFg: s.base05,
    buttonBg: s.base02,
    buttonFg: s.base05,
    border: s.base03,
    shadow: s.base00,
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

export function schemeToQt(s: ColorScheme): QtColors {
  return {
    window: s.base00,
    windowText: s.base05,
    base: s.base01,
    text: s.base05,
    button: s.base02,
    buttonText: s.base05,
    highlight: s.base0D,
    highlightedText: s.base07,
    tooltipBase: s.base02,
    tooltipText: s.base05,
    disabled: s.base03,
  };
}
