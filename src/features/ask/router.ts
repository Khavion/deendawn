import { expandTerm } from './synonyms';
import { hasArabic, normalizeArabicQuery } from '../quran/normalize';
import { AyahRow, QuranDb } from '../quran/repo';

/**
 * Ask Tier A - deterministic retrieval ONLY (CLAUDE.md Rule 1.5). Counting
 * and locating questions get exact FTS answers phrased as verifiable corpus
 * facts; ruling-seeking questions get a fixed redirect; nothing is generated.
 */
export type AskResponse =
  | { kind: 'count'; term: string; count: number; refs: AyahRow[] }
  | { kind: 'verses'; refs: AyahRow[] }
  | { kind: 'rulingRedirect'; refs: AyahRow[] }
  | { kind: 'empty' };

export type AskIntent = 'count' | 'list' | 'ruling' | 'topical';

// Ruling-seeking patterns (EN + Arabic-script; escapes per the guard policy:
// halal, haram, yajooz, ja'iz).
const RULING_PATTERNS = [
  /\b(halal|haram|permissible|impermissible|forbidden|allowed|lawful|unlawful|makruh|sinful|a sin)\b/i,
  /\b(should|can|may|must)\s+i\b/i,
  /\bis it (ok|okay|wrong|bad|good)\b/i,
  /\bam i allowed\b/i,
  /\u062D\u0644\u0627\u0644|\u062D\u0631\u0627\u0645/,
  /\u064A\u062C\u0648\u0632/,
  /\u062C\u0627\u0626\u0632/,
];

// count: "how many", "number of", Arabic "kam".
const COUNT_PATTERNS = [/\bhow many\b/i, /\bnumber of\b/i, /\bhow often\b/i, /\u0643\u0645\s/];

const LIST_PATTERNS = [
  /\bwhich (verses?|ayahs?|surahs?)\b/i,
  /\bwhere (does|is|do|did)\b/i,
  /\blist\b.*\b(verses?|ayahs?)\b/i,
  /\bfind (verses?|ayahs?)\b/i,
];

export function detectIntent(query: string): AskIntent {
  if (RULING_PATTERNS.some((re) => re.test(query))) return 'ruling';
  if (COUNT_PATTERNS.some((re) => re.test(query))) return 'count';
  if (LIST_PATTERNS.some((re) => re.test(query))) return 'list';
  return 'topical';
}

const STOPWORDS = new Set(
  `a an the is are was were be been do does did how many much often number of verse verses ayah ayahs surah surahs quran koran mention mentions mentioned about say says said speak speaks talk talks regarding contain contains word words which where what when list find in on for to with and or that this it i me my you your can could should would may must halal haram permissible forbidden allowed ok okay wrong bad good whats`.split(
    /\s+/
  )
);

/** Content terms left after stripping question scaffolding. */
export function extractTerms(query: string): string[] {
  if (hasArabic(query)) {
    const folded = normalizeArabicQuery(query);
    return folded.split(/\s+/).filter((w) => w.length >= 2);
  }
  return query
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Quoted, OR-joined FTS match string across a term list (injection-safe). */
function ftsMatch(terms: string[]): string {
  return terms.map((t) => `"${t.replace(/"/g, '')}"`).join(' OR ');
}

function searchExpanded(db: QuranDb, terms: string[], limit: number): AyahRow[] {
  const expanded = terms.flatMap(expandTerm);
  if (expanded.length === 0) return [];
  return db.getAllSync<AyahRow>(
    `SELECT a.* FROM ayahs_fts f JOIN ayahs a ON a.id = f.rowid
     WHERE ayahs_fts MATCH ? ORDER BY a.id LIMIT ?`,
    [ftsMatch(expanded), limit]
  );
}

function countExpanded(db: QuranDb, terms: string[]): number {
  const expanded = terms.flatMap(expandTerm);
  if (expanded.length === 0) return 0;
  const row = db.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) n FROM ayahs_fts WHERE ayahs_fts MATCH ?',
    [ftsMatch(expanded)]
  );
  return row?.n ?? 0;
}

export const MAX_REFS = 20;

export function ask(db: QuranDb, rawQuery: string): AskResponse {
  const query = rawQuery.trim();
  if (query.length === 0) return { kind: 'empty' };
  const intent = detectIntent(query);
  const terms = extractTerms(query);

  if (intent === 'ruling') {
    // Fixed redirect - never an opinion. Related verses are retrieval only.
    return { kind: 'rulingRedirect', refs: searchExpanded(db, terms, 5) };
  }

  if (terms.length === 0) return { kind: 'empty' };

  if (intent === 'count') {
    const count = countExpanded(db, terms);
    return {
      kind: 'count',
      term: terms.join(' '),
      count,
      refs: searchExpanded(db, terms, MAX_REFS),
    };
  }

  const refs = searchExpanded(db, terms, MAX_REFS);
  if (refs.length === 0) return { kind: 'empty' };
  return { kind: 'verses', refs };
}
