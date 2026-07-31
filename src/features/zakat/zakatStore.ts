import type { NisabBasis, ZakatInputs, ZakatResult } from './zakat';
import type { KVStore } from '../../lib/kvStore';

/**
 * Saved zakat calculations (handoff §6 screen 08: "Save calculation" —
 * "kept on this device · export as text any time"; gap 31: rates shown
 * beside the result, timestamped on save). Local KV only, newest first,
 * capped so the store can't grow unbounded.
 */
export interface SavedCalculation {
  savedAtIso: string;
  basis: NisabBasis;
  inputs: ZakatInputs;
  result: ZakatResult;
}

const KEY = 'zakat.saved.v1';
const MAX_SAVED = 20;

export function loadSavedCalculations(store: KVStore): SavedCalculation[] {
  try {
    const raw: unknown = JSON.parse(store.get(KEY) ?? '[]');
    return Array.isArray(raw) ? (raw as SavedCalculation[]) : [];
  } catch {
    return [];
  }
}

export function saveCalculation(
  store: KVStore,
  entry: Omit<SavedCalculation, 'savedAtIso'>,
  now: Date = new Date()
): SavedCalculation {
  const saved: SavedCalculation = { ...entry, savedAtIso: now.toISOString() };
  const list = [saved, ...loadSavedCalculations(store)].slice(0, MAX_SAVED);
  store.set(KEY, JSON.stringify(list));
  return saved;
}

/**
 * Plain-text export of one calculation. Labels arrive from the caller's
 * translation layer so exports match the UI language.
 */
export function buildExportText(
  saved: SavedCalculation,
  labels: {
    title: string;
    wealth: string;
    nisab: string;
    due: string;
    ratesNote: string;
  },
  fmt: (n: number) => string
): string {
  const { result } = saved;
  const lines = [
    `${labels.title} — ${saved.savedAtIso.slice(0, 10)}`,
    `${labels.wealth}: ${fmt(result.zakatableWealth)}`,
    result.nisabThreshold !== null ? `${labels.nisab}: ${fmt(result.nisabThreshold)}` : null,
    `${labels.due}: ${fmt(result.zakatDue)}`,
    labels.ratesNote,
  ];
  return lines.filter(Boolean).join('\n');
}
