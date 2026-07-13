/**
 * @jest-environment node
 */
import { daysInHijriMonth, fromHijri, isRamadan, keyDatesFor, toHijri } from '../hijri';

describe('Umm al-Qura conversion (calculated)', () => {
  // Published Umm al-Qura anchors.
  test.each([
    [new Date(2024, 2, 11), 1445, 9, 1], // 1 Ramadan 1445
    [new Date(2024, 3, 10), 1445, 10, 1], // Eid al-Fitr 1445
    [new Date(2021, 7, 9), 1443, 1, 1], // 1 Muharram 1443
    [new Date(2026, 1, 18), 1447, 9, 1], // 1 Ramadan 1447
  ])('%s -> %i/%i/%i', (g, hy, hm, hd) => {
    const h = toHijri(g as Date);
    expect([h.year, h.month, h.day]).toEqual([hy, hm, hd]);
  });

  test('round-trips through fromHijri', () => {
    for (const [y, m, d] of [
      [1445, 9, 1],
      [1447, 1, 10],
      [1446, 12, 10],
    ] as const) {
      const g = fromHijri(y, m, d);
      const h = toHijri(g);
      expect([h.year, h.month, h.day]).toEqual([y, m, d]);
    }
  });

  test('±1 day offset shifts the derived Hijri date by exactly one day', () => {
    const g = new Date(2024, 2, 11); // 1 Ramadan 1445 at offset 0
    expect(toHijri(g, 1).day).toBe(2);
    const minus = toHijri(g, -1);
    expect(minus.month).toBe(8); // back into Sha'ban
    expect(minus.day).toBe(daysInHijriMonth(1445, 8));
  });

  test('month lengths are 29 or 30 days', () => {
    for (let m = 1; m <= 12; m++) {
      const len = daysInHijriMonth(1447, m);
      expect(len === 29 || len === 30).toBe(true);
    }
  });

  test('monthKey exposes the i18n key', () => {
    expect(toHijri(new Date(2024, 2, 11)).monthKey).toBe('hijriMonths.9');
  });
});

describe('Ramadan detection', () => {
  test('true within Ramadan, false outside, offset-aware at the boundary', () => {
    expect(isRamadan(new Date(2024, 2, 11))).toBe(true);
    expect(isRamadan(new Date(2024, 3, 10))).toBe(false);
    // Day before Ramadan flips on with +1 offset:
    expect(isRamadan(new Date(2024, 2, 10))).toBe(false);
    expect(isRamadan(new Date(2024, 2, 10), 1)).toBe(true);
  });
});

describe('keyDatesFor', () => {
  test('Muharram has Ashura + white days', () => {
    const keys = keyDatesFor(1).map((k) => k.labelKey);
    expect(keys).toContain('hijriDates.ashura');
    expect(keys.filter((k) => k === 'hijriDates.whiteDay')).toHaveLength(3);
  });

  test('Dhul-Hijjah has the first ten days then Eid al-Adha', () => {
    const d12 = keyDatesFor(12);
    expect(d12.filter((k) => k.labelKey === 'hijriDates.dhulHijjah')).toHaveLength(9);
    expect(d12.find((k) => k.day === 10)?.labelKey).toBe('hijriDates.eidAlAdha');
  });

  test('Ramadan and Shawwal starts are marked', () => {
    expect(keyDatesFor(9).find((k) => k.day === 1)?.labelKey).toBe('hijriDates.ramadanStart');
    expect(keyDatesFor(10).find((k) => k.day === 1)?.labelKey).toBe('hijriDates.eidAlFitr');
  });
});
