import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';

import { useDeviceTier } from './theme/useDeviceTier';

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
 *
 * All calls are fire-and-forget; callers use `void h.select()`. Reduce Motion
 * (which also forces the essential device tier) silences them via `useHaptics`.
 */
const verbs = {
  press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  detent: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  select: () => Haptics.selectionAsync(),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
} as const;

export type HapticVerb = keyof typeof verbs;
export type Haptic = Record<HapticVerb, () => void>;

/** The raw, always-firing vocabulary (use `useHaptics` in components to respect Reduce Motion). */
export const haptic: Haptic = verbs;

const silent: Haptic = {
  press: () => {},
  detent: () => {},
  select: () => {},
  success: () => {},
  warning: () => {},
};

/**
 * Reduce-Motion-aware haptics. Returns no-op verbs when the user has Reduce
 * Motion on (accessibility + battery comfort); otherwise the real vocabulary.
 * Gated on Reduce Motion — NOT the full device tier — because even low-end
 * phones have a taptic engine and users expect touch feedback there.
 */
export function useHaptics(): Haptic {
  const { reduceMotion } = useDeviceTier();
  return useMemo(() => (reduceMotion ? silent : verbs), [reduceMotion]);
}
