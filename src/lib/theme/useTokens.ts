import { useContext } from 'react';
import { useColorScheme } from 'react-native';

import { ThemeContext } from './ThemeProvider';
import { ColorTokens, palette, ThemeMode } from './tokens';

/**
 * Resolve the active color tokens.
 * - An explicit `override` wins (the Quran reader forces night-warm this way).
 * - Otherwise follow the app theme preference from <AppThemeProvider>.
 * - With no provider (e.g. isolated tests) fall back to the system appearance.
 */
export function useTokens(override?: ThemeMode): ColorTokens {
  const ctx = useContext(ThemeContext);
  const scheme = useColorScheme() ?? 'light';
  if (override) return palette[override];
  if (ctx) return palette[ctx.mode];
  return palette[scheme === 'dark' ? 'dark' : 'light'];
}
