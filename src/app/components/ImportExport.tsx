"use client";

import { useState, useRef, useEffect } from "react";
import { ColorScheme } from "@/src/lib/types";
import { exportFormats, parseBase16Json, parseBase16Yaml } from "@/src/lib/formats";
import { X, Check, Copy } from "lucide-react";

interface ImportExportProps {
  mode: "import" | "export" | null;
  scheme: ColorScheme | null;
  onClose: () => void;
  onImport: (s: Partial<ColorScheme>) => void;
  onExported: () => void;
}

export default function ImportExport({ mode, scheme, onClose, onImport, onExported }: ImportExportProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (mode) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [mode, onClose]);

  if (!mode || !scheme) return null;

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 2500);
    });
  };

  const handleImportAction = () => {
    const parsed = parseBase16Json(text) || parseBase16Yaml(text);
    if (parsed) {
      onImport(parsed);
      setText("");
      setError("");
    } else {
      setError("Invalid format. Paste Base16 JSON or YAML with all 16 colors.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: `${scheme.base00}cc` }}>
      <div ref={ref} className="w-full max-w-lg flex flex-col" style={{ background: scheme.base01, border: `1px solid ${scheme.base02}`, maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: scheme.base02 }}>
          <span className="text-sm font-semibold" style={{ color: scheme.base05 }}>
            {mode === "import" ? "Import Scheme" : "Export Scheme"}
          </span>
          <button onClick={onClose} style={{ color: scheme.base04 }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {mode === "import" ? (
            <div className="space-y-3">
              <div className="text-[14px]" style={{ color: scheme.base04 }}>
                Paste Base16 JSON or YAML below:
              </div>
              <textarea
                className="w-full h-40 text-[13px] p-2 font-mono outline-none resize-none"
                style={{
                  background: scheme.base00,
                  color: scheme.base05,
                  border: `1px solid ${scheme.base02}`,
                }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Base16 JSON or YAML e.g. {"scheme":"My Theme","base00":"#131313",...}'
              />
              {error && <div className="text-[13px]" style={{ color: scheme.base08 }}>{error}</div>}
              <button
                onClick={handleImportAction}
                className="w-full py-1.5 text-[14px] font-semibold"
                style={{ background: scheme.base0D, color: scheme.base00 }}
              >
                Import
              </button>
            </div>
          ) : (
            exportFormats.map((fmt) => {
              const content = fmt.generate(scheme);
              const isCopied = copiedId === fmt.id;
              return (
                <div key={fmt.id} style={{ border: `1px solid ${scheme.base02}` }}>
                  <div className="flex items-center justify-between px-3 py-1.5" style={{ background: scheme.base02 }}>
                    <span className="text-[13px] font-semibold" style={{ color: scheme.base05 }}>{fmt.label}</span>
                    <button
                      onClick={() => handleCopy(content, fmt.id)}
                      className="p-1 text-[15px] font-medium transition-all rounded"
                      title={isCopied ? "Copied!" : "Copy to clipboard"}
                      style={{
                        background: isCopied ? scheme.base0B : "transparent",
                        color: isCopied ? scheme.base00 : scheme.base04,
                        border: isCopied ? `1px solid ${scheme.base0B}` : "none",
                      }}
                    >
                      <span className="block">
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  </div>
                  <pre
                    className="p-3 text-[15px] font-mono overflow-x-auto leading-relaxed"
                    style={{
                      background: scheme.base00,
                      color: scheme.base04,
                      borderTop: `1px solid ${scheme.base02}`,
                    }}
                  >
                    {content}
                  </pre>
                </div>
              );
            })
          )}
        </div>

        {mode === "export" && (
          <div className="p-3 border-t shrink-0" style={{ borderColor: scheme.base02 }}>
            <button
              onClick={onExported}
              className="w-full py-1.5 text-[14px]"
              style={{
                background: scheme.base02,
                color: scheme.base05,
                border: `1px solid ${scheme.base03}`,
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
