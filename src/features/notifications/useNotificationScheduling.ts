import { useEffect } from 'react';
import { AppState } from 'react-native';

import { rescheduleAll } from './service';
import { useSettings } from '../settings/SettingsContext';

/**
 * Keeps the rolling adhan schedule fresh: on mount, whenever prayer settings
 * change, whenever the app returns to the foreground, and whenever a
 * notification fires (so the queue is topped back up toward 7+ days).
 */
export function useNotificationScheduling(): void {
  const { settings } = useSettings();

  useEffect(() => {
    void rescheduleAll();
  }, [settings]);

  useEffect(() => {
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void rescheduleAll();
    });
    // Dynamic import keeps expo-notifications out of the module graph for
    // components that only need the hook's type.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    const received = Notifications.addNotificationReceivedListener(() => {
      void rescheduleAll();
    });
    return () => {
      appState.remove();
      received.remove();
    };
  }, []);
}
