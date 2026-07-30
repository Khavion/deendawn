import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import {
  addExactAlarmListener,
  canScheduleExactAlarms,
  exactAlarmApplicable,
  openExactAlarmSettings,
} from './exactAlarm';
import { rescheduleAll } from './service';

export interface ExactAlarmHook {
  /** Show the card only when the special access exists AND is denied. */
  showCard: boolean;
  /** Deep-links to "Alarms & reminders"; re-checks + reschedules on return. */
  openSettings: () => Promise<void>;
}

/**
 * Exact-alarm grant state for the "Make adhan times exact" card. Re-checks
 * on AppState active (covers the settings round-trip even if the intent
 * promise resolution is missed) and on the native permission-state event.
 * The reschedule itself is also triggered by the state machine inside
 * rescheduleAll — this hook just makes it immediate.
 */
export function useExactAlarm(): ExactAlarmHook {
  const applicable = exactAlarmApplicable();
  const [granted, setGranted] = useState(() => (applicable ? canScheduleExactAlarms() : true));

  const refresh = useCallback(() => {
    if (!applicable) return;
    const now = canScheduleExactAlarms();
    setGranted(now);
    // rescheduleAll's grant state machine detects the flip and forces the
    // full re-registration; harmless no-op otherwise.
    void rescheduleAll();
  }, [applicable]);

  useEffect(() => {
    if (!applicable) return;
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const native = addExactAlarmListener(() => refresh());
    return () => {
      appState.remove();
      native.remove();
    };
  }, [applicable, refresh]);

  const openSettings = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    await openExactAlarmSettings();
    refresh();
  }, [refresh]);

  return { showCard: applicable && !granted, openSettings };
}
