import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import i18n from '../../lib/i18n';

import { deriveChannelId } from './channels';
import { ensureChannels, deleteStaleChannels } from './channelSync';
import { canScheduleExactAlarms } from './exactAlarm';
import { grantTransition, loadStoredGrant, recordGrant } from './exactAlarmState';
import { loadNotificationPrefs } from './prefsStore';
import {
  contextChanged,
  currentScheduleContext,
  loadScheduleContext,
  saveScheduleContext,
} from './scheduleContext';
import { ensureAdhanCategory } from './notificationTasks';
import { diffPlans, planNotifications, PlannedNotification } from './scheduler';
import { ADHAN_CATEGORY } from './silenceToday';
import { loadStickyEnabled, syncStickyNextPrayer } from './stickyNextPrayer';
import { log } from '../../lib/log';
import { getUserKVStore, KVStore } from '../../lib/kvStore';
import { loadSettings, resolveLocation, resolvePrayerConfig } from '../settings/settingsStore';
import { refreshPrayerWidget } from '../widget/refreshWidget';

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

/**
 * The ios options object is ignored on Android; requestPermissionsAsync
 * still raises the Android 13+ POST_NOTIFICATIONS runtime dialog there (the
 * permission itself ships in expo-notifications' module manifest).
 */
export async function ensurePermission(request: boolean): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!request || !current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return asked.granted;
}

function toContent(
  p: PlannedNotification,
  channelId: string | undefined
): Notifications.NotificationContentInput {
  const prayerName = i18n.t(`prayers.${p.prayer}`);
  if (p.kind === 'suhoor') {
    return {
      title: i18n.t('notifications.suhoorTitle'),
      body: i18n.t('notifications.suhoorBody'),
      sound: true,
      interruptionLevel: 'timeSensitive',
      data: {
        prayer: p.prayer,
        plannedId: p.id,
        fullAdhan: false,
        soundKey: p.sound,
        ...(channelId ? { channelId } : {}),
      },
    };
  }
  // 'fullAdhan' plays the bundled clip at fire time; the app plays the full
  // recording only when opened from the notification (the picker says exactly
  // that, per platform).
  // The per-notification `sound` field is iOS-only in effect: Android 8+
  // takes sound from the CHANNEL (channelId below); harmless to keep here.
  const sound =
    p.sound === 'silent'
      ? undefined
      : p.sound === 'clip' || p.sound === 'fullAdhan'
        ? 'adhan_clip_placeholder.wav'
        : true;
  return {
    title: prayerName,
    body: i18n.t('notifications.body', { prayer: prayerName }),
    sound,
    // iOS-only field; Android urgency lives on the channel (IMPORTANCE_HIGH).
    interruptionLevel: 'timeSensitive',
    // Android-only (channelId is the android marker): the "Silence today"
    // action button. iOS has no registered category — field omitted there.
    ...(channelId ? { categoryIdentifier: ADHAN_CATEGORY } : {}),
    data: {
      prayer: p.prayer,
      plannedId: p.id,
      fullAdhan: p.sound === 'fullAdhan',
      // soundKey round-trips so diffPlans can see sound changes on pending
      // entries (they were previously invisible — a sound change never
      // updated the ~8 already-scheduled days).
      soundKey: p.sound,
      ...(channelId ? { channelId } : {}),
    },
  };
}

/**
 * Recompute the rolling plan and sync the OS pending queue to it. Safe to
 * call often (foreground, settings change, after a fire): unchanged entries
 * are left in place, so the common case is a no-op.
 *
 * `platform` is a test seam; production callers use the device default.
 */
export async function rescheduleAll(
  now: Date = new Date(),
  store: KVStore = getUserKVStore(),
  platform: string = Platform.OS
): Promise<void> {
  try {
    const settings = loadSettings(store);
    const location = resolveLocation(settings);
    if (!location) return; // nothing to schedule until a location is chosen

    const granted = await ensurePermission(false);
    if (!granted) return;

    // Two force-full-re-registration triggers (see DECISIONS 2026-07-30):
    // 1. Timezone change — the pending ids' local days no longer line up.
    // 2. Exact-alarm grant flip — on revoke Android cancelled our alarms but
    //    expo's store still lists them (a plain diff would keep ghosts); on
    //    grant, only re-registration upgrades pending alarms to exact.
    const context = currentScheduleContext();
    const android = platform === 'android';
    const exactGranted = android ? canScheduleExactAlarms() : true;
    const force =
      contextChanged(loadScheduleContext(store), context) ||
      (android && grantTransition(loadStoredGrant(store), exactGranted));

    const prefs = loadNotificationPrefs(store);
    const suhoorEnabled = !!settings.suhoorReminderMinutes;
    const plan = planNotifications({
      coords: location,
      settings: resolvePrayerConfig(settings),
      prefs,
      now,
      suhoorReminderMinutes: settings.suhoorReminderMinutes,
      hijriOffset: settings.hijriOffset,
    });

    // Channels first — scheduling below points notifications at them, and
    // stale-channel deletion must come AFTER the queue sync (a deleted
    // channel silently drops any notification still pointed at it).
    const desiredChannelIds = android ? await ensureChannels(prefs, suhoorEnabled) : [];
    if (android) await ensureAdhanCategory();

    const planForDiff = plan.map((p) => ({
      ...p,
      ...(android ? { channelId: deriveChannelId(p.kind, p.prayer, p.sound) } : {}),
    }));

    const pending = await Notifications.getAllScheduledNotificationsAsync();
    const pendingPlanned = pending
      .map((n) => {
        const trigger = n.trigger as { type?: string; value?: number } | null;
        const fireMs = trigger && trigger.type === 'date' ? trigger.value : undefined;
        return {
          id: (n.content.data?.plannedId as string) ?? n.identifier,
          identifier: n.identifier,
          fireDate: fireMs ? new Date(fireMs) : new Date(0),
          sound: n.content.data?.soundKey as string | undefined,
          channelId: n.content.data?.channelId as string | undefined,
        };
      })
      .filter((n) => n.id.match(/^(fajr|dhuhr|asr|maghrib|isha|suhoor)-\d{4}-\d{2}-\d{2}$/));

    const actions = force
      ? {
          cancelIds: pendingPlanned.map((p) => p.id),
          schedule: planForDiff,
          keepIds: [] as string[],
        }
      : diffPlans(pendingPlanned, planForDiff);

    const identifierByPlannedId = new Map(pendingPlanned.map((p) => [p.id, p.identifier]));
    for (const id of actions.cancelIds) {
      const identifier = identifierByPlannedId.get(id);
      if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier);
    }
    for (const p of actions.schedule) {
      const channelId = (p as { channelId?: string }).channelId;
      await Notifications.scheduleNotificationAsync({
        identifier: p.id,
        content: toContent(p, channelId),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: p.fireDate,
          ...(channelId ? { channelId } : {}),
        },
      });
    }
    if (android) await deleteStaleChannels(desiredChannelIds);
    if (android) await syncStickyNextPrayer(loadStickyEnabled(store), plan, now);
    saveScheduleContext(store, context);
    if (android) recordGrant(store, exactGranted);
    // Home-screen widget rides the same triggers (fire-and-forget no-op
    // when no widget is placed or the lib is absent, e.g. in tests).
    if (android) refreshPrayerWidget();
    log.info('notifications', 'rescheduled', {
      kept: actions.keepIds.length,
      cancelled: actions.cancelIds.length,
      scheduled: actions.schedule.length,
      ...(force ? { forced: true } : {}),
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
