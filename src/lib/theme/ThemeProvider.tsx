import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { ColorTokens, palette, ThemeMode } from './tokens';
import { getUserKVStore, KVStore } from '@/src/lib/kvStore';

/** What the user picked. 'system' follows the OS light/dark appearance. */
export type ThemePref = 'system' | 'light' | 'dark' | 'nightWarm';

const PREF_KEY = 'theme.pref.v1';
const PREFS: ThemePref[] = ['system', 'light', 'dark', 'nightWarm'];

interface ThemeContextValue {
  /** Resolved concrete mode after applying `pref` + system appearance. */
  mode: ThemeMode;
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
  tokens: ColorTokens;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Exported for the headless Android widget renderer (no provider there). */
export function readThemePref(store: KVStore): ThemePref {
  const raw = store.get(PREF_KEY);
  return (PREFS as string[]).includes(raw ?? '') ? (raw as ThemePref) : 'system';
}

/**
 * App-level theme provider: resolves the active palette from the persisted
 * preference and the system appearance, and lets the user override it (incl.
 * the night-warm reading palette). Persists via the user KV store. Named
 * AppThemeProvider to avoid colliding with @react-navigation's ThemeProvider.
 */
export function AppThemeProvider({
  children,
  store,
}: {
  children: React.ReactNode;
  /** Injectable for tests; defaults to the on-device user store. */
  store?: KVStore;
}) {
  const kv = useMemo(() => store ?? getUserKVStore(), [store]);
  const system = useColorScheme() ?? 'light';
  const [pref, setPrefState] = useState<ThemePref>(() => readThemePref(kv));

  const mode: ThemeMode = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;

  // RN 0.86 recomputes the JS color scheme from whichever window posted the
  // trait-change notification, so a second (dev-only) window can flip it while
  // the OS never changes (docs/reports/darkmode-oscillation-research.md).
  // Explicit prefs are pinned into Appearance — which also sets
  // overrideUserInterfaceStyle on every window, so native chrome (tab bar,
  // sheets, alerts) follows the app theme. 'system' must CLEAR the override
  // ('unspecified' re-reads the real OS scheme): pinning it would suppress the
  // trait-change events Appearance itself needs, freezing the cold-start look.
  useEffect(() => {
    Appearance.setColorScheme(
      pref === 'system' ? 'unspecified' : pref === 'light' ? 'light' : 'dark'
    );
  }, [pref]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      pref,
      tokens: palette[mode],
      setPref: (p: ThemePref) => {
        setPrefState(p);
        kv.set(PREF_KEY, p);
      },
    }),
    [mode, pref, kv]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Full theme context (mode, preference, setter, tokens). */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <AppThemeProvider>');
  return ctx;
}

/**
 * Just the resolved mode, with a graceful fallback to the system appearance
 * when no provider is present (mirrors useTokens). Use this in components that
 * only need the mode for styling — it never throws, so screen tests don't have
 * to wrap in AppThemeProvider.
 */
export function useThemeMode(): ThemeMode {
  const ctx = useContext(ThemeContext);
  const system = useColorScheme() ?? 'light';
  if (ctx) return ctx.mode;
  return system === 'dark' ? 'dark' : 'light';
}
