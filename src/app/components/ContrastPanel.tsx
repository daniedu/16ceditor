"use client";

import { ColorScheme, RoleMapping, SemanticRole, DEFAULT_ROLE_MAPPING } from "@/src/lib/types";
import { contrastRatio, wcagLevel } from "@/src/lib/color";

const pairs: { bg: SemanticRole; fg: SemanticRole; label: string }[] = [
  { bg: "bg", fg: "fg", label: "BG / FG" },
  { bg: "container", fg: "fg", label: "Container / FG" },
  { bg: "input", fg: "fg", label: "Input / FG" },
  { bg: "bg", fg: "blue", label: "BG / Blue" },
  { bg: "bg", fg: "yellow", label: "BG / Yellow" },
  { bg: "bg", fg: "green", label: "BG / Green" },
  { bg: "bg", fg: "red", label: "BG / Red" },
  { bg: "container", fg: "darkFg", label: "Container / Dark FG" },
];

export default function ContrastPanel({ scheme, mapping = DEFAULT_ROLE_MAPPING }: { scheme: ColorScheme; mapping?: RoleMapping }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] font-semibold tracking-wider text-outline">CONTRAST ANALYSIS</div>
        <span className="text-[13px] text-primary px-1 py-0.5 border border-primary">WCAG 2.1</span>
      </div>

      <div className="space-y-1">
        {pairs.map((p) => {
          const bg = scheme[mapping[p.bg]];
          const fg = scheme[mapping[p.fg]];
          const ratio = contrastRatio(bg, fg);
          const level = wcagLevel(ratio);

          const levelColor = level === "AAA"
            ? "text-[#b4d8ca] border-[#b4d8ca]"
            : level === "AA"
            ? "text-[#d5c59e] border-[#d5c59e]"
            : "text-[#ffb4ab] border-[#ffb4ab]";

          const levelBg = level === "AAA"
            ? "bg-[#b4d8ca]/10"
            : level === "AA"
            ? "bg-[#d5c59e]/10"
            : "bg-[#ffb4ab]/10";

          return (
            <div
              key={p.label}
              className="flex items-center gap-2 px-2 py-1.5 border border-surface-high text-[13px]"
            >
              <div className="flex items-center gap-0.5 shrink-0">
                <span className="w-3 h-3 border border-outline-variant" style={{ background: bg }} />
                <span className="w-3 h-3 border border-outline-variant" style={{ background: fg }} />
              </div>
              <span className="text-outline w-20 shrink-0">{p.label}</span>
              <span className="text-[#e4e2e1] font-medium w-12 text-right">{ratio.toFixed(1)}:1</span>
              <span className={`px-1 py-0.5 text-[13px] border ${levelColor} ${levelBg}`}>
                {level === "AAA" ? "AAA" : level === "AA" ? "AA" : "FAIL"}
              </span>
              {level === "fail" && (
                <span className="ml-auto text-error text-[13px]">NEEDS FIX</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
