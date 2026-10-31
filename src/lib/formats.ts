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
  {
    id: "kitty",
    label: "Kitty",
    extension: ".conf",
    mime: "text/plain",
    generate: (s) =>
      `# ${s.name}${s.author ? ` by ${s.author}` : ""} — https://sw.kovidgoyal.net/kitty/conf.html\n` +
      `foreground ${s.base05}\nbackground ${s.base00}\nselection_foreground ${s.base00}\nselection_background ${s.base02}\n` +
      `cursor ${s.base05}\ncursor_text_color ${s.base00}\nurl_color ${s.base0C}\nactive_border_color ${s.base0D}\n` +
      `inactive_border_color ${s.base01}\nbell_color ${s.base0A}\nactive_tab_foreground ${s.base00}\nactive_tab_background ${s.base0D}\n` +
      `inactive_tab_foreground ${s.base04}\ninactive_tab_background ${s.base01}\ntab_bar_background ${s.base01}\n\n` +
      `color0 ${s.base00}\ncolor1 ${s.base08}\ncolor2 ${s.base0B}\ncolor3 ${s.base0A}\n` +
      `color4 ${s.base0D}\ncolor5 ${s.base0E}\ncolor6 ${s.base0C}\ncolor7 ${s.base05}\n` +
      `color8 ${s.base03}\ncolor9 ${s.base08}\ncolor10 ${s.base0B}\ncolor11 ${s.base0A}\n` +
      `color12 ${s.base0D}\ncolor13 ${s.base0E}\ncolor14 ${s.base0C}\ncolor15 ${s.base06}\n`,
  },
  {
    id: "ghostty",
    label: "Ghostty",
    extension: ".conf",
    mime: "text/plain",
    generate: (s) =>
      `# ${s.name}${s.author ? ` by ${s.author}` : ""} — https://ghostty.org/docs/config\n` +
      `background = ${s.base00}\nforeground = ${s.base05}\ncursor-color = ${s.base05}\ncursor-text = ${s.base00}\n` +
      `selection-background = ${s.base02}\nselection-foreground = ${s.base05}\n\n` +
      `palette = 0=${s.base00}\npalette = 1=${s.base08}\npalette = 2=${s.base0B}\npalette = 3=${s.base0A}\n` +
      `palette = 4=${s.base0D}\npalette = 5=${s.base0E}\npalette = 6=${s.base0C}\npalette = 7=${s.base05}\n` +
      `palette = 8=${s.base03}\npalette = 9=${s.base08}\npalette = 10=${s.base0B}\npalette = 11=${s.base0A}\n` +
      `palette = 12=${s.base0D}\npalette = 13=${s.base0E}\npalette = 14=${s.base0C}\npalette = 15=${s.base06}\n`,
  },
  {
    id: "neovim",
    label: "Neovim Lua",
    extension: ".lua",
    mime: "text/plain",
    generate: (s) => {
      const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom";
      return (
        `-- ${s.name}${s.author ? ` by ${s.author}` : ""} — save as lua/colors/${slug}.lua and use :colorscheme ${slug}\n` +
        `local c = {\n` +
        `  base00 = "${s.base00}", base01 = "${s.base01}", base02 = "${s.base02}", base03 = "${s.base03}",\n` +
        `  base04 = "${s.base04}", base05 = "${s.base05}", base06 = "${s.base06}", base07 = "${s.base07}",\n` +
        `  base08 = "${s.base08}", base09 = "${s.base09}", base0A = "${s.base0A}", base0B = "${s.base0B}",\n` +
        `  base0C = "${s.base0C}", base0D = "${s.base0D}", base0E = "${s.base0E}", base0F = "${s.base0F}",\n` +
        `}\n\n` +
        `local hi = vim.fn.highlight\n` +
        `local g = vim.g\n\n` +
        `g.colors_name = "${slug}"\n\n` +
        `hi(0, "Normal",    { guifg = c.base05, guibg = c.base00 })\n` +
        `hi(0, "Comment",   { guifg = c.base03 })\n` +
        `hi(0, "Constant",  { guifg = c.base09 })\n` +
        `hi(0, "String",    { guifg = c.base0B })\n` +
        `hi(0, "Function",  { guifg = c.base0D })\n` +
        `hi(0, "Keyword",   { guifg = c.base0E })\n` +
        `hi(0, "Type",      { guifg = c.base0A })\n` +
        `hi(0, "Error",     { guifg = c.base08 })\n` +
        `hi(0, "Visual",    { guibg = c.base02 })\n` +
        `hi(0, "StatusLine",{ guifg = c.base00, guibg = c.base0D })\n` +
        `hi(0, "LineNr",    { guifg = c.base03 })\n` +
        `hi(0, "CursorLine",{ guibg = c.base01 })\n` +
        `hi(0, "Pmenu",     { guifg = c.base05, guibg = c.base01 })\n` +
        `hi(0, "PmenuSel",  { guifg = c.base00, guibg = c.base0D })\n`
      );
    },
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
