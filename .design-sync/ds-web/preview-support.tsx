/**
 * Preview-only support module (design-sync extraEntries). Exports the
 * provider wrapper every preview renders inside: the REAL AppThemeProvider
 * with an in-memory KV store (no sqlite in the browser), under the real
 * SafeAreaProvider. Nothing here reimplements a component.
 */
import React, { useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeContext, type ThemePref } from '@/src/lib/theme/ThemeProvider';
import { palette as themePalette, type ThemeMode } from '@/src/lib/theme/tokens';

/**
 * Supplies the REAL ThemeContext with the real palette, without
 * AppThemeProvider's Appearance.setColorScheme side effect (an RN-only API
 * that react-native-web 0.21 doesn't implement — it throws in the browser).
 */
export function DSPreviewRoot({ children }: { children: React.ReactNode }) {
  // react-native-web injects <style id="react-native-stylesheet">, which the
  // render check's `[id^="r"]` mount selector picks up as the first "root"
  // (a style tag is contentless → every card would read as empty). Rename it
  // out of the selector's range; RNW holds the sheet by reference, not id.
  React.useEffect(() => {
    const el = typeof document !== 'undefined' && document.getElementById('react-native-stylesheet');
    if (el) el.id = 'x-rn-stylesheet';
  }, []);
  const [pref, setPref] = useState<ThemePref>('light');
  const mode: ThemeMode = pref === 'system' ? 'light' : pref;
  const value = useMemo(
    () => ({ mode, pref, setPref, tokens: themePalette[mode] }),
    [mode, pref]
  );
  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

// Design tokens exposed on the bundle so previews and the design agent can
// style layout glue with the real values (single source: src/lib/theme/tokens.ts).
export {
  palette,
  spacing,
  radius,
  fonts,
  fontSize,
  duration,
  featuredGradient,
  textOnFeatured,
} from '@/src/lib/theme/tokens';
