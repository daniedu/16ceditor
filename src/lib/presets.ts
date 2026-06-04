import { ColorScheme, BaseKey } from "./types";

export const BASE_KEYS: BaseKey[] = [
  "base00","base01","base02","base03","base04","base05","base06","base07",
  "base08","base09","base0A","base0B","base0C","base0D","base0E","base0F",
];

export const SWATCH_LABELS: Record<BaseKey, string> = {
  base00: "SURFACE", base01: "CONTAINER", base02: "INPUT", base03: "MUTED",
  base04: "DARK FG", base05: "FG", base06: "LIGHT FG", base07: "LIGHT BG",
  base08: "RED", base09: "ORANGE", base0A: "YELLOW", base0B: "GREEN",
  base0C: "CYAN", base0D: "BLUE", base0E: "MAGENTA", base0F: "BROWN",
};

export const SWATCH_GROUPS: { label: string; keys: BaseKey[] }[] = [
  { label: "Backgrounds", keys: ["base00","base01","base02","base03"] },
  { label: "Foregrounds", keys: ["base04","base05","base06","base07"] },
  { label: "Accents", keys: ["base08","base09","base0A","base0B","base0C","base0D","base0E","base0F"] },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const presets: ColorScheme[] = [
  {
    name: "Gruvbox Dark", slug: "gruvbox-dark", author: "Pavel Pertsev",
    base00: "#282828", base01: "#3c3836", base02: "#504945", base03: "#665c54",
    base04: "#bdae93", base05: "#d5c4a1", base06: "#ebdbb2", base07: "#fbf1c7",
    base08: "#fb4934", base09: "#fe8019", base0A: "#fabd2f", base0B: "#b8bb26",
    base0C: "#8ec07c", base0D: "#83a598", base0E: "#d3869b", base0F: "#d65d0e",
  },
  {
    name: "Nord", slug: "nord", author: "Arctic Ice Studio",
    base00: "#2e3440", base01: "#3b4252", base02: "#434c5e", base03: "#4c566a",
    base04: "#d8dee9", base05: "#e5e9f0", base06: "#eceff4", base07: "#8fbcbb",
    base08: "#bf616a", base09: "#d08770", base0A: "#ebcb8b", base0B: "#a3be8c",
    base0C: "#88c0d0", base0D: "#81a1c1", base0E: "#b48ead", base0F: "#5e81ac",
  },
  {
    name: "Solarized Dark", slug: "solarized-dark", author: "Ethan Schoonover",
    base00: "#002b36", base01: "#073642", base02: "#586e75", base03: "#657b83",
    base04: "#839496", base05: "#93a1a1", base06: "#eee8d5", base07: "#fdf6e3",
    base08: "#dc322f", base09: "#cb4b16", base0A: "#b58900", base0B: "#859900",
    base0C: "#2aa198", base0D: "#268bd2", base0E: "#6c71c4", base0F: "#d33682",
  },
  {
    name: "Dracula", slug: "dracula", author: "Dracula Theme",
    base00: "#282a36", base01: "#343746", base02: "#3d3f51", base03: "#535563",
    base04: "#e4e4e8", base05: "#f2f2f5", base06: "#f9f9fb", base07: "#ffffff",
    base08: "#ff5555", base09: "#ffb86c", base0A: "#f1fa8c", base0B: "#50fa7b",
    base0C: "#8be9fd", base0D: "#bd93f9", base0E: "#ff79c6", base0F: "#e6c79b",
  },
  {
    name: "One Dark", slug: "one-dark", author: "Atom",
    base00: "#1e2127", base01: "#282c34", base02: "#353b45", base03: "#4f5666",
    base04: "#7b8394", base05: "#abb2bf", base06: "#b6bdc9", base07: "#c8ccd4",
    base08: "#e06c75", base09: "#d19a66", base0A: "#e5c07b", base0B: "#98c379",
    base0C: "#56b6c2", base0D: "#61afef", base0E: "#c678dd", base0F: "#be5046",
  },
  {
    name: "Catppuccin Mocha", slug: "catppuccin-mocha", author: "Catppuccin",
    base00: "#11111b", base01: "#181825", base02: "#1e1e2e", base03: "#313244",
    base04: "#585b70", base05: "#cdd6f4", base06: "#f5f5f5", base07: "#ffffff",
    base08: "#f38ba8", base09: "#fab387", base0A: "#f9e2af", base0B: "#a6e3a1",
    base0C: "#94e2d5", base0D: "#89b4fa", base0E: "#cba6f7", base0F: "#f2cdcd",
  },
  {
    name: "Tokyo Night", slug: "tokyo-night", author: "Enkia",
    base00: "#1a1b26", base01: "#24283b", base02: "#2f354b", base03: "#444b6a",
    base04: "#787c99", base05: "#a9b1d6", base06: "#c0caf5", base07: "#e2e8f0",
    base08: "#f7768e", base09: "#ff9e64", base0A: "#e0af68", base0B: "#9ece6a",
    base0C: "#73daca", base0D: "#7aa2f7", base0E: "#bb9af7", base0F: "#f7768e",
  },
  {
    name: "Everforest Dark", slug: "everforest-dark", author: "sainnhe",
    base00: "#2b3339", base01: "#323d43", base02: "#3d484d", base03: "#515e65",
    base04: "#869a9a", base05: "#d3c6aa", base06: "#e6e0cc", base07: "#f4f0d9",
    base08: "#e67e80", base09: "#e69875", base0A: "#dbbc7f", base0B: "#a7c080",
    base0C: "#83c092", base0D: "#7fbbb3", base0E: "#d699b6", base0F: "#9da9a0",
  },
  {
    name: "Ayu Dark", slug: "ayu-dark", author: "tehnix",
    base00: "#0b0e14", base01: "#131721", base02: "#1a1f29", base03: "#252a36",
    base04: "#565e73", base05: "#bfc7d5", base06: "#cbd2e1", base07: "#d9e0ee",
    base08: "#f07178", base09: "#fa8d3e", base0A: "#f2ae49", base0B: "#aad94c",
    base0C: "#95e6cb", base0D: "#59c2ff", base0E: "#d2a6ff", base0F: "#e6b673",
  },
  {
    name: "Decaf", slug: "decaf", author: "Alex Mirrington",
    base00: "#2d2d2d", base01: "#393939", base02: "#515151", base03: "#777777",
    base04: "#b4b7b4", base05: "#cccccc", base06: "#e0e0e0", base07: "#ffffff",
    base08: "#ff7f7b", base09: "#ffbf70", base0A: "#ffd67c", base0B: "#beda78",
    base0C: "#70d0d0", base0D: "#90d0ff", base0E: "#f0a0e0", base0F: "#e0c090",
  },
];

export function createEmptyScheme(name: string): ColorScheme {
  const slug = slugify(name);
  return {
    name, slug,
    base00: "#131313", base01: "#1b1c1c", base02: "#1f2020", base03: "#353535",
    base04: "#93927b", base05: "#e4e2e1", base06: "#c3b48d", base07: "#e7ea54",
    base08: "#ffb4ab", base09: "#f2e1b8", base0A: "#d4d742", base0B: "#b4d8ca",
    base0C: "#abcec0", base0D: "#d5c59e", base0E: "#c9c8af", base0F: "#e4e2e1",
  };
}
