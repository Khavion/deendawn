/**
 * @jest-environment node
 */
import { countdownShape, msUntilCountdownChange } from '../countdownFormat';

const MIN = 60_000;

describe('countdownShape', () => {
  test('under a minute is "now"', () => {
    expect(countdownShape(0)).toEqual({ kind: 'now' });
    expect(countdownShape(999)).toEqual({ kind: 'now' });
    expect(countdownShape(MIN - 1)).toEqual({ kind: 'now' });
    expect(countdownShape(-5_000)).toEqual({ kind: 'now' });
  });

  test('exactly one minute is "in 1 minute"', () => {
    expect(countdownShape(MIN)).toEqual({ kind: 'minutes', minutes: 1 });
  });

  test('minutes are ceilinged so the wait is never understated', () => {
    expect(countdownShape(40 * MIN + 30_000)).toEqual({ kind: 'minutes', minutes: 41 });
    expect(countdownShape(41 * MIN)).toEqual({ kind: 'minutes', minutes: 41 });
  });

  test('59:59 remaining stays under the hour form', () => {
    expect(countdownShape(59 * MIN)).toEqual({ kind: 'minutes', minutes: 59 });
  });

  test('the hour boundary flips to hours+minutes', () => {
    // 59 min 1 s ceilings to 60 → 1 h 0 min.
    expect(countdownShape(59 * MIN + 1000)).toEqual({ kind: 'hoursMinutes', hours: 1, minutes: 0 });
    expect(countdownShape(2 * 60 * MIN + 14 * MIN)).toEqual({
      kind: 'hoursMinutes',
      hours: 2,
      minutes: 14,
    });
  });
});

describe('msUntilCountdownChange', () => {
  test('returns the time to the next minute boundary', () => {
    expect(msUntilCountdownChange(90_000)).toBe(30_000);
    expect(msUntilCountdownChange(2 * MIN)).toBe(MIN);
  });

  test('never returns less than a second', () => {
    expect(msUntilCountdownChange(500)).toBe(1000);
    expect(msUntilCountdownChange(0)).toBe(MIN);
  });
});
