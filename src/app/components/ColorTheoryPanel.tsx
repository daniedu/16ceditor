"use client";

import { ColorScheme } from "@/src/lib/types";
import { analyzeScheme, generateHarmonies } from "@/src/lib/harmony";
import { toneDown } from "@/src/lib/color";

export default function ColorTheoryPanel({
  scheme,
  onUpdate,
}: {
  scheme: ColorScheme;
  onUpdate: (s: ColorScheme) => void;
}) {
  const issues = analyzeScheme(scheme);
  const c = (s: string) => s === "error" ? scheme.base08 : s === "warning" ? scheme.base0A : scheme.base0C;

  return (
    <div className="space-y-2">
      <div className="text-[13px] font-semibold tracking-wider" style={{ color: scheme.base04 }}>
        analysis
      </div>

      <div className="space-y-0.5">
        {issues.length === 0 && (
          <div className="text-[13px]" style={{ color: scheme.base0B }}>no issues</div>
        )}
        {issues.map((issue, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[12px] leading-tight" style={{ color: scheme.base04 }}>
            <span style={{ color: c(issue.severity) }}>
              {issue.severity === "error" ? "!" : issue.severity === "warning" ? "~" : "i"}
            </span>
            <span className="flex-1">{issue.message}</span>
            {issue.suggestion && (
              <button
                className="underline decoration-dotted shrink-0"
                style={{ color: scheme.base0D }}
                onClick={() => {
                  const k = (["base08","base09","base0A","base0B","base0C","base0D","base0E","base0F"] as const)
                    .find(k => scheme[k] === issue.color);
                  if (k) onUpdate({ ...scheme, [k]: issue.suggestion });
                }}
              >
                fix
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-[13px] font-semibold tracking-wider pt-1" style={{ color: scheme.base04 }}>
        harmonies
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        {(["base08","base09","base0A","base0B","base0C","base0D","base0E","base0F"] as const).map((k) => {
          const harmonies = generateHarmonies(scheme[k]);
          return (
            <div key={k} className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: scheme[k] }} />
              {harmonies.slice(0, 3).map((h, hi) => (
                <button
                  key={hi}
                  className="w-2.5 h-2.5 rounded-sm cursor-pointer hover:scale-125 transition-transform"
                  style={{ background: h }}
                  onClick={() => onUpdate({ ...scheme, [k]: h })}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="text-[13px] font-semibold tracking-wider pt-1" style={{ color: scheme.base04 }}>
        tone down
      </div>
      <div className="flex gap-1">
        {[0, 0.15, 0.3, 0.45, 0.6].map((amt) => (
          <button
            key={amt}
            className="flex-1 h-5 rounded text-[13px]"
            style={{
              background: amt === 0 ? scheme.base02 : scheme.base01,
              color: scheme.base04,
              border: `1px solid ${scheme.base02}`,
            }}
            onClick={() => {
              const updated = { ...scheme };
              for (const k of ["base08","base09","base0A","base0B","base0C","base0D","base0E","base0F"] as const) {
                updated[k] = toneDown(updated[k], amt);
              }
              onUpdate(updated);
            }}
          >
            {amt === 0 ? "off" : `${Math.round(amt * 100)}%`}
          </button>
        ))}
      </div>
    </div>
  );
}
