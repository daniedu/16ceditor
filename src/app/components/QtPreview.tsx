"use client";

import { memo } from "react";
import { ColorScheme, RoleMapping, DEFAULT_ROLE_MAPPING } from "@/src/lib/types";
import { schemeToQt } from "@/src/lib/mappings";

export function QtPreview({ scheme, mapping = DEFAULT_ROLE_MAPPING }: { scheme: ColorScheme; mapping?: RoleMapping }) {
  const q = schemeToQt(scheme, mapping);

  return (
    <div className="border border-surface-high bg-surface overflow-hidden flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-low border-b border-surface-high">
        <span className="w-2.5 h-2.5 bg-error" />
        <span className="w-2.5 h-2.5 bg-[#f2e1b8]" />
        <span className="w-2.5 h-2.5 bg-[#b4d8ca]" />
        <span className="ml-auto text-[15px] text-outline">SIMULATION: Qt 6 (Kvantum, Stylix)</span>
      </div>

      <div style={{ background: q.window, color: q.windowText }}>
        <div className="flex items-center px-3 py-2 select-none border-b border-surface-high" style={{ background: q.base }}>
          <span className="font-bold text-[15px] tracking-tight" style={{ color: q.highlight }}>Explorer</span>
          <span className="text-[13px] ml-3">File</span>
          <span className="text-[13px] ml-2">Edit</span>
          <span className="text-[13px] ml-2">View</span>
          <span className="flex-1" />
          <span className="text-[13px] text-outline">&mdash;</span>
          <span className="mx-1.5 text-[15px] text-outline">&#9744;</span>
          <span className="text-[15px]" style={{ color: q.highlight }}>&#10005;</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface-high" style={{ background: q.button }}>
          <span className="text-[13px]" style={{ color: q.link }}>Home</span>
          <span className="text-[15px] text-outline">/</span>
          <span className="text-[15px] text-outline">Documents</span>
          <span className="text-[15px] text-outline">/</span>
          <span className="text-[15px]">Projects</span>
        </div>

        <div className="flex flex-1">
          <div className="w-32 p-2 space-y-0.5 shrink-0 border-r border-surface-high" style={{ background: q.base }}>
            {[
              { n: "Home", icon: "&#9660;", sel: true },
              { n: "Desktop", icon: "&#9654;", sel: false },
              { n: "Documents", icon: "&#9660;", sel: false },
              { n: "  Work", icon: "", sel: false },
              { n: "  Personal", icon: "", sel: false },
              { n: "Downloads", icon: "&#9654;", sel: false },
            ].map((item) => (
              <div key={item.n} className="flex items-center gap-1 px-2 py-1 text-[13px]" style={{
                background: item.sel ? q.highlight : "transparent",
                color: item.sel ? q.highlightedText : "var(--color-outline)",
                fontWeight: item.sel ? 500 : 400,
              }}>
                {item.icon && <span className="text-[15px]" style={{ color: item.sel ? q.highlightedText : "var(--color-outline)" }}
                  dangerouslySetInnerHTML={{ __html: item.icon }} />}
                <span>{item.n.trim()}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 p-3 space-y-2">
            <div className="px-2 py-1 text-[13px] border border-surface-high" style={{ background: q.base }}>
              <span className="text-outline">&#8997;</span>
              <span className="text-outline ml-1">search files...</span>
            </div>

            <div className="space-y-1">
              {[
                { n: "report.pdf", sz: "2.4 MB", c: scheme[mapping.red], sel: false, visited: false },
                { n: "notes.txt", sz: "12 KB", c: scheme[mapping.green], sel: false, visited: false },
                { n: "photo.jpg", sz: "3.7 MB", c: scheme[mapping.blue], sel: true, visited: false },
                { n: "archive.zip", sz: "156 KB", c: q.linkVisited, sel: false, visited: true },
              ].map((f) => (
                <div key={f.n} className="flex items-center gap-2 px-2 py-1.5 text-[13px]" style={{
                  background: f.sel ? q.highlight : "transparent",
                  color: f.sel ? q.highlightedText : q.text,
                }}>
                  <span className="text-[13px]" style={{ color: f.sel ? q.highlightedText : f.c }}>&#9632;</span>
                  <span className="flex-1" style={f.visited ? { color: q.linkVisited } : undefined}>{f.n}</span>
                  <span className="text-[13px]" style={{ color: f.sel ? q.highlightedText : q.disabled }}>{f.sz}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border-t border-surface-high" style={{ background: q.base }}>
          <button className="px-3 py-1 text-[13px] border border-surface-high" style={{ background: q.button, color: q.buttonText }}>
            Open
          </button>
          <button className="px-3 py-1 text-[13px]" style={{ background: q.inactiveHighlight, color: q.text }}>
            Select
          </button>
          <span className="flex-1 text-[15px] text-right">4 items</span>
        </div>
      </div>
    </div>
  );
}

export default memo(QtPreview);
