import { fireEvent, render } from '@testing-library/react-native';
import Database from 'better-sqlite3';
import React from 'react';
import path from 'node:path';

import { VerseOfDayCard } from '../VerseOfDayCard';
import { verseOfDayOrdinal } from '../../verseOfDay';
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
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockRouterPush }) }));

const DATE = new Date(2026, 6, 21);
const ordinal = verseOfDayOrdinal(DATE);
const expected = raw
  .prepare('SELECT surah, ayah, text_translation FROM ayahs ORDER BY surah, ayah LIMIT 1 OFFSET ?')
  .get(ordinal) as { surah: number; ayah: number; text_translation: string };

const wrap = () => (
  <SettingsProvider store={createMemoryKVStore()}>
    <VerseOfDayCard date={DATE} />
  </SettingsProvider>
);

beforeEach(() => mockRouterPush.mockClear());

describe('VerseOfDayCard', () => {
  test('renders the deterministic daily verse with its translation and citation', async () => {
    const view = await render(wrap());
    expect(view.getByTestId('verse-of-day')).toBeOnTheScreen();
    // The verse shown is exactly the date-derived one (never curated).
    expect(view.getByText(expected.text_translation)).toBeOnTheScreen();
    expect(view.getByText(new RegExp(`${expected.surah}:${expected.ayah}`))).toBeOnTheScreen();
  });

  test('tapping opens that verse in the reader', async () => {
    const view = await render(wrap());
    await fireEvent.press(view.getByTestId('verse-of-day'));
    expect(mockRouterPush).toHaveBeenCalledWith(
      `/surah/${expected.surah}?ayah=${expected.ayah}`
    );
  });
});
