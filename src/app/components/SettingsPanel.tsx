"use client";

import { ColorScheme, ColorSettings, BaseKey, AnsiSlot, ANSI_SLOTS, ANSI_LABELS, DEFAULT_COLOR_SETTINGS, BASE_KEYS } from "@/src/lib/types";
import { RotateCcw } from "lucide-react";

const BASE16_ROLES: { key: BaseKey; role: string; description: string }[] = [
  { key: "base00", role: "Default Background", description: "Terminal BG, window BG, view BG" },
  { key: "base01", role: "Lighter Background", description: "Headerbar, sidebar, cards, popovers" },
  { key: "base02", role: "Selection / Scrollbar", description: "Scrollbar outlines, selection highlights, subtle borders" },
  { key: "base03", role: "Muted / Comments", description: "Borders, disabled text, comments" },
  { key: "base04", role: "Dark Foreground", description: "Secondary text, URL color" },
  { key: "base05", role: "Default Foreground", description: "Primary text, ANSI white" },
  { key: "base06", role: "Light Foreground", description: "ANSI bright white (Kitty)" },
  { key: "base07", role: "Light Background", description: "ANSI bright white (Console)" },
  { key: "base08", role: "Red", description: "Errors, destructive, ANSI red" },
  { key: "base09", role: "Orange", description: "ANSI bright red (Kitty)" },
  { key: "base0A", role: "Yellow", description: "Warnings, ANSI yellow" },
  { key: "base0B", role: "Green", description: "Success, ANSI green" },
  { key: "base0C", role: "Cyan", description: "Info, ANSI cyan" },
  { key: "base0D", role: "Blue", description: "Accent/links, ANSI blue" },
  { key: "base0E", role: "Magenta / Purple", description: "Warning, ANSI magenta" },
  { key: "base0F", role: "Brown", description: "Deprecated, ANSI brown (Kitty)" },
];

