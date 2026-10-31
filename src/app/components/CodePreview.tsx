"use client";

import { useState, memo } from "react";
import { ColorScheme, RoleMapping, DEFAULT_ROLE_MAPPING, BaseKey } from "@/src/lib/types";

type CodeLang = "rust" | "typescript" | "python" | "bash";

const LANGS: Record<CodeLang, { label: string; file: string; snippet: string; keywords: string[] }> = {
  rust: {
    label: "Rust",
    file: "main.rs",
    keywords: ["fn", "let", "mut", "for", "in", "match", "if", "else", "return", "println", "u32", "struct", "impl", "enum", "use", "pub"],
    snippet: `fn fibonacci(n: u32) -> u32 {
  match n {
    0 | 1 => n,
    _ => fibonacci(n - 1) + fibonacci(n - 2),
  }
}

fn main() {
  let mut count = 0;
  for i in 0..10 {
    let result = fibonacci(i);
    println!("fib({}) = {}", i, result);
    count += result;
  }
  println!("total: {}", count); // classic recursion
}`,
  },
  typescript: {
    label: "TypeScript",
    file: "theme.ts",
    keywords: ["import", "export", "from", "const", "let", "var", "function", "return", "class", "new", "async", "await", "if", "else", "for", "while", "interface", "type", "null", "undefined", "default"],
    snippet: `import { theme } from "./colors";

// flatten base16 into tailwind vars
export const palette = theme.base08.map((hex, i) => ({
  name: \`variant-\${i}\`,
  hex,
}));

export function contrast(fg: string, bg: string): number {
  const l = (hex: string) => 0.2126 * hex.r + 0.7152 * hex.g + 0.0722 * hex.b;
  const a = l(fg) + 0.05, b = l(bg) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}`,
  },
  python: {
    label: "Python",
    file: "main.py",
    keywords: ["def", "return", "import", "from", "class", "for", "in", "if", "elif", "else", "while", "lambda", "print", "self", "None", "True", "False", "with", "open", "range", "not"],
    snippet: `from pathlib import Path

# pick the darkest colour as terminal bg
def darkest_base00(scheme: dict) -> str:
    best, best_l = None, 999.0
    for key in ("base00", "base01", "base02"):
        hexv = scheme[key]
        lum = luminance(hexv)
        if lum < best_l:
            best, best_l = hexv, lum
    return best

if __name__ == "__main__":
    theme = load_theme("solarized-dark.yaml")
    print(darkest_base00(theme))`,
  },
  bash: {
    label: "Bash",
    file: "rice.sh",
    keywords: ["echo", "export", "if", "then", "fi", "for", "do", "done", "while", "function", "sudo", "pacman", "grep", "sed", "case", "esac", "source", "local"],
    snippet: `#!/usr/bin/env bash
# apply palette system-wide

apply() {
  wal --theme "$1" && echo "applied: $1"
  notify-send "wal" "theme $1 loaded"
}

if [[ -f "$HOME/.cache/wal/sequences" ]]; then
  source "$HOME/.cache/wal/sequences"
fi

for theme in gruvbox nord catppuccin; do
  apply "$theme"
done`,
  },
};

