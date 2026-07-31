import { KVStore } from '../../lib/kvStore';

/**
 * Tasbih state (handoff §6 screen 05). NO Arabic dhikr SCRIPT ships until
 * scholar gate #5 clears (owner decision 2026-07-31): the UI shows
 * transliteration + gloss from i18n; this module deals only in dhikr KEYS.
 *
 * Modes:
 * - 'set'    — the guided set: SubhanAllah ×33 → Alhamdulillah ×33 → Allahu
 *              Akbar ×34 (the handoff's counts — SCHOLAR-REVIEW row covers
 *              the number set), advancing ONLY by explicit "Continue" (no
 *              auto-advance; §6). A completed round holds at its target.
 * - 'free'   — the continuous 99: one counter to 99 with detents at 33/66.
 * - 'custom' — user-chosen target with an optional user-typed label.
 */
export type TasbihMode = 'set' | 'free' | 'custom';
export type DhikrKey = 'subhanallah' | 'alhamdulillah' | 'allahuakbar';

/** The guided set's counts per §6 (33 + 33 + 34). */
export const DHIKR_SET: readonly { key: DhikrKey; target: number }[] = [
  { key: 'subhanallah', target: 33 },
  { key: 'alhamdulillah', target: 33 },
  { key: 'allahuakbar', target: 34 },
];

export const FREE_TARGET = 99;

export interface TasbihState {
  mode: TasbihMode;
  /** Round index into DHIKR_SET ('set' mode only). */
  round: number;
  /** Count within the current round ('set') or total ('free'/'custom'). */
  count: number;
  /** Custom-mode target. */
  customTarget: number;
  /** User-entered label for custom mode; empty by default, never pre-filled. */
  label: string;
}

const STATE_KEY = 'tasbih.v2';
const LEGACY_KEY = 'tasbih.v1';
const HISTORY_KEY = 'tasbih.history.v1';
const STREAK_KEY = 'tasbih.streakOptIn.v1';

const DEFAULT_STATE: TasbihState = {
  mode: 'set',
  round: 0,
  count: 0,
  customTarget: 100,
  label: '',
};

/** The active round's target for any mode. */
export function currentTarget(state: TasbihState): number {
  if (state.mode === 'free') return FREE_TARGET;
  if (state.mode === 'custom') return state.customTarget;
  return DHIKR_SET[state.round]?.target ?? 33;
}

/** The active dhikr key, or null in custom mode (user's own label rules). */
export function currentDhikr(state: TasbihState): DhikrKey | null {
  if (state.mode === 'custom') return null;
  if (state.mode === 'free') return 'subhanallah';
  return DHIKR_SET[state.round]?.key ?? 'subhanallah';
}

/** True when the current round sits completed at its target ('milestone'). */
export function roundComplete(state: TasbihState): boolean {
  return state.count >= currentTarget(state);
}

export function loadTasbih(store: KVStore): TasbihState {
  try {
    const raw: unknown = JSON.parse(store.get(STATE_KEY) ?? 'null');
    if (typeof raw === 'object' && raw !== null) {
      const o = raw as Partial<TasbihState>;
      const mode: TasbihMode = o.mode === 'free' || o.mode === 'custom' ? o.mode : 'set';
      const round =
        Number.isInteger(o.round) && (o.round as number) >= 0 && (o.round as number) < DHIKR_SET.length
          ? (o.round as number)
          : 0;
      const customTarget =
        Number.isInteger(o.customTarget) && (o.customTarget as number) > 0 && (o.customTarget as number) <= 9999
          ? (o.customTarget as number)
          : DEFAULT_STATE.customTarget;
      const state: TasbihState = {
        mode,
        round,
        customTarget,
        count: Number.isInteger(o.count) && (o.count as number) >= 0 ? (o.count as number) : 0,
        label: typeof o.label === 'string' ? o.label.slice(0, 60) : '',
      };
      state.count = Math.min(state.count, currentTarget(state));
      return state;
    }
  } catch {
    // fall through to legacy / default
  }
  // One-time migration from the v1 shape {count, target, label}.
  try {
    const raw: unknown = JSON.parse(store.get(LEGACY_KEY) ?? 'null');
    if (typeof raw === 'object' && raw !== null) {
      const o = raw as { count?: number; target?: number; label?: string };
      const count = Number.isInteger(o.count) && (o.count as number) >= 0 ? (o.count as number) : 0;
      const label = typeof o.label === 'string' ? o.label.slice(0, 60) : '';
      let state: TasbihState;
      if (o.target === 99) state = { ...DEFAULT_STATE, mode: 'free', count, label };
      else if (o.target && o.target !== 33)
        state = { ...DEFAULT_STATE, mode: 'custom', customTarget: o.target, count, label };
      else state = { ...DEFAULT_STATE, count: Math.min(count, 33), label };
      state.count = Math.min(state.count, currentTarget(state));
      return state;
    }
  } catch {
    // default
  }
  return DEFAULT_STATE;
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
  /** Passed a 33-multiple inside a continuing count (quiet detent). */
  hitDetent: boolean;
  /** The current round just reached its target (celebration; §2 grammar). */
  completedRound: boolean;
}

