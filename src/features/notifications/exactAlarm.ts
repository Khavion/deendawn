import { Platform } from 'react-native';

/**
 * Facade over the local `modules/exact-alarm` native module (Android-only;
 * expo-notifications has no exact-alarm JS API through 57.0.8). Every
 * consumer goes through here — the lazy require keeps iOS bundles and
 * node-env Jest untouched by the native binding.
 */

type ExactAlarmNativeModule = {
  canScheduleExactAlarms(): boolean;
  addListener?: unknown;
};

function nativeModule(): ExactAlarmNativeModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy
    // native binding; must not load on iOS or in node-env tests.
    const { requireNativeModule } = require('expo-modules-core');
    return requireNativeModule('ExactAlarm');
  } catch {
    return null; // Expo Go / module not linked — treat as not grantable
  }
}

/** iOS and Android <12 are always "exact" (the special access doesn't exist). */
export function canScheduleExactAlarms(): boolean {
  if (Platform.OS !== 'android') return true;
  if (typeof Platform.Version === 'number' && Platform.Version < 31) return true;
  return nativeModule()?.canScheduleExactAlarms() ?? false;
}

export function exactAlarmApplicable(): boolean {
  return (
    Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 31
  );
}

/**
 * Deep-link to the system "Alarms & reminders" screen for this app.
 * Resolves when the user returns — callers re-check + reschedule then.
 */
export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy,
  // android-only.
  const IntentLauncher = require('expo-intent-launcher');
  await IntentLauncher.startActivityAsync('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', {
    // applicationId is fixed for this app (app.json android.package).
    data: 'package:com.khavion.deendawn',
  });
}

/**
 * Fires when the user flips the special access while the app runs (the OS
 * kills the app on revoke, so cold-start paths rely on the KV state machine
 * in exactAlarmState.ts instead).
 */
export function addExactAlarmListener(listener: (granted: boolean) => void): {
  remove: () => void;
} {
  if (Platform.OS !== 'android') return { remove: () => {} };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy,
    // android-only.
    const { requireNativeModule, EventEmitter } = require('expo-modules-core');
    const emitter = new EventEmitter(requireNativeModule('ExactAlarm'));
    const sub = emitter.addListener(
      'onExactAlarmStateChanged',
      (event: { granted: boolean }) => listener(event.granted)
    );
    return { remove: () => sub.remove() };
  } catch {
    return { remove: () => {} };
  }
}
