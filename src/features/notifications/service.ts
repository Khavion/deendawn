import * as Notifications from 'expo-notifications';

import i18n from '../../lib/i18n';

import { loadNotificationPrefs } from './prefsStore';
import { AdhanPrayer, diffPlans, planNotifications, PlannedNotification } from './scheduler';
import { log } from '../../lib/log';
import { getUserKVStore, KVStore } from '../../lib/kvStore';
import { loadSettings, resolveLocation, resolvePrayerConfig } from '../settings/settingsStore';

/** Foreground presentation: show banner + play sound like a normal alert. */
export function installForegroundHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensurePermission(request: boolean): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!request || !current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return asked.granted;
}

function toContent(p: PlannedNotification): Notifications.NotificationContentInput {
  const prayerName = i18n.t(`prayers.${p.prayer}`);
  if (p.kind === 'suhoor') {
    return {
      title: i18n.t('notifications.suhoorTitle'),
      body: i18n.t('notifications.suhoorBody'),
      sound: true,
      interruptionLevel: 'timeSensitive',
      data: { prayer: p.prayer, plannedId: p.id, fullAdhan: false },
    };
  }
  // 'fullAdhan' plays the bundled clip at fire time; the app plays the full
  // recording only when opened from the notification (iOS limitation — the
  // picker says exactly that).
  const sound =
    p.sound === 'silent'
      ? undefined
      : p.sound === 'clip' || p.sound === 'fullAdhan'
        ? 'adhan-clip-placeholder.wav'
        : true;
  return {
    title: prayerName,
    body: i18n.t('notifications.body', { prayer: prayerName }),
    sound,
    interruptionLevel: 'timeSensitive',
    data: { prayer: p.prayer, plannedId: p.id, fullAdhan: p.sound === 'fullAdhan' },
  };
}

/**
 * Recompute the rolling plan and sync the OS pending queue to it. Safe to
 * call often (foreground, settings change, after a fire): unchanged entries
 * are left in place, so the common case is a no-op.
 */
export async function rescheduleAll(
  now: Date = new Date(),
  store: KVStore = getUserKVStore()
): Promise<void> {
  try {
    const settings = loadSettings(store);
    const location = resolveLocation(settings);
    if (!location) return; // nothing to schedule until a location is chosen

    const granted = await ensurePermission(false);
    if (!granted) return;

    const prefs = loadNotificationPrefs(store);
    const plan = planNotifications({
      coords: location,
      settings: resolvePrayerConfig(settings),
      prefs,
      now,
      suhoorReminderMinutes: settings.suhoorReminderMinutes,
      hijriOffset: settings.hijriOffset,
    });

    const pending = await Notifications.getAllScheduledNotificationsAsync();
    const pendingPlanned = pending
      .map((n) => {
        const trigger = n.trigger as { type?: string; value?: number } | null;
        const fireMs = trigger && trigger.type === 'date' ? trigger.value : undefined;
        return {
          id: (n.content.data?.plannedId as string) ?? n.identifier,
          identifier: n.identifier,
          fireDate: fireMs ? new Date(fireMs) : new Date(0),
        };
      })
      .filter((n) => n.id.match(/^(fajr|dhuhr|asr|maghrib|isha|suhoor)-\d{4}-\d{2}-\d{2}$/));

    const actions = diffPlans(pendingPlanned, plan);

    const identifierByPlannedId = new Map(pendingPlanned.map((p) => [p.id, p.identifier]));
    for (const id of actions.cancelIds) {
      const identifier = identifierByPlannedId.get(id);
      if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier);
    }
    for (const p of actions.schedule) {
      await Notifications.scheduleNotificationAsync({
        identifier: p.id,
        content: toContent(p),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: p.fireDate,
        },
      });
    }
    log.info('notifications', 'rescheduled', {
      kept: actions.keepIds.length,
      cancelled: actions.cancelIds.length,
      scheduled: actions.schedule.length,
    });
  } catch (e) {
    log.error('notifications', 'reschedule failed', { message: String(e) });
  }
}

/** Turn everything off and clear the OS queue (user disabled all prayers). */
export async function cancelAllAdhans(): Promise<void> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of pending) {
    const id = (n.content.data?.plannedId as string) ?? n.identifier;
    if (id.match(/^(fajr|dhuhr|asr|maghrib|isha|suhoor)-\d{4}-\d{2}-\d{2}$/)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
