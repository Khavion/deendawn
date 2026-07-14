import { act, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { AppThemeProvider, useTheme } from '../ThemeProvider';
import { palette } from '../tokens';
import { createMemoryKVStore } from '@/src/lib/kvStore';

// Force a known system appearance so 'system' resolves deterministically.
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => 'light',
}));

let captured: ReturnType<typeof useTheme> | null = null;
function Probe() {
  captured = useTheme();
  return <Text>{captured.mode}</Text>;
}

describe('AppThemeProvider', () => {
  beforeEach(() => {
    captured = null;
  });

  it("defaults to 'system' → light and exposes the matching tokens", async () => {
    const store = createMemoryKVStore();
    await render(
      <AppThemeProvider store={store}>
        <Probe />
      </AppThemeProvider>
    );
    expect(captured?.pref).toBe('system');
    expect(captured?.mode).toBe('light');
    expect(captured?.tokens).toBe(palette.light);
  });

  it('a manual override changes the resolved mode + tokens and persists', async () => {
    const store = createMemoryKVStore();
    await render(
      <AppThemeProvider store={store}>
        <Probe />
      </AppThemeProvider>
    );
    await act(async () => captured!.setPref('nightWarm'));
    expect(captured?.mode).toBe('nightWarm');
    expect(captured?.tokens).toBe(palette.nightWarm);
    expect(store.get('theme.pref.v1')).toBe('nightWarm');
  });

  it('reads a persisted preference on mount', async () => {
    const store = createMemoryKVStore({ 'theme.pref.v1': 'dark' });
    await render(
      <AppThemeProvider store={store}>
        <Probe />
      </AppThemeProvider>
    );
    expect(captured?.pref).toBe('dark');
    expect(captured?.mode).toBe('dark');
  });

  it('ignores a corrupt stored value (falls back to system)', async () => {
    const store = createMemoryKVStore({ 'theme.pref.v1': 'chartreuse' });
    await render(
      <AppThemeProvider store={store}>
        <Probe />
      </AppThemeProvider>
    );
    expect(captured?.pref).toBe('system');
  });
});
