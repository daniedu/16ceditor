"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ColorScheme, ViewTab, BaseKey, RoleMapping, DEFAULT_ROLE_MAPPING } from "@/src/lib/types";
import { presets, createEmptyScheme } from "@/src/lib/presets";
import { usePersistedSchemes } from "@/src/lib/usePersistedSchemes";
import { useUndoRedo } from "@/src/lib/useUndoRedo";
import { pickColorFromImage } from "@/src/lib/color";
import { useMediaQuery } from "@/src/lib/useMediaQuery";
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
import RoleMappingEditor from "./components/RoleMappingEditor";
import { Pipette, Menu, Palette, Eye, BarChart3, Sparkles, ChevronLeft } from "lucide-react";

function nextSlug(schemes: ColorScheme[]): string {
  return `custom-${schemes.length + 1}`;
}

export default function Home() {
  const [schemes, setSchemes] = usePersistedSchemes();
  const [activeSlug, setActiveSlug] = useState(presets[0].slug || "gruvbox-dark");
  const [activeTab, setActiveTab] = useState<ViewTab>("previews");
  const [roleMapping, setRoleMapping] = useState<RoleMapping>(DEFAULT_ROLE_MAPPING);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stylix-role-mapping");
      if (saved) setRoleMapping(JSON.parse(saved) as RoleMapping);
    } catch {}
  }, []);

  const handleMappingChange = useCallback((m: RoleMapping) => {
    setRoleMapping(m);
    try { localStorage.setItem("stylix-role-mapping", JSON.stringify(m)); } catch {}
  }, []);
  const [modalMode, setModalMode] = useState<"import" | "export" | null>(null);
  const [pickerTarget, setPickerTarget] = useState<BaseKey | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const isPhone = useMediaQuery("(max-width: 767px)");
  const [mobileTab, setMobileTab] = useState<"colors" | "previews" | "tools">("colors");

  useEffect(() => {
    try {
      const selectSlug = sessionStorage.getItem("select-scheme");
      if (selectSlug && schemes.find((s) => s.slug === selectSlug)) {
        setActiveSlug(selectSlug);
        sessionStorage.removeItem("select-scheme");
      }
    } catch {}
  }, []);

  const undoRedo = useUndoRedo();

  const FALLBACK_SCHEME = presets[0] || createEmptyScheme("Fallback");
  const activeScheme = schemes.find((s) => s.slug === activeSlug) || schemes[0] || FALLBACK_SCHEME;

  const handleSelect = useCallback((s: ColorScheme) => {
    setActiveSlug(s.slug || FALLBACK_SCHEME.slug || "");
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setPickerTarget(null);
    undoRedo.check(s.slug || "");
  }, [undoRedo]);

  const handleColorChange = useCallback((key: BaseKey, hex: string) => {
    const slug = activeScheme.slug;
    if (!slug) return;
    undoRedo.push(slug, key, activeScheme[key], hex);
    setSchemes((prev) =>
      prev.map((s) => (s.slug === slug ? { ...s, [key]: hex } : s))
    );
  }, [activeScheme, undoRedo]);

  const handleUndo = useCallback(() => {
    const slug = activeScheme.slug;
    if (!slug) return;
    const entry = undoRedo.undo(slug);
    if (entry) {
      setSchemes((prev) =>
        prev.map((s) =>
          s.slug === slug ? { ...s, [entry.key]: entry.prev } : s
        )
      );
    }
  }, [activeScheme, undoRedo]);

  const handleRedo = useCallback(() => {
    const slug = activeScheme.slug;
    if (!slug) return;
    const entry = undoRedo.redo(slug);
    if (entry) {
      setSchemes((prev) =>
        prev.map((s) =>
          s.slug === slug ? { ...s, [entry.key]: entry.prev } : s
        )
      );
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
      const slug = activeScheme.slug;
      if (slug) undoRedo.push(slug, pickerTarget, activeScheme[pickerTarget], hex);
      setSchemes((prev) =>
        prev.map((s) =>
          s.slug === slug ? { ...s, [pickerTarget]: hex } : s
        )
      );
      setPickerTarget(null);
    }
  }, [pickerTarget, activeScheme, undoRedo]);

  const handleOpenPicker = useCallback(() => setShowImagePicker(true), []);

  const handleImagePick = useCallback((key: BaseKey, hex: string) => {
    const slug = activeScheme.slug;
    if (!slug) return;
    undoRedo.push(slug, key, activeScheme[key], hex);
    setSchemes((prev) =>
      prev.map((s) =>
        s.slug === slug ? { ...s, [key]: hex } : s
      )
    );
  }, [activeScheme, undoRedo]);

  const handleImageUpload = useCallback((dataUrl: string) => {
    setSchemes((prev) =>
      prev.map((s) =>
        s.slug === activeScheme.slug ? { ...s, sourceImage: dataUrl } : s
      )
    );
  }, [activeScheme.slug]);

  const { base00, base01, base02, base03, base04, base05, base08, base0D } = activeScheme;

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
    <div
      className="h-screen flex overflow-hidden"
      style={{
        background: base00,
        color: base05,
        '--color-outline': base04,
        '--color-surface': base00,
        '--color-surface-low': base01,
        '--color-surface-high': base02 || base00,
        '--color-error': base08,
        '--color-outline-variant': base02,
        '--color-primary': base0D,
      } as React.CSSProperties}
    >
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
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
          style={{ background: base01, borderColor: base02 }}
        >
          {isMobile && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-1.5 hover:opacity-80 lg:hidden touch-target"
              style={{ color: base04 }}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="text-[14px] font-semibold" style={{ color: base05 }}>
            {isPhone && mobileTab === "colors" && "Palette Editor"}
            {isPhone && mobileTab === "previews" && "Environment Previews"}
            {isPhone && mobileTab === "tools" && "Tools"}
            {!isPhone && activeTab === "previews" && "Environment Previews"}
            {!isPhone && activeTab === "editor" && "Palette Editor"}
            {!isPhone && activeTab === "analysis" && "Contrast Analysis"}
            {!isPhone && activeTab === "generate" && "Generate Theme"}
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
          <div ref={mainRef} className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
            {activeTab === "previews" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sourceImage}
                <TerminalPreview scheme={activeScheme} mapping={roleMapping} />
                <GtkPreview scheme={activeScheme} mapping={roleMapping} />
                <QtPreview scheme={activeScheme} mapping={roleMapping} />
                <CodePreview scheme={activeScheme} mapping={roleMapping} />
              </div>
            )}

            {activeTab === "editor" && (
              <div className="max-w-3xl">
                <ColorEditor
                  scheme={activeScheme}
                  onColorChange={handleColorChange}
                  canUndo={undoRedo.canUndo}
                  canRedo={undoRedo.canRedo}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  pickerTarget={pickerTarget}
                  onPickerTargetChange={setPickerTarget}
                  onOpenPicker={handleOpenPicker}
                  mapping={roleMapping}
                />
              </div>
            )}

            {activeTab === "analysis" && (
              <div className="max-w-3xl">
                <ContrastPanel scheme={activeScheme} mapping={roleMapping} />
              </div>
            )}

            {activeTab === "generate" && (
              <div className="max-w-2xl">
                <GeneratePanel scheme={activeScheme} onSave={handleSave} />
              </div>
            )}
          </div>

          {!isPhone && (
            <button
              onClick={() => setRightSidebarOpen((v) => !v)}
              className="xl:hidden fixed right-0 top-1/2 z-20 -translate-y-1/2 touch-target px-1 rounded-l border border-r-0"
              style={{ background: base01, borderColor: base02, color: base04 }}
              title={rightSidebarOpen ? "Close panel" : "Open panel"}
            >
              <ChevronLeft
                className="w-4 h-4 transition-transform"
                style={{ transform: rightSidebarOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
          )}

          {rightSidebarOpen && (
            <div
              className="xl:hidden fixed right-0 top-0 bottom-0 z-10 w-80 flex flex-col border-l overflow-y-auto p-3 space-y-4 shadow-2xl"
              style={{ background: base01, borderColor: base02, marginTop: 0 }}
            >
              <div className="flex items-center justify-between pt-1 pb-2 border-b" style={{ borderColor: base02 }}>
                <span className="text-[12px] font-semibold" style={{ color: base04 }}>TOOLS</span>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="touch-target p-1"
                  style={{ color: base04 }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              {sideSourceImage}
              <ColorEditor
                scheme={activeScheme}
                onColorChange={handleColorChange}
                canUndo={undoRedo.canUndo}
                canRedo={undoRedo.canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                pickerTarget={pickerTarget}
                onPickerTargetChange={setPickerTarget}
                onOpenPicker={handleOpenPicker}
                mapping={roleMapping}
              />
              <RoleMappingEditor mapping={roleMapping} onChange={handleMappingChange} />
              <ContrastPanel scheme={activeScheme} mapping={roleMapping} />
            </div>
          )}

          <div
            className="hidden xl:flex w-80 shrink-0 flex-col border-l overflow-y-auto p-3 space-y-4"
            style={{ background: base01, borderColor: base02 }}
          >
            {sideSourceImage}
            <ColorEditor
              scheme={activeScheme}
              onColorChange={handleColorChange}
              canUndo={undoRedo.canUndo}
              canRedo={undoRedo.canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              pickerTarget={pickerTarget}
              onPickerTargetChange={setPickerTarget}
              onOpenPicker={handleOpenPicker}
              mapping={roleMapping}
            />
            <RoleMappingEditor mapping={roleMapping} onChange={handleMappingChange} />
            <ContrastPanel scheme={activeScheme} mapping={roleMapping} />
          </div>
        </div>

        {isPhone ? (
          <nav
            className="fixed bottom-0 left-0 right-0 z-30 flex border-t md:hidden"
            style={{ background: base01, borderColor: base02 }}
          >
            {[
              { id: "editor" as ViewTab, icon: Palette, label: "Colors", mobileId: "colors" as const },
              { id: "previews" as ViewTab, icon: Eye, label: "Previews", mobileId: "previews" as const },
              { id: "analysis" as ViewTab, icon: BarChart3, label: "Analysis", mobileId: "tools" as const },
              { id: "generate" as ViewTab, icon: Sparkles, label: "Generate", mobileId: "tools" as const },
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    setMobileTab(t.mobileId);
                    setSidebarOpen(false);
                  }}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] transition-all"
                  style={{
                    color: isActive ? base0D : base04,
                    borderTop: isActive ? `2px solid ${base0D}` : "2px solid transparent",
                  }}
                >
                  <t.icon className="w-5 h-5" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        ) : (
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
        )}
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
