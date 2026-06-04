"use client";

import { ColorScheme } from "@/src/lib/types";
import { presets } from "@/src/lib/presets";

export default function SchemeSelector({
  current,
  onSelect,
}: {
  current: ColorScheme;
  onSelect: (s: ColorScheme) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {presets.map((p) => (
        <button
          key={p.name}
          className="px-2 py-0.5 rounded text-[13px] transition-all"
          style={{
            background: p === current ? p.base0D + "25" : "transparent",
            color: p === current ? p.base0D : p.base04,
            border: `1px solid ${p === current ? p.base0D + "55" : p.base02}`,
          }}
          onClick={() => onSelect(p)}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
