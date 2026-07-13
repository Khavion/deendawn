import { useColorScheme } from 'react-native';

import { ColorTokens, palette, ThemeMode } from './tokens';

/**
 * Resolve the active color tokens. Follows the system appearance;
 * `override` lets the Quran reader apply the opt-in night-warm palette.
 */
export function useTokens(override?: ThemeMode): ColorTokens {
  const scheme = useColorScheme() ?? 'light';
  return palette[override ?? (scheme === 'dark' ? 'dark' : 'light')];
}
