/**
 * @jest-environment node
 */
import { createMemoryKVStore } from '../../../lib/kvStore';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  parseSettings,
  resolveLocation,
  resolvePrayerConfig,
  saveSettings,
} from '../settingsStore';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US' }],
}));

describe('parseSettings', () => {
  test('null, garbage, and non-object input all yield defaults', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not json{{')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  test('valid persisted settings round-trip', () => {
    const store = createMemoryKVStore();
    saveSettings(store, {
      location: { type: 'manual', cityId: 'houston-us' },
      method: 'Karachi',
      madhab: 'hanafi',
      highLatRule: 'middleofthenight',
    });
    expect(loadSettings(store)).toEqual({
      location: { type: 'manual', cityId: 'houston-us' },
      method: 'Karachi',
      madhab: 'hanafi',
      highLatRule: 'middleofthenight',
    });
  });

  test('unknown city, bogus method, and bad enum values are reset field-by-field', () => {
    const parsed = parseSettings(
      JSON.stringify({
        location: { type: 'manual', cityId: 'atlantis-xx' },
        method: 'MadeUpMethod',
        madhab: 'other',
        highLatRule: 'nope',
        extraField: true,
      })
    );
    expect(parsed).toEqual(DEFAULT_SETTINGS);
  });
});

describe('resolveLocation', () => {
  test('null when unset, coordinates + label for a known city', () => {
    expect(resolveLocation(DEFAULT_SETTINGS)).toBeNull();
    const loc = resolveLocation({
      ...DEFAULT_SETTINGS,
      location: { type: 'manual', cityId: 'london-gb' },
    });
    expect(loc?.label).toBe('London');
    expect(loc?.latitude).toBeCloseTo(51.51, 2);
  });
});

describe('resolvePrayerConfig', () => {
  test('auto method follows locale (US -> ISNA, PK -> MWL)', () => {
    expect(resolvePrayerConfig(DEFAULT_SETTINGS, 'en-US').method).toBe('NorthAmerica');
    expect(resolvePrayerConfig(DEFAULT_SETTINGS, 'ur-PK').method).toBe('MuslimWorldLeague');
  });

  test('explicit method wins over locale; other fields pass through', () => {
    const cfg = resolvePrayerConfig(
      { ...DEFAULT_SETTINGS, method: 'UmmAlQura', madhab: 'hanafi', highLatRule: 'twilightangle' },
      'en-US'
    );
    expect(cfg).toEqual({ method: 'UmmAlQura', madhab: 'hanafi', highLatRule: 'twilightangle' });
  });

  test('falls back to device locale from expo-localization when no tag given', () => {
    expect(resolvePrayerConfig(DEFAULT_SETTINGS).method).toBe('NorthAmerica');
  });
});
