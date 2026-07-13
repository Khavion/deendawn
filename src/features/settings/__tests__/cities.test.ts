/**
 * @jest-environment node
 */
import { computeDayTimes, isValidTime } from '../../prayer-times/engine';
import { CITIES } from '../cities';
import { foldForSearch, searchCities } from '../citySearch';
import fixtureCities from '../../prayer-times/fixtures/cities.json';

describe('bundled city dataset', () => {
  test('ids unique, coordinates in range, names/countries non-empty', () => {
    const ids = new Set(CITIES.map((c) => c.id));
    expect(ids.size).toBe(CITIES.length);
    for (const c of CITIES) {
      expect(Math.abs(c.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(c.longitude)).toBeLessThanOrEqual(180);
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.country.length).toBeGreaterThan(0);
    }
  });

  test('agrees with the verified fixture-city coordinates (within ~0.02 deg)', () => {
    const pairs: [string, string][] = [
      ['houston-us', 'houston'],
      ['nyc-us', 'nyc'],
      ['london-gb', 'london'],
      ['toronto-ca', 'toronto'],
      ['karachi-pk', 'karachi'],
      ['jeddah-sa', 'jeddah'],
      ['anchorage-us', 'anchorage'],
      ['stockholm-se', 'stockholm'],
    ];
    for (const [cityId, fixtureId] of pairs) {
      const city = CITIES.find((c) => c.id === cityId)!;
      const ref = fixtureCities.cities.find((c) => c.id === fixtureId)!;
      expect(Math.abs(city.latitude - ref.latitude)).toBeLessThan(0.02);
      expect(Math.abs(city.longitude - ref.longitude)).toBeLessThan(0.02);
    }
  });

  test('every bundled city computes a valid prayer day offline (equinox, MWL/auto)', () => {
    for (const c of CITIES) {
      const times = computeDayTimes(
        { latitude: c.latitude, longitude: c.longitude },
        new Date(2026, 2, 20, 12),
        {
          method: 'MuslimWorldLeague',
          madhab: 'shafi',
          highLatRule: 'auto',
        }
      );
      for (const t of Object.values(times)) expect(isValidTime(t)).toBe(true);
    }
  });

  test('Makkah entry matches the Kaaba coordinates used by the qibla spec to city precision', () => {
    const makkah = CITIES.find((c) => c.id === 'makkah-sa')!;
    expect(Math.abs(makkah.latitude - 21.4225)).toBeLessThan(0.05);
    expect(Math.abs(makkah.longitude - 39.8262)).toBeLessThan(0.05);
  });
});

describe('searchCities', () => {
  test('empty query returns nothing', () => {
    expect(searchCities('')).toEqual([]);
    expect(searchCities('   ')).toEqual([]);
  });

  test('prefix matches rank before substring matches, alphabetical within rank', () => {
    const names = searchCities('man').map((c) => c.name);
    expect(names.slice(0, 3)).toEqual(['Manama', 'Manchester', 'Manila']);
    // 'Amman' only contains "man" mid-word, so it must come after all prefix matches.
    expect(names.indexOf('Amman')).toBeGreaterThan(2);
  });

  test('diacritic folding: "malmo" finds Malmö, "sao paulo" finds São Paulo', () => {
    expect(searchCities('malmo')[0]?.name).toBe('Malmö');
    expect(searchCities('sao paulo')[0]?.name).toBe('São Paulo');
  });

  test('word-prefix beats mid-word substring, country search works', () => {
    expect(searchCities('york')[0]?.name).toBe('New York');
    const pk = searchCities('pakistan');
    expect(pk.length).toBeGreaterThanOrEqual(5);
    expect(pk.every((c) => c.country === 'Pakistan')).toBe(true);
  });

  test('case-insensitive and limit respected', () => {
    expect(searchCities('LONDON')[0]?.name).toBe('London');
    expect(searchCities('a', 5)).toHaveLength(5);
  });

  test('foldForSearch strips combining marks and case', () => {
    expect(foldForSearch('  MALMÖ ')).toBe('malmo');
    expect(foldForSearch('São')).toBe('sao');
  });
});
