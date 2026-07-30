import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { isSilenceTodayResponse, silenceToday, SILENCE_TODAY_ACTION, ADHAN_CATEGORY } from './silenceToday';
import { log } from '../../lib/log';
import i18n from '../../lib/i18n';

/**
 * Killed-state notification handling (Android): since SDK 53 the task
 * registered via Notifications.registerTaskAsync also runs on notification
 * ACTION presses with opensAppToForeground:false — the only path that works
 * when the process is dead. Registered from the app entry (module scope, per
 * expo-task-manager requirements).
 */
const NOTIFICATION_TASK = 'deendawn-notification-task';

export function registerNotificationTasks(): void {
  if (Platform.OS !== 'android') return;
  TaskManager.defineTask(NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
      log.error('notifications', 'background task error', { message: error.message });
      return;
    }
    const response = (data as { response?: { actionIdentifier?: string } } | undefined)
      ?.response;
    if (response && isSilenceTodayResponse(response)) {
      await silenceToday();
    }
  });
  void Notifications.registerTaskAsync(NOTIFICATION_TASK);
}

/** The adhan category with the "Silence today" action. Android-only by
 * CONTRACT — the caller gates (service.ts platform seam; no Platform check
 * here so node-env tests can exercise the android path). */
export async function ensureAdhanCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(ADHAN_CATEGORY, [
    {
      identifier: SILENCE_TODAY_ACTION,
      buttonTitle: i18n.t('notifications.silenceToday'),
      options: { opensAppToForeground: false },
    },
  ]);
}

/** Warm-path handling: the app is alive and the user pressed the action. */
export function installSilenceTodayListener(): { remove: () => void } {
  if (Platform.OS !== 'android') return { remove: () => {} };
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    if (isSilenceTodayResponse(response)) void silenceToday();
  });
  return { remove: () => sub.remove() };
}
