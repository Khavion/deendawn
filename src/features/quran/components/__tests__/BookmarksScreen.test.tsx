import { fireEvent, render } from '@testing-library/react-native';
import Database from 'better-sqlite3';
import React from 'react';
import path from 'node:path';

import { BookmarksScreen } from '../BookmarksScreen';
import { loadBookmarks } from '../../readerState';
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
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'en-US' }] }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  Stack: { Screen: () => null },
}));

const BOOKMARKS = JSON.stringify([
  { surah: 1, ayah: 1 },
  { surah: 2, ayah: 255 },
]);

const wrap = (store = createMemoryKVStore()) => (
  <SettingsProvider store={store}>
    <BookmarksScreen />
  </SettingsProvider>
);

beforeEach(() => mockRouterPush.mockClear());

describe('BookmarksScreen', () => {
  test('empty state when nothing is saved', async () => {
    const view = await render(wrap());
    expect(view.getByText(/No saved verses yet/)).toBeOnTheScreen();
  });

  test('lists saved verses newest-first with their text and citation', async () => {
    const store = createMemoryKVStore({ 'quran.bookmarks.v1': BOOKMARKS });
    const view = await render(wrap(store));
    // Newest bookmark (2:255) renders; its citation shows the surah name.
    expect(view.getByText(/Al-Baqara 2:255/)).toBeOnTheScreen();
    expect(view.getByText(/Al-Faatiha 1:1/)).toBeOnTheScreen();
    // Real translation text from the shipped db is shown.
    expect(view.getByTestId('bookmark-open-2-255')).toBeOnTheScreen();
  });

  test('tapping a verse deep-links into the reader at that ayah', async () => {
    const store = createMemoryKVStore({ 'quran.bookmarks.v1': BOOKMARKS });
    const view = await render(wrap(store));
    await fireEvent.press(view.getByTestId('bookmark-open-2-255'));
    expect(mockRouterPush).toHaveBeenCalledWith('/surah/2?ayah=255');
  });

  test('removing a bookmark drops it from storage and the list', async () => {
    const store = createMemoryKVStore({ 'quran.bookmarks.v1': BOOKMARKS });
    const view = await render(wrap(store));
    await fireEvent.press(view.getByTestId('bookmark-remove-2-255'));
    expect(loadBookmarks(store)).toEqual([{ surah: 1, ayah: 1 }]);
    expect(view.queryByTestId('bookmark-open-2-255')).toBeNull();
  });
});
