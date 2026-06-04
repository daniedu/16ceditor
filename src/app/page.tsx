"use client";

import { useState, useCallback, useRef } from "react";
import { ColorScheme, ViewTab, BaseKey } from "@/src/lib/types";
import { presets, createEmptyScheme } from "@/src/lib/presets";
import { usePersistedSchemes } from "@/src/lib/usePersistedSchemes";
import { useUndoRedo } from "@/src/lib/useUndoRedo";
import { pickColorFromImage } from "@/src/lib/color";
import Sidebar from "./components/Sidebar";
import ColorEditor from "./components/ColorEditor";
import ContrastPanel from "./components/ContrastPanel";
import TerminalPreview from "./components/TerminalPreview";
import GtkPreview from "./components/GtkPreview";
import QtPreview from "./components/QtPreview";
import CodePreview from "./components/CodePreview";
import GeneratePanel from "./components/GeneratePanel";
import ImportExport from "./components/ImportExport";
import ImagePicker from "./components/ImagePicker";
import { Pipette } from "lucide-react";

function nextSlug(schemes: ColorScheme[]): string {
  return `custom-${schemes.length + 1}`;
}

export default function Home() {
  const [schemes, setSchemes] = usePersistedSchemes();
  const [activeSlug, setActiveSlug] = useState(presets[0].slug || "gruvbox-dark");
  const [activeTab, setActiveTab] = useState<ViewTab>("previews");
  const [modalMode, setModalMode] = useState<"import" | "export" | null>(null);
  const [pickerTarget, setPickerTarget] = useState<BaseKey | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const undoRedo = useUndoRedo<ColorScheme>();

  const FALLBACK_SCHEME = presets[0] || createEmptyScheme("Fallback");
  const activeScheme = schemes.find((s) => s.slug === activeSlug) || schemes[0] || FALLBACK_SCHEME;

  const handleSelect = useCallback((s: ColorScheme) => {
    setActiveSlug(s.slug || FALLBACK_SCHEME.slug || "");
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setPickerTarget(null);
    undoRedo.check(s.slug || "");
  }, [undoRedo]);

  const handleChange = useCallback((updated: ColorScheme) => {
    const slug = updated.slug;
    if (slug) {
      setSchemes((prev) => {
        const old = prev.find((s) => s.slug === slug);
        if (old) undoRedo.push(slug, old);
        return prev.map((s) => (s.slug === slug ? updated : s));
      });
    }
  }, [undoRedo]);

  const handleUndo = useCallback(() => {
    const slug = activeScheme.slug;
    if (!slug) return;
    const prev = undoRedo.undo(slug, activeScheme);
    if (prev) {
      setSchemes((s) => s.map((x) => (x.slug === slug ? prev : x)));
    }
  }, [activeScheme, undoRedo]);

  const handleRedo = useCallback(() => {
    const slug = activeScheme.slug;
    if (!slug) return;
    const next = undoRedo.redo(slug, activeScheme);
    if (next) {
      setSchemes((s) => s.map((x) => (x.slug === slug ? next : x)));
    }
  }, [activeScheme, undoRedo]);

  const handleAdd = useCallback(() => {
    const slug = nextSlug(schemes);
    const newScheme = { ...createEmptyScheme(`Custom ${schemes.length + 1}`), slug };
    setSchemes((prev) => [...prev, newScheme]);
    setActiveSlug(slug);
    setActiveTab("editor");
  }, [schemes]);

  const handleDuplicate = useCallback((s: ColorScheme) => {
    const slug = nextSlug(schemes);
    setSchemes((prev) => [...prev, { ...s, name: `${s.name} (copy)`, slug }]);
    setActiveSlug(slug);
  }, [schemes]);

  const handleDelete = useCallback((s: ColorScheme) => {
    if (schemes.length <= 1) return;
    setSchemes((prev) => prev.filter((x) => x.slug !== s.slug));
    setActiveSlug((prev) => prev === s.slug ? schemes.find((x) => x.slug !== s.slug)?.slug || schemes[0]?.slug || "" : prev);
  }, [schemes]);

  const handleRename = useCallback((s: ColorScheme, name: string) => {
    setSchemes((prev) => prev.map((x) => (x.slug === s.slug ? { ...x, name } : x)));
  }, []);

  const handleImport = useCallback((partial: Partial<ColorScheme>) => {
    const slug = nextSlug(schemes);
    const base = createEmptyScheme(partial.name || "Imported");
    setSchemes((prev) => [...prev, { ...base, ...partial, slug }]);
    setActiveSlug(slug);
    setModalMode(null);
  }, [schemes]);

  const handleSave = useCallback((generated: ColorScheme) => {
    const slug = nextSlug(schemes);
    setSchemes((prev) => [...prev, { ...generated, slug }]);
    setActiveSlug(slug);
    setActiveTab("previews");
  }, [schemes]);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!pickerTarget) return;
    const img = e.currentTarget;
    const hex = pickColorFromImage(img, e.clientX, e.clientY);
    if (hex) {
      setSchemes((prev) => {
        const old = prev.find((s) => s.slug === activeScheme.slug);
        if (old) undoRedo.push(activeScheme.slug || "", old);
        return prev.map((s) =>
          s.slug === activeScheme.slug ? { ...s, [pickerTarget]: hex } : s
        );
      });
      setPickerTarget(null);
    }
  }, [pickerTarget, activeScheme.slug, undoRedo]);

  const handleOpenPicker = useCallback(() => setShowImagePicker(true), []);

  const handleImagePick = useCallback((key: BaseKey, hex: string) => {
    setSchemes((prev) => {
      const old = prev.find((s) => s.slug === activeScheme.slug);
      if (old) undoRedo.push(activeScheme.slug || "", old);
      return prev.map((s) =>
        s.slug === activeScheme.slug ? { ...s, [key]: hex } : s
      );
    });
  }, [activeScheme.slug, undoRedo]);

  const handleImageUpload = useCallback((dataUrl: string) => {
    setSchemes((prev) =>
      prev.map((s) =>
        s.slug === activeScheme.slug ? { ...s, sourceImage: dataUrl } : s
      )
    );
  }, [activeScheme.slug]);

  const { base00, base01, base02, base03, base04, base05, base0D } = activeScheme;

  const sourceImage = activeScheme.sourceImage && (
    <div
      className="flex flex-col border overflow-hidden"
      style={{ borderColor: base02, background: base01 }}
    >
      <div
        className="text-[12px] font-semibold px-3 py-1.5 flex items-center justify-between"
        style={{ color: base04 }}
      >
        <span>SOURCE IMAGE</span>
        {pickerTarget && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: base0D }}>
            <Pipette className="w-3 h-3" />
            picking {pickerTarget}
          </span>
        )}
      </div>
      <img
        src={activeScheme.sourceImage}
        alt="Source"
        className="w-full object-contain"
        style={{
          maxHeight: 320,
          background: base00,
          cursor: pickerTarget ? "crosshair" : "default",
        }}
        onClick={handleImageClick}
      />
    </div>
  );

  const sideSourceImage = activeScheme.sourceImage && (
    <div className="flex flex-col border overflow-hidden" style={{ borderColor: base02 }}>
      <div
        className="text-[11px] font-semibold px-2 py-1 flex items-center justify-between"
        style={{ color: base04 }}
      >
        <span>SOURCE IMAGE</span>
        {pickerTarget && (
          <span className="flex items-center gap-1 text-[10px]" style={{ color: base0D }}>
            <Pipette className="w-2.5 h-2.5" />
            {pickerTarget}
          </span>
        )}
      </div>
      <img
        src={activeScheme.sourceImage}
        alt="Source"
        className="w-full object-contain"
        style={{
          maxHeight: 160,
          background: base00,
          cursor: pickerTarget ? "crosshair" : "default",
        }}
        onClick={handleImageClick}
      />
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: base00, color: base05 }}>
      <Sidebar
        scheme={activeScheme}
        schemes={schemes}
        activeSlug={activeSlug}
        onSelect={handleSelect}
        onAdd={handleAdd}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onRename={handleRename}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onImport={() => setModalMode("import")}
        onExport={(s) => setModalMode("export")}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
          style={{ background: base01, borderColor: base02 }}
        >
          <span className="text-[14px] font-semibold" style={{ color: base05 }}>
            {activeTab === "previews" && "Environment Previews"}
            {activeTab === "editor" && "Palette Editor"}
            {activeTab === "analysis" && "Contrast Analysis"}
            {activeTab === "generate" && "Generate Theme"}
          </span>
          <span
            className="text-[12px] px-1.5 py-0.5"
            style={{ color: base04, border: `1px solid ${base02}` }}
          >
            {activeScheme.name}
          </span>
          <span className="flex-1" />
          <button
            onClick={() => setModalMode("import")}
            className="px-2 py-0.5 text-[13px] transition-all"
            style={{
              color: base04,
              border: `1px solid ${base03}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = base05; e.currentTarget.style.borderColor = base04; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = base04; e.currentTarget.style.borderColor = base03; }}
          >
            Import
          </button>
          <button
            onClick={() => setModalMode("export")}
            className="px-2 py-0.5 text-[13px] font-semibold"
            style={{ background: base0D, color: base00 }}
          >
            Export
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div ref={mainRef} className="flex-1 overflow-y-auto p-4">
            {activeTab === "previews" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sourceImage}
                <TerminalPreview scheme={activeScheme} />
                <GtkPreview scheme={activeScheme} />
                <QtPreview scheme={activeScheme} />
                <CodePreview scheme={activeScheme} />
              </div>
            )}

            {activeTab === "editor" && (
              <div className="max-w-3xl">
                <ColorEditor
                  scheme={activeScheme}
                  onChange={handleChange}
                  canUndo={undoRedo.canUndo}
                  canRedo={undoRedo.canRedo}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  pickerTarget={pickerTarget}
                  onPickerTargetChange={setPickerTarget}
                  onOpenPicker={handleOpenPicker}
                />
              </div>
            )}

            {activeTab === "analysis" && (
              <div className="max-w-3xl">
                <ContrastPanel scheme={activeScheme} />
              </div>
            )}

            {activeTab === "generate" && (
              <div className="max-w-2xl">
                <GeneratePanel scheme={activeScheme} onSave={handleSave} />
              </div>
            )}
          </div>

          <div
            className="hidden xl:flex w-80 shrink-0 flex-col border-l overflow-y-auto p-3 space-y-4"
            style={{ background: base01, borderColor: base02 }}
          >
            {sideSourceImage}
            <ColorEditor
              scheme={activeScheme}
              onChange={handleChange}
              canUndo={undoRedo.canUndo}
              canRedo={undoRedo.canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              pickerTarget={pickerTarget}
              onPickerTargetChange={setPickerTarget}
              onOpenPicker={handleOpenPicker}
            />
            <ContrastPanel scheme={activeScheme} />
          </div>
        </div>

        <div
          className="flex items-center justify-center gap-3 py-1.5 text-[11px] border-t shrink-0"
          style={{ color: base04, borderColor: base02, background: base01 }}
        >
          <span>BASE16</span>
          <span style={{ color: base03 }}>/</span>
          <span>TERMINAL ANSI</span>
          <span style={{ color: base03 }}>/</span>
          <span>GTK</span>
          <span style={{ color: base03 }}>/</span>
          <span>Qt</span>
          <span style={{ color: base03 }}>/</span>
          <span>CODE PREVIEW</span>
        </div>
      </div>

      <ImportExport
        mode={modalMode}
        scheme={activeScheme}
        onClose={() => setModalMode(null)}
        onImport={handleImport}
        onExported={() => setModalMode(null)}
      />

      {showImagePicker && (
        <ImagePicker
          scheme={activeScheme}
          sourceImage={activeScheme.sourceImage}
          onPick={handleImagePick}
          onImageUpload={handleImageUpload}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}
