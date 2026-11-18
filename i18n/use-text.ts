"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import english from "../messages/en.json";

// Keep existing navigation/action identifiers stable; translate display copy only.
// Editorial pages can be migrated incrementally and retain English until translated.
const keys = new Map(Object.entries(english.ui).map(([key, value]) => [value as string, key]));
for (const [label, canonical] of Object.entries({
  "Crash & Instant Games": "Crash & Instant",
  "Table Games": "Table & Cards",
  "Lottery & Scratch Cards": "Lotto & Scratch",
  "Explore all games": "Browse all games",
  "All games": "All Games",
})) keys.set(label, keys.get(canonical)!);
export function useText() {
  const translate = useTranslations("ui");
  return useCallback((text: string, values?: Record<string, string | number>) => {
    const key = keys.get(text);
    return key ? translate(key, values) : text;
  }, [translate]);
}
