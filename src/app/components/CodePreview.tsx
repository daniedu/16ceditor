"use client";

import { ColorScheme, RoleMapping, DEFAULT_ROLE_MAPPING } from "@/src/lib/types";

const code = `fn fibonacci(n: u32) -> u32 {
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
  println!("total: {}", count);
}`;

export default function CodePreview({ scheme, mapping = DEFAULT_ROLE_MAPPING }: { scheme: ColorScheme; mapping?: RoleMapping }) {
  return (
    <div className="border border-surface-high bg-surface overflow-hidden flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-low border-b border-surface-high">
        <span className="w-2.5 h-2.5 bg-error" />
        <span className="w-2.5 h-2.5 bg-[#f2e1b8]" />
        <span className="w-2.5 h-2.5 bg-[#b4d8ca]" />
        <span className="ml-auto text-[15px] text-outline">CODE EDITOR</span>
      </div>

      <div className="flex gap-0.5 px-3 pt-2 bg-surface-low">
        {["main.rs", "lib.rs", "types.rs"].map((f, i) => (
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
            {i === 0 && <span className="ml-1.5 text-outline">&#10005;</span>}
          </div>
        ))}
        <div className="px-1.5 py-1 text-[15px] text-outline">+</div>
      </div>

      <pre className="p-3 text-[14px] leading-relaxed overflow-x-auto font-mono border-t border-surface-high" style={{ background: scheme.base00 }}>
        {code.split("\n").map((line, i) => (
          <div key={i} className="flex">
            <span className="w-6 text-right mr-2 shrink-0 select-none text-[15px] text-outline">
              {i + 1}
            </span>
            <span>{tokenize(line, scheme, mapping)}</span>
          </div>
        ))}
      </pre>

      <div className="flex items-center gap-2 px-3 py-1.5 text-[15px] border-t border-surface-high" style={{ background: scheme.base01, color: "var(--color-outline)" }}>
        <span className="w-1.5 h-1.5" style={{ background: scheme.base0B }} />
        <span>Rust</span>
        <span className="flex-1" />
        <span>Ln 18, Col 1</span>
        <span>UTF-8</span>
        <span>Spaces: 2</span>
      </div>
    </div>
  );
}

function tokenize(line: string, s: ColorScheme, mapping: RoleMapping = DEFAULT_ROLE_MAPPING) {
  const parts: { text: string; color: string }[] = [];
  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    const kw = rest.match(/^(fn|let|mut|for|in|match|if|else|return|println|u32)\b/);
    if (kw) { parts.push({ text: kw[1], color: s[mapping.magenta] }); i += kw[1].length; continue; }
    const num = rest.match(/^\d+/);
    if (num) { parts.push({ text: num[0], color: s[mapping.orange] }); i += num[0].length; continue; }
    const id = rest.match(/^[a-zA-Z_]\w*/);
    if (id) { parts.push({ text: id[0], color: s[mapping.fg] }); i += id[0].length; continue; }
    const str = rest.match(/^"[^"]*"/);
    if (str) { parts.push({ text: str[0], color: s[mapping.green] }); i += str[0].length; continue; }
    if ("(){}".includes(rest[0])) { parts.push({ text: rest[0], color: s[mapping.blue] }); i++; continue; }
    if ("=+-!><.".includes(rest[0])) { parts.push({ text: rest[0], color: s[mapping.cyan] }); i++; continue; }
    if (":;,".includes(rest[0])) { parts.push({ text: rest[0], color: s[mapping.darkFg] }); i++; continue; }
    if (rest[0] === "_") { parts.push({ text: "_", color: s[mapping.yellow] }); i++; continue; }
    if (rest[0] === " ") { parts.push({ text: " ", color: s[mapping.fg] }); i++; continue; }
    parts.push({ text: rest[0], color: s[mapping.muted] }); i++;
  }
  return parts.map((p, j) => <span key={j} style={{ color: p.color }}>{p.text}</span>);
}
