export const languages = [
  { code: "en", name: "English", label: "English" },
  { code: "ja", name: "日本語", label: "Japanese" },
  { code: "es", name: "Español", label: "Spanish" },
  { code: "ko", name: "한국어", label: "Korean" },
  { code: "pt", name: "Português", label: "Portuguese" },
  { code: "ro", name: "Română", label: "Romanian" },
  { code: "it", name: "Italiano", label: "Italian" },
  { code: "zh", name: "简体中文", label: "Chinese (Simplified)" },
] as const;

export type Locale = (typeof languages)[number]["code"];
export const localeCookie = "choicestakes-language";
export function isLocale(value: unknown): value is Locale {
  return languages.some((language) => language.code === value);
}
export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : "en";
}
