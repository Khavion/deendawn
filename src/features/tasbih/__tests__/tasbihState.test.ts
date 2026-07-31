/**
 * @jest-environment node
 */
import { createMemoryKVStore } from '../../../lib/kvStore';
import {
  continueSet,
  currentDhikr,
  currentTarget,
  DHIKR_SET,
  loadTasbih,
  recentHistory,
  resetCount,
  roundComplete,
  setCustomTarget,
  setMode,
  setStreakEnabled,
  isStreakEnabled,
  streakDays,
  switchToFree,
  tap,
} from '../tasbihState';

const taps = (store: ReturnType<typeof createMemoryKVStore>, n: number, now?: Date) => {
  let last!: ReturnType<typeof tap>;
  for (let i = 0; i < n; i++) last = tap(store, now);
  return last;
};

describe('dhikr set machine (33/33/34, no auto-advance)', () => {
  it('starts on SubhanAllah with target 33', () => {
    const store = createMemoryKVStore();
    const s = loadTasbih(store);
    expect(s.mode).toBe('set');
    expect(currentDhikr(s)).toBe('subhanallah');
    expect(currentTarget(s)).toBe(33);
  });

  it('celebrates at 33 and HOLDS — further taps are inert until Continue', () => {
    const store = createMemoryKVStore();
    const r = taps(store, 33);
    expect(r.completedRound).toBe(true);
    expect(roundComplete(r.state)).toBe(true);
    const after = tap(store);
    expect(after.state.count).toBe(33);
    expect(after.completedRound).toBe(false);
  });

  it('Continue advances rounds through the set and wraps', () => {
    const store = createMemoryKVStore();
    taps(store, 33);
    let s = continueSet(store);
    expect(currentDhikr(s)).toBe('alhamdulillah');
    expect(currentTarget(s)).toBe(33);
    taps(store, 33);
    s = continueSet(store);
    expect(currentDhikr(s)).toBe('allahuakbar');
    expect(currentTarget(s)).toBe(34);
    taps(store, 34);
    s = continueSet(store);
    expect(currentDhikr(s)).toBe('subhanallah');
    expect(s.count).toBe(0);
  });

  it('"keep tapping toward 99" carries cumulative progress into free mode', () => {
    const store = createMemoryKVStore();
    taps(store, 33);
    continueSet(store);
    taps(store, 10); // cumulative 43
    const s = switchToFree(store);
    expect(s.mode).toBe('free');
    expect(s.count).toBe(43);
    expect(currentTarget(s)).toBe(99);
  });

  it('the set carries the specced counts (33/33/34 — SCHOLAR-REVIEW row)', () => {
    expect(DHIKR_SET.map((r) => r.target)).toEqual([33, 33, 34]);
  });
});

describe('free 99 mode', () => {
  it('detents at 33 and 66, completes at 99, holds at 99', () => {
    const store = createMemoryKVStore();
    setMode(store, 'free');
    expect(taps(store, 33).hitDetent).toBe(true);
    expect(taps(store, 33).hitDetent).toBe(true); // 66
    const done = taps(store, 33); // 99
    expect(done.completedRound).toBe(true);
    expect(tap(store).state.count).toBe(99);
  });
});

describe('custom mode', () => {
  it('uses the user target and rejects nonsense', () => {
    const store = createMemoryKVStore();
    let s = setCustomTarget(store, 500);
    expect(currentTarget(s)).toBe(500);
    s = setCustomTarget(store, -3);
    expect(currentTarget(s)).toBe(100);
    expect(currentDhikr(s)).toBeNull();
  });
});

describe('mode switching and reset', () => {
  it('switching modes resets the count; reset returns to round 0', () => {
    const store = createMemoryKVStore();
    taps(store, 10);
    const s = setMode(store, 'free');
    expect(s.count).toBe(0);
    taps(store, 5);
    const r = resetCount(store);
    expect(r.count).toBe(0);
    expect(r.round).toBe(0);
  });
});

describe('v1 migration', () => {
  it('maps target 33 → set, 99 → free, other → custom', () => {
    const cases: [number, string][] = [
      [33, 'set'],
      [99, 'free'],
      [250, 'custom'],
    ];
    for (const [target, mode] of cases) {
      const store = createMemoryKVStore({
        'tasbih.v1': JSON.stringify({ count: 5, target, label: 'x' }),
      });
      const s = loadTasbih(store);
      expect(s.mode).toBe(mode);
      expect(s.count).toBe(5);
      expect(s.label).toBe('x');
    }
  });
});

describe('history and streaks', () => {
  it('records taps per local day', () => {
    const store = createMemoryKVStore();
    const day = new Date(2026, 6, 31, 10);
    taps(store, 3, day);
    const recent = recentHistory(store, 7, day);
    expect(recent[6]).toEqual({ date: '2026-07-31', count: 3 });
  });

  it('streaks are off by default and opt-in', () => {
    const store = createMemoryKVStore();
    expect(isStreakEnabled(store)).toBe(false);
    setStreakEnabled(store, true);
    expect(isStreakEnabled(store)).toBe(true);
  });

  it('streak counts consecutive days and resets SILENTLY (pure recompute)', () => {
    const store = createMemoryKVStore();
    const day = (d: number, month = 6) => new Date(2026, month, d, 9);
    tap(store, day(29));
    tap(store, day(30));
    tap(store, day(31));
    expect(streakDays(store, day(31))).toBe(3);
    // An unstarted "today" doesn't read as a loss: count from yesterday.
    expect(streakDays(store, new Date(2026, 7, 1, 9))).toBe(3);
    // A genuinely missed day just yields the shorter number — no event.
    expect(streakDays(store, new Date(2026, 7, 2, 9))).toBe(0);
  });
});
