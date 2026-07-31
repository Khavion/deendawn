import { Platform } from 'react-native';

/**
 * Facade over the local `modules/volume-keys` native module (Android-only).
 * While subscribed, volume presses are consumed and counted instead of
 * changing volume — the tasbih screen subscribes only while focused, so
 * volume behaves normally everywhere else. iOS deliberately has no
 * implementation (hardware-button repurposing risks App Review 2.5.9 —
 * DECISIONS 2026-07-31); callers show platform-appropriate hint copy.
 * The lazy require keeps iOS bundles and node-env Jest untouched.
 */
export function addVolumeKeyListener(
  listener: (direction: 'up' | 'down') => void
): { remove: () => void } {
  if (Platform.OS !== 'android') return { remove: () => {} };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy,
    // android-only.
    const { requireNativeModule, EventEmitter } = require('expo-modules-core');
    const emitter = new EventEmitter(requireNativeModule('VolumeKeys'));
    const sub = emitter.addListener('onVolumeKey', (e: { direction: 'up' | 'down' }) =>
      listener(e.direction)
    );
    return { remove: () => sub.remove() };
  } catch {
    return { remove: () => {} }; // module not linked (tests, old builds) — no-op
  }
}

/** Whether volume-key counting exists on this platform (drives hint copy). */
export const VOLUME_KEYS_SUPPORTED = Platform.OS === 'android';
