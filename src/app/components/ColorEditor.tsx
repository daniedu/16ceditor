"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { ColorScheme, BaseKey, HexColor } from "@/src/lib/types";
import { BASE_KEYS, SWATCH_LABELS, SWATCH_GROUPS } from "@/src/lib/presets";
import { hexToHsl, hslToHex, contrastRatio, wcagLevel } from "@/src/lib/color";

function luminance(hex: string): number {
  const hsl = hexToHsl(hex);
  return hsl.l;
}

function autoFixSaturation(hex: string): string {
  const hsl = hexToHsl(hex);
  const targetL = hsl.l > 50 ? Math.min(hsl.l, 70) : Math.min(hsl.l, 55);
  const targetS = Math.min(hsl.s, 75);
  return hslToHex(hsl.h, targetS, targetL);
}

export default function ColorEditor({
  scheme,
  onChange,
}: {
  scheme: ColorScheme;
  onChange: (s: ColorScheme) => void;
}) {
  const set = (k: BaseKey, v: HexColor) => onChange({ ...scheme, [k]: v });
  const [openPicker, setOpenPicker] = useState<BaseKey | null>(null);

  return (
    <div className="space-y-3">
      {SWATCH_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="text-[13px] font-semibold tracking-wider text-outline mb-1.5">{group.label}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {group.keys.map((key) => {
              const hex = scheme[key];
              const lum = luminance(hex);
              const textColor = lum > 40 ? "#131313" : "#e4e2e1";
              return (
                <SwatchCard
                  key={key}
                  hex={hex}
                  label={key}
                  semantic={SWATCH_LABELS[key]}
                  textColor={textColor}
                  isOpen={openPicker === key}
                  onToggle={() => setOpenPicker(openPicker === key ? null : key)}
                  onChange={(c) => set(key, c)}
                  onFix={() => set(key, autoFixSaturation(hex))}
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="border-t pt-3" style={{ borderColor: scheme.base02 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] font-semibold tracking-wider text-outline">CONTRAST</div>
          <span className="text-[10px] text-primary px-1 py-0.5 border border-primary">WCAG 2.1</span>
        </div>
        <div className="space-y-1">
          {([
            { bg: "base00", fg: "base05", label: "BG / FG" },
            { bg: "base01", fg: "base05", label: "Container / FG" },
            { bg: "base02", fg: "base05", label: "Input / FG" },
            { bg: "base00", fg: "base0D", label: "BG / Blue" },
            { bg: "base01", fg: "base04", label: "Container / Dark FG" },
          ] as const).map((p) => {
            const bg = scheme[p.bg];
            const fg = scheme[p.fg];
            const ratio = contrastRatio(bg, fg);
            const level = wcagLevel(ratio);
            const c = level === "AAA" ? scheme.base0B : level === "AA" ? scheme.base0A : scheme.base08;
            return (
              <div
                key={p.label}
                className="flex items-center gap-2 px-2 py-1 border text-[11px]"
                style={{
                  borderColor: scheme.base02,
                  background: level === "fail" ? `${scheme.base08}10` : "transparent",
                }}
              >
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="w-3 h-3 border" style={{ background: bg, borderColor: scheme.base03 }} />
                  <span className="w-3 h-3 border" style={{ background: fg, borderColor: scheme.base03 }} />
                </div>
                <span className="text-outline w-20 shrink-0">{p.label}</span>
                <span className="font-medium w-12 text-right" style={{ color: scheme.base05 }}>{ratio.toFixed(1)}:1</span>
                <span className="px-1 py-0.5 text-[10px]" style={{ color: c, border: `1px solid ${c}`, background: `${c}15` }}>
                  {level === "AAA" ? "AAA" : level === "AA" ? "AA" : "FAIL"}
                </span>
                {level === "fail" && (
                  <span className="ml-auto" style={{ color: scheme.base08, fontSize: "10px" }}>ADJUST</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SwatchCard({
  hex, label, semantic, textColor, isOpen, onToggle, onChange, onFix,
}: {
  hex: string; label: string; semantic: string; textColor: string;
  isOpen: boolean; onToggle: () => void; onChange: (c: string) => void;
  onFix: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inputHex, setInputHex] = useState(hex);

  useEffect(() => {
    setInputHex(hex);
  }, [hex]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className="relative group">
      <button
        onClick={onToggle}
        className="w-full cursor-pointer text-left border border-surface-high hover:border-outline-variant transition-all"
      >
        <div
          className="h-12 flex items-end p-1.5"
          style={{ background: hex }}
        >
          <span className="text-[12px] font-semibold" style={{ color: textColor }}>
            {label}
          </span>
        </div>
        <div className="px-1.5 py-1 bg-surface-low">
          <div className="text-[13px] text-[#e4e2e1] leading-tight">{semantic}</div>
          <div className="text-[12px] text-outline font-mono">{hex}</div>
        </div>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onFix(); }}
        className="absolute top-1 right-1 px-1.5 py-0.5 text-[13px] bg-[#131313]/80 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
      >
        FIX SAT
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-surface border border-surface-high p-2 shadow-lg">
          <HexColorPicker color={hex} onChange={(c) => { onChange(c); setInputHex(c); }} />
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-outline text-[12px]">#</span>
            <input
              className="w-full bg-surface text-[#e4e2e1] text-[13px] px-1 py-0.5 border border-surface-high outline-none font-mono"
              value={inputHex.replace("#", "")}
              onChange={(e) => {
                const v = "#" + e.target.value;
                setInputHex("#" + e.target.value);
                if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
