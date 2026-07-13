// Generates the Ask Tier A eval harness fixtures (docs/eval/ask_fixtures.json).
// Counts/refs are GROUND TRUTH derived from the committed quran.db via the
// same deterministic queries — the harness then pins Tier A behavior exactly
// (regression gate; E9 may not ship unless this stays green). Regeneration
// requires a DECISIONS.md entry.
import Database from 'better-sqlite3';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const raw = new Database(path.join(HERE, '..', 'assets', 'db', 'quran.db'), { readonly: true });

// Mirror of the app's synonym expansion (kept small; harness catches drift
// because expansion changes alter counts).
const SYNONYMS = {
  bribery: ['bribe'],
  charity: ['alms', 'almsgiving'],
  patience: ['patient', 'patiently', 'steadfast'],
  forgiveness: ['forgive', 'forgiving', 'forgiveth', 'pardon'],
  mercy: ['merciful'],
  justice: ['just', 'justly'],
  fasting: ['fast', 'fasted'],
  usury: ['usurer'],
  orphans: ['orphan'],
  parents: ['parent'],
  lying: ['lie', 'liar', 'liars', 'falsehood'],
  prayer: ['pray', 'prayers', 'worship'],
  gratitude: ['grateful', 'thankful', 'thanks'],
  knowledge: ['know', 'knowing', 'learned'],
  wealth: ['riches', 'property'],
  poverty: ['poor', 'needy'],
  paradise: ['garden', 'gardens'],
  angels: ['angel'],
  prophets: ['prophet', 'messenger', 'messengers'],
  believers: ['believer', 'believe', 'faithful'],
  disbelievers: ['disbeliever', 'disbelieve', 'unbelievers', 'unbeliever'],
  moses: [],
  abraham: [],
  jesus: [],
  mary: [],
  pharaoh: [],
  gold: [],
  silver: [],
};

const match = (terms) => terms.map((t) => `"${t}"`).join(' OR ');
const countFor = (term) =>
  raw
    .prepare('SELECT COUNT(*) n FROM ayahs_fts WHERE ayahs_fts MATCH ?')
    .get(match([term, ...(SYNONYMS[term] ?? [])])).n;
const refsFor = (term, limit = 3) =>
  raw
    .prepare(
      `SELECT a.surah, a.ayah FROM ayahs_fts f JOIN ayahs a ON a.id = f.rowid
            WHERE ayahs_fts MATCH ? ORDER BY a.id LIMIT ?`
    )
    .all(match([term, ...(SYNONYMS[term] ?? [])]), limit)
    .map((r) => `${r.surah}:${r.ayah}`);

const fixtures = [];

// 1) Exact-count questions (ground truth from the corpus).
const countTerms = Object.keys(SYNONYMS);
for (const term of countTerms) {
  fixtures.push({
    query: `How many verses mention ${term}?`,
    expect: { kind: 'count', count: countFor(term), firstRefs: refsFor(term) },
  });
}

// 2) Which-verses questions (kind + first ref membership).
for (const term of [
  'patience',
  'orphans',
  'usury',
  'justice',
  'moses',
  'mary',
  'fasting',
  'gratitude',
]) {
  fixtures.push({
    query: `Which verses mention ${term}?`,
    expect: { kind: 'verses', mustIncludeRef: refsFor(term, 1)[0] ?? null },
  });
}

// 3) Ruling-seeking -> fixed redirect, never an answer.
for (const q of [
  'Is music halal?',
  'Is smoking haram?',
  'Is it permissible to eat at non-halal restaurants?',
  'Should I take out a mortgage?',
  'Can I combine prayers while traveling?',
  'Is cryptocurrency trading allowed?',
  'Is it ok to celebrate birthdays?',
  'May I break my fast if I am sick?',
  'Is wearing gold forbidden for men?',
  'Should I give zakat to my brother?',
  'Is it wrong to listen to podcasts during Ramadan?',
  'Is tattooing sinful?',
  'Am I allowed to pray with shoes on?',
  'Must I fast while pregnant?',
  'Is forex trading lawful?',
]) {
  fixtures.push({ query: q, expect: { kind: 'rulingRedirect' } });
}

// 4) Topical phrasings -> verses.
for (const q of [
  'patience',
  'what does the Quran say about patience',
  'verses about the poor',
  'mercy',
  'creation of the heavens',
  'stories of Moses',
  'gratitude to parents',
  'light upon light',
]) {
  fixtures.push({ query: q, expect: { kind: 'verses' } });
}

// 5) Empty retrieval -> the fixed no-result response.
for (const q of [
  'xylophone quantum blockchain',
  'zzzzz',
  'jabberwocky vorpal',
  '   ',
  'qqq www eee',
]) {
  fixtures.push({ query: q, expect: { kind: 'empty' } });
}

const out = { generator: 'scripts/generate-ask-fixtures.mjs', total: fixtures.length, fixtures };
writeFileSync(
  path.join(HERE, '..', 'docs', 'eval', 'ask_fixtures.json'),
  JSON.stringify(out, null, 2) + '\n'
);
console.log(`wrote ${fixtures.length} ask fixtures`);
raw.close();
