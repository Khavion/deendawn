import { fireEvent, render } from '@testing-library/react-native';
import Database from 'better-sqlite3';
import React from 'react';
import path from 'node:path';

import { AskScreen } from '../AskScreen';

const DB_PATH = path.resolve(__dirname, '..', '..', '..', '..', '..', 'assets', 'db', 'quran.db');
const raw = new Database(DB_PATH, { readonly: true, fileMustExist: true });
const mockDb = {
  getAllSync: (sql: string, params: (string | number)[] = []) => raw.prepare(sql).all(...params),
  getFirstSync: (sql: string, params: (string | number)[] = []) =>
    raw.prepare(sql).get(...params) ?? null,
};
afterAll(() => raw.close());

const mockRouterPush = jest.fn();
jest.mock('expo-sqlite', () => ({ useSQLiteContext: () => mockDb }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockRouterPush }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => mockRouterPush.mockClear());

const submitQuery = async (view: Awaited<ReturnType<typeof render>>, q: string) => {
  await fireEvent.changeText(view.getByTestId('ask-input'), q);
  await fireEvent(view.getByTestId('ask-input'), 'submitEditing');
};

describe('AskScreen', () => {
  test('count question renders the honest count sentence with tappable refs', async () => {
    const view = await render(<AskScreen />);
    await submitQuery(view, 'How many verses mention bribery?');
    expect(view.getByTestId('ask-count')).toBeOnTheScreen();
    expect(view.getByText(/match(es)? “bribery” in the bundled translation/)).toBeOnTheScreen();
    // Tap the first citation chip (derived from the corpus, not assumed).
    const first = mockDb.getAllSync(
      'SELECT a.surah, a.ayah FROM ayahs_fts f JOIN ayahs a ON a.id = f.rowid WHERE ayahs_fts MATCH ? ORDER BY a.id LIMIT 1',
      ['"bribery" OR "bribe"']
    )[0] as { surah: number; ayah: number };
    await fireEvent.press(view.getByTestId(`ref-${first.surah}-${first.ayah}`));
    expect(mockRouterPush).toHaveBeenCalledWith(`/surah/${first.surah}?ayah=${first.ayah}`);
  });

  test('ruling question shows the redirect card, never an answer', async () => {
    const view = await render(<AskScreen />);
    await submitQuery(view, 'Is music halal?');
    expect(view.getByTestId('ask-redirect')).toBeOnTheScreen();
    expect(view.getByText(/qualified scholar/)).toBeOnTheScreen();
    expect(view.queryByTestId('ask-count')).toBeNull();
  });

  test('topical question lists verses; empty query shows the hint', async () => {
    const view = await render(<AskScreen />);
    expect(view.getByText(/Search-powered answers/)).toBeOnTheScreen();
    await submitQuery(view, 'patience');
    expect(view.getByTestId('ask-verses')).toBeOnTheScreen();
  });

  test('no matches shows the fixed empty response', async () => {
    const view = await render(<AskScreen />);
    await submitQuery(view, 'xylophone quantum blockchain');
    expect(view.getByTestId('ask-empty')).toBeOnTheScreen();
  });
});
