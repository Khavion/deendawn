/**
 * Locale-aware numeral and date rendering. Digit policy (DECISIONS
 * 2026-07-30): Arabic UI renders Eastern Arabic-Indic digits everywhere —
 * the pre-polish screens mixed digit systems within a single line; Urdu
 * keeps Latin digits (the convention in Pakistani apps); English is
 * untouched. One helper owns the mapping so no screen hand-rolls digit
 * conversion.
 */

/** BCP-47 tag that pins the numbering system for the app language. */
export function digitLocale(lang: string): string {
  if (lang === 'ar' || lang.startsWith('ar-')) return 'ar-u-nu-arab';
  if (lang === 'ur' || lang.startsWith('ur-')) return 'ur-u-nu-latn';
  return lang || 'en';
}

/** Bare number in the language's digit system — no grouping separators. */
export function localizeNumber(value: number, lang: string): string {
  if (!Number.isFinite(value)) return String(value);
  return new Intl.NumberFormat(digitLocale(lang), { useGrouping: false }).format(value);
}

/** Local-day key 'YYYY-MM-DD' → short localized label like "Jul 24". */
export function formatDayKey(dayKey: string, lang: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return dayKey;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Intl.DateTimeFormat(digitLocale(lang), { month: 'short', day: 'numeric' }).format(d);
}
