"use client";

import { ColorScheme, RoleMapping, DEFAULT_ROLE_MAPPING } from "@/src/lib/types";
import { schemeToGtk } from "@/src/lib/mappings";

export default function GtkPreview({ scheme, mapping = DEFAULT_ROLE_MAPPING }: { scheme: ColorScheme; mapping?: RoleMapping }) {
  const g = schemeToGtk(scheme, mapping);

  return (
    <div className="border border-surface-high overflow-hidden flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b" style={{ background: scheme.base01, borderColor: scheme.base02 }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: scheme.base08 }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: scheme.base0A }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: scheme.base0B }} />
        <span className="ml-auto text-[12px]" style={{ color: scheme.base04 }}>SIMULATION: GTK 4 (adw-gtk3)</span>
      </div>

      <div style={{ background: g.windowBg, color: g.windowFg }}>
        <div className="flex items-center gap-3 px-3 py-2 select-none border-b" style={{ background: g.headerbarBg, borderColor: g.border, color: g.headerbarFg }}>
          <span className="font-bold text-[14px] tracking-tight" style={{ color: g.accent }}>Files</span>
          <span className="text-[13px]" style={{ color: scheme.base04 }}>File</span>
          <span className="text-[13px]" style={{ color: scheme.base04 }}>Edit</span>
          <span className="text-[13px]" style={{ color: scheme.base04 }}>View</span>
          <span className="flex-1" />
          <span className="px-2 py-0.5 text-[13px] border rounded" style={{ borderColor: g.border, color: scheme.base04 }}>~ search</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ borderColor: g.border }}>
          <div className="flex gap-1">
            <div className="px-2 py-0.5 text-[13px] border rounded" style={{ background: g.cardBg, borderColor: g.border, color: g.cardFg }}>&larr;</div>
            <div className="px-2 py-0.5 text-[13px] border rounded" style={{ background: g.cardBg, borderColor: g.border, color: g.cardFg }}>&rarr;</div>
          </div>
          <div className="flex-1 px-2 py-0.5 text-[13px] border rounded" style={{ background: g.viewBg, borderColor: g.border }}>
            <span style={{ color: g.accent }}>Home</span>
            <span style={{ color: scheme.base04 }}> / Documents</span>
          </div>
        </div>

        <div className="flex">
          <div className="w-28 p-2 space-y-0.5 shrink-0 border-r" style={{ background: g.sidebarBg, borderColor: g.border }}>
            {["Home", "Desktop", "Documents", "Downloads", "Music", "Pictures"].map((n, i) => (
              <div key={n} className="px-2 py-1 text-[13px] flex items-center gap-1.5 rounded" style={{
                background: i === 0 ? `${g.accent}22` : "transparent",
                color: i === 0 ? g.sidebarFg : scheme.base04,
              }}>
                <span className="text-[12px]" style={{ color: i === 0 ? g.accent : scheme.base04 }}>&#9679;</span>
                {n}
              </div>
            ))}
          </div>

          <div className="flex-1 p-3 space-y-1" style={{ background: g.viewBg }}>
            {[
              { n: "report.pdf", sz: "2.4 MB", c: g.destructive },
              { n: "notes.txt", sz: "12 KB", c: g.success },
              { n: "photo.jpg", sz: "3.7 MB", c: g.accent },
              { n: "budget.xlsx", sz: "156 KB", c: g.success },
            ].map((f, i) => (
              <div key={f.n} className="flex items-center gap-2 px-2 py-1.5 text-[13px] rounded" style={{
                background: i === 0 ? `${g.accent}12` : "transparent",
                color: i === 0 ? g.viewFg : scheme.base04,
              }}>
                <span className="text-[13px] shrink-0" style={{ color: f.c }}>&#9632;</span>
                <span className="flex-1">{f.n}</span>
                <span className="text-[13px]" style={{ color: scheme.base04 }}>{f.sz}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 text-[13px] border-t" style={{ background: g.headerbarBg, borderColor: g.border, color: scheme.base04 }}>
          <span style={{ color: g.accent }}>&#9679;</span>
          <span>5 items</span>
          <span className="flex-1" />
          <span>List view</span>
        </div>
      </div>
    </div>
  );
}
