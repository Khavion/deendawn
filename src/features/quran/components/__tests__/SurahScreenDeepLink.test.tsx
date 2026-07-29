import { render } from '@testing-library/react-native';
import Database from 'better-sqlite3';
import React from 'react';
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

describe('SurahScreen row loading', () => {
  test('with an ayah param, the target verse is loaded at mount', async () => {
    mockSearchParams = { id: '2', ayah: '255' };
    const view = await render(wrap());
    expect(view.getByTestId('ayah-2-255')).toBeOnTheScreen();
  });

  test('without an ayah param, rows are also present at mount (no deferral, no blank page)', async () => {
    mockSearchParams = { id: '2' };
    const view = await render(wrap());
    // The InteractionManager deferral is gone: the reader must never show an
    // empty page after a surah tap.
    expect(view.getByTestId('ayah-2-1')).toBeOnTheScreen();
  });
});
