import * as Notifications from 'expo-notifications';

import { log } from '../../lib/log';
import { getUserKVStore, KVStore } from '../../lib/kvStore';

/**
 * "Silence today" — the Android notification action. Cancels every adhan /
 * suhoor reminder still pending for TODAY (local calendar day) and leaves
 * the rest of the rolling week untouched; tomorrow resumes normally. Runs
 * from the warm response listener AND the killed-state background task.
 */

const PLANNED_ID = /^(fajr|dhuhr|asr|maghrib|isha|suhoor)-(\d{4})-(\d{2})-(\d{2})$/;

export const SILENCE_TODAY_ACTION = 'silence-today';
export const ADHAN_CATEGORY = 'adhan';

/** Pure: which planned ids belong to `now`'s local calendar day. */
export function idsForToday(ids: string[], now: Date): string[] {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return ids.filter((id) => {
    const match = PLANNED_ID.exec(id);
    if (!match) return false;
    return Number(match[2]) === y && Number(match[3]) === m && Number(match[4]) === d;
  });
}

/**
 * Persisted silence marker (review 2026-07-31, notifications finding 1).
 * Cancelling the OS queue alone is not enough: ANY later `rescheduleAll`
 * (app foreground, notification-received, Android AppState-active, or the
 * 12h background task — i.e. without the user ever opening the app) replans
 * today and re-arms exactly the adhans the user just silenced. The date is
 * therefore written down and honoured by the planner until the day rolls
 * over.
 */
export const SILENCED_DATE_KEY = 'notifications.silencedDate.v1';

/** Local calendar day key, matching the planned-id date format. */
export function silenceDateKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function recordSilencedDate(store: KVStore, now: Date): void {
  store.set(SILENCED_DATE_KEY, silenceDateKey(now));
}

/**
 * The silenced day, or null. Self-clearing: a stored date that is not
 * `now`'s local day is deleted, so the marker can never outlive its day
 * (including across a timezone move, where the key simply stops matching).
 */
export function loadSilencedDate(store: KVStore, now: Date = new Date()): string | null {
  const stored = store.get(SILENCED_DATE_KEY);
  if (!stored) return null;
  if (stored !== silenceDateKey(now)) {
    store.delete(SILENCED_DATE_KEY);
    return null;
  }
  return stored;
}

export async function silenceToday(
  now: Date = new Date(),
  store: KVStore = getUserKVStore()
): Promise<number> {
  recordSilencedDate(store, now);
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const byPlannedId = new Map(
    pending.map((n) => [(n.content.data?.plannedId as string) ?? n.identifier, n.identifier])
  );
  const cancel = idsForToday([...byPlannedId.keys()], now);
  for (const id of cancel) {
    const identifier = byPlannedId.get(id);
    if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier);
  }
  log.info('notifications', 'silenced today', { cancelled: cancel.length });
  return cancel.length;
}

/** True when a notification response is the silence-today action press. */
export function isSilenceTodayResponse(response: {
  actionIdentifier?: string | null;
}): boolean {
  return response.actionIdentifier === SILENCE_TODAY_ACTION;
}
