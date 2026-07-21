export const TOTAL_AYAHS = 6236;

/**
 * The verse-of-the-day ordinal (0-based) for a given local calendar day.
 *
 * Deterministic and curation-free: it is purely a function of the date — the
 * same day yields the same verse for everyone, and it advances by one each day,
 * cycling through all 6236 ayat. No verse is chosen or weighted by hand (that
 * would be editorializing scripture, forbidden by Rule 1); the date alone picks
 * it. The ~17-year cycle length means no repeat within any realistic use.
 */
export function verseOfDayOrdinal(date: Date, total = TOTAL_AYAHS): number {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
  return ((dayNumber % total) + total) % total;
}
