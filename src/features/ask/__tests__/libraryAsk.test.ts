/**
 * @jest-environment node
 *
 * Ask-over-library runs against the REAL committed library.db.
 */
import Database from 'better-sqlite3';
import path from 'node:path';

import { askLibrary, sectionSnippet } from '../libraryAsk';
import { QuranDb } from '../../quran/repo';

const raw = new Database(
  path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'db', 'library.db'),
  { readonly: true, fileMustExist: true }
);
const db: QuranDb = {
  getAllSync: (sql, params = []) => raw.prepare(sql).all(...params) as never,
  getFirstSync: (sql, params = []) => (raw.prepare(sql).get(...params) as never) ?? null,
};
afterAll(() => raw.close());

describe('askLibrary over the shipped db', () => {
  test('topical query returns sections with work titles and bodies', () => {
    const res = askLibrary(db, 'knowledge of the soul');
    expect(res.kind).toBe('sections');
    if (res.kind !== 'sections') return;
    expect(res.refs.length).toBeGreaterThan(0);
    expect(res.refs.length).toBeLessThanOrEqual(20);
    for (const ref of res.refs) {
      expect(ref.title.length).toBeGreaterThan(0);
      expect(ref.body.length).toBeGreaterThan(0);
      expect(ref.work_id).toBeGreaterThan(0);
    }
  });

  test('ruling-seeking queries get the fixed redirect, never book passages', () => {
    expect(askLibrary(db, 'is music haram?')).toEqual({ kind: 'rulingRedirect' });
    expect(askLibrary(db, 'should I take this loan')).toEqual({ kind: 'rulingRedirect' });
  });

  test('no matches and blank input are honest empties', () => {
    expect(askLibrary(db, 'zzxqwv unfindable').kind).toBe('empty');
    expect(askLibrary(db, '   ').kind).toBe('empty');
    // Stopword-only queries extract no terms.
    expect(askLibrary(db, 'the and of').kind).toBe('empty');
  });

  test('results deep-link into real works (ids resolve)', () => {
    const res = askLibrary(db, 'heart');
    expect(res.kind).toBe('sections');
    if (res.kind !== 'sections') return;
    const work = raw.prepare('SELECT id FROM works WHERE id = ?').get(res.refs[0].work_id) as
      { id: number } | undefined;
    expect(work?.id).toBe(res.refs[0].work_id);
  });
});

describe('sectionSnippet', () => {
  const body =
    'It is a long established truth that the heart which remembers finds rest, ' +
    'and the seeker of knowledge travels far beyond the boundaries of the known world.';

  test('windows around the first matched term with ellipses', () => {
    const snip = sectionSnippet(body, ['knowledge'], 60);
    expect(snip).toContain('knowledge');
    expect(snip.startsWith('…')).toBe(true);
    expect(snip.endsWith('…')).toBe(true);
  });

  test('falls back to the opening when no term matches', () => {
    const snip = sectionSnippet(body, ['unfindable'], 40);
    expect(snip.startsWith('It is a long')).toBe(true);
  });
});
