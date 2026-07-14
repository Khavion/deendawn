import { fireEvent, render } from '@testing-library/react-native';
import Database from 'better-sqlite3';
import React from 'react';
import path from 'node:path';

import { SurahListScreen } from '../SurahListScreen';
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

const mockRouterPush = jest.fn();
let mockSearchParams: Record<string, string> = { id: '1' };

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
// No audio source configured in tests → the Listen bar renders nothing.
jest.mock('@/src/features/audio/config', () => ({ getAudioSource: () => null }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useLocalSearchParams: () => mockSearchParams,
  Stack: { Screen: () => null },
}));

const wrap = (ui: React.ReactElement, store = createMemoryKVStore()) => (
  <SettingsProvider store={store}>{ui}</SettingsProvider>
);

beforeEach(() => {
  mockRouterPush.mockClear();
  mockSearchParams = { id: '1' };
});

describe('SurahListScreen', () => {
  test('renders the surah list from the shipped db and navigates on tap', async () => {
    const view = await render(wrap(<SurahListScreen />));
    expect(view.getByText('Al-Faatiha')).toBeOnTheScreen();
    expect(view.getByText(/The Opening · 7 verses/)).toBeOnTheScreen();
    await fireEvent.press(view.getByTestId('surah-2'));
    expect(mockRouterPush).toHaveBeenCalledWith('/surah/2');
  });

  test('search mode shows FTS hits and navigates with the ayah target', async () => {
    const view = await render(wrap(<SurahListScreen />));
    await fireEvent.changeText(view.getByTestId('quran-search'), 'merciful');
    const hit = view.getByTestId('result-1-1');
    expect(hit).toBeOnTheScreen();
    await fireEvent.press(hit);
    expect(mockRouterPush).toHaveBeenCalledWith('/surah/1?ayah=1');
  });

  test('continue-reading chip appears when a last-read position exists', async () => {
    const store = createMemoryKVStore({
      'quran.lastRead.v1': JSON.stringify({ surah: 18, ayah: 10 }),
    });
    const view = await render(wrap(<SurahListScreen />, store));
    expect(view.getByText(/Continue reading — 18:10/)).toBeOnTheScreen();
  });
});

describe('SurahScreen', () => {
  test('renders all 7 ayahs of Al-Faatiha with Arabic and translation', async () => {
    const view = await render(wrap(<SurahScreen />));
    for (let a = 1; a <= 7; a++) expect(view.getByTestId(`ayah-1-${a}`)).toBeOnTheScreen();
    expect(view.getByTestId('translation-1')).toBeOnTheScreen();
    expect(view.getByTestId('dev-translation-badge')).toBeOnTheScreen();
    // Arabic text must be the exact db bytes.
    const dbText = (
      mockDb.getFirstSync('SELECT text_uthmani FROM ayahs WHERE surah=1 AND ayah=1') as {
        text_uthmani: string;
      }
    ).text_uthmani;
    expect(view.getByText(dbText)).toBeOnTheScreen();
  });

  test('bookmark toggle persists to the store', async () => {
    const store = createMemoryKVStore();
    const view = await render(wrap(<SurahScreen />, store));
    await fireEvent.press(view.getByTestId('bookmark-1'));
    expect(JSON.parse(store.get('quran.bookmarks.v1')!)).toEqual([{ surah: 1, ayah: 1 }]);
    await fireEvent.press(view.getByTestId('bookmark-1'));
    expect(JSON.parse(store.get('quran.bookmarks.v1')!)).toEqual([]);
  });

  test('share builds text with citation from db bytes', async () => {
    const { Share } = jest.requireActual('react-native');
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const view = await render(wrap(<SurahScreen />));
    await fireEvent.press(view.getByTestId('share-1'));
    expect(shareSpy).toHaveBeenCalledTimes(1);
    const message = (shareSpy.mock.calls[0][0] as { message: string }).message;
    expect(message).toContain('— Quran 1:1 (Al-Faatiha)');
    shareSpy.mockRestore();
  });

  test('unknown surah id shows the not-found state', async () => {
    mockSearchParams = { id: '999' };
    const view = await render(wrap(<SurahScreen />));
    expect(view.getByText('Surah not found.')).toBeOnTheScreen();
  });
});
