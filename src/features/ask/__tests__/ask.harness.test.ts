/**
 * @jest-environment node
 *
 * Ask Tier A eval harness (PHASE_2 E8). Replays docs/eval/ask_fixtures.json
 * against the REAL committed database and asserts exact matches. This suite
 * gates E9: Tier B may not ship unless Tier A behavior is pinned and green.
 */
import Database from 'better-sqlite3';
import path from 'node:path';

import { ask, detectIntent, extractTerms } from '../router';
import { QuranDb } from '../../quran/repo';
import fixturesJson from '../../../../docs/eval/ask_fixtures.json';

const DB_PATH = path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'db', 'quran.db');
const raw = new Database(DB_PATH, { readonly: true, fileMustExist: true });
const db: QuranDb = {
  getAllSync: (sql, params = []) => raw.prepare(sql).all(...params) as never,
  getFirstSync: (sql, params = []) => (raw.prepare(sql).get(...params) as never) ?? null,
};
afterAll(() => raw.close());

interface Fixture {
  query: string;
  expect: {
    kind: string;
    count?: number;
    firstRefs?: string[];
    mustIncludeRef?: string | null;
  };
}

const fixtures = fixturesJson.fixtures as Fixture[];

test('harness has at least 60 fixtures across all intents', () => {
  expect(fixtures.length).toBeGreaterThanOrEqual(60);
  const kinds = new Set(fixtures.map((f) => f.expect.kind));
  expect([...kinds].sort()).toEqual(['count', 'empty', 'rulingRedirect', 'verses']);
});

describe.each(fixtures.map((f, i) => [i, f.query, f] as const))(
  'fixture %i: "%s"',
  (_i, _q, fixture) => {
    test('matches expected response exactly', () => {
      const response = ask(db, fixture.query);
      expect(response.kind).toBe(fixture.expect.kind);

      if (fixture.expect.kind === 'count' && response.kind === 'count') {
        expect(response.count).toBe(fixture.expect.count);
        const refs = response.refs.map((r) => `${r.surah}:${r.ayah}`);
        expect(refs.slice(0, fixture.expect.firstRefs!.length)).toEqual(fixture.expect.firstRefs);
      }
      if (fixture.expect.kind === 'verses' && response.kind === 'verses') {
        expect(response.refs.length).toBeGreaterThan(0);
        if (fixture.expect.mustIncludeRef) {
          expect(response.refs.map((r) => `${r.surah}:${r.ayah}`)).toContain(
            fixture.expect.mustIncludeRef
          );
        }
      }
      if (fixture.expect.kind === 'rulingRedirect' && response.kind === 'rulingRedirect') {
        // Redirects never carry a generated answer — refs only, capped small.
        expect(response.refs.length).toBeLessThanOrEqual(5);
      }
    });
  }
);

describe('router internals', () => {
  test('intent detection basics', () => {
    expect(detectIntent('How many verses mention mercy?')).toBe('count');
    expect(detectIntent('Which verses mention orphans?')).toBe('list');
    expect(detectIntent('Is music halal?')).toBe('ruling');
    expect(detectIntent('patience')).toBe('topical');
  });

  test('term extraction strips scaffolding and keeps content', () => {
    expect(extractTerms('How many verses mention bribery?')).toEqual(['bribery']);
    expect(extractTerms('what does the Quran say about patience')).toEqual(['patience']);
  });

  test('count answers are exact FTS counts (spot check against direct SQL)', () => {
    const direct = (
      raw
        .prepare('SELECT COUNT(*) n FROM ayahs_fts WHERE ayahs_fts MATCH ?')
        .get('"bribery" OR "bribe"') as { n: number }
    ).n;
    const response = ask(db, 'How many verses mention bribery?');
    expect(response.kind).toBe('count');
    if (response.kind === 'count') expect(response.count).toBe(direct);
  });
});
