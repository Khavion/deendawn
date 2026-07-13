/**
 * Arabic search-query folding — MUST stay byte-identical to
 * content-pipeline/lib.mjs normalizeArabicForSearch (the FTS index was built
 * with it). A parity test compares this against the db's derived column.
 * Escape sequences only — no Arabic literals in AI-authored code.
 */
export function normalizeArabicQuery(s: string): string {
  return s
    .replace(/[\u0640\u06D6-\u06ED\u08D3-\u08FF]/g, '') // tatweel, Quranic annotation signs
    .replace(/[\u064B-\u065F\u0670]/g, '') // harakat, tanwin, hamza marks, superscript alef
    .replace(/[\u0622\u0623\u0625\u0671-\u0673\u0675]/g, '\u0627') // alef variants -> alef
    .replace(/\u0629/g, '\u0647') // ta marbuta -> ha
    .replace(/\u0649/g, '\u064A') // alef maksura -> ya
    .replace(/\u0624/g, '\u0648') // waw with hamza -> waw
    .replace(/\u0626/g, '\u064A') // ya with hamza -> ya
    .replace(/\s+/g, ' ')
    .trim();
}

/** True if the string contains Arabic-block characters. */
export function hasArabic(s: string): boolean {
  return /[\u0600-\u06FF]/.test(s);
}
