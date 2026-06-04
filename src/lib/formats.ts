import { ColorScheme, ExportFormat, BaseKey } from "./types";
import { BASE_KEYS } from "./presets";

function stripHash(h: string) {
  return h.replace("#", "").toUpperCase();
}

export const exportFormats: ExportFormat[] = [
  {
    id: "alacritty",
    label: "Alacritty YAML",
    extension: ".yml",
    mime: "text/yaml",
    generate: (s) =>
      `# ${s.name}${s.author ? ` by ${s.author}` : ""}\ncolors:\n  primary:\n` +
      `    background: '${s.base00}'\n    foreground: '${s.base05}'\n` +
      `  cursor:\n    text: '${s.base00}'\n    cursor: '${s.base05}'\n` +
      `  normal:\n    black: '${s.base00}'\n    red: '${s.base08}'\n` +
      `    green: '${s.base0B}'\n    yellow: '${s.base0A}'\n` +
      `    blue: '${s.base0D}'\n    magenta: '${s.base0E}'\n` +
      `    cyan: '${s.base0C}'\n    white: '${s.base05}'\n` +
      `  bright:\n    black: '${s.base03}'\n    red: '${s.base08}'\n` +
      `    green: '${s.base0B}'\n    yellow: '${s.base0A}'\n` +
      `    blue: '${s.base0D}'\n    magenta: '${s.base0E}'\n` +
      `    cyan: '${s.base0C}'\n    white: '${s.base06}'\n`,
  },
  {
    id: "base16-json",
    label: "Base16 JSON",
    extension: ".json",
    mime: "application/json",
    generate: (s) => {
      const scheme: Record<string, string> = { scheme: s.name, author: s.author || "" };
      for (const k of BASE_KEYS) scheme[k] = stripHash(s[k]);
      return JSON.stringify(scheme, null, 2);
    },
  },
  {
    id: "xresources",
    label: "Xresources",
    extension: ".Xresources",
    mime: "text/plain",
    generate: (s) =>
      `! ${s.name}${s.author ? ` by ${s.author}` : ""}\n` +
      `#define background ${s.base00}\n#define foreground ${s.base05}\n` +
      `#define cursor ${s.base05}\n#define cursor_fg ${s.base00}\n` +
      `*color0: ${s.base00}\n*color1: ${s.base08}\n*color2: ${s.base0B}\n*color3: ${s.base0A}\n` +
      `*color4: ${s.base0D}\n*color5: ${s.base0E}\n*color6: ${s.base0C}\n*color7: ${s.base05}\n` +
      `*color8: ${s.base03}\n*color9: ${s.base08}\n*color10: ${s.base0B}\n*color11: ${s.base0A}\n` +
      `*color12: ${s.base0D}\n*color13: ${s.base0E}\n*color14: ${s.base0C}\n*color15: ${s.base06}\n`,
  },
  {
    id: "terminal-sexy",
    label: "Terminal.sexy JSON",
    extension: ".json",
    mime: "application/json",
    generate: (s) => {
      const colors: Record<string, string> = {};
      [s.base00, s.base08, s.base0B, s.base0A, s.base0D, s.base0E, s.base0C, s.base05,
       s.base03, s.base08, s.base0B, s.base0A, s.base0D, s.base0E, s.base0C, s.base06]
        .forEach((c, i) => { colors[i < 8 ? `color_${i}` : `color_${i}`] = c; });
      return JSON.stringify({ name: s.name, author: s.author || "", colors }, null, 2);
    },
  },
  {
    id: "gtk-css",
    label: "GTK CSS",
    extension: ".css",
    mime: "text/css",
    generate: (s) =>
      `@define-color theme_bg_color ${s.base00};\n` +
      `@define-color theme_fg_color ${s.base05};\n` +
      `@define-color theme_base_color ${s.base01};\n` +
      `@define-color theme_text_color ${s.base05};\n` +
      `@define-color theme_selected_bg_color ${s.base0D};\n` +
      `@define-color theme_selected_fg_color ${s.base07};\n` +
      `@define-color theme_tooltip_bg_color ${s.base02};\n` +
      `@define-color theme_tooltip_fg_color ${s.base05};\n` +
      `@define-color theme_button_bg_color ${s.base02};\n` +
      `@define-color theme_button_fg_color ${s.base05};\n` +
      `@define-color borders ${s.base03};\n` +
      `@define-color theme_unfocused_fg_color ${s.base04};\n`,
  },
  {
    id: "qt-stylesheet",
    label: "Qt Stylesheet",
    extension: ".qss",
    mime: "text/css",
    generate: (s) =>
      `QWidget {\n  background-color: ${s.base00};\n  color: ${s.base05};\n}\n` +
      `QMenuBar, QToolBar {\n  background-color: ${s.base01};\n}\n` +
      `QPushButton {\n  background-color: ${s.base02};\n  color: ${s.base05};\n  border: 1px solid ${s.base03};\n}\n` +
      `QLineEdit {\n  background-color: ${s.base02};\n  color: ${s.base05};\n  border: 1px solid ${s.base03};\n}\n` +
      `QListView::item:selected {\n  background: ${s.base0D};\n  color: ${s.base07};\n}\n`,
  },
  {
    id: "base16-yaml",
    label: "Base16 YAML",
    extension: ".yaml",
    mime: "text/yaml",
    generate: (s) => {
      const lines = [`scheme: "${s.name}"`];
      if (s.author) lines.push(`author: "${s.author}"`);
      for (const k of BASE_KEYS) lines.push(`${k}: "${stripHash(s[k])}"`);
      return lines.join("\n") + "\n";
    },
  },
  {
    id: "kde-konsole",
    label: "KDE Konsole",
    extension: ".colorscheme",
    mime: "text/plain",
    generate: (s) =>
      `[General]\nDescription=${s.name}\nOpacity=1\n\n[Background]\nColor=${s.base00}\n\n[Foreground]\nColor=${s.base05}\n\n` +
      `[Color0]\nColor=${s.base00}\n[Color1]\nColor=${s.base08}\n[Color2]\nColor=${s.base0B}\n` +
      `[Color3]\nColor=${s.base0A}\n[Color4]\nColor=${s.base0D}\n[Color5]\nColor=${s.base0E}\n` +
      `[Color6]\nColor=${s.base0C}\n[Color7]\nColor=${s.base05}\n` +
      `[Color0Intense]\nColor=${s.base03}\n[Color1Intense]\nColor=${s.base08}\n` +
      `[Color2Intense]\nColor=${s.base0B}\n[Color3Intense]\nColor=${s.base0A}\n` +
      `[Color4Intense]\nColor=${s.base0D}\n[Color5Intense]\nColor=${s.base0E}\n` +
      `[Color6Intense]\nColor=${s.base0C}\n[Color7Intense]\nColor=${s.base06}\n`,
  },
];

