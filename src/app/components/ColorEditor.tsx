"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { ColorScheme, BaseKey, HexColor, RoleMapping, DEFAULT_ROLE_MAPPING, ROLE_LABELS } from "@/src/lib/types";
import { SWATCH_GROUPS } from "@/src/lib/presets";
import { hexToHsl, hslToHex, hexToRgb, rgbToHex, complementary, triadic, splitComplementary, analogous, shadeVariants, toneVariants, readableOn, contrastRatio } from "@/src/lib/color";
import { Undo2, Redo2, Pipette, Crosshair, Palette, Sparkles } from "lucide-react";

function luminance(hex: string): number {
  return hexToHsl(hex).l;
}

function rolesForKey(mapping: RoleMapping, key: BaseKey): string[] {
  return (Object.entries(mapping) as [string, BaseKey][])
    .filter(([, v]) => v === key)
    .map(([k]) => ROLE_LABELS[k as keyof typeof ROLE_LABELS]);
}

export default function ColorEditor({
  scheme,
  onColorChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  pickerTarget,
  onPickerTargetChange,
  onOpenPicker,
  mapping = DEFAULT_ROLE_MAPPING,
}: {
  scheme: ColorScheme;
  onColorChange: (k: BaseKey, v: HexColor) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  pickerTarget?: BaseKey | null;
  onPickerTargetChange?: (k: BaseKey | null) => void;
  onOpenPicker?: () => void;
  mapping?: RoleMapping;
}) {
  const [openPicker, setOpenPicker] = useState<BaseKey | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold tracking-wider" style={{ color: scheme.base04 }}>
          COLOURS
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="touch-target p-1 transition-opacity disabled:opacity-30"
            style={{ color: scheme.base04 }}
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="touch-target p-1 transition-opacity disabled:opacity-30"
            style={{ color: scheme.base04 }}
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4" style={{ background: scheme.base03 }} />
          <button
            onClick={onOpenPicker}
            className="touch-target p-1 transition-opacity hover:opacity-80"
            style={{ color: scheme.base0D }}
            title="Image color picker"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {SWATCH_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="text-[13px] font-semibold tracking-wider text-outline mb-1.5">{group.label}</div>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1.5">
            {group.keys.map((key) => {
              const hex = scheme[key];
              const lum = luminance(hex);
              const textColor = lum > 40 ? "#131313" : "#e4e2e1";
              const isPicking = pickerTarget === key;
              return (
                <SwatchCard
                  key={key}
                  hex={hex}
                  label={key}
                  roleLabels={rolesForKey(mapping, key)}
                  textColor={textColor}
                  isOpen={openPicker === key}
                  isPicking={isPicking}
                  onToggle={() => setOpenPicker(openPicker === key ? null : key)}
                  onChange={(c) => onColorChange(key, c)}
                  onPick={() => onPickerTargetChange?.(isPicking ? null : key)}
                  scheme={scheme}
                />
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}

type PickerMode = "picker" | "hsl" | "rgb" | "circle" | "harmony" | "suggest";

function SwatchCard({
  hex, label, roleLabels, textColor, isOpen, isPicking, onToggle, onChange, onPick, scheme,
}: {
  hex: string; label: string; roleLabels: string[]; textColor: string;
  isOpen: boolean; isPicking: boolean; onToggle: () => void; onChange: (c: string) => void;
  onPick: () => void; scheme: ColorScheme;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [inputHex, setInputHex] = useState(hex);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>("picker");

  const hsl = hexToHsl(hex);
  const [r, g, b] = hexToRgb(hex);

  useEffect(() => {
    setInputHex(hex);
  }, [hex]);

  useEffect(() => {
    if (!isOpen) setPickerMode("picker");
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onToggle]);

  const handleToggle = useCallback(() => {
    if (btnRef.current && !isOpen) {
      const rect = btnRef.current.getBoundingClientRect();
      const popoverWidth = 240;
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      if (left < 8) left = 8;
      if (left + popoverWidth > window.innerWidth - 8) left = window.innerWidth - popoverWidth - 8;
      setPopoverPos({ top: rect.bottom + 4, left });
    }
    onToggle();
  }, [isOpen, onToggle]);

  function handleHsl(h: number, s: number, l: number) {
    const c = hslToHex(h, s, l);
    onChange(c);
    setInputHex(c);
  }

  function handleRgb(rv: number, gv: number, bv: number) {
    const c = rgbToHex(rv, gv, bv);
    onChange(c);
    setInputHex(c);
  }

  function selectColor(c: string) {
    onChange(c);
    setInputHex(c);
  }

  const harmonyResults = [
    { label: "Analogous", colors: analogous(hex, 5) },
    { label: "Complementary", colors: [hex, complementary(hex)] },
    { label: "Split Comp.", colors: [...splitComplementary(hex)] },
    { label: "Triadic", colors: [...triadic(hex)] },
    { label: "Shades", colors: shadeVariants(hex).filter((_, i) => i % 2 === 0).slice(0, 5) },
  ];

  const suggestions = [
    ...Object.entries(scheme).filter(([, v]) => v !== hex).slice(0, 4).map(([, v]) => v),
    ...companionable(hex),
  ].slice(0, 9);

  return (
    <div
      ref={ref}
      className="relative group"
      style={isPicking ? { outline: `2px solid ${hex}`, outlineOffset: 1, borderRadius: 4 } : undefined}
    >
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-full cursor-pointer text-left border border-surface-high hover:border-outline-variant transition-all"
        style={{ borderColor: isPicking ? hex : undefined }}
      >
        <div
          className="h-12 sm:h-14 flex items-end p-1.5"
          style={{ background: hex }}
        >
          <span className="text-[12px] font-semibold" style={{ color: textColor }}>
            {label}
          </span>
        </div>
        <div className="px-1.5 py-1 bg-surface-low">
          <div className="text-[13px] text-[#e4e2e1] leading-tight">{roleLabels.join(", ") || label}</div>
          <div className="text-[12px] text-outline font-mono">{hex}</div>
        </div>
      </button>

      <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onPick(); }}
          className="p-1"
          style={{
            background: "#131313cc",
            color: textColor,
          }}
          title="Pick from source image"
        >
          <Pipette className="w-3 h-3" />
        </button>
      </div>

      {isOpen && popoverPos && (
        <div
          className="fixed z-50"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          <div className="bg-surface border border-surface-high p-2 shadow-lg" style={{ width: 240 }}>
            <div className="flex flex-wrap mb-1.5 border-b border-surface-high pb-1">
              {(["picker","circle","hsl","rgb","harmony","suggest"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPickerMode(mode)}
                  className="flex-1 text-[10px] py-1 font-medium transition-all"
                  style={{
                    color: pickerMode === mode ? "#e4e2e1" : "#93927b",
                    borderBottom: pickerMode === mode ? "2px solid" : "2px solid transparent",
                  }}
                >
                  {mode === "picker" ? "Pick" : mode === "circle" ? "Wheel" : mode === "harmony" ? "Harmony" : mode === "suggest" ? "Suggest" : mode.toUpperCase()}
                </button>
              ))}
            </div>

            {pickerMode === "picker" && (
              <HexColorPicker color={hex} onChange={(c) => { onChange(c); setInputHex(c); }} />
            )}

            {pickerMode === "circle" && (
              <HsvRingPicker hex={hex} onChange={(c) => { onChange(c); setInputHex(c); }} />
            )}

            {pickerMode === "hsl" && (
              <div className="space-y-2 px-0.5">
                <SliderInput label="H" value={Math.round(hsl.h)} min={0} max={360} onChange={(v) => handleHsl(v, hsl.s, hsl.l)} colorful />
                <SliderInput label="S" value={Math.round(hsl.s)} min={0} max={100} onChange={(v) => handleHsl(hsl.h, v, hsl.l)} />
                <SliderInput label="L" value={Math.round(hsl.l)} min={0} max={100} onChange={(v) => handleHsl(hsl.h, hsl.s, v)} />
              </div>
            )}

            {pickerMode === "rgb" && (
              <div className="space-y-2 px-0.5">
                <SliderInput label="R" value={r} min={0} max={255} onChange={(v) => handleRgb(v, g, b)} colorful />
                <SliderInput label="G" value={g} min={0} max={255} onChange={(v) => handleRgb(r, v, b)} colorful />
                <SliderInput label="B" value={b} min={0} max={255} onChange={(v) => handleRgb(r, g, v)} colorful />
              </div>
            )}

            {pickerMode === "harmony" && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {harmonyResults.map((group) => (
                  <div key={group.label}>
                    <div className="text-[10px] font-semibold text-outline mb-0.5">{group.label}</div>
                    <div className="flex gap-1 flex-wrap">
                      {group.colors.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => selectColor(c)}
                          className="w-6 h-6 border border-outline-variant hover:scale-110 transition-transform shrink-0"
                          style={{ background: c, borderRadius: "50%" }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pickerMode === "suggest" && (
              <div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {suggestions.map((c, i) => {
                    const bgHsl = hexToHsl(c);
                    const diff = Math.abs(bgHsl.h - hsl.h);
                    const isSimilar = diff < 20 || diff > 340;
                    return (
                      <button
                        key={i}
                        onClick={() => selectColor(c)}
                        className="flex flex-col items-center gap-0.5 p-1 border rounded transition-all hover:scale-105"
                        style={{
                          borderColor: "#353535",
                          background: c === hex ? `${c}33` : "transparent",
                        }}
                      >
                        <span
                          className="w-7 h-7 border border-outline-variant"
                          style={{ background: c, borderRadius: "50%" }}
                        />
                        <span className="text-[8px] font-mono text-outline">{c}</span>
                        {isSimilar && <span className="text-[8px] text-[#d5c59e]">match</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 pt-1.5 border-t border-surface-high">
                  <div className="text-[10px] font-semibold text-outline mb-1">How it reads</div>
                  <div className="flex items-center gap-2 px-2 py-1 border border-surface-high rounded">
                    <span className="w-4 h-4 border border-outline-variant shrink-0" style={{ background: readableOn(hex).bg, borderRadius: "50%" }} />
                    <span className="w-4 h-4 border border-outline-variant shrink-0" style={{ background: readableOn(hex).fg, borderRadius: "50%" }} />
                    <span className="text-[10px] text-outline">{readableOn(hex).bg} / {hex}</span>
                    <span className="text-[10px] font-medium ml-auto" style={{ color: "#b4d8ca" }}>
                      {contrastRatio(readableOn(hex).bg, readableOn(hex).fg).toFixed(1)}:1
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-outline text-[12px]">#</span>
              <input
                className="w-24 bg-surface text-[#e4e2e1] text-[13px] px-1 py-0.5 border border-surface-high outline-none font-mono"
                value={inputHex.replace("#", "")}
                onChange={(e) => {
                  const v = "#" + e.target.value;
                  setInputHex("#" + e.target.value);
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function companionable(hex: string): string[] {
  const hsl = hexToHsl(hex);
  const candidates: string[] = [];
  for (let ao = 0; ao < 360; ao += 30) {
    candidates.push(hslToHex((hsl.h + ao) % 360, Math.max(10, hsl.s - 20), Math.min(90, hsl.l + (hsl.l > 50 ? -20 : 20))));
  }
  return candidates.sort((a, b) => contrastRatio(b, hex) - contrastRatio(a, hex)).slice(0, 6);
}

function HsvRingPicker({ hex, onChange }: { hex: string; onChange: (c: string) => void }) {
  const hsl = hexToHsl(hex);
  const size = 160;
  const cx = size / 2, cy = size / 2, outerR = size / 2 - 2, innerR = outerR * 0.3;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    for (let a = 0; a < 360; a++) {
      const rad = ((a - 90) * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(cx + innerR * Math.cos(rad), cy + innerR * Math.sin(rad), 3, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${a}, 70%, 55%)`;
      ctx.fill();
    }
    for (let r = 0; r < innerR; r++) {
      const sat = (r / innerR) * 100;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hsl.h}, ${sat}%, ${hsl.l}%)`;
      ctx.fill();
    }
    {
      const rad = ((hsl.h - 90) * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(cx + innerR * 0.85 * Math.cos(rad), cy + innerR * 0.85 * Math.sin(rad), 5, 0, Math.PI * 2);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [size, hsl.h, hsl.s, hsl.l]);

  function handlePick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dx = e.clientX - rect.left - cx, dy = e.clientY - rect.top - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > outerR) return;
    if (dist <= innerR) {
      onChange(hslToHex(hsl.h, (dist / innerR) * 100, hsl.l));
      return;
    }
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    onChange(hslToHex(angle, hsl.s, hsl.l));
  }

  return (
    <canvas
      ref={canvasRef}
      className="cursor-crosshair mx-auto"
      style={{ width: size, height: size }}
      onClick={handlePick}
    />
  );
}

function SliderInput({ label, value, min, max, onChange, colorful }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; colorful?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      {label && <span className="text-outline w-3 shrink-0">{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2"
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
        className="w-12 bg-surface text-[#e4e2e1] text-[12px] px-1 py-0.5 border border-surface-high outline-none text-right font-mono"
      />
    </div>
  );
}