/**
 * @jest-environment node
 *
 * Fixture matrix: the engine wrapper must reproduce the committed adhan
 * reference outputs to the minute, and local formatting must be DST-correct
 * in each city's zone (CLAUDE.md acceptance criterion 1).
 */
import { computeDayTimes, isValidTime } from '../engine';
import { formatHHmm } from '../format';
import { PRAYER_NAMES, PrayerSettings } from '../types';
import citiesJson from '../fixtures/cities.json';
import fixturesJson from '../fixtures/prayer-fixtures.json';

interface Fixture {
  city: string;
  date: string;
  method: string;
  madhab: string;
  highLatRule: string;
  times: Record<string, string | null>;
  local: Record<string, string | null>;
}

const cities = Object.fromEntries(citiesJson.cities.map((c) => [c.id, c]));
const fixtures = fixturesJson.fixtures as Fixture[];

test('fixture matrix is present and covers the constitution dimensions', () => {
  expect(fixtures.length).toBeGreaterThanOrEqual(1500);
  const dim = (f: (x: Fixture) => string) => new Set(fixtures.map(f)).size;
  expect(dim((f) => f.city)).toBe(8);
  expect(dim((f) => f.date)).toBe(8);
  expect(dim((f) => f.method)).toBe(12);
  expect(dim((f) => f.madhab)).toBe(2);
  expect(dim((f) => f.highLatRule)).toBe(4);
});

test('engine matches every reference fixture to the minute (instants + zone-local HH:mm)', () => {
  const mismatches: string[] = [];
  for (const f of fixtures) {
    const city = cities[f.city];
    const [y, m, d] = f.date.split('-').map(Number);
    const settings = {
      method: f.method,
      madhab: f.madhab,
      highLatRule: f.highLatRule,
    } as PrayerSettings;
    const times = computeDayTimes(
      { latitude: city.latitude, longitude: city.longitude },
      new Date(y, m - 1, d, 12),
      settings
    );
    for (const p of PRAYER_NAMES) {
      const actual = times[p];
      const expected = f.times[p];
      const label = `${f.city} ${f.date} ${f.method}/${f.madhab}/${f.highLatRule} ${p}`;
      if (expected === null) {
        if (isValidTime(actual))
          mismatches.push(`${label}: expected uncomputable, got ${actual.toISOString()}`);
        continue;
      }
      if (!isValidTime(actual)) {
        mismatches.push(`${label}: expected ${expected}, got Invalid Date`);
        continue;
      }
      const truncate = (iso: string) => iso.slice(0, 16); // to the minute
      if (truncate(actual.toISOString()) !== truncate(expected))
        mismatches.push(`${label}: expected ${expected}, got ${actual.toISOString()}`);
      const local = formatHHmm(actual, city.timeZone);
      if (local !== f.local[p])
        mismatches.push(`${label}: local expected ${f.local[p]}, got ${local} (${city.timeZone})`);
    }
  }
  expect(mismatches).toEqual([]);
});

test('DST transition days format without hour anomalies (spring-forward day has no 02:xx wallclock)', () => {
  // On 2026-03-08 America/Chicago the 02:00 hour does not exist.
  const houston = cities['houston'];
  const times = computeDayTimes(
    { latitude: houston.latitude, longitude: houston.longitude },
    new Date(2026, 2, 8, 12),
    { method: 'NorthAmerica', madhab: 'shafi', highLatRule: 'auto' }
  );
  for (const p of PRAYER_NAMES) {
    expect(formatHHmm(times[p], houston.timeZone).startsWith('02:')).toBe(false);
  }
});
