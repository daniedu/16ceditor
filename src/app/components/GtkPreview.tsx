"use client";

import { ColorScheme } from "@/src/lib/types";
import { schemeToGtk } from "@/src/lib/mappings";

export default function GtkPreview({ scheme }: { scheme: ColorScheme }) {
  const g = schemeToGtk(scheme);

  return (
    <div className="border border-surface-high bg-surface overflow-hidden flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-low border-b border-surface-high">
        <span className="w-2.5 h-2.5 bg-error" />
        <span className="w-2.5 h-2.5 bg-[#f2e1b8]" />
        <span className="w-2.5 h-2.5 bg-[#b4d8ca]" />
        <span className="ml-auto text-[15px] text-outline">SIMULATION: GTK 4.0</span>
      </div>

      <div style={{ background: g.bg, color: g.fg }}>
        <div className="flex items-center gap-3 px-3 py-2 select-none border-b border-surface-high" style={{ background: scheme.base01 }}>
          <span className="font-bold text-[15px] tracking-tight" style={{ color: g.selectedBg }}>Files</span>
          <span className="text-[13px] text-outline">File</span>
          <span className="text-[13px] text-outline">Edit</span>
          <span className="text-[13px] text-outline">View</span>
          <span className="flex-1" />
          <span className="px-2 py-0.5 text-[15px] border border-surface-high text-outline">~ search</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface-high">
          <div className="flex gap-1">
            <div className="px-2 py-0.5 text-[13px] border border-surface-high" style={{ background: g.buttonBg, color: g.buttonFg }}>&larr;</div>
            <div className="px-2 py-0.5 text-[13px] border border-surface-high" style={{ background: g.buttonBg, color: g.buttonFg }}>&rarr;</div>
          </div>
          <div className="flex-1 px-2 py-0.5 text-[13px] border border-surface-high" style={{ background: g.base }}>
            <span style={{ color: g.selectedBg }}>Home</span>
            <span className="text-outline"> / Documents</span>
          </div>
        </div>

        <div className="flex flex-1">
          <div className="w-28 p-2 space-y-0.5 shrink-0 border-r border-surface-high" style={{ background: scheme.base01 }}>
            {["Home", "Desktop", "Documents", "Downloads", "Music", "Pictures"].map((n, i) => (
              <div key={n} className="px-2 py-1 text-[13px] flex items-center gap-1.5" style={{
                background: i === 0 ? g.selectedBg + "20" : "transparent",
                color: i === 0 ? g.fg : "var(--color-outline)",
              }}>
                <span className="text-[13px]" style={{ color: i === 0 ? g.selectedBg : "var(--color-outline)" }}>&#9679;</span>
                {n}
              </div>
            ))}
          </div>

          <div className="flex-1 p-3 space-y-1">
            {[
              { n: "report.pdf", sz: "2.4 MB", c: scheme.base08 },
              { n: "notes.txt", sz: "12 KB", c: scheme.base0B },
              { n: "photo.jpg", sz: "3.7 MB", c: scheme.base0D },
              { n: "budget.xlsx", sz: "156 KB", c: scheme.base0B },
            ].map((f, i) => (
              <div key={f.n} className="flex items-center gap-2 px-2 py-1.5 text-[13px]" style={{
                background: i === 0 ? g.selectedBg + "12" : "transparent",
                color: i === 0 ? g.fg : scheme.base04,
              }}>
                <span className="text-[13px] shrink-0" style={{ color: f.c }}>&#9632;</span>
                <span className="flex-1">{f.n}</span>
                <span className="text-[13px] text-outline">{f.sz}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 text-[15px] border-t border-surface-high" style={{ background: scheme.base01, color: "var(--color-outline)" }}>
          <span style={{ color: g.selectedBg }}>&#9679;</span>
          <span>5 items</span>
          <span className="flex-1" />
          <span>List view</span>
        </div>
      </div>
    </div>
  );
}
