import { useContext } from 'react';
import { useColorScheme } from 'react-native';

import { ThemeContext } from './ThemeProvider';
import { ColorTokens, palette, ThemeMode } from './tokens';

/**
 * Resolve the active color tokens.
 * - An explicit `override` wins (the Quran reader forces night-warm this way).
 * - Otherwise use the nearest provider's tokens — normally palette[mode], but
 *   a filled GoldFrameCard nests a provider carrying `onFeaturedTokens` so
 *   its subtree lands legibly on the gradient (handoff gap 02).
 * - With no provider (e.g. isolated tests) fall back to the system appearance.
 */
export function useTokens(override?: ThemeMode): ColorTokens {
  const ctx = useContext(ThemeContext);
  const scheme = useColorScheme() ?? 'light';
  if (override) return palette[override];
  if (ctx) return ctx.tokens;
  return palette[scheme === 'dark' ? 'dark' : 'light'];
}
