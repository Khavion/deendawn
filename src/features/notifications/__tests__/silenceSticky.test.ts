/**
 * @jest-environment node
 */
import { createMemoryKVStore } from '../../../lib/kvStore';
import { idsForToday, isSilenceTodayResponse } from '../silenceToday';
import { loadStickyEnabled, nextAdhan, saveStickyEnabled } from '../stickyNextPrayer';
import { PlannedNotification } from '../scheduler';

jest.mock('expo-notifications', () => ({}));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'en-US' }] }));

const planned = (
  id: string,
  fireDate: Date,
  kind: 'adhan' | 'suhoor' = 'adhan'
): PlannedNotification => ({
  id,
  prayer: 'fajr',
  fireDate,
  sound: 'default',
  kind,
});

describe('idsForToday', () => {
  const now = new Date(2026, 6, 30, 14, 0);
  test('selects only ids from the local calendar day (adhan + suhoor)', () => {
    expect(
      idsForToday(
        [
          'fajr-2026-07-30',
          'asr-2026-07-30',
          'suhoor-2026-07-30',
          'fajr-2026-07-31',
          'isha-2026-08-30',
          'not-a-planned-id',
        ],
        now
      )
    ).toEqual(['fajr-2026-07-30', 'asr-2026-07-30', 'suhoor-2026-07-30']);
  });
});

describe('isSilenceTodayResponse', () => {
  test('matches only the silence-today action', () => {
    expect(isSilenceTodayResponse({ actionIdentifier: 'silence-today' })).toBe(true);
    expect(isSilenceTodayResponse({ actionIdentifier: 'expo.modules.notifications.actions.DEFAULT' })).toBe(false);
    expect(isSilenceTodayResponse({ actionIdentifier: null })).toBe(false);
  });
});

describe('nextAdhan', () => {
  const now = new Date(2026, 6, 30, 12, 0);
  test('first future adhan wins; suhoor entries are skipped', () => {
    const plan = [
      planned('fajr-2026-07-30', new Date(2026, 6, 30, 5, 27)),
      planned('suhoor-2026-07-31', new Date(2026, 6, 30, 13, 0), 'suhoor'),
      planned('dhuhr-2026-07-30', new Date(2026, 6, 30, 13, 29)),
      planned('asr-2026-07-30', new Date(2026, 6, 30, 17, 4)),
    ];
    expect(nextAdhan(plan, now)?.id).toBe('dhuhr-2026-07-30');
  });
  test('empty/past-only plans give null', () => {
    expect(nextAdhan([], now)).toBeNull();
    expect(nextAdhan([planned('fajr-2026-07-30', new Date(2026, 6, 30, 5, 27))], now)).toBeNull();
  });
});

describe('sticky preference', () => {
  test('defaults off; round-trips', () => {
    const store = createMemoryKVStore();
    expect(loadStickyEnabled(store)).toBe(false);
    saveStickyEnabled(store, true);
    expect(loadStickyEnabled(store)).toBe(true);
    saveStickyEnabled(store, false);
    expect(loadStickyEnabled(store)).toBe(false);
  });
});
