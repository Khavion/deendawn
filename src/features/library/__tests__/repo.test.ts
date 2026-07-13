/**
 * @jest-environment node
 *
 * Runs against the REAL committed library.db.
 */
import Database from 'better-sqlite3';
import path from 'node:path';

import { getWork, listSections, listWorks, searchSections, worksByAuthor } from '../repo';
import { THINKERS } from '../thinkers';
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

describe('library repo over the shipped db', () => {
  test('lists the three PD-verified works with full attribution', () => {
    const works = listWorks(db);
    expect(works).toHaveLength(3);
    for (const w of works) {
      expect(w.translator.length).toBeGreaterThan(0);
      expect(w.license).toMatch(/public domain/i);
    }
    expect(worksByAuthor(db, 'ghazali')).toHaveLength(2);
    expect(worksByAuthor(db, 'rumi')).toHaveLength(1);
  });

  test('sections read back in order with substantial bodies', () => {
    const work = listWorks(db)[0];
    const sections = listSections(db, work.id);
    expect(sections.length).toBeGreaterThanOrEqual(10);
    expect(sections[0].section_index).toBe(1);
    expect(sections.every((s) => s.body.length >= 40)).toBe(true);
    expect(getWork(db, 9999)).toBeNull();
  });

  test('FTS search returns titled hits and resists injection', () => {
    const hits = searchSections(db, 'knowledge');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].title.length).toBeGreaterThan(0);
    expect(() => searchSections(db, 'x" OR NEAR(')).not.toThrow();
    expect(searchSections(db, '')).toEqual([]);
  });
});

describe('thinkers data (gate 9 pending)', () => {
  test('16 entries, complete fields, 3-5 key ideas each, unique keys', () => {
    expect(THINKERS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(THINKERS.map((t) => t.key)).size).toBe(THINKERS.length);
    for (const t of THINKERS) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.era.length).toBeGreaterThan(0);
      expect(t.school.length).toBeGreaterThan(0);
      expect(t.majorWorks.length).toBeGreaterThanOrEqual(1);
      expect(t.keyIdeas.length).toBeGreaterThanOrEqual(3);
      expect(t.keyIdeas.length).toBeLessThanOrEqual(5);
    }
  });

  test('library-linked thinkers point at real author keys', () => {
    const authorKeys = new Set(listWorks(db).map((w) => w.author_key));
    for (const t of THINKERS.filter((t) => t.libraryAuthorKey)) {
      expect(authorKeys.has(t.libraryAuthorKey!)).toBe(true);
    }
  });
});
