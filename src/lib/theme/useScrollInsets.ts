import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Android fallback for `contentInsetAdjustmentBehavior="automatic"` — that
 * prop is iOS-only, and with edge-to-edge unconditional at target 36 every
 * headerless Android scroller otherwise starts under the status bar and ends
 * under the gesture/nav area (verified on emulator: the Today period eyebrow
 * collided with the status-bar clock).
 *
 * Usage: `contentContainerStyle={[styles.scroll, androidInsets]}` — on iOS
 * this returns {} so the native automatic behavior (and the screen's own
 * base padding) is untouched; on Android it OVERRIDES the vertical paddings,
 * so pass the screen's own base values in so they participate:
 *
 *   const androidInsets = useScrollInsets({ baseTop: spacing.m, baseBottom: spacing.l });
 *
 * `top:false` for screens with a native header (the header already clears
 * the status bar). Bottom modes since the custom DS TabBar (in-flow, opaque,
 * 66pt + safe area — handoff gap 03): `'tabs'` for screens inside the tab
 * navigator, where the bar itself consumes the bottom inset so only the base
 * padding is needed; `'nav'` for pushed screens that reach the screen bottom
 * and must clear the gesture/nav area themselves.
 */
export function useScrollInsets(
  opts: {
    top?: boolean;
    bottom?: 'tabs' | 'nav' | false;
    baseTop?: number;
    baseBottom?: number;
  } = {}
): { paddingTop?: number; paddingBottom?: number } {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'android') return {};
  const { top = true, bottom = 'tabs', baseTop = 0, baseBottom = 0 } = opts;
  return {
    ...(top ? { paddingTop: insets.top + baseTop } : {}),
    ...(bottom
      ? { paddingBottom: (bottom === 'nav' ? insets.bottom : 0) + baseBottom }
      : {}),
  };
}
