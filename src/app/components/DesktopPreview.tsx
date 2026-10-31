"use client";

import { memo } from "react";
import { ColorScheme, RoleMapping, DEFAULT_ROLE_MAPPING } from "@/src/lib/types";

export function DesktopPreview({
  scheme,
  mapping = DEFAULT_ROLE_MAPPING,
  wallpaper,
}: {
  scheme: ColorScheme;
  mapping?: RoleMapping;
  wallpaper?: string | null;
}) {
  const s = scheme;
  const accent = s[mapping.blue];
  const activeBorder = `linear-gradient(135deg, ${s[mapping.blue]} 0%, ${s[mapping.magenta]} 50%, ${s[mapping.cyan]} 100%)`;

  return (
    <div
      className="relative overflow-hidden border h-64 flex flex-col"
      style={{ borderColor: s.base02, background: wallpaper ? "#000" : `linear-gradient(160deg, ${s.base00}, ${s.base01} 60%, ${s.base01})` }}
    >
      {wallpaper && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${wallpaper})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      )}
      {!wallpaper && (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 70% 30%, ${accent}22 0%, transparent 60%)` }}
        />
      )}

      <div
        className="relative flex items-center gap-1 px-2 h-8 text-[11px] font-medium border-b"
        style={{ background: `${s.base01}dd`, borderColor: s.base02 }}
      >
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((w) => (
            <div
              key={w}
              className="w-5 h-5 flex items-center justify-center rounded"
              style={{
                background: w === 1 ? accent : `${s.base02}aa`,
                color: w === 1 ? s.base00 : s.base04,
              }}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="flex-1 text-center truncate" style={{ color: s.base05 }}>
          <span className="opacity-70">⌨</span> kitty — zsh
        </div>
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded" style={{ background: `${s.base02}aa`, color: s.base0C }}>CPU 12%</span>
          <span className="px-2 py-0.5 rounded" style={{ background: `${s.base02}aa`, color: s.base0E }}>MEM 38%</span>
          <span className="px-2 py-0.5 rounded" style={{ background: `${s.base02}aa`, color: s.base05 }}>21:37</span>
        </div>
      </div>

      <div className="relative flex-1 p-2 gap-2 flex items-stretch">
        <div
          className="flex-1 rounded-[6px] p-[2px]"
          style={{ background: activeBorder }}
        >
          <div
            className="w-full h-full rounded-[4px] font-mono text-[10.5px] leading-relaxed p-2 overflow-hidden"
            style={{ background: `${s.base00}f2`, color: s[mapping.fg] }}
          >
            <div>
              <span style={{ color: s[mapping.green] }}>user@rig</span>
              <span style={{ color: s.base03 }}>~</span>
              <span style={{ color: s[mapping.fg] }}>$ </span>
              <span style={{ color: s[mapping.blue] }}>neofetch</span>
            </div>
            <div style={{ color: s[mapping.cyan] }}>OS      Arch Linux x86_64</div>
            <div style={{ color: s[mapping.cyan] }}>WM      Hyprland (Wayland)</div>
            <div style={{ color: s[mapping.cyan] }}>Shell   zsh 5.9</div>
            <div>
              <span style={{ color: s[mapping.fg] }}>$ </span>
              <span className="inline-block w-1.5 h-3 align-middle" style={{ background: s[mapping.lightFg] }} />
            </div>
          </div>
        </div>

        <div
          className="w-2/5 rounded-[6px] p-[2px]"
          style={{ background: s.base02 }}
        >
          <div
            className="w-full h-full rounded-[4px] p-2 text-[10.5px] overflow-hidden"
            style={{ background: `${s.base00}f2` }}
          >
            <div className="font-semibold mb-1" style={{ color: s[mapping.fg] }}>Files</div>
            <div className="rounded p-1" style={{ background: s.base02, color: s[mapping.fg] }}> Documents</div>
            <div className="p-1" style={{ color: s.base04 }}> Downloads</div>
            <div className="p-1" style={{ color: s.base04 }}> Pictures</div>
            <div className="p-1 flex items-center gap-1" style={{ color: s[mapping.magenta] }}>
              <span className="inline-block w-2 h-2" style={{ background: s[mapping.magenta] }} /> wallpaper.png
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-2 px-2 pb-2">
        <div
          className="w-56 rounded-md border p-2 text-[10.5px]"
          style={{ background: `${s.base01}f0`, borderColor: s.base03 }}
        >
          <div
            className="rounded px-2 py-1 mb-1"
            style={{ background: s.base00, color: s.base03, border: `1px solid ${s.base02}` }}
          >
            run a command…
          </div>
          <div className="rounded px-2 py-1" style={{ background: accent, color: s.base00 }}> firefox</div>
          <div className="px-2 py-1" style={{ color: s.base04 }}> kitty</div>
          <div className="px-2 py-1" style={{ color: s.base04 }}> nautilus</div>
        </div>
        <div className="ml-auto text-[10px] px-2 py-1 rounded" style={{ background: `${s.base01}f0`, color: s.base03, border: `1px solid ${s.base02}` }}>
          workspace 1/5
        </div>
      </div>
    </div>
  );
}

export default memo(DesktopPreview);
