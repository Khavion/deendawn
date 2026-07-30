import { Platform } from 'react-native';

/**
 * Facade over the local `modules/audio-noisy` native module (Android-only).
 * expo-audio 57.0.3 never pauses on headphone/Bluetooth disconnect (the
 * upstream fix will not ship inside SDK 57 — DECISIONS 2026-07-30), so the
 * player subscribes here and pauses itself. iOS pauses via the system audio
 * session already; the lazy require keeps iOS bundles and node-env Jest
 * untouched by the native binding.
 */
export function addBecomingNoisyListener(listener: () => void): { remove: () => void } {
  if (Platform.OS !== 'android') return { remove: () => {} };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy,
    // android-only.
    const { requireNativeModule, EventEmitter } = require('expo-modules-core');
    const emitter = new EventEmitter(requireNativeModule('AudioNoisy'));
    const sub = emitter.addListener('onAudioBecomingNoisy', () => listener());
    return { remove: () => sub.remove() };
  } catch {
    return { remove: () => {} }; // module not linked (Expo Go, tests) — no-op
  }
}
