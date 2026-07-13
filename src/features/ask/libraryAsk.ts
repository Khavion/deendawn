import { detectIntent, extractTerms } from './router';
import { searchSections, SectionRow } from '../library/repo';
import { QuranDb } from '../quran/repo';

/**
 * Ask over the philosophers library (E10 cross-source filter). Same Tier A
 * discipline as the Quran path: deterministic FTS only, and ruling-seeking
 * questions get the fixed scholar redirect — classical books are sources to
 * read, not a fatwa machine. No synonym expansion: these are translated
 * literary texts, so we match the user's own words only.
 */
export type LibraryAskResponse =
  | { kind: 'sections'; refs: (SectionRow & { title: string })[] }
  | { kind: 'rulingRedirect' }
  | { kind: 'empty' };

export const MAX_SECTION_REFS = 20;

export function askLibrary(db: QuranDb, rawQuery: string): LibraryAskResponse {
  const query = rawQuery.trim();
  if (query.length === 0) return { kind: 'empty' };

  if (detectIntent(query) === 'ruling') return { kind: 'rulingRedirect' };

  const terms = extractTerms(query);
  if (terms.length === 0) return { kind: 'empty' };

  const refs = searchSections(db, terms.join(' '), MAX_SECTION_REFS);
  if (refs.length === 0) return { kind: 'empty' };
  return { kind: 'sections', refs };
}

/** Short display snippet around the first matched term (plain slice — the
 * body is immutable source text; we never alter it, only window it). */
export function sectionSnippet(body: string, terms: string[], maxLength = 180): string {
  const lower = body.toLowerCase();
  let at = -1;
  for (const term of terms) {
    const i = lower.indexOf(term.toLowerCase());
    if (i >= 0 && (at === -1 || i < at)) at = i;
  }
  // Lead-in is a third of the window so the matched term always lands inside.
  const start = Math.max(0, at === -1 ? 0 : at - Math.floor(maxLength / 3));
  const slice = body.slice(start, start + maxLength).trim();
  const prefix = start > 0 ? '…' : '';
  const suffix = start + maxLength < body.length ? '…' : '';
  return `${prefix}${slice}${suffix}`;
}