function AnsiSlotEditor({
  label,
  scheme,
  ansiMap,
  onChange,
}: {
  label: string;
  scheme: ColorScheme;
  ansiMap: Record<AnsiSlot, BaseKey>;
  onChange: (map: Record<AnsiSlot, BaseKey>) => void;
}) {
  const handleChange = (slot: AnsiSlot, key: BaseKey) => {
    onChange({ ...ansiMap, [slot]: key });
  };

  return (
    <div>
      <div className="text-[13px] font-semibold mb-2" style={{ color: scheme.base04 }}>{label}</div>
      <div className="grid grid-cols-2 gap-1">
        {ANSI_SLOTS.map((slot) => {
          const key = ansiMap[slot];
          const hex = scheme[key];
          return (
            <div key={slot} className="flex items-center gap-1.5 px-1.5 py-1 rounded" style={{ background: scheme.base00 }}>
              <span className="w-4 h-4 shrink-0 border rounded" style={{ background: hex, borderColor: scheme.base02 }} />
              <span className="text-[11px] font-mono w-14 shrink-0" style={{ color: scheme.base03 }}>
                {slot.replace("color", "")}
              </span>
              <span className="text-[10px] w-16 shrink-0" style={{ color: scheme.base04 }}>{ANSI_LABELS[slot]}</span>
              <select
                value={key}
                onChange={(e) => handleChange(slot, e.target.value as BaseKey)}
                className="flex-1 text-[11px] font-mono px-1 py-0.5 border outline-none rounded"
                style={{ background: scheme.base01, color: scheme.base05, borderColor: scheme.base02 }}
              >
                {BASE_KEYS.map((bk) => (
                  <option key={bk} value={bk}>{bk}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppearanceEditor({
  scheme,
  appearance,
  onChange,
  label,
}: {
  scheme: ColorScheme;
  appearance: { cursor: BaseKey; cursorText: BaseKey; selectionBg: BaseKey; selectionFg: BaseKey };
  onChange: (a: typeof appearance) => void;
  label: string;
}) {
  const fields: { key: keyof typeof appearance; label: string }[] = [
    { key: "cursor", label: "Cursor" },
    { key: "cursorText", label: "Cursor Text" },
    { key: "selectionBg", label: "Selection BG" },
    { key: "selectionFg", label: "Selection FG" },
  ];

  return (
    <div>
      <div className="text-[13px] font-semibold mb-2" style={{ color: scheme.base04 }}>{label}</div>
      <div className="space-y-1">
        {fields.map((f) => {
          const val = appearance[f.key];
          return (
            <div key={f.key} className="flex items-center gap-2 px-1.5 py-1 rounded" style={{ background: scheme.base00 }}>
              <span className="w-4 h-4 shrink-0 border rounded" style={{ background: scheme[val], borderColor: scheme.base02 }} />
              <span className="text-[11px] w-20 shrink-0" style={{ color: scheme.base04 }}>{f.label}</span>
              <select
                value={val}
                onChange={(e) => onChange({ ...appearance, [f.key]: e.target.value as BaseKey })}
                className="flex-1 text-[11px] font-mono px-1 py-0.5 border outline-none rounded"
                style={{ background: scheme.base01, color: scheme.base05, borderColor: scheme.base02 }}
              >
                {BASE_KEYS.map((bk) => (
                  <option key={bk} value={bk}>{bk}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPanel({
  scheme,
  settings,
  onChange,
}: {
  scheme: ColorScheme;
  settings: ColorSettings;
  onChange: (s: ColorSettings) => void;
}) {
  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold tracking-wider" style={{ color: scheme.base04 }}>
          COLOUR SETTINGS
        </div>
        <button
          onClick={() => onChange(DEFAULT_COLOR_SETTINGS)}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] border"
          style={{ borderColor: scheme.base02, color: scheme.base04 }}
        >
          <RotateCcw className="w-3 h-3" />
          Reset all
        </button>
      </div>

      <div className="border rounded p-3" style={{ borderColor: scheme.base02, background: scheme.base01 }}>
        <AnsiSlotEditor
          label="KITTY / TERMINAL ANSI MAP"
          scheme={scheme}
          ansiMap={settings.terminal.ansi}
          onChange={(ansi) => onChange({ ...settings, terminal: { ...settings.terminal, ansi } })}
        />
      </div>

      <div className="border rounded p-3" style={{ borderColor: scheme.base02, background: scheme.base01 }}>
        <AppearanceEditor
          label="TERMINAL APPEARANCE"
          scheme={scheme}
          appearance={settings.terminal.appearance}
          onChange={(appearance) => onChange({ ...settings, terminal: { ...settings.terminal, appearance } })}
        />
      </div>

      <div className="border rounded p-3" style={{ borderColor: scheme.base02, background: scheme.base01 }}>
        <AnsiSlotEditor
          label="SYSTEM CONSOLE ANSI MAP"
          scheme={scheme}
          ansiMap={settings.console.ansi}
          onChange={(ansi) => onChange({ ...settings, console: { ...settings.console, ansi } })}
        />
      </div>

      <div className="border rounded p-3" style={{ borderColor: scheme.base02, background: scheme.base01 }}>
        <div className="text-[13px] font-semibold mb-2" style={{ color: scheme.base04 }}>BASE16 COLOR REFERENCE</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {BASE16_ROLES.map(({ key, role, description }) => (
            <div key={key} className="flex items-center gap-1.5 px-1.5 py-1 rounded" style={{ background: scheme.base00 }}>
              <span className="w-4 h-4 shrink-0 border rounded" style={{ background: scheme[key], borderColor: scheme.base02 }} />
              <span className="text-[11px] font-mono w-12 shrink-0" style={{ color: scheme.base03 }}>{key}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium truncate" style={{ color: scheme.base05 }}>{role}</div>
                <div className="text-[9px] truncate" style={{ color: scheme.base04 }}>{description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
