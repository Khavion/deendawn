import {
  ADHAN_PRAYERS,
  AdhanPrayer,
  DEFAULT_NOTIFICATION_PREFS,
  NotificationPrefs,
  SoundKey,
} from './scheduler';
import { KVStore } from '../../lib/kvStore';

const KEY = 'notificationPrefs.v1';
const SOUND_KEYS: SoundKey[] = ['default', 'silent', 'clip', 'fullAdhan'];

/** Defensive parse — malformed fields fall back per-prayer, not wholesale. */
export function parseNotificationPrefs(raw: string | null): NotificationPrefs {
  if (!raw) return DEFAULT_NOTIFICATION_PREFS;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
  if (typeof obj !== 'object' || obj === null) return DEFAULT_NOTIFICATION_PREFS;
  const o = obj as { enabled?: Record<string, unknown>; sound?: Record<string, unknown> };
  const prefs: NotificationPrefs = {
    enabled: { ...DEFAULT_NOTIFICATION_PREFS.enabled },
    sound: { ...DEFAULT_NOTIFICATION_PREFS.sound },
  };
  for (const p of ADHAN_PRAYERS) {
    const e = o.enabled?.[p];
    if (typeof e === 'boolean') prefs.enabled[p] = e;
    const s = o.sound?.[p];
    if (typeof s === 'string' && (SOUND_KEYS as string[]).includes(s)) {
      prefs.sound[p] = s as SoundKey;
    }
  }
  return prefs;
}

export function loadNotificationPrefs(store: KVStore): NotificationPrefs {
  return parseNotificationPrefs(store.get(KEY));
}

export function saveNotificationPrefs(store: KVStore, prefs: NotificationPrefs): void {
  store.set(KEY, JSON.stringify(prefs));
}

export function setPrayerSound(
  prefs: NotificationPrefs,
  prayer: AdhanPrayer,
  sound: SoundKey
): NotificationPrefs {
  return { ...prefs, sound: { ...prefs.sound, [prayer]: sound } };
}

export function setPrayerEnabled(
  prefs: NotificationPrefs,
  prayer: AdhanPrayer,
  enabled: boolean
): NotificationPrefs {
  return { ...prefs, enabled: { ...prefs.enabled, [prayer]: enabled } };
}
