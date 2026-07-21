import { render } from '@testing-library/react-native';
import Database from 'better-sqlite3';
import React from 'react';
import { InteractionManager } from 'react-native';
import path from 'node:path';

import { SurahScreen } from '../SurahScreen';
import { createMemoryKVStore } from '../../../../lib/kvStore';
import { SettingsProvider } from '../../../settings/SettingsContext';

const DB_PATH = path.resolve(__dirname, '..', '..', '..', '..', '..', 'assets', 'db', 'quran.db');
const raw = new Database(DB_PATH, { readonly: true, fileMustExist: true });
const mockDb = {
  getAllSync: (sql: string, params: (string | number)[] = []) => raw.prepare(sql).all(...params),
  getFirstSync: (sql: string, params: (string | number)[] = []) =>
    raw.prepare(sql).get(...params) ?? null,
};
afterAll(() => raw.close());

let mockSearchParams: Record<string, string> = { id: '2' };
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'en-US' }] }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({}),
  useAudioPlayerStatus: () => ({ currentTime: 0, duration: 0, playing: false }),
  setAudioModeAsync: jest.fn(),
}));
jest.mock('@/src/features/audio/config', () => ({ getAudioSource: () => null }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => mockSearchParams,
  Stack: { Screen: () => null },
}));

const wrap = (store = createMemoryKVStore()) => (
  <SettingsProvider store={store}>
    <SurahScreen />
  </SettingsProvider>
);

describe('SurahScreen deep-link to an ayah', () => {
  beforeEach(() => {
    // Stub the post-transition deferral so ONLY the synchronous deep-link load
    // can populate the list — this is exactly the on-device timing that used to
    // leave the reader scrolled to the top instead of the target ayah.
    jest
      .spyOn(InteractionManager, 'runAfterInteractions')
      .mockReturnValue({ then: jest.fn(), done: jest.fn(), cancel: jest.fn() } as never);
  });
  afterEach(() => jest.restoreAllMocks());

  test('with an ayah param, the target verse is loaded at mount (no deferral)', async () => {
    mockSearchParams = { id: '2', ayah: '255' };
    const view = await render(wrap());
    expect(view.getByTestId('ayah-2-255')).toBeOnTheScreen();
  });

  test('without an ayah param, rows wait for the post-transition load', async () => {
    mockSearchParams = { id: '2' };
    const view = await render(wrap());
    // Deferral stubbed out → no rows yet (proves ordinary opens stay deferred).
    expect(view.queryByTestId('ayah-2-1')).toBeNull();
  });

});
