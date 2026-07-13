import { KVStore } from '../../lib/kvStore';

/**
 * Tasbih counter state. NO Arabic dhikr text ships until the scholar gate
 * clears (CLAUDE.md): counts, targets, and an optional USER-TYPED label only.
 */
export interface TasbihState {
  count: number;
  /** Round size — the classic 33 and 99 plus freeform. */
  target: number;
  /** User-entered label; empty by default. Never pre-filled by us. */
  label: string;
}

export const TASBIH_TARGETS = [33, 99] as const;

const STATE_KEY = 'tasbih.v1';
const HISTORY_KEY = 'tasbih.history.v1';

const DEFAULT_STATE: TasbihState = { count: 0, target: 33, label: '' };

export function loadTasbih(store: KVStore): TasbihState {
  try {
    const raw: unknown = JSON.parse(store.get(STATE_KEY) ?? 'null');
    if (typeof raw !== 'object' || raw === null) return DEFAULT_STATE;
    const o = raw as Partial<TasbihState>;
    return {
      count: Number.isInteger(o.count) && (o.count as number) >= 0 ? (o.count as number) : 0,
      target: Number.isInteger(o.target) && (o.target as number) > 0 ? (o.target as number) : 33,
      label: typeof o.label === 'string' ? o.label.slice(0, 60) : '',
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function save(store: KVStore, state: TasbihState): void {
  store.set(STATE_KEY, JSON.stringify(state));
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export type TasbihHistory = Record<string, number>;

export function loadHistory(store: KVStore): TasbihHistory {
  try {
    const raw: unknown = JSON.parse(store.get(HISTORY_KEY) ?? '{}');
    if (typeof raw !== 'object' || raw === null) return {};
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).filter(
        ([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isInteger(v) && (v as number) > 0
      )
    ) as TasbihHistory;
  } catch {
    return {};
  }
}

/** Keep a rolling year of daily totals. */
function recordTap(store: KVStore, now: Date): void {
  const history = loadHistory(store);
  const key = dayKey(now);
  history[key] = (history[key] ?? 0) + 1;
  const keys = Object.keys(history).sort();
  while (keys.length > 366) delete history[keys.shift()!];
  store.set(HISTORY_KEY, JSON.stringify(history));
}

export interface TapResult {
  state: TasbihState;
  /** Completed a multiple of 33 within the round (classic detent). */
  hitThirtyThree: boolean;
  /** Completed the full round (target). */
  completedRound: boolean;
}

/** One tap: increments, records history, wraps at the target. */
export function tap(store: KVStore, now: Date = new Date()): TapResult {
  const prev = loadTasbih(store);
  const next = prev.count + 1;
  const completedRound = next >= prev.target;
  const state: TasbihState = { ...prev, count: completedRound ? 0 : next };
  save(store, state);
  recordTap(store, now);
  return {
    state,
    hitThirtyThree: !completedRound && next % 33 === 0,
    completedRound,
  };
}

export function resetCount(store: KVStore): TasbihState {
  const state = { ...loadTasbih(store), count: 0 };
  save(store, state);
  return state;
}

export function setTarget(store: KVStore, target: number): TasbihState {
  const safe = Number.isInteger(target) && target > 0 && target <= 9999 ? target : 33;
  const state = { ...loadTasbih(store), target: safe, count: 0 };
  save(store, state);
  return state;
}

export function setLabel(store: KVStore, label: string): TasbihState {
  const state = { ...loadTasbih(store), label: label.slice(0, 60) };
  save(store, state);
  return state;
}

/** Last `days` calendar days, oldest first, zero-filled. */
export function recentHistory(store: KVStore, days: number, now: Date = new Date()) {
  const history = loadHistory(store);
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = dayKey(d);
    out.push({ date: key, count: history[key] ?? 0 });
  }
  return out;
}