export function CodePreview({ scheme, mapping = DEFAULT_ROLE_MAPPING }: { scheme: ColorScheme; mapping?: RoleMapping }) {
  const [lang, setLang] = useState<CodeLang>("rust");
  const [customCode, setCustomCode] = useState<string | null>(null);
  const meta = LANGS[lang];
  const code = customCode ?? meta.snippet;

  return (
    <div className="border border-surface-high bg-surface overflow-hidden flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-low border-b border-surface-high">
        <span className="w-2.5 h-2.5 bg-error" />
        <span className="w-2.5 h-2.5 bg-[#f2e1b8]" />
        <span className="w-2.5 h-2.5 bg-[#b4d8ca]" />
        <span className="ml-auto text-[15px] text-outline">CODE EDITOR</span>
      </div>

      <div className="flex gap-1 px-3 pt-2 bg-surface-low">
        {(Object.keys(LANGS) as CodeLang[]).map((l) => (
          <button
            key={l}
            onClick={() => { setLang(l); setCustomCode(null); }}
            className="px-2 py-1 text-[12px] border-t border-l border-r"
            style={{
              background: l === lang ? scheme.base00 : scheme.base01,
              color: l === lang ? scheme.base05 : scheme.base03,
              borderColor: `var(--color-surface-high)`,
            }}
          >
            {LANGS[l].label}
          </button>
        ))}
      </div>

      <div className="flex gap-0.5 px-3 pt-2 bg-surface-low">
        {([meta.file, "lib.rs", "types.rs"].map((f, i) => ({ f, i }))).map(({ f, i }) => (
          <div
            key={f}
            className="px-2 py-1 text-[13px] border-t border-l border-r border-surface-high"
            style={{
              background: i === 0 ? scheme.base00 : scheme.base02,
              color: i === 0 ? scheme.base05 : scheme.base03,
              marginBottom: -1,
            }}
          >
            {f}
          </div>
        ))}
        <div className="px-1.5 py-1 text-[15px] text-outline">+</div>
      </div>

      <pre
        className="p-3 text-[14px] leading-relaxed overflow-x-auto font-mono border-t border-surface-high"
        style={{ background: scheme.base00 }}
      >
        {code.split("\n").map((line, i) => (
          <div key={i} className="flex">
            <span className="w-6 text-right mr-2 shrink-0 select-none text-[15px] text-outline" style={{ color: scheme.base03 }}>
              {i + 1}
            </span>
            <span>{tokenize(line, scheme, mapping, lang)}</span>
          </div>
        ))}
      </pre>

      <textarea
        value={customCode ?? ""}
        onChange={(e) => setCustomCode(e.target.value)}
        placeholder="paste your own code here to preview it with this scheme…"
        className="px-3 py-2 text-[13px] font-mono resize-y border-t border-surface-high outline-none min-h-[64px] max-h-48"
        style={{ background: scheme.base01, color: scheme.base04 }}
      />

      <div className="flex items-center gap-2 px-3 py-1.5 text-[15px] border-t border-surface-high" style={{ background: scheme.base01, color: "var(--color-outline)" }}>
        <span className="w-1.5 h-1.5" style={{ background: scheme.base0B }} />
        <span>{customCode ? "custom" : meta.label}</span>
        {customCode && (
          <button onClick={() => setCustomCode(null)} className="underline" style={{ color: scheme.base0D }}>
            reset
          </button>
        )}
        <span className="flex-1" />
        <span>Ln {code.split("\n").length}, Col 1</span>
        <span>UTF-8</span>
        <span>Spaces: 2</span>
      </div>
    </div>
  );
}

const COMMENT_START: Record<CodeLang, string> = {
  rust: "//",
  typescript: "//",
  python: "#",
  bash: "#",
};

function tokenize(line: string, s: ColorScheme, mapping: RoleMapping, lang: CodeLang) {
  const meta = LANGS[lang];
  const parts: { text: string; color: string }[] = [];
  const trimmed = line.trimStart();

  if (trimmed.startsWith(COMMENT_START[lang])) {
    return <span style={{ color: s.base03 }}>{line}</span>;
  }

  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    const inlineComment = rest.startsWith(COMMENT_START[lang]);
    if (inlineComment) {
      parts.push({ text: rest, color: s.base03 });
      break;
    }
    const kw = rest.match(new RegExp(`^(?:${meta.keywords.join("|")})\\b`));
    if (kw) { parts.push({ text: kw[0], color: s[mapping.magenta] }); i += kw[0].length; continue; }
    const num = rest.match(/^\d+\.?\d*/);
    if (num) { parts.push({ text: num[0], color: s[mapping.orange] }); i += num[0].length; continue; }
    const str = rest.match(/^"[^"]*"?|^'[^']*'?|^`[^`]*`?/);
    if (str) { parts.push({ text: str[0], color: s[mapping.green] }); i += str[0].length; continue; }
    const id = rest.match(/^[a-zA-Z_\-]\w*/);
    if (id) {
      const decorator = rest[id[0].length] === ":" && lang === "python";
      parts.push({ text: id[0], color: decorator ? s[mapping.yellow] : s[mapping.fg] });
      i += id[0].length; continue;
    }
    const sel = rest.match(/^\$\w+|^@\w+/);
    if (sel) { parts.push({ text: sel[0], color: s[mapping.cyan] }); i += sel[0].length; continue; }
    if ("(){}".includes(rest[0])) { parts.push({ text: rest[0], color: s[mapping.blue] }); i++; continue; }
    if ("=+-*/!><.".includes(rest[0])) { parts.push({ text: rest[0], color: s[mapping.cyan] }); i++; continue; }
    if (":;,".includes(rest[0])) { parts.push({ text: rest[0], color: s[mapping.darkFg] }); i++; continue; }
    if (rest[0] === "_") { parts.push({ text: "_", color: s[mapping.yellow] }); i++; continue; }
    parts.push({ text: rest[0], color: s[mapping.fg] }); i++;
  }
  return parts.map((p, j) => <span key={j} style={{ color: p.color }}>{p.text}</span>);
}

export default memo(CodePreview);
