"use client";

import { useState, useRef, useCallback } from "react";
import { ColorScheme } from "@/src/lib/types";
import { hexToHsl, hslToHex } from "@/src/lib/color";
import { presets, BASE_KEYS } from "@/src/lib/presets";
import { extractPalette, type ExtractAlgorithm, ALGORITHM_LABELS } from "@/src/lib/imagePalette";
import { Sparkles, Loader2 } from "lucide-react";

function generateRandomScheme(name: string, seedHue?: number): ColorScheme {
  const hue = seedHue ?? Math.random() * 360;
  const scheme: Record<string, string> = {};
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    scheme[`base0${i}`] = hslToHex(hue, 15, 5 + t * 20);
  }
  for (let i = 4; i < 8; i++) {
    const t = (i - 4) / 3;
    scheme[`base0${i}`] = hslToHex(hue, 10, 40 + t * 40);
  }
  const hues = [0, 30, 60, 120, 180, 210, 270, 300];
  for (let i = 0; i < 8; i++) {
    const ah = (hue + hues[i] + Math.random() * 15) % 360;
    scheme[`base0${(i + 8).toString(16).toUpperCase()}`] = hslToHex(ah, 55 + Math.random() * 30, 45 + Math.random() * 20);
  }
  return {
    name,
    base00: scheme.base00 || "#131313",
    base01: scheme.base01 || "#1b1c1c",
    base02: scheme.base02 || "#1f2020",
    base03: scheme.base03 || "#353535",
    base04: scheme.base04 || "#93927b",
    base05: scheme.base05 || "#e4e2e1",
    base06: scheme.base06 || "#c3b48d",
    base07: scheme.base07 || "#e7ea54",
    base08: hslToHex((hue + 0) % 360, 70, 55),
    base09: hslToHex((hue + 30) % 360, 65, 55),
    base0A: hslToHex((hue + 60) % 360, 75, 55),
    base0B: hslToHex((hue + 120) % 360, 60, 50),
    base0C: hslToHex((hue + 180) % 360, 55, 50),
    base0D: hslToHex((hue + 210) % 360, 60, 55),
    base0E: hslToHex((hue + 270) % 360, 55, 50),
    base0F: hslToHex((hue + 300) % 360, 45, 45),
  };
}

function generateFromBase(base: ColorScheme, seed: number): ColorScheme {
  const hueShift = seed * 30;
  const result = { ...base, name: `${base.name} Variant ${seed}` } as ColorScheme;
  for (const k of BASE_KEYS) {
    const hsl = hexToHsl(base[k]);
    (result as any)[k] = hslToHex((hsl.h + hueShift) % 360, Math.min(100, hsl.s + 10), Math.min(90, hsl.l + 5));
  }
  return result;
}

const ALL_ALGORITHMS: ExtractAlgorithm[] = [
  "kmeans", "median-cut", "histogram", "octree",
  "monochrome", "vibrant", "muted", "dominant",
  "high-contrast", "complementary",
];

interface GeneratePanelProps {
  onSave: (s: ColorScheme) => void;
  scheme: ColorScheme;
}

