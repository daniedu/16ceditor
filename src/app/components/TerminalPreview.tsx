"use client";

import { ColorScheme, AnsiSlotMap, DEFAULT_TERMINAL_ANSI, TerminalAppearance, DEFAULT_TERMINAL_APPEARANCE } from "@/src/lib/types";
import { schemeToAnsi } from "@/src/lib/mappings";

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

export default function TerminalPreview({
  scheme,
  ansiMap = DEFAULT_TERMINAL_ANSI,
  appearance = DEFAULT_TERMINAL_APPEARANCE,
}: {
  scheme: ColorScheme;
  ansiMap?: AnsiSlotMap;
  appearance?: TerminalAppearance;
}) {
  const a = schemeToAnsi(scheme, ansiMap);
  const selBg = scheme[appearance.selectionBg];
  const selFg = scheme[appearance.selectionFg];
  const cur = scheme[appearance.cursor];
  const curText = scheme[appearance.cursorText];

  return (
    <div className="border border-surface-high overflow-hidden flex flex-col" style={{ borderColor: scheme.base02 }}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b" style={{ background: scheme.base01, borderColor: scheme.base02 }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: scheme.base08 }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: scheme.base0A }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: scheme.base0B }} />
        <span className="ml-auto text-[12px]" style={{ color: scheme.base04 }}>KITTY</span>
      </div>

      <div className="p-3 font-mono text-[14px] leading-relaxed space-y-0.5" style={{ background: scheme[ansiMap.color0], color: a.white }}>
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

        <div className="mt-2 pt-1 border-t border-dashed" style={{ borderColor: scheme.base02 }}>
          <div className="text-[11px] font-semibold mb-1" style={{ color: scheme.base04 }}>SEARCH</div>
          <div style={{ color: a.brightBlack }}>/src</div>
          <div className="mt-1">
            <span style={{ color: a.white }}>  </span>
            <span style={{ background: selBg, color: selFg }}>
              src
            </span>
            <span style={{ color: a.white }}>/index.ts</span>
          </div>
          <div className="mt-1" style={{ color: a.brightBlack }}>
            <span>  </span>
            <span style={{ background: `${selBg}55`, color: a.brightBlack }}>
              src/
            </span>
            <span>components/</span>
          </div>
        </div>

        <div className="mt-1">{prompt(a)}</div>
        <div className="flex items-center gap-0.5">
          {prompt(a)}
          <span className="inline-block w-2 h-4" style={{ background: cur, color: curText }}>&nbsp;</span>
        </div>
      </div>

      <div className="border-t p-3" style={{ borderColor: scheme.base02, background: scheme.base01 }}>
        <div className="text-[12px] font-semibold mb-2" style={{ color: scheme.base04 }}>ANSI COLOR TABLE</div>
        <div className="grid grid-cols-8 gap-1 mb-1">
          {ansiLabels.map((k, i) => (
            <div
              key={k}
              className="h-5 flex items-center justify-center text-[10px] font-medium"
              style={{ background: a[k], color: i < 4 && i !== 2 ? a.white : scheme.base00 }}
            >
              {i}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1">
          {ansiLabels.map((k, i) => (
            <div
              key={`b-${k}`}
              className="h-4 flex items-center justify-center text-[10px]"
              style={{ background: a[brightKey[k]], color: scheme.base00 }}
            >
              {i + 8}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t px-3 py-1.5 flex items-center gap-2 text-[10px]" style={{ borderColor: scheme.base02, background: scheme.base01, color: scheme.base03 }}>
        <span className="w-2.5 h-2.5 rounded" style={{ background: cur }} />
        <span>cursor</span>
        <span className="w-2.5 h-2.5 rounded" style={{ background: selBg }} />
        <span>selection</span>
      </div>
    </div>
  );
}
