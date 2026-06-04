"use client";

import { useState, useEffect, useCallback } from "react";
import { ColorScheme } from "./types";
import { presets } from "./presets";

const STORAGE_KEY = "stylix-schemes";

export function usePersistedSchemes() {
  const [schemes, setSchemes] = useState<ColorScheme[]>(presets);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ColorScheme[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSchemes(parsed);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  const setAndPersist = useCallback((next: ColorScheme[] | ((prev: ColorScheme[]) => ColorScheme[])) => {
    setSchemes((prev) => {
      const updated = typeof next === "function" ? (next as (prev: ColorScheme[]) => ColorScheme[])(prev) : next;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  return [schemes, setAndPersist, hydrated] as const;
}