export default function GeneratePanel({ onSave, scheme }: GeneratePanelProps) {
  const [mode, setMode] = useState<"random" | "variant" | "image">("random");
  const [baseColor, setBaseColor] = useState("#d4d742");
  const [basePreset, setBasePreset] = useState(presets[3]);
  const [generated, setGenerated] = useState<ColorScheme | null>(null);
  const [name, setName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [algorithm, setAlgorithm] = useState<ExtractAlgorithm>("kmeans");
  const [compareResults, setCompareResults] = useState<Record<string, ColorScheme> | null>(null);
  const [comparing, setComparing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewScheme = generated || scheme;

  const handleGenerate = () => {
    let result: ColorScheme;
    if (mode === "random") {
      const hue = hexToHsl(baseColor).h;
      result = generateRandomScheme("", hue);
    } else {
      result = generateFromBase(basePreset, Math.floor(Math.random() * 12));
    }
    setGenerated(result);
    setName(result.name || "");
  };

  const handleSave = () => {
    if (!generated) return;
    onSave({ ...generated, name: name || "Untitled" });
    setGenerated(null);
    setName("");
    setCompareResults(null);
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadedFile(f);
    setExtracting(true);
    setCompareResults(null);
    try {
      const result = await extractPalette(f, algorithm);
      setGenerated(result);
      setName(result.name);
    } catch {}
    setExtracting(false);
  }, [algorithm]);

  const handleCompareAll = useCallback(async () => {
    if (!uploadedFile) return;
    setComparing(true);
    setCompareResults(null);
    const results: Record<string, ColorScheme> = {};
    try {
      const entries = await Promise.all(
        ALL_ALGORITHMS.map(async (alg) => {
          const r = await extractPalette(uploadedFile, alg);
          return [alg, r] as const;
        })
      );
      for (const [alg, r] of entries) {
        results[alg] = r;
      }
    } catch {}
    setCompareResults(results);
    setComparing(false);
  }, [uploadedFile]);

  const handleSelectResult = (alg: ExtractAlgorithm) => {
    if (!compareResults?.[alg]) return;
    setAlgorithm(alg);
    setGenerated(compareResults[alg]);
    setName(compareResults[alg].name);
    setCompareResults(null);
  };

  const algorithmGroups: { label: string; algs: ExtractAlgorithm[] }[] = [
    { label: "Standard", algs: ["kmeans", "median-cut", "histogram", "octree"] },
    { label: "Themed", algs: ["monochrome", "vibrant", "muted", "dominant"] },
    { label: "Accessibility", algs: ["high-contrast", "complementary"] },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("random")}
            className="flex-1 py-1 text-[13px] font-medium"
            style={{
              background: mode === "random" ? scheme.base0D : scheme.base02,
              color: mode === "random" ? scheme.base00 : scheme.base05,
            }}
          >
            Random
          </button>
          <button
            onClick={() => setMode("variant")}
            className="flex-1 py-1 text-[13px] font-medium"
            style={{
              background: mode === "variant" ? scheme.base0D : scheme.base02,
              color: mode === "variant" ? scheme.base00 : scheme.base05,
            }}
          >
            From Theme
          </button>
          <button
            onClick={() => setMode("image")}
            className="flex-1 py-1 text-[13px] font-medium"
            style={{
              background: mode === "image" ? scheme.base0D : scheme.base02,
              color: mode === "image" ? scheme.base00 : scheme.base05,
            }}
          >
            From Image
          </button>
        </div>

        {mode === "random" ? (
          <div>
            <div className="text-[12px] font-semibold mb-1" style={{ color: scheme.base04 }}>BASE HUE SEED</div>
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="w-full h-8 p-0 border cursor-pointer"
              style={{ background: "transparent", borderColor: scheme.base02 }}
            />
          </div>
        ) : mode === "variant" ? (
          <div>
            <div className="text-[12px] font-semibold mb-1" style={{ color: scheme.base04 }}>BASE THEME</div>
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {presets.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => setBasePreset(p)}
                  className="flex items-center gap-1.5 px-2 py-1 text-[12px] border text-left"
                  style={{
                    background: basePreset.slug === p.slug ? `${p.base0D}25` : "transparent",
                    borderColor: basePreset.slug === p.slug ? p.base0D : scheme.base02,
                    color: basePreset.slug === p.slug ? p.base05 : scheme.base04,
                  }}
                >
                  <span className="flex shrink-0">
                    {["base00","base0A","base03"].map((dk, di) => (
                      <span key={dk} className="w-1.5 h-2" style={{
                        background: (p as any)[dk],
                        borderLeft: di > 0 ? `1px solid ${scheme.base02}` : "none",
                      }} />
                    ))}
                  </span>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[12px] font-semibold mb-1" style={{ color: scheme.base04 }}>ALGORITHM</div>
            {algorithmGroups.map((group) => (
              <div key={group.label} className="mb-2">
                <div className="text-[10px] font-semibold tracking-wider mb-0.5" style={{ color: scheme.base03 }}>
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.algs.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAlgorithm(a)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 text-[12px] border text-left transition-all"
                      style={{
                        background: algorithm === a ? `${scheme.base0D}20` : "transparent",
                        borderColor: algorithm === a ? scheme.base0D : scheme.base02,
                        color: algorithm === a ? scheme.base0D : scheme.base04,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: algorithm === a ? scheme.base0D : scheme.base03 }}
                      />
                      {ALGORITHM_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-[12px] font-semibold mb-1 mt-3" style={{ color: scheme.base04 }}>UPLOAD IMAGE</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {generated?.sourceImage ? (
              <div className="relative">
                <img
                  src={generated.sourceImage}
                  alt="Source"
                  className="w-full h-32 object-cover rounded cursor-pointer"
                  style={{ border: `1px solid ${scheme.base02}` }}
                  onClick={() => fileRef.current?.click()}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[13px] font-semibold"
                  style={{ background: `${scheme.base00}cc`, color: scheme.base05 }}
                >
                  Change image
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={extracting}
                className="w-full h-24 flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer disabled:opacity-50"
                style={{ borderColor: scheme.base03, color: scheme.base04 }}
              >
                {extracting ? (
                  <span className="text-[14px]">Extracting palette...</span>
                ) : (
                  <>
                    <span className="text-[20px]">+</span>
                    <span className="text-[13px]">Click to select an image</span>
                  </>
                )}
              </button>
            )}

            {generated && uploadedFile && !compareResults && (
              <button
                onClick={handleCompareAll}
                disabled={comparing}
                className="w-full py-1.5 text-[13px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                style={{ background: scheme.base00, color: scheme.base0D, border: `1px solid ${scheme.base0D}` }}
              >
                {comparing ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Comparing all algorithms...</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Compare All 10 Algorithms</>
                )}
              </button>
            )}
          </div>
        )}

        <button
          onClick={mode === "image" && fileRef.current ? () => fileRef.current?.click() : handleGenerate}
          className="w-full py-1.5 text-[14px] font-semibold flex items-center justify-center gap-1"
          style={{ background: scheme.base0D, color: scheme.base00 }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {mode === "image" ? "Select Image" : "Generate"}
        </button>

        {generated && !compareResults && (
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: scheme.base02 }}>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 px-2 py-1 text-[13px] font-mono outline-none"
                style={{
                  background: scheme.base00,
                  color: scheme.base05,
                  border: `1px solid ${scheme.base02}`,
                }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Theme name..."
              />
              <button
                onClick={handleSave}
                className="px-3 py-1 text-[13px] font-semibold"
                style={{ background: scheme.base0B, color: scheme.base00 }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={compareResults ? "lg:col-span-2" : ""}>
        {compareResults ? (
          <div>
            <div className="text-[12px] font-semibold mb-2" style={{ color: scheme.base04 }}>
              COMPARE RESULTS — click Select to pick a scheme
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {ALL_ALGORITHMS.map((alg) => {
                const r = compareResults[alg];
                if (!r) return null;
                return (
                  <div
                    key={alg}
                    className="flex flex-col border overflow-hidden"
                    style={{ borderColor: scheme.base02, background: scheme.base00 }}
                  >
                    <div className="flex h-6 w-full">
                      {BASE_KEYS.map((k) => (
                        <div key={k} className="flex-1" style={{ background: r[k] }} />
                      ))}
                    </div>
                    <div className="p-2 space-y-1 flex-1 flex flex-col">
                      <div className="text-[11px] font-semibold truncate" style={{ color: scheme.base05 }}>
                        {ALGORITHM_LABELS[alg]}
                      </div>
                      <div className="text-[9px] font-mono truncate" style={{ color: scheme.base03 }}>
                        {r.base00} {r.base05} {r.base08}
                      </div>
                      <div className="grid grid-cols-8 gap-px mt-auto">
                        {BASE_KEYS.slice(0, 8).map((k) => (
                          <div key={k} className="aspect-square rounded-sm" style={{ background: r[k] }} />
                        ))}
                      </div>
                      <button
                        onClick={() => handleSelectResult(alg)}
                        className="w-full py-1 text-[11px] font-semibold mt-1"
                        style={{ background: scheme.base0D, color: scheme.base00 }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="text-[12px] font-semibold mb-1.5" style={{ color: scheme.base04 }}>
              {generated ? "PREVIEW" : "BASE THEME"}
            </div>
            <div className="grid grid-cols-2 gap-px border" style={{ borderColor: scheme.base02 }}>
              {BASE_KEYS.map((k) => {
                const c = generated ? generated[k] : basePreset[k];
                return (
                  <div key={k} className="flex items-center gap-1.5 px-1.5 py-0.5" style={{ background: scheme.base00 }}>
                    <span className="w-4 h-3 shrink-0 border" style={{ background: c, borderColor: scheme.base02 }} />
                    <span className="text-[13px] font-mono" style={{ color: scheme.base04 }}>{k}</span>
                    <span className="text-[12px] font-mono ml-auto" style={{ color: scheme.base03 }}>{c}</span>
                  </div>
                );
              })}
            </div>

            {!generated && (
              <div className="mt-2 text-[12px]" style={{ color: scheme.base04 }}>
                Click Generate to create a new palette.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
