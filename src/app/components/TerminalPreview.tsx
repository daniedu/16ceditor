"use client";

import { useState } from "react";
import { ColorScheme, RoleMapping, DEFAULT_ROLE_MAPPING } from "@/src/lib/types";
import { schemeToAnsi } from "@/src/lib/mappings";
import { applyGamma } from "@/src/lib/color";

const ansiLabels = ["black","red","green","yellow","blue","magenta","cyan","white"] as const;
const brightKey: Record<string, keyof ReturnType<typeof schemeToAnsi>> = {
  black:"brightBlack", red:"brightRed", green:"brightGreen", yellow:"brightYellow",
  blue:"brightBlue", magenta:"brightMagenta", cyan:"brightCyan", white:"brightWhite",
};

const prompt = (a: ReturnType<typeof schemeToAnsi>) => (
  <span>
    <span style={{ color: a.green }}>user@box</span>
    <span style={{ color: a.brightBlack }}>:</span>
    <span style={{ color: a.yellow }}>~</span>
    <span style={{ color: a.brightBlack }}>$ </span>
  </span>
);

export default function TerminalPreview({ scheme, mapping = DEFAULT_ROLE_MAPPING }: { scheme: ColorScheme; mapping?: RoleMapping }) {
  const [gamma, setGamma] = useState(2.2);
  const a = schemeToAnsi(scheme, mapping);
  const bg = applyGamma(scheme[mapping.bg], gamma);

  return (
    <div className="border border-surface-high overflow-hidden flex flex-col" style={{ borderColor: scheme.base02 }}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b" style={{ background: scheme.base01, borderColor: scheme.base02 }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: scheme.base08 }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: scheme.base0A }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: scheme.base0B }} />
        <span className="ml-auto text-[12px]" style={{ color: scheme.base04 }}>TERMINAL: ZSH</span>
        <div className="ml-2 flex items-center gap-1">
          <span className="text-[10px]" style={{ color: scheme.base04 }}>γ</span>
          <input
            type="range"
            min="10"
            max="24"
            value={Math.round(gamma * 10)}
            onChange={(e) => setGamma(parseInt(e.target.value) / 10)}
            className="w-12 h-3"
            style={{ accentColor: scheme.base0D }}
          />
          <span className="text-[10px] font-mono" style={{ color: scheme.base03 }}>{gamma.toFixed(1)}</span>
        </div>
      </div>

      <div className="p-3 font-mono text-[14px] leading-relaxed space-y-0.5" style={{ background: bg, color: a.white }}>
        <div>{prompt(a)}<span style={{ color: a.green }}>ls -la</span></div>
        <div style={{ color: a.brightBlack }}>total 42</div>
        <div>
          <span style={{ color: a.brightBlack }}>drwxr-xr-x  6 user </span>
          <span style={{ color: a.yellow }}>src</span>
          <span style={{ color: a.brightBlack }}>/</span>
        </div>
        <div>
          <span style={{ color: a.brightBlack }}>-rw-r--r--  1 user </span>
          <span style={{ color: a.white }}>main.rs</span>
        </div>
        <div>
          <span style={{ color: a.brightBlack }}>-rw-r--r--  1 user </span>
          <span style={{ color: a.cyan }}>build.sh</span>
        </div>
        <div>
          <span style={{ color: a.brightBlack }}>-rw-r--r--  1 user </span>
          <span style={{ color: a.blue }}>config.toml</span>
        </div>
        <div>
          <span style={{ color: a.brightBlack }}>-rwxr-xr-x  1 user </span>
          <span style={{ color: a.green }}>Makefile</span>
        </div>
        <div className="mt-1">{prompt(a)}</div>
        <div>{prompt(a)}<span style={{ color: a.green }}>./build</span></div>
        <div style={{ color: a.green }}>[00:00:01] 16/16 OK</div>
        <div className="flex items-center gap-0.5 mt-1">
          {prompt(a)}
          <span className="inline-block w-2 h-4 terminal-cursor" style={{ background: scheme[mapping.blue] }} />
        </div>
      </div>

      <div className="border-t p-3" style={{ borderColor: scheme.base02, background: scheme.base01 }}>
        <div className="text-[12px] font-semibold mb-2" style={{ color: scheme.base04 }}>ANSI COLOR TEST</div>
        <div className="grid grid-cols-8 gap-1 mb-1">
          {ansiLabels.map((k, i) => (
            <div
              key={k}
              className="h-5 flex items-center justify-center text-[10px] font-medium"
              style={{ background: a[k], color: i === 0 || i === 4 || i === 5 ? a.white : scheme.base00 }}
            >
              {i}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1">
          {ansiLabels.map((k, i) => (
            <div
              key={`b-${k}`}
              className="h-4 flex items-center justify-center text-[12px]"
              style={{ background: a[brightKey[k]], color: scheme.base01 }}
            >
              {i + 8}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
