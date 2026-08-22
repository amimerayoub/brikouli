const arabicDiacritics = /[\u064B-\u065F\u0670\u0640]/g;

export function normalizeArabicText(value: string) {
  return value.trim().toLowerCase().replace(arabicDiacritics, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ");
}

export function semanticSearchPreparation(value: string) {
  return Array.from(new Set(normalizeArabicText(value).split(/[^A-Za-z0-9\u0600-\u06FF]+/).filter(token => token.length > 1))).slice(0, 24);
}
