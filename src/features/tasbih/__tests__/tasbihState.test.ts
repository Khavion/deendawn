/**
 * @jest-environment node
 */
import {
  loadHistory,
  loadTasbih,
  recentHistory,
  resetCount,
  setLabel,
  setTarget,
  tap,
} from '../tasbihState';
import { createMemoryKVStore } from '../../../lib/kvStore';

const NOW = new Date(2026, 6, 13, 10, 0, 0);

describe('tasbih counting', () => {
  test('increments, hits the 33 detent, and wraps at the 99 round', () => {
    const store = createMemoryKVStore();
    setTarget(store, 99);
    let last;
    for (let i = 1; i <= 32; i++) last = tap(store, NOW);
    expect(last!.state.count).toBe(32);
    expect(last!.hitThirtyThree).toBe(false);

    last = tap(store, NOW); // 33
    expect(last.hitThirtyThree).toBe(true);
    expect(last.completedRound).toBe(false);

    for (let i = 34; i <= 66; i++) last = tap(store, NOW);
    expect(last!.hitThirtyThree).toBe(true); // 66

    for (let i = 67; i <= 99; i++) last = tap(store, NOW);
    expect(last!.completedRound).toBe(true);
    expect(last!.state.count).toBe(0); // wrapped
  });

  test('target 33: round completion fires instead of the detent', () => {
    const store = createMemoryKVStore();
    let last;
    for (let i = 1; i <= 33; i++) last = tap(store, NOW);
    expect(last!.completedRound).toBe(true);
    expect(last!.hitThirtyThree).toBe(false);
    expect(last!.state.count).toBe(0);
  });

  test('reset and target changes zero the count; label is user text only', () => {
    const store = createMemoryKVStore();
    tap(store, NOW);
    tap(store, NOW);
    expect(loadTasbih(store).count).toBe(2);
    expect(resetCount(store).count).toBe(0);
    tap(store, NOW);
    expect(setTarget(store, 99).count).toBe(0);
    expect(loadTasbih(store).target).toBe(99);
    expect(setTarget(store, -5).target).toBe(33); // rejected -> default
    expect(setLabel(store, 'My dhikr').label).toBe('My dhikr');
    expect(loadTasbih(store).label).toBe('My dhikr');
  });

  test('daily history accumulates per calendar day and zero-fills gaps', () => {
    const store = createMemoryKVStore();
    for (let i = 0; i < 5; i++) tap(store, NOW);
    const yesterday = new Date(2026, 6, 12, 23, 0, 0);
    for (let i = 0; i < 3; i++) tap(store, yesterday);
    const recent = recentHistory(store, 3, NOW);
    expect(recent).toEqual([
      { date: '2026-07-11', count: 0 },
      { date: '2026-07-12', count: 3 },
      { date: '2026-07-13', count: 5 },
    ]);
  });

  test('corrupt storage falls back safely', () => {
    const store = createMemoryKVStore({
      'tasbih.v1': '{{nope',
      'tasbih.history.v1': '[1,2,3]',
    });
    expect(loadTasbih(store)).toEqual({ count: 0, target: 33, label: '' });
    expect(loadHistory(store)).toEqual({});
  });
});
