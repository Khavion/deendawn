/**
 * @jest-environment node
 */
import {
  loadNotificationPrefs,
  parseNotificationPrefs,
  saveNotificationPrefs,
  setPrayerEnabled,
  setPrayerSound,
} from '../prefsStore';
import { DEFAULT_NOTIFICATION_PREFS } from '../scheduler';
import { createMemoryKVStore } from '../../../lib/kvStore';

describe('notification prefs persistence', () => {
  test('defaults on missing/garbage data', () => {
    expect(parseNotificationPrefs(null)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(parseNotificationPrefs('][')).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  test('round-trips through the store', () => {
    const store = createMemoryKVStore();
    const prefs = setPrayerEnabled(DEFAULT_NOTIFICATION_PREFS, 'fajr', false);
    saveNotificationPrefs(store, prefs);
    expect(loadNotificationPrefs(store)).toEqual(prefs);
    expect(loadNotificationPrefs(store).enabled.fajr).toBe(false);
    expect(loadNotificationPrefs(store).enabled.dhuhr).toBe(true);
  });

  test('bad per-field values fall back individually', () => {
    const parsed = parseNotificationPrefs(
      JSON.stringify({
        enabled: { fajr: 'yes', dhuhr: false },
        sound: { asr: 'airhorn', maghrib: 'silent' },
      })
    );
    expect(parsed.enabled.fajr).toBe(true); // bad value -> default
    expect(parsed.enabled.dhuhr).toBe(false);
    expect(parsed.sound.asr).toBe('default'); // unknown sound -> default
    expect(parsed.sound.maghrib).toBe('silent');
  });

  test('new sound keys parse and persist; setPrayerSound is immutable', () => {
    const store = createMemoryKVStore();
    let prefs = setPrayerSound(DEFAULT_NOTIFICATION_PREFS, 'fajr', 'fullAdhan');
    prefs = setPrayerSound(prefs, 'dhuhr', 'clip');
    saveNotificationPrefs(store, prefs);
    const loaded = loadNotificationPrefs(store);
    expect(loaded.sound.fajr).toBe('fullAdhan');
    expect(loaded.sound.dhuhr).toBe('clip');
    expect(loaded.sound.asr).toBe('default');
    expect(DEFAULT_NOTIFICATION_PREFS.sound.fajr).toBe('default');
  });

  test('setPrayerEnabled does not mutate its input', () => {
    const next = setPrayerEnabled(DEFAULT_NOTIFICATION_PREFS, 'isha', false);
    expect(DEFAULT_NOTIFICATION_PREFS.enabled.isha).toBe(true);
    expect(next.enabled.isha).toBe(false);
  });
});
