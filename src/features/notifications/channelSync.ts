import * as Notifications from 'expo-notifications';

import i18n from '../../lib/i18n';
import { log } from '../../lib/log';

import { channelSpec, desiredChannels, diffChannels } from './channels';
import { NotificationPrefs } from './scheduler';

/**
 * Impure half of the channel model (Android only — callers gate on
 * platform). Reconciles the OS channel list against channels.ts's desired
 * set. Split into two phases because ORDER IS LOAD-BEARING inside
 * rescheduleAll: create/update channels → cancel/schedule notifications →
 * delete stale channels. Deleting first would leave pending notifications
 * pointed at a dead channel (silently dropped at fire time).
 */

function displayName(channelId: string): string {
  const spec = channelSpec(channelId);
  if (spec.kind === 'suhoor') return i18n.t('notifications.suhoorTitle');
  return i18n.t(`prayers.${spec.prayer ?? 'fajr'}`);
}

/**
 * Create every desired channel and re-set mutable fields (name — so a
 * language change localizes the Settings list for free; re-setting an
 * existing id is a documented no-op for the locked fields).
 */
export async function ensureChannels(
  prefs: NotificationPrefs,
  suhoorEnabled: boolean
): Promise<string[]> {
  const desired = desiredChannels(prefs, suhoorEnabled);
  for (const id of desired) {
    const spec = channelSpec(id);
    await Notifications.setNotificationChannelAsync(id, {
      name: displayName(id),
      importance: Notifications.AndroidImportance.HIGH,
      sound: spec.sound === null ? null : spec.sound,
      audioAttributes:
        spec.audioUsage === 'alarm' ? { usage: Notifications.AndroidAudioUsage.ALARM } : undefined,
    });
  }
  return desired;
}

/** Delete stale channels WE own (prefix-guarded in the pure diff). */
export async function deleteStaleChannels(desired: string[]): Promise<void> {
  const existing = (await Notifications.getNotificationChannelsAsync()) ?? [];
  const { deleteIds } = diffChannels(
    existing.map((c) => c.id),
    desired
  );
  for (const id of deleteIds) {
    await Notifications.deleteNotificationChannelAsync(id);
  }
  if (deleteIds.length > 0) {
    log.info('notifications', 'stale channels deleted', { deleted: deleteIds.length });
  }
}
