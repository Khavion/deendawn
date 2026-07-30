import * as Notifications from 'expo-notifications';

import { PlannedNotification } from './scheduler';
import i18n from '../../lib/i18n';
import { KVStore } from '../../lib/kvStore';
import { formatTimeInZone } from '../prayer-times/format';

/**
 * Opt-in Android "next prayer" ongoing notification. Honest constraints
 * baked in: it lives on a SILENT, LOW-importance channel; Android 14+ lets
 * users swipe it away (sticky is a soft hint) — it re-posts at the next
 * reschedule trigger, and no foreground service is involved (a persistent
 * FGS just to pin a notification is a Play-review liability).
 */

export const STICKY_KEY = 'notifications.nextPrayerSticky.v1';
export const STICKY_CHANNEL_ID = 'nextprayer.low.v1';
export const STICKY_IDENTIFIER = 'next-prayer-sticky';

export function loadStickyEnabled(store: KVStore): boolean {
  return store.get(STICKY_KEY) === 'true';
}

export function saveStickyEnabled(store: KVStore, enabled: boolean): void {
  store.set(STICKY_KEY, enabled ? 'true' : 'false');
}

/** Pure: the first adhan strictly after `now` (suhoor reminders excluded). */
export function nextAdhan(
  plan: PlannedNotification[],
  now: Date
): PlannedNotification | null {
  return (
    plan.find((p) => p.kind === 'adhan' && p.fireDate.getTime() > now.getTime()) ?? null
  );
}

/** Post/refresh or clear the ongoing notification (Android callers only). */
export async function syncStickyNextPrayer(
  enabled: boolean,
  plan: PlannedNotification[],
  now: Date
): Promise<void> {
  if (!enabled) {
    await Notifications.dismissNotificationAsync(STICKY_IDENTIFIER);
    return;
  }
  const next = nextAdhan(plan, now);
  if (!next) {
    await Notifications.dismissNotificationAsync(STICKY_IDENTIFIER);
    return;
  }
  await Notifications.setNotificationChannelAsync(STICKY_CHANNEL_ID, {
    name: i18n.t('notifications.stickyChannelName'),
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
  });
  await Notifications.scheduleNotificationAsync({
    identifier: STICKY_IDENTIFIER,
    content: {
      title: i18n.t('notifications.stickyTitle', {
        prayer: i18n.t(`prayers.${next.prayer}`),
        time: formatTimeInZone(next.fireDate),
      }),
      body: i18n.t('notifications.stickyBody'),
      sound: undefined,
      sticky: true,
      // Status notification: a tap must not clear it (expo defaults
      // autoDismiss -> AUTO_CANCEL, verified in dumpsys).
      autoDismiss: false,
      data: { sticky: true },
    },
    // channelId-only trigger = present immediately on that channel (Android).
    trigger: { channelId: STICKY_CHANNEL_ID },
  });
}
