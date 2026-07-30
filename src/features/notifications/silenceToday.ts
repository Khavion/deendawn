import * as Notifications from 'expo-notifications';

import { log } from '../../lib/log';

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

export async function silenceToday(now: Date = new Date()): Promise<number> {
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