export function parseBase16Yaml(text: string): Partial<ColorScheme> | null {
  try {
    const scheme: Partial<ColorScheme> = {};
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) continue;
      const key = trimmed.slice(0, colonIdx).trim();
      let value = trimmed.slice(colonIdx + 1).trim();
      value = value.replace(/^["']|["']$/g, "");
      if (key === "scheme") scheme.name = value;
      else if (key === "author") scheme.author = value;
      else if (BASE_KEYS.includes(key as BaseKey)) {
        const hex = value.startsWith("#") ? value : `#${value}`;
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) scheme[key as BaseKey] = hex;
      }
    }
    return BASE_KEYS.every((k) => scheme[k] !== undefined) ? scheme : null;
  } catch {
    return null;
  }
}

export function parseBase16Json(text: string): Partial<ColorScheme> | null {
  try {
    const data = JSON.parse(text);
    const scheme: Partial<ColorScheme> = {};
    if (data.scheme) scheme.name = data.scheme;
    if (data.author) scheme.author = data.author;
    for (const k of BASE_KEYS) {
      if (data[k]) {
        const v = data[k].startsWith("#") ? data[k] : `#${data[k]}`;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) scheme[k] = v;
      }
    }
    const hasAll = BASE_KEYS.every((k) => scheme[k] !== undefined);
    return hasAll ? scheme : null;
  } catch {
    return null;
  }
}
