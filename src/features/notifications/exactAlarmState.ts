import { KVStore } from '../../lib/kvStore';

/**
 * Pure exact-alarm state machine. The correctness core (DECISIONS
 * 2026-07-30): the grant state is persisted, and ANY observed transition
 * forces full re-registration of the pending queue —
 * - revoke: Android stops the app and cancels its alarms, but
 *   expo-notifications' own store still lists them; an ordinary diff would
 *   "keep" ghosts that never fire.
 * - grant: exactness is decided at registration time
 *   (setExactAndAllowWhileIdle vs setAndAllowWhileIdle), so only
 *   re-registration upgrades already-pending alarms to exact.
 */
export interface ExactAlarmStatus {
  /** Android 12+ only; everywhere else the concept doesn't exist. */
  applicable: boolean;
  /** Treated as granted when not applicable (exactness is the default). */
  granted: boolean;
}

export function evaluateExactAlarm(
  platform: string,
  apiLevel: number | null,
  nativeGranted: boolean | null
): ExactAlarmStatus {
  if (platform !== 'android') return { applicable: false, granted: true };
  if (apiLevel !== null && apiLevel < 31) return { applicable: false, granted: true };
  return { applicable: true, granted: nativeGranted === true };
}

const KEY = 'notifications.exactAlarmGranted.v1';

export function loadStoredGrant(store: KVStore): boolean | null {
  const raw = store.get(KEY);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}

export function recordGrant(store: KVStore, granted: boolean): void {
  store.set(KEY, granted ? 'true' : 'false');
}

/** First observation (nothing stored) is NOT a transition. */
export function grantTransition(stored: boolean | null, current: boolean): boolean {
  return stored !== null && stored !== current;
}
