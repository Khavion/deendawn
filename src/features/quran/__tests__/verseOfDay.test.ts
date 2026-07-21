import { TOTAL_AYAHS, verseOfDayOrdinal } from '../verseOfDay';

describe('verseOfDayOrdinal', () => {
  test('is always a valid 0-based ordinal', () => {
    for (let d = 0; d < 400; d++) {
      const date = new Date(2026, 0, 1 + d);
      const ord = verseOfDayOrdinal(date);
      expect(ord).toBeGreaterThanOrEqual(0);
      expect(ord).toBeLessThan(TOTAL_AYAHS);
    }
  });

  test('is deterministic — same calendar day, same verse regardless of time', () => {
    const morning = new Date(2026, 6, 21, 6, 0, 0);
    const night = new Date(2026, 6, 21, 23, 59, 59);
    expect(verseOfDayOrdinal(morning)).toBe(verseOfDayOrdinal(night));
  });

  test('advances by exactly one each day and wraps modulo the total', () => {
    const day = new Date(2026, 6, 21);
    const next = new Date(2026, 6, 22);
    const expectedNext = (verseOfDayOrdinal(day) + 1) % TOTAL_AYAHS;
    expect(verseOfDayOrdinal(next)).toBe(expectedNext);
  });

  test('different days generally give different verses (no accidental constant)', () => {
    const a = verseOfDayOrdinal(new Date(2026, 0, 1));
    const b = verseOfDayOrdinal(new Date(2026, 5, 15));
    expect(a).not.toBe(b);
  });
});
