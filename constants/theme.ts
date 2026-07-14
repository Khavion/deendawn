/**
 * Legacy color map consumed by the template components (tab bar, ThemedView).
 * Values mirror src/lib/theme/tokens.ts — the tokens file is the source of
 * truth (contrast tests cover the tokens).
 */
import { Platform } from 'react-native';

import { palette } from '@/src/lib/theme/tokens';

export const Colors = {
  light: {
    text: palette.light.textPrimary,
    background: palette.light.bgCanvas,
    tint: palette.light.accent,
    icon: palette.light.icon,
    tabIconDefault: palette.light.icon,
    tabIconSelected: palette.light.accent,
  },
  dark: {
    text: palette.dark.textPrimary,
    background: palette.dark.bgCanvas,
    tint: palette.dark.accent,
    icon: palette.dark.icon,
    tabIconDefault: palette.dark.icon,
    tabIconSelected: palette.dark.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'SourceSans3-Regular',
    serif: 'Literata-Regular',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'SourceSans3-Regular',
    serif: 'Literata-Regular',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});
