"use client";

import { ColorScheme, ViewTab, BaseKey } from "@/src/lib/types";
import { Palette, Eye, BarChart3, Sparkles, Plus, Copy, Download, Trash2, Upload } from "lucide-react";

interface SidebarProps {
  scheme: ColorScheme;
  schemes: ColorScheme[];
  activeSlug: string;
  onSelect: (s: ColorScheme) => void;
  onAdd: () => void;
  onDuplicate: (s: ColorScheme) => void;
  onDelete: (s: ColorScheme) => void;
  onRename: (s: ColorScheme, name: string) => void;
  activeTab: ViewTab;
  onTabChange: (t: ViewTab) => void;
  onImport: () => void;
  onExport: (s: ColorScheme) => void;
}

const schemeDots = ["base00", "base0A", "base03"] as const;

const tabs: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "editor", label: "Palette", icon: Palette },
  { id: "previews", label: "Previews", icon: Eye },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "generate", label: "Generate", icon: Sparkles },
];

export default function Sidebar({
  scheme, schemes, activeSlug, onSelect, onAdd, onDuplicate, onDelete, onRename,
  activeTab, onTabChange, onImport, onExport,
}: SidebarProps) {
  if (!scheme) return null;

  return (
    <div
      className="w-64 shrink-0 flex flex-col border-r select-none"
      style={{ background: scheme.base01, borderColor: scheme.base02, color: scheme.base05 }}
    >
      <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: scheme.base02 }}>
        <div className="font-bold tracking-tight text-sm" style={{ color: scheme.base0D }}>Stylix Architect</div>
        <div className="text-[12px] mt-0.5" style={{ color: scheme.base04 }}>16-Color Theme Studio</div>
      </div>

      <div className="flex flex-col gap-px px-1.5 py-2 border-b" style={{ borderColor: scheme.base02 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className="flex items-center gap-1.5 px-2 py-1 text-[13px] transition-all"
            style={{
              background: activeTab === t.id ? `${scheme.base0D}18` : "transparent",
              color: activeTab === t.id ? scheme.base0D : scheme.base04,
              borderLeft: activeTab === t.id ? `2px solid ${scheme.base0D}` : "2px solid transparent",
            }}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 pt-2 pb-0.5">
          <span className="text-[12px] font-semibold tracking-wider" style={{ color: scheme.base04 }}>SCHEMES</span>
          <button
            onClick={onAdd}
            className="hover:opacity-80 transition-opacity"
            style={{ color: scheme.base0D }}
            title="New scheme"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="px-1 pb-1 space-y-px">
          {schemes.map((s) => {
            const isActive = s.slug === activeSlug;
            return (
              <div
                key={s.slug}
                onClick={() => onSelect(s)}
                className="group flex items-center gap-1.5 px-2 py-1 text-[13px] cursor-pointer"
                style={{
                  background: isActive ? scheme.base02 : "transparent",
                  color: isActive ? scheme.base05 : scheme.base04,
                }}
              >
                <span className="flex shrink-0">
                  {schemeDots.map((dk, di) => (
                    <span
                      key={dk}
                      className="w-3 h-3.5"
                      style={{
                        background: s[dk],
                        borderLeft: di > 0 ? `1px solid ${scheme.base02}` : "none",
                      }}
                    />
                  ))}
                </span>
                <span className="flex-1 truncate">{s.name}</span>
                <span className="hidden group-hover:flex items-center gap-px">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(s); }}
                    className="hover:opacity-80"
                    style={{ color: scheme.base04 }}
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onExport(s); }}
                    className="hover:opacity-80"
                    style={{ color: scheme.base04 }}
                    title="Export"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(s); }}
                    className="hover:opacity-80"
                    style={{ color: scheme.base08 }}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t p-2" style={{ borderColor: scheme.base02 }}>
        <button
          onClick={onImport}
          className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[13px] border"
          style={{ borderColor: scheme.base03, color: scheme.base04 }}
        >
           <Upload className="w-4 h-4" />
          Import
        </button>
      </div>
    </div>
  );
}
