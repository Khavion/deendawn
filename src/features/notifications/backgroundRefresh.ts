import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { rescheduleAll } from './service';
import { log } from '../../lib/log';

const TASK_NAME = 'deendawn-reschedule-adhans';

TaskManager.defineTask(TASK_NAME, async () => {
  await rescheduleAll();
  return BackgroundTask.BackgroundTaskResult.Success;
});

/**
 * Opportunistic background top-up of the rolling 7-day schedule. iOS decides
 * when (if ever) this runs — the foreground/fire listeners remain the primary
 * refresh paths; this just extends coverage for rarely-opened apps.
 */
export async function registerBackgroundRefresh(): Promise<void> {
  try {
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 12, // minutes; at most twice a day is plenty
    });
  } catch (e) {
    // Unavailable in Expo Go / simulator background-refresh-off — not fatal.
    log.warn('notifications', 'background task registration failed', { message: String(e) });
  }
}
