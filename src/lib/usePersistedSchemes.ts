"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ColorScheme } from "./types";
import { presets } from "./presets";

const SCHEMES_KEY = "stylix-schemes";
const IMAGES_KEY = "stylix-images";
const SAVE_DELAY_MS = 400;

const lastImagesJson = new Map<string, string>();

export function usePersistedSchemes() {
  const [schemes, setSchemes] = useState<ColorScheme[]>(presets);
  const [hydrated, setHydrated] = useState(false);
  const imagesDirty = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCHEMES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ColorScheme[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          let migrated = false;
          for (const s of parsed) {
            if (s.sourceImage && s.slug) {
              lastImagesJson.set(s.slug, s.sourceImage);
              migrated = true;
            }
          }
          if (migrated) {
            try {
              localStorage.setItem(SCHEMES_KEY, JSON.stringify(parsed.map(({ sourceImage, ...rest }) => rest)));
            } catch {}
            try {
              localStorage.setItem(IMAGES_KEY, JSON.stringify(Object.fromEntries(lastImagesJson)));
            } catch {}
          }
          setSchemes(parsed.map((s) => {
            const img = s.slug ? lastImagesJson.get(s.slug) : undefined;
            return img ? { ...s, sourceImage: img } : s;
          }));
        }
      } else {
        const imagesRaw = localStorage.getItem(IMAGES_KEY);
        if (imagesRaw) {
          try {
            const legacy = JSON.parse(imagesRaw) as Record<string, string>;
            for (const [slug, img] of Object.entries(legacy)) lastImagesJson.set(slug, img);
          } catch {}
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  const flush = useCallback((updated: ColorScheme[]) => {
    try {
      const payload = updated.map((s) => {
        if (s.sourceImage !== undefined) {
          const { sourceImage, ...rest } = s;
          void sourceImage;
          return rest as ColorScheme;
        }
        return s;
      });
      localStorage.setItem(SCHEMES_KEY, JSON.stringify(payload));
      if (imagesDirty.current) {
        localStorage.setItem(IMAGES_KEY, JSON.stringify(Object.fromEntries(lastImagesJson)));
        imagesDirty.current = false;
      }
    } catch {}
  }, []);

  const setAndPersist = useCallback((next: ColorScheme[] | ((prev: ColorScheme[]) => ColorScheme[])) => {
    setSchemes((prev) => {
      const updated = typeof next === "function" ? (next as (prev: ColorScheme[]) => ColorScheme[])(prev) : next;
      const prevImages = new Map<string, string | undefined>(prev.map((s) => [s.slug as string, s.sourceImage]));
      for (const s of updated) {
        const slug = s.slug;
        if (slug === undefined) continue;
        if (s.sourceImage !== prevImages.get(slug)) {
          imagesDirty.current = true;
          if (s.sourceImage === undefined) lastImagesJson.delete(slug);
          else lastImagesJson.set(slug, s.sourceImage);
        }
      }
      for (const [slug] of lastImagesJson) {
        if (!updated.some((s) => s.slug === slug && s.sourceImage)) {
          // orphaned image from a deleted scheme — will be cleaned on next dirty flush
          imagesDirty.current = true;
          lastImagesJson.delete(slug);
        }
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => flush(updated), SAVE_DELAY_MS);
      return updated;
    });
  }, []);

  return [schemes, setAndPersist, hydrated] as const;
}
