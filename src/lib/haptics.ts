import * as Haptics from 'expo-haptics';

/**
 * The app's haptic vocabulary — one named verb per interaction meaning, so
 * feedback is consistent everywhere instead of ad-hoc `expo-haptics` calls
 * scattered per screen (docs/DESIGN_AUDIT.md motion pass).
 *
 * - press:   a light tap acknowledging a control was pressed (tab, button)
 * - detent:  a firmer tick when crossing a meaningful threshold (tasbih 33/66)
 * - select:  a subtle selection change (counter increment, entering a window)
 * - success: a positive completion (round complete, qibla aligned)
 * - warning: a cautionary notification (destructive / blocked action)
 * - error:   a failure notification (an action could not complete)
 *
 * All calls are fire-and-forget; callers use `void h.select()`. The user's
 * haptics setting (More ▸ default on) silences them at fire time — NOT Reduce
 * Motion: motion is visual, haptics are physical, and both platforms treat
 * them as separate accessibility choices (iOS System Haptics / Android
 * "Touch feedback" each have their own system switch, which expo-haptics
 * respects beneath ours).
 *
 * Android: the same verbs map to VibrationEffect primitives via expo-haptics
 * (impact styles → primitive ticks/clicks, notification types → composed
 * patterns, selection → segment tick). Intensity varies by motor — actual
 * FEEL is a physical-device pass item (docs/TESTPLAN.md); the emulator has
 * no motor. VIBRATE is already in the shipped permission set.
 */
const verbs = {
  press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  detent: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  select: () => Haptics.selectionAsync(),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
} as const;

export type HapticVerb = keyof typeof verbs;
export type Haptic = Record<HapticVerb, () => void>;

/** The raw, always-firing vocabulary (bypasses the user setting — avoid). */
export const haptic: Haptic = verbs;

// Module-level flag, synchronized from the persisted setting by
// SettingsProvider (write-through on toggle). Checked at FIRE time, so every
// mounted screen honors a change instantly — no re-render round trip, no
// per-fire storage read.
let hapticsEnabled = true;

/** Called by the settings layer on load and on toggle. */
export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

const gated: Haptic = {
  press: () => hapticsEnabled && void verbs.press(),
  detent: () => hapticsEnabled && void verbs.detent(),
  select: () => hapticsEnabled && void verbs.select(),
  success: () => hapticsEnabled && void verbs.success(),
  warning: () => hapticsEnabled && void verbs.warning(),
  error: () => hapticsEnabled && void verbs.error(),
};

/**
 * Setting-aware haptics — the only entry point components should use. Verbs
 * no-op while the user has haptics off. (Deliberately NOT gated on Reduce
 * Motion; see the header note — that was the old, semantically wrong gate.)
 */
export function useHaptics(): Haptic {
  return gated;
}
