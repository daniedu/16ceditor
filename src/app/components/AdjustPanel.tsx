"use client";

import { useMemo, useState } from "react";
import { ColorScheme, BaseKey, BASE_KEYS } from "@/src/lib/types";
import {
  applyRecolAdjusts,
  adjustsToSpec,
  describeAdjust,
  isAdjustNoop,
  normalizeChannelLabel,
  parseRecolSpec,
  RECOL_ADJUST_KINDS,
  RECOL_GROUPS,
  type NormalizeChannel,
  type RecolAdjust,
  type RecolAdjustKind,
  type RecolGroup,
} from "@/src/lib/recolAdjust";
import { Copy, Plus, Save, RotateCcw, X, SlidersHorizontal } from "lucide-react";

interface AdjustPanelProps {
  scheme: ColorScheme;
  onSave: (s: ColorScheme) => void;
}

/** recol-style colour adjustments (https://github.com/nlkli/recol). */
export default function AdjustPanel({ scheme, onSave }: AdjustPanelProps) {
  const [kind, setKind] = useState<RecolAdjustKind>("brightness");
  const [group, setGroup] = useState<RecolGroup>("all");
  const [value, setValue] = useState(20);
  const [channel, setChannel] = useState<NormalizeChannel>("l");
  const [stack, setStack] = useState<RecolAdjust[]>([]);
  const [spec, setSpec] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => applyRecolAdjusts(scheme, stack), [scheme, stack]);
  const kindInfo = RECOL_ADJUST_KINDS.find((k) => k.kind === kind)!;

  const syncStack = (next: RecolAdjust[]) => {
    setStack(next);
    setSpec(adjustsToSpec(next));
  };

  const addAdjustment = () => {
    const adj: RecolAdjust = { kind, group, value, channel: kind === "normalize" ? channel : undefined };
    syncStack([...stack, adj]);
  };

  const removeAdjustment = (i: number) => syncStack(stack.filter((_, idx) => idx !== i));

  const handleSpecChange = (text: string) => {
    setSpec(text);
    const { adjusts, errors } = parseRecolSpec(text);
    if (errors.length === 0) setStack(adjusts);
  };

  const handleCopySpec = async () => {
    try {
      await navigator.clipboard.writeText(adjustsToSpec(stack));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleSave = () => {
    if (stack.length === 0) return;
    onSave({ ...preview, name: name.trim() || `${scheme.name} (adjusted)` });
    setStack([]);
    setSpec("");
    setName("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: scheme.base04 }}>
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" style={{ color: scheme.base0D }} />
          <span>
            recol-style adjustments — stack transforms with{" "}
            <code className="px-1 font-mono" style={{ background: scheme.base00, color: scheme.base04 }}>
              --adjust
            </code>{" "}
            semantics, then save the result as a new scheme.
          </span>
        </div>

        {/* kind picker */}
        <div>
          <div className="text-[12px] font-semibold mb-1" style={{ color: scheme.base04 }}>ADJUSTMENT</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-44 overflow-y-auto pr-1">
            {RECOL_ADJUST_KINDS.map((k) => (
              <button
                key={k.kind}
                onClick={() => setKind(k.kind)}
                title={k.desc}
                className="px-2 py-1 text-[12px] border text-left transition-all"
                style={{
                  background: kind === k.kind ? `${scheme.base0D}20` : "transparent",
                  borderColor: kind === k.kind ? scheme.base0D : scheme.base02,
                  color: kind === k.kind ? scheme.base0D : scheme.base04,
                }}
              >
                {k.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] mt-1" style={{ color: scheme.base03 }}>{kindInfo.desc}</div>
        </div>

        {/* group picker */}
        <div>
          <div className="text-[12px] font-semibold mb-1" style={{ color: scheme.base04 }}>TARGET</div>
          <div className="flex flex-wrap gap-1">
            {RECOL_GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGroup(g.id)}
                className="px-2 py-0.5 text-[11px] border transition-all"
                style={{
                  background: group === g.id ? scheme.base0D : "transparent",
                  borderColor: group === g.id ? scheme.base0D : scheme.base02,
                  color: group === g.id ? scheme.base00 : scheme.base04,
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* value slider (+ normalize channel) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[12px] font-semibold" style={{ color: scheme.base04 }}>
              {kindInfo.label.toUpperCase()} · {RECOL_GROUPS.find((g) => g.id === group)?.label}
            </div>
            <span className="text-[12px] font-mono" style={{ color: scheme.base0D }}>
              {kind === "invert" ? "flip" : `${value > 0 ? "+" : ""}${value}`}
            </span>
          </div>
          {kind === "normalize" && (
            <div className="flex gap-1 mb-1.5">
              {(["l", "c", "both"] as NormalizeChannel[]).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className="px-2 py-0.5 text-[11px] border transition-all"
                  style={{
                    background: channel === ch ? scheme.base0D : "transparent",
                    borderColor: channel === ch ? scheme.base0D : scheme.base02,
                    color: channel === ch ? scheme.base00 : scheme.base04,
                  }}
                >
                  {normalizeChannelLabel(ch)}
                </button>
              ))}
            </div>
          )}
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className={`w-full ${kind === "invert" ? "opacity-40" : ""}`}
            style={{ accentColor: scheme.base0D }}
            aria-label={`${kindInfo.label} amount`}
            disabled={kind === "invert"}
          />
          <button
            onClick={addAdjustment}
            className="w-full py-1 text-[13px] font-semibold flex items-center justify-center gap-1 mt-1"
            style={{ background: scheme.base02, color: scheme.base05 }}
          >
            <Plus className="w-3.5 h-3.5" /> Add to stack
          </button>
        </div>

        {/* spec input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[12px] font-semibold" style={{ color: scheme.base04 }}>RECOL SPEC</div>
            <button
              onClick={handleCopySpec}
              disabled={stack.length === 0}
              className="flex items-center gap-1 text-[11px] disabled:opacity-40"
              style={{ color: scheme.base0D }}
              title="Copy as recol --adjust syntax"
            >
              <Copy className="w-3 h-3" /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <input
            className="w-full px-2 py-1 text-[13px] font-mono outline-none"
            style={{
              background: scheme.base00,
              color: scheme.base05,
              border: `1px solid ${scheme.base02}`,
            }}
            value={spec}
            onChange={(e) => handleSpecChange(e.target.value)}
            placeholder="e.g. red.sat=20,all.b=10"
            spellCheck={false}
          />
          <div className="text-[10px] mt-0.5" style={{ color: scheme.base03 }}>
            groups: all · nt (neutrals) · ac/pal (accents) · bg · fg · red…pink — kinds: b e c s v h t ti g f i n/nb/nc
          </div>
        </div>

        {/* stack */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[12px] font-semibold" style={{ color: scheme.base04 }}>
              STACK {stack.length > 0 && <span style={{ color: scheme.base03 }}>({stack.length})</span>}
            </div>
            {stack.length > 0 && (
              <button onClick={() => syncStack([])} className="flex items-center gap-1 text-[11px]" style={{ color: scheme.base04 }}>
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          {stack.length === 0 ? (
            <div
              className="px-2 py-2 text-[12px] border border-dashed"
              style={{ borderColor: scheme.base03, color: scheme.base03 }}
            >
              Nothing applied yet — the preview below mirrors the active scheme.
            </div>
          ) : (
            <div className="space-y-0.5">
              {stack.map((adj, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1 text-[12px]"
                  style={{
                    background: scheme.base00,
                    border: `1px solid ${scheme.base02}`,
                    opacity: isAdjustNoop(adj) ? 0.5 : 1,
                  }}
                >
                  <span className="flex-1" style={{ color: scheme.base05 }}>{describeAdjust(adj)}</span>
                  {isAdjustNoop(adj) && (
                    <span className="text-[10px]" style={{ color: scheme.base03 }}>no-op</span>
                  )}
                  <button onClick={() => removeAdjustment(i)} style={{ color: scheme.base04 }} title="Remove">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {stack.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <input
              className="flex-1 px-2 py-1 text-[13px] outline-none"
              style={{
                background: scheme.base00,
                color: scheme.base05,
                border: `1px solid ${scheme.base02}`,
              }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${scheme.name} (adjusted)`}
            />
            <button
              onClick={handleSave}
              className="px-3 py-1 text-[13px] font-semibold flex items-center gap-1 shrink-0"
              style={{ background: scheme.base0B, color: scheme.base00 }}
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      <div>
        <div className="text-[12px] font-semibold mb-1.5" style={{ color: scheme.base04 }}>
          {stack.length > 0 ? "RESULT" : "CURRENT SCHEME"}{" "}
          {stack.length > 0 && <span style={{ color: scheme.base03 }}>(before → after)</span>}
        </div>
        <div className="grid grid-cols-2 gap-px border" style={{ borderColor: scheme.base02 }}>
          {BASE_KEYS.map((k: BaseKey) => {
            const before = scheme[k];
            const after = preview[k];
            const changed = before.toLowerCase() !== after.toLowerCase();
            return (
              <div key={k} className="flex items-center gap-1.5 px-1.5 py-0.5" style={{ background: scheme.base00 }}>
                <span className="text-[11px] font-mono shrink-0" style={{ color: scheme.base03 }}>{k}</span>
                <span className="w-4 h-3 shrink-0 border" style={{ background: before, borderColor: scheme.base02 }} />
                {stack.length > 0 && (
                  <span
                    className="w-4 h-3 shrink-0 border"
                    style={{
                      background: after,
                      borderColor: changed ? scheme.base0D : scheme.base02,
                      outline: changed ? `1px solid ${scheme.base0D}55` : "none",
                    }}
                  />
                )}
                <span
                  className="text-[11px] font-mono ml-auto truncate"
                  style={{
                    color: changed ? scheme.base05 : scheme.base03,
                    background: changed ? `${scheme.base0D}18` : "transparent",
                  }}
                >
                  {after}
                </span>
              </div>
            );
          })}
        </div>
        {stack.length === 0 ? (
          <div className="mt-2 text-[12px]" style={{ color: scheme.base04 }}>
            Pick an adjustment, choose which colours it targets, then stack several together.
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-8 gap-px border" style={{ borderColor: scheme.base02 }}>
            {BASE_KEYS.map((k) => (
              <div key={k} className="aspect-square" style={{ background: preview[k] }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
