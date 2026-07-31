/**
 * @jest-environment node
 */
import {
  nextRateChoice,
  nextSleepChoice,
  sleepDeadline,
  sleepExpired,
} from '../sleepTimer';

describe('sleep timer', () => {
  test('cycles off → 15 → 30 → off', () => {
    expect(nextSleepChoice(0)).toBe(15);
    expect(nextSleepChoice(15)).toBe(30);
    expect(nextSleepChoice(30)).toBe(0);
  });

  test('deadline and expiry', () => {
    const now = new Date('2026-07-31T22:00:00Z');
    expect(sleepDeadline(0, now)).toBeNull();
    const at = sleepDeadline(15, now)!;
    expect(at.getTime() - now.getTime()).toBe(15 * 60_000);
    expect(sleepExpired(at, new Date(at.getTime() - 1))).toBe(false);
    expect(sleepExpired(at, at)).toBe(true);
    expect(sleepExpired(null, now)).toBe(false);
  });

  test('rate cycles 1 → 1.25 → 1.5 → 1', () => {
    expect(nextRateChoice(1)).toBe(1.25);
    expect(nextRateChoice(1.25)).toBe(1.5);
    expect(nextRateChoice(1.5)).toBe(1);
  });
});
