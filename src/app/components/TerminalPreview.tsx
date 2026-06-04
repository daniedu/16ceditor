"use client";

import { ColorScheme } from "@/src/lib/types";
import { schemeToAnsi } from "@/src/lib/mappings";

const ansiLabels = ["black","red","green","yellow","blue","magenta","cyan","white"] as const;
const brightKey: Record<string, keyof ReturnType<typeof schemeToAnsi>> = {
  black:"brightBlack", red:"brightRed", green:"brightGreen", yellow:"brightYellow",
  blue:"brightBlue", magenta:"brightMagenta", cyan:"brightCyan", white:"brightWhite",
};

const prompt = (
  <span>
    <span style={{ color: "#b4d8ca" }}>user@box</span>
    <span style={{ color: "#93927b" }}>:</span>
    <span style={{ color: "#d5c59e" }}>~</span>
    <span style={{ color: "#93927b" }}>$ </span>
  </span>
);

export default function TerminalPreview({ scheme }: { scheme: ColorScheme }) {
  const a = schemeToAnsi(scheme);

  return (
    <div className="border border-surface-high bg-surface overflow-hidden flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-low border-b border-surface-high">
        <span className="w-2.5 h-2.5 bg-error" />
        <span className="w-2.5 h-2.5 bg-[#f2e1b8]" />
        <span className="w-2.5 h-2.5 bg-[#b4d8ca]" />
        <span className="ml-auto text-[12px] text-outline">TERMINAL: ZSH</span>
      </div>

      <div className="p-3 font-mono text-[14px] leading-relaxed space-y-0.5" style={{ background: "#0e0e0e", color: a.white }}>
        <div>{prompt}<span style={{ color: a.green }}>ls -la</span></div>
        <div className="text-outline">total 42</div>
        <div>
          <span className="text-outline">drwxr-xr-x  6 user </span>
          <span style={{ color: a.yellow }}>src</span>
          <span className="text-outline">/</span>
        </div>
        <div>
          <span className="text-outline">-rw-r--r--  1 user </span>
          <span style={{ color: a.white }}>main.rs</span>
        </div>
        <div>
          <span className="text-outline">-rw-r--r--  1 user </span>
          <span style={{ color: a.cyan }}>build.sh</span>
        </div>
        <div>
          <span className="text-outline">-rw-r--r--  1 user </span>
          <span style={{ color: a.blue }}>config.toml</span>
        </div>
        <div>
          <span className="text-outline">-rwxr-xr-x  1 user </span>
          <span style={{ color: a.green }}>Makefile</span>
        </div>
        <div className="mt-1">{prompt}</div>
        <div>{prompt}<span style={{ color: a.green }}>./build</span></div>
        <div style={{ color: a.green }}>[00:00:01] 16/16 OK</div>
        <div className="flex items-center gap-0.5 mt-1">
          {prompt}
          <span className="inline-block w-2 h-4 bg-primary terminal-cursor" />
        </div>
      </div>

      <div className="border-t border-surface-high bg-surface-low p-3">
        <div className="text-[12px] font-semibold text-outline mb-2">ANSI COLOR TEST</div>
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