/**
 * One tap. In 'set' mode a completed round HOLDS at its target (taps do
 * nothing until "Continue" or a mode switch — no auto-advance, §6); 'free'
 * and 'custom' hold at their target the same way until Reset.
 */
export function tap(store: KVStore, now: Date = new Date()): TapResult {
  const prev = loadTasbih(store);
  const target = currentTarget(prev);
  if (prev.count >= target) {
    return { state: prev, hitDetent: false, completedRound: false };
  }
  const next = prev.count + 1;
  const state: TasbihState = { ...prev, count: next };
  save(store, state);
  recordTap(store, now);
  const completedRound = next >= target;
  return {
    state,
    completedRound,
    hitDetent: !completedRound && next % 33 === 0,
  };
}

/** "Continue — Alhamdulillah": advance to the next round of the set. */
export function continueSet(store: KVStore): TasbihState {
  const prev = loadTasbih(store);
  if (prev.mode !== 'set') return prev;
  const nextRound = (prev.round + 1) % DHIKR_SET.length;
  const state: TasbihState = { ...prev, round: nextRound, count: 0 };
  save(store, state);
  return state;
}

/** "or keep tapping toward 99": carry the set progress into the free 99. */
export function switchToFree(store: KVStore): TasbihState {
  const prev = loadTasbih(store);
  const cumulative =
    prev.mode === 'set'
      ? DHIKR_SET.slice(0, prev.round).reduce((sum, r) => sum + r.target, 0) + prev.count
      : prev.count;
  const state: TasbihState = {
    ...prev,
    mode: 'free',
    round: 0,
    count: Math.min(cumulative, FREE_TARGET),
  };
  save(store, state);
  return state;
}

export function setMode(store: KVStore, mode: TasbihMode): TasbihState {
  const prev = loadTasbih(store);
  if (prev.mode === mode) return prev;
  const state: TasbihState = { ...prev, mode, round: 0, count: 0 };
  save(store, state);
  return state;
}

export function setCustomTarget(store: KVStore, target: number): TasbihState {
  const safe = Number.isInteger(target) && target > 0 && target <= 9999 ? target : 100;
  const state: TasbihState = {
    ...loadTasbih(store),
    mode: 'custom',
    round: 0,
    count: 0,
    customTarget: safe,
  };
  save(store, state);
  return state;
}

export function resetCount(store: KVStore): TasbihState {
  const state = { ...loadTasbih(store), round: 0, count: 0 };
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

// --- Streaks (§1: optional, OFF by default; a missed day resets SILENTLY —
// the app never announces a loss, never shows fire/badges) -----------------

export function isStreakEnabled(store: KVStore): boolean {
  return store.get(STREAK_KEY) === 'true';
}

export function setStreakEnabled(store: KVStore, enabled: boolean): void {
  store.set(STREAK_KEY, enabled ? 'true' : 'false');
}

/**
 * Consecutive days with any dhikr, counting back from today (or yesterday,
 * so an unstarted today doesn't read as a loss). Pure computation — a break
 * simply yields the new shorter number.
 */
export function streakDays(store: KVStore, now: Date = new Date()): number {
  const history = loadHistory(store);
  const startOffset = history[dayKey(now)] ? 0 : 1;
  let days = 0;
  for (let i = startOffset; ; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    if (history[dayKey(d)]) days++;
    else break;
  }
  return days;
}
