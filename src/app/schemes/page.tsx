"use client";

import { useState, useMemo } from "react";
import type { ColorScheme } from "@/src/lib/types";
import { BASE_KEYS, createEmptyScheme } from "@/src/lib/presets";
import { usePersistedSchemes } from "@/src/lib/usePersistedSchemes";
import { exportFormats } from "@/src/lib/formats";
import { contrastRatio } from "@/src/lib/color";
import { Palette, Eye, Download, Trash2, Copy, Plus, Search, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const formatGroups: { label: string; ids: string[] }[] = [
  { label: "Terminal", ids: ["alacritty", "xresources", "terminal-sexy", "kde-konsole"] },
  { label: "Base16", ids: ["base16-json", "base16-yaml"] },
  { label: "Desktop", ids: ["gtk-css", "qt-stylesheet"] },
];

export default function SchemesPage() {
  const router = useRouter();
  const [schemes, setSchemes] = usePersistedSchemes();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "newest" | "contrast">("name");
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState("base16-json");

  const filtered = useMemo(() => {
    let list = [...schemes];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || (s.author || "").toLowerCase().includes(q));
    }
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "contrast") {
      list.sort((a, b) => {
        const ra = contrastRatio(a.base00, a.base05);
        const rb = contrastRatio(b.base00, b.base05);
        return rb - ra;
      });
    }
    return list;
  }, [schemes, search, sortBy]);

  const handleDelete = (slug: string) => {
    if (schemes.length <= 1) return;
    setSchemes((prev) => prev.filter((s) => s.slug !== slug));
  };

  const handleDuplicate = (s: ColorScheme) => {
    const slug = `${s.slug || "scheme"}-copy-${Date.now()}`;
    setSchemes((prev) => [...prev, { ...s, name: `${s.name} (copy)`, slug }]);
  };

  const handleExport = (scheme: ColorScheme, formatId: string) => {
    const fmt = exportFormats.find((f) => f.id === formatId);
    if (!fmt) return;
    const content = fmt.generate(scheme);
    const blob = new Blob([content], { type: fmt.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scheme.slug || scheme.name.replace(/\s+/g, "-")}${fmt.extension}`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  };

  const handleLoad = (slug: string) => {
    try {
      sessionStorage.setItem("select-scheme", slug);
    } catch {}
    router.push("/");
  };

  const handleAddNew = () => {
    const slug = `custom-${schemes.length + 1}`;
    const newScheme = createEmptyScheme(`Custom ${schemes.length + 1}`);
    setSchemes((prev) => [...prev, { ...newScheme, slug }]);
    handleLoad(slug);
  };

  return (
    <div className="min-h-screen" style={{ background: "#131313", color: "#e4e2e1" }}>
      <header className="sticky top-0 z-10 border-b" style={{ background: "#1b1c1c", borderColor: "#1f2020" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Palette className="w-5 h-5 shrink-0" style={{ color: "#d5c59e" }} />
          <span className="font-bold tracking-tight text-sm" style={{ color: "#d5c59e" }}>
            SCHEME GALLERY
          </span>
          <span className="text-[12px] px-1.5 py-0.5" style={{ color: "#93927b", border: "1px solid #353535" }}>
            {schemes.length} schemes
          </span>
          <div className="flex-1" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#93927b" }} />
            <input
              className="w-full pl-7 pr-2 py-1 text-[13px] font-mono outline-none"
              placeholder="Search schemes..."
              style={{ background: "#131313", color: "#e4e2e1", border: "1px solid #353535" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-2 py-1 text-[12px] font-mono outline-none"
            style={{ background: "#131313", color: "#e4e2e1", border: "1px solid #353535" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="name">Name</option>
            <option value="newest">Newest</option>
            <option value="contrast">Contrast</option>
          </select>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1 px-3 py-1 text-[13px] font-semibold"
            style={{ background: "#d5c59e", color: "#131313" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
          <Link
            href="/"
            className="flex items-center gap-1 px-2 py-1 text-[13px]"
            style={{ color: "#93927b", border: "1px solid #353535" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Editor
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Palette className="w-12 h-12" style={{ color: "#353535" }} />
            <span className="text-[15px]" style={{ color: "#93927b" }}>
              {search ? "No schemes match your search." : "No schemes yet. Create one in the editor!"}
            </span>
            <Link
              href="/"
              className="px-4 py-1.5 text-[13px] font-semibold"
              style={{ background: "#d5c59e", color: "#131313" }}
            >
              Go to Editor
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((s) => (
              <SchemeCard
                key={s.slug}
                scheme={s}
                onLoad={() => handleLoad(s.slug || "")}
                onDuplicate={() => handleDuplicate(s)}
                onDelete={() => handleDelete(s.slug || "")}
                onExport={(fmt) => handleExport(s, fmt)}
                exporting={exporting === (s.slug || "")}
                exportFormat={exportFormat}
                onExportFormatChange={setExportFormat}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SchemeCard({
  scheme: s, onLoad, onDuplicate, onDelete, onExport,
  exporting, exportFormat, onExportFormatChange,
}: {
  scheme: ColorScheme;
  onLoad: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: (fmt: string) => void;
  exporting: boolean;
  exportFormat: string;
  onExportFormatChange: (f: string) => void;
}) {
  return (
    <div
      className="flex flex-col border rounded overflow-hidden transition-all hover:shadow-lg"
      style={{ borderColor: "#1f2020", background: "#1b1c1c" }}
    >
      <div className="flex h-8 w-full">
        {BASE_KEYS.map((k) => (
          <div
            key={k}
            className="flex-1 first:rounded-l last:rounded-r"
            style={{ background: s[k] }}
            title={`${k}: ${s[k]}`}
          />
        ))}
      </div>

      {s.sourceImage && (
        <div className="h-20 overflow-hidden">
          <img src={s.sourceImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex-1 p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold truncate" style={{ color: s.base05 }}>
              {s.name}
            </div>
            {s.author && (
              <div className="text-[11px]" style={{ color: s.base04 }}>
                by {s.author}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-8 gap-0.5">
          {BASE_KEYS.map((k) => (
            <div
              key={k}
              className="aspect-square rounded"
              style={{ background: s[k] }}
              title={`${k}: ${s[k]}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono truncate" style={{ color: s.base03 }}>
          <span>{s.base00}</span>
          <span>{s.base05}</span>
          <span>{s.base08}</span>
          <span>{s.base0D}</span>
        </div>
      </div>

      <div className="border-t p-2 space-y-1.5" style={{ borderColor: "#1f2020" }}>
        <div className="flex items-center gap-1">
          <button
            onClick={onLoad}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[12px] font-semibold"
            style={{ background: s.base0D, color: s.base00 }}
          >
            <Eye className="w-3 h-3" />
            Load
          </button>
          <button
            onClick={onDuplicate}
            className="touch-target px-2 py-1 text-[12px]"
            style={{ color: s.base04, border: `1px solid ${s.base03}` }}
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="touch-target px-2 py-1 text-[12px]"
            style={{ color: s.base08, border: `1px solid ${s.base03}` }}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <select
            className="flex-1 px-1.5 py-1 text-[11px] font-mono outline-none"
            style={{ background: "#131313", color: s.base04, border: `1px solid ${s.base03}` }}
            value={exporting ? exportFormat : ""}
            onChange={(e) => {
              onExportFormatChange(e.target.value);
              onExport(e.target.value);
            }}
          >
            {formatGroups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.ids.map((id) => {
                  const fmt = exportFormats.find((f) => f.id === id);
                  return fmt ? <option key={id} value={id}>{fmt.label}</option> : null;
                })}
              </optgroup>
            ))}
          </select>
          <button
            onClick={() => onExport(exportFormat)}
            className="flex items-center gap-1 px-2 py-1 text-[11px]"
            style={{ color: s.base0B, border: `1px solid ${s.base03}` }}
            title="Export"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
