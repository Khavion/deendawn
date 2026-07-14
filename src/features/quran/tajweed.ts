/**
 * Tajweed color-coding data + pure rendering model.
 *
 * The annotation data (assets/tajweed.json) is DERIVED, not authored here: it
 * was produced by the cpfair/quran-tajweed classifier (CC BY 4.0) run against
 * our own checksum-pinned Tanzil Uthmani text, so every offset aligns to our
 * quran.db by construction (proven by the golden test). This module never
 * writes or judges tajweed — it only maps the verified rule spans to colors.
 *
 * GATE: the rule→color MAPPING and rule correctness are religious-presentation
 * decisions flagged in docs/SCHOLAR_REVIEW.md. The feature ships OFF behind
 * TAJWEED_ENABLED until a knowledgeable reviewer signs off.
 */

// SCHOLAR-REVIEW: tajweed rule → color-family mapping. Uses a common printed-
// mushaf scheme; the exact assignment needs a knowledgeable reviewer's blessing.
export type TajweedColorKey =
  | 'maddLong' // obligatory / longer elongation
  | 'maddNatural' // natural / permissible elongation
  | 'ghunnah' // nasalization
  | 'ikhfa' // hiding
  | 'iqlab' // conversion
  | 'qalqalah' // echo
  | 'idghaam' // merging
  | 'silent'; // not pronounced

const RULE_COLOR: Record<string, TajweedColorKey> = {
  madd_6: 'maddLong',
  madd_muttasil: 'maddLong',
  madd_246: 'maddLong',
  madd_2: 'maddNatural',
  madd_munfasil: 'maddNatural',
  ghunnah: 'ghunnah',
  idghaam_ghunnah: 'ghunnah',
  ikhfa: 'ikhfa',
  ikhfa_shafawi: 'ikhfa',
  iqlab: 'iqlab',
  qalqalah: 'qalqalah',
  idghaam_no_ghunnah: 'idghaam',
  idghaam_shafawi: 'idghaam',
  idghaam_mutajanisayn: 'idghaam',
  idghaam_mutaqaribayn: 'idghaam',
  hamzat_wasl: 'silent',
  lam_shamsiyyah: 'silent',
  silent: 'silent',
};

// When spans overlap, the higher-priority color wins per codepoint. Elongation
// and qalqalah are the most visually meaningful, so they sit above the rest.
// SCHOLAR-REVIEW: this precedence ordering.
const COLOR_PRIORITY: TajweedColorKey[] = [
  'maddLong',
  'maddNatural',
  'qalqalah',
  'iqlab',
  'ikhfa',
  'ghunnah',
  'idghaam',
  'silent',
];

export interface TajweedData {
  rules: string[];
  ayat: Record<string, [number, number, number][]>; // 'surah:ayah' -> [ruleId, start, end][]
}

let cache: TajweedData | null = null;

export function loadTajweedData(): TajweedData {
  if (!cache) {
    // Lazy require: 723 KB JSON is parsed only when tajweed is turned on.
    cache = require('@/assets/tajweed.json') as TajweedData;
  }
  return cache;
}

export interface ColoredRun {
  text: string;
  /** null = default text color (no tajweed rule on this run). */
  colorKey: TajweedColorKey | null;
}

/**
 * Split an ayah's text into contiguous colored runs. Pure and deterministic:
 * assigns each codepoint the highest-priority rule color covering it, then
 * coalesces neighbours with the same color. Splitting only adds color
 * attributes over a continuous string — Arabic shaping is preserved because
 * the runs render inside one parent <Text> (color does not break ligatures).
 */
export function toColoredRuns(
  text: string,
  spans: [number, number, number][],
  rules: string[]
): ColoredRun[] {
  const cps = [...text];
  const perCp: (TajweedColorKey | null)[] = new Array(cps.length).fill(null);
  const rank = (k: TajweedColorKey) => COLOR_PRIORITY.indexOf(k);

  for (const [ruleId, start, end] of spans) {
    const ruleName = rules[ruleId];
    const color = ruleName ? RULE_COLOR[ruleName] : undefined;
    if (!color) continue;
    for (let i = Math.max(0, start); i < Math.min(end, cps.length); i++) {
      const cur = perCp[i];
      if (cur === null || rank(color) < rank(cur)) perCp[i] = color;
    }
  }

  const runs: ColoredRun[] = [];
  let buf = '';
  let bufColor: TajweedColorKey | null = null;
  for (let i = 0; i < cps.length; i++) {
    if (i > 0 && perCp[i] !== bufColor) {
      runs.push({ text: buf, colorKey: bufColor });
      buf = '';
    }
    if (buf === '') bufColor = perCp[i];
    buf += cps[i];
  }
  if (buf !== '') runs.push({ text: buf, colorKey: bufColor });
  return runs;
}

export function getAyahRuns(surah: number, ayah: number, text: string): ColoredRun[] {
  const data = loadTajweedData();
  const spans = data.ayat[`${surah}:${ayah}`] ?? [];
  if (spans.length === 0) return [{ text, colorKey: null }];
  return toColoredRuns(text, spans, data.rules);
}

/** Legend entries for the reader's tajweed key (labels are i18n keys). */
export const TAJWEED_LEGEND: { colorKey: TajweedColorKey; labelKey: string }[] = [
  { colorKey: 'maddLong', labelKey: 'quran.tajweed.maddLong' },
  { colorKey: 'maddNatural', labelKey: 'quran.tajweed.maddNatural' },
  { colorKey: 'ghunnah', labelKey: 'quran.tajweed.ghunnah' },
  { colorKey: 'qalqalah', labelKey: 'quran.tajweed.qalqalah' },
  { colorKey: 'ikhfa', labelKey: 'quran.tajweed.ikhfa' },
  { colorKey: 'iqlab', labelKey: 'quran.tajweed.iqlab' },
  { colorKey: 'idghaam', labelKey: 'quran.tajweed.idghaam' },
  { colorKey: 'silent', labelKey: 'quran.tajweed.silent' },
];
