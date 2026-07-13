/**
 * @jest-environment node
 */
import { computeDayTimes, isValidTime, nextPrayer } from '../engine';
import { defaultMethodForLocale, METHOD_LABELS } from '../methods';
import { METHOD_KEYS, PrayerSettings } from '../types';

const HOUSTON = { latitude: 29.7604, longitude: -95.3698 };
const ANCHORAGE = { latitude: 61.2181, longitude: -149.9003 };
const BASE: PrayerSettings = { method: 'NorthAmerica', madhab: 'shafi', highLatRule: 'auto' };
const DAY = new Date(2026, 6, 12, 12);

describe('defaultMethodForLocale', () => {
  test.each([
    ['en-US', 'NorthAmerica'],
    ['es-US', 'NorthAmerica'],
    ['en-GB', 'MuslimWorldLeague'],
    ['ur-PK', 'MuslimWorldLeague'],
    ['ar-SA', 'MuslimWorldLeague'],
    ['fr', 'MuslimWorldLeague'],
    ['', 'MuslimWorldLeague'],
    [null, 'MuslimWorldLeague'],
  ])('%s -> %s', (locale, expected) => {
    expect(defaultMethodForLocale(locale)).toBe(expected);
  });
});

describe('method registry', () => {
  test('every method key is selectable and computes a full valid day at mid latitude', () => {
    for (const method of METHOD_KEYS) {
      expect(METHOD_LABELS[method]).toBeTruthy();
      const times = computeDayTimes(HOUSTON, DAY, { ...BASE, method });
      for (const t of Object.values(times)) expect(isValidTime(t)).toBe(true);
    }
  });
});

describe('madhab toggle', () => {
  test('hanafi asr is later than shafi asr; other prayers unchanged', () => {
    const shafi = computeDayTimes(HOUSTON, DAY, { ...BASE, madhab: 'shafi' });
    const hanafi = computeDayTimes(HOUSTON, DAY, { ...BASE, madhab: 'hanafi' });
    expect(hanafi.asr.getTime()).toBeGreaterThan(shafi.asr.getTime());
    for (const p of ['fajr', 'sunrise', 'dhuhr', 'maghrib', 'isha'] as const) {
      expect(hanafi[p].getTime()).toBe(shafi[p].getTime());
    }
  });
});

describe('high latitude handling', () => {
  test('rules produce different fajr in Anchorage midsummer; auto matches a concrete rule', () => {
    const at = (rule: PrayerSettings['highLatRule']) =>
      computeDayTimes(ANCHORAGE, new Date(2026, 5, 21, 12), {
        ...BASE,
        method: 'MuslimWorldLeague',
        highLatRule: rule,
      });
    const middle = at('middleofthenight');
    const seventh = at('seventhofthenight');
    const auto = at('auto');
    expect(isValidTime(middle.fajr)).toBe(true);
    expect(isValidTime(seventh.fajr)).toBe(true);
    expect(middle.fajr.getTime()).not.toBe(seventh.fajr.getTime());
    expect([
      middle.fajr.getTime(),
      seventh.fajr.getTime(),
      at('twilightangle').fajr.getTime(),
    ]).toContain(auto.fajr.getTime());
  });
});

describe('nextPrayer', () => {
  const times = computeDayTimes(HOUSTON, DAY, BASE);

  test('before fajr -> fajr today', () => {
    const now = new Date(times.fajr.getTime() - 60_000);
    expect(nextPrayer(HOUSTON, now, BASE)).toMatchObject({ prayer: 'fajr', isTomorrow: false });
  });

  test('sunrise is never an adhan target: between sunrise and dhuhr -> dhuhr', () => {
    const now = new Date(times.sunrise.getTime() + 60_000);
    const next = nextPrayer(HOUSTON, now, BASE);
    expect(next).toMatchObject({ prayer: 'dhuhr', isTomorrow: false });
    expect(next!.time.getTime()).toBe(times.dhuhr.getTime());
  });

  test('after isha -> tomorrow fajr, strictly later than today isha', () => {
    const now = new Date(times.isha.getTime() + 60_000);
    const next = nextPrayer(HOUSTON, now, BASE);
    expect(next).toMatchObject({ prayer: 'fajr', isTomorrow: true });
    expect(next!.time.getTime()).toBeGreaterThan(times.isha.getTime());
  });

  test('exactly at a prayer time -> that prayer is not "next"', () => {
    const next = nextPrayer(HOUSTON, times.dhuhr, BASE);
    expect(next).toMatchObject({ prayer: 'asr' });
  });
});
