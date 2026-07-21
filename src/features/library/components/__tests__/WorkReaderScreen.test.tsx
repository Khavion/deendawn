import { act, render } from '@testing-library/react-native';
import Database from 'better-sqlite3';
import React from 'react';
import path from 'node:path';

import { WorkReaderScreen } from '../WorkReaderScreen';

const raw = new Database(
  path.resolve(__dirname, '..', '..', '..', '..', '..', 'assets', 'db', 'library.db'),
  { readonly: true, fileMustExist: true }
);
const mockDb = {
  getAllSync: (sql: string, params: (string | number)[] = []) => raw.prepare(sql).all(...params),
  getFirstSync: (sql: string, params: (string | number)[] = []) =>
    raw.prepare(sql).get(...params) ?? null,
};
afterAll(() => raw.close());

// Controllable async db-open so we can observe the loading skeleton.
let mockResolveDb: (db: unknown) => void = () => {};
jest.mock('../../libraryDb', () => ({
  openLibraryDb: () =>
    new Promise((res) => {
      mockResolveDb = res;
    }),
}));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'en-US' }] }));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  Stack: { Screen: () => null },
}));

describe('WorkReaderScreen', () => {
  test('shows a skeleton while the library db opens, then the work content', async () => {
    const view = await render(<WorkReaderScreen />);
    // Before the async db-open resolves: skeleton, no sections.
    expect(view.getByTestId('work-loading')).toBeOnTheScreen();
    expect(view.queryByTestId('section-1')).toBeNull();

    await act(async () => {
      mockResolveDb(mockDb);
    });

    // After it resolves: skeleton gone, real sections render.
    expect(view.queryByTestId('work-loading')).toBeNull();
    expect(view.getByTestId('section-1')).toBeOnTheScreen();
  });
});
