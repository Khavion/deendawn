import { act, render } from '@testing-library/react-native';
import React from 'react';
import { Appearance, Text } from 'react-native';

import { AppThemeProvider, useTheme } from '../ThemeProvider';
import { palette } from '../tokens';
import { createMemoryKVStore } from '@/src/lib/kvStore';

// Force a known system appearance so 'system' resolves deterministically.
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => 'light',
}));

const capture = jest.fn<void, [ReturnType<typeof useTheme>]>();
function latest(): ReturnType<typeof useTheme> {
  const call = capture.mock.calls.at(-1);
  if (!call) throw new Error('Probe never rendered');
  return call[0];
}
function Probe() {
  const theme = useTheme();
  capture(theme);
  return <Text>{theme.mode}</Text>;
}

describe('AppThemeProvider', () => {
  beforeEach(() => {
    capture.mockClear();
  });

  it("defaults to 'system' → light and exposes the matching tokens", async () => {
    const store = createMemoryKVStore();
    await render(
      <AppThemeProvider store={store}>
        <Probe />
      </AppThemeProvider>
    );
    expect(latest().pref).toBe('system');
    expect(latest().mode).toBe('light');
    expect(latest().tokens).toBe(palette.light);
  });

  it('a manual override changes the resolved mode + tokens and persists', async () => {
    const store = createMemoryKVStore();
    await render(
      <AppThemeProvider store={store}>
        <Probe />
      </AppThemeProvider>
    );
    await act(async () => latest().setPref('nightWarm'));
    expect(latest().mode).toBe('nightWarm');
    expect(latest().tokens).toBe(palette.nightWarm);
    expect(store.get('theme.pref.v1')).toBe('nightWarm');
  });

  it('reads a persisted preference on mount', async () => {
    const store = createMemoryKVStore({ 'theme.pref.v1': 'dark' });
    await render(
      <AppThemeProvider store={store}>
        <Probe />
      </AppThemeProvider>
    );
    expect(latest().pref).toBe('dark');
    expect(latest().mode).toBe('dark');
  });

  it('ignores a corrupt stored value (falls back to system)', async () => {
    const store = createMemoryKVStore({ 'theme.pref.v1': 'chartreuse' });
    await render(
      <AppThemeProvider store={store}>
        <Probe />
      </AppThemeProvider>
    );
    expect(latest().pref).toBe('system');
  });

  describe('native appearance pinning (RN 0.86 multi-window hardening)', () => {
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
    beforeEach(() => setColorScheme.mockClear());
    afterAll(() => setColorScheme.mockRestore());

    it("'system' clears the native override so live OS tracking survives", async () => {
      const store = createMemoryKVStore();
      await render(
        <AppThemeProvider store={store}>
          <Probe />
        </AppThemeProvider>
      );
      expect(setColorScheme).toHaveBeenLastCalledWith('unspecified');
    });

    it('explicit prefs pin the native scheme (nightWarm counts as dark)', async () => {
      const store = createMemoryKVStore();
      await render(
        <AppThemeProvider store={store}>
          <Probe />
        </AppThemeProvider>
      );
      await act(async () => latest().setPref('light'));
      expect(setColorScheme).toHaveBeenLastCalledWith('light');
      await act(async () => latest().setPref('nightWarm'));
      expect(setColorScheme).toHaveBeenLastCalledWith('dark');
      await act(async () => latest().setPref('dark'));
      expect(setColorScheme).toHaveBeenLastCalledWith('dark');
      await act(async () => latest().setPref('system'));
      expect(setColorScheme).toHaveBeenLastCalledWith('unspecified');
    });
  });
});
