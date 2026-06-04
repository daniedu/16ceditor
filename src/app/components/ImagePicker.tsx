"use client";

import { useState, useRef, useCallback } from "react";
import { ColorScheme, BaseKey } from "@/src/lib/types";
import { BASE_KEYS, SWATCH_LABELS } from "@/src/lib/presets";
import { rgbToHex } from "@/src/lib/color";
import { X, ZoomIn, ZoomOut, Pipette, Crosshair } from "lucide-react";

interface ImagePickerProps {
  scheme: ColorScheme;
  sourceImage?: string;
  onPick: (key: BaseKey, hex: string) => void;
  onImageUpload: (dataUrl: string) => void;
  onClose: () => void;
}

function generateThumbnail(img: HTMLImageElement, maxSize: number): string {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export default function ImagePicker({
  scheme, sourceImage, onPick, onImageUpload, onClose,
}: ImagePickerProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(sourceImage || null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [picking, setPicking] = useState(false);
  const [targetKey, setTargetKey] = useState<BaseKey>("base08");
  const [pickedHex, setPickedHex] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const thumb = generateThumbnail(img, 400);
        setImageSrc(dataUrl);
        onImageUpload(thumb);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.25, Math.min(20, zoom + delta));
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scale = newZoom / zoom;
    setPan({
      x: mouseX - scale * (mouseX - pan.x),
      y: mouseY - scale * (mouseY - pan.y),
    });
    setZoom(newZoom);
  }, [zoom, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (picking) return;
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: pan.x, y: pan.y });
  }, [picking, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: panStart.x + (e.clientX - dragStart.x),
      y: panStart.y + (e.clientY - dragStart.y),
    });
  }, [dragging, dragStart, panStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (!picking) return;
    const img = imgRef.current;
    if (!img) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const imgX = (localX - pan.x) / zoom;
    const imgY = (localY - pan.y) / zoom;
    if (imgX < 0 || imgX > img.naturalWidth || imgY < 0 || imgY > img.naturalHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(Math.round(imgX), Math.round(imgY), 1, 1).data;
    if (data[3] < 128) return;
    const hex = rgbToHex(data[0], data[1], data[2]);
    setPickedHex(hex);
    onPick(targetKey, hex);
  }, [picking, zoom, pan, targetKey, onPick]);

  const fullImageUrl = imageSrc || sourceImage;

  const { base00, base01, base02, base03, base04, base05, base0D } = scheme;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "#000000cc" }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="flex flex-col rounded-lg overflow-hidden"
        style={{
          width: "90vw",
          height: "85vh",
          background: base01,
          border: `1px solid ${base02}`,
        }}
      >
        <header
          className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ borderBottom: `1px solid ${base02}` }}
        >
          <span className="text-[14px] font-semibold flex items-center gap-2" style={{ color: base05 }}>
            <Crosshair className="w-4 h-4" style={{ color: base0D }} />
            Color Picker
            {picking && (
              <span className="text-[12px] px-2 py-0.5" style={{ color: base05, background: `${base0D}33` }}>
                picking {targetKey} — click the image
              </span>
            )}
            {pickedHex && (
              <span className="text-[12px] font-mono flex items-center gap-1" style={{ color: base04 }}>
                <span className="w-3 h-3 rounded" style={{ background: pickedHex }} />
                {pickedHex}
              </span>
            )}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
              className="p-1.5 transition-opacity hover:opacity-80"
              style={{ color: base04 }}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-mono w-12 text-center" style={{ color: base04 }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(20, z + 0.25))}
              className="p-1.5 transition-opacity hover:opacity-80"
              style={{ color: base04 }}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-5 mx-1" style={{ background: base03 }} />
            {fullImageUrl && (
              <button
                onClick={() => setPicking((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-1 text-[13px] font-semibold transition-all"
                style={{
                  background: picking ? base0D : "transparent",
                  color: picking ? base00 : base05,
                  border: `1px solid ${picking ? base0D : base03}`,
                }}
              >
                <Pipette className="w-3.5 h-3.5" />
                {picking ? "Picking..." : "Pick"}
              </button>
            )}
            <div className="w-px h-5 mx-1" style={{ background: base03 }} />
            <button
              onClick={onClose}
              className="p-1.5 transition-opacity hover:opacity-80"
              style={{ color: base04 }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden flex items-center justify-center"
          style={{ background: base00, cursor: picking ? "crosshair" : dragging ? "grabbing" : "grab" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          {fullImageUrl ? (
            <img
              ref={imgRef}
              src={fullImageUrl}
              alt="Source"
              draggable={false}
              onClick={handleImageClick}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
                maxWidth: "none",
                maxHeight: "none",
                userSelect: "none",
              }}
            />
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-2 px-8 py-12 border-2 border-dashed rounded-lg cursor-pointer"
              style={{ borderColor: base03, color: base04 }}
            >
              <span className="text-[24px]">+</span>
              <span className="text-[14px]">Upload an image to pick colors from</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageFile(f);
                }}
              />
            </label>
          )}
        </div>

        <footer
          className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto shrink-0"
          style={{ borderTop: `1px solid ${base02}`, background: base00 }}
        >
          {BASE_KEYS.map((k) => {
            const isTarget = targetKey === k;
            return (
              <button
                key={k}
                onClick={() => setTargetKey(k)}
                className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition-all shrink-0"
                style={{
                  background: isTarget ? base02 : "transparent",
                  outline: isTarget ? `2px solid ${base0D}` : "none",
                }}
              >
                <span
                  className="w-6 h-6 rounded"
                  style={{ background: scheme[k], boxShadow: `inset 0 0 0 1px ${base03}` }}
                />
                <span className="text-[10px] font-mono" style={{ color: isTarget ? base05 : base04 }}>
                  {k}
                </span>
              </button>
            );
          })}
        </footer>
      </div>
    </div>
  );
}
