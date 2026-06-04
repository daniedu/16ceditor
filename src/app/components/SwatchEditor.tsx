"use client";

import { HexColorPicker } from "react-colorful";
import { useState, useRef, useEffect } from "react";
import { HexColor, ColorScheme } from "@/src/lib/types";

export default function SwatchEditor({
  label,
  hex,
  onChange,
  scheme,
}: {
  label: string;
  hex: HexColor;
  onChange: (c: HexColor) => void;
  scheme: ColorScheme;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      <button
        className="w-5 h-5 rounded shrink-0 cursor-pointer"
        style={{
          background: hex,
          boxShadow: `inset 0 0 0 1px ${scheme.base03}`,
        }}
        onClick={() => setOpen(!open)}
        title={label}
      />
      <span
        className="text-[13px] w-8 truncate"
        style={{ color: scheme.base04 }}
      >
        {label}
      </span>
      <input
        className="w-12 text-[13px] px-1 py-0.5 rounded font-mono outline-none"
        style={{
          background: scheme.base00,
          color: scheme.base05,
          border: `1px solid ${scheme.base02}`,
        }}
        value={hex}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
        }}
      />
      {open && (
        <div
          className="absolute top-7 left-0 z-50"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))" }}
        >
          <div style={{ background: scheme.base01, padding: 8, borderRadius: 8 }}>
            <HexColorPicker color={hex} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  );
}
