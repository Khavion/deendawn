import { QuranDb } from '../quran/repo';

export interface WorkRow {
  id: number;
  artifact_id: string;
  author_key: string;
  title: string;
  translator: string;
  year: number;
  license: string;
  source_url: string;
}

export interface SectionRow {
  id: number;
  work_id: number;
  section_index: number;
  body: string;
}

export function listWorks(db: QuranDb): WorkRow[] {
  return db.getAllSync<WorkRow>('SELECT * FROM works ORDER BY author_key, year', []);
}

export function worksByAuthor(db: QuranDb, authorKey: string): WorkRow[] {
  return db.getAllSync<WorkRow>('SELECT * FROM works WHERE author_key = ? ORDER BY year', [
    authorKey,
  ]);
}

export function getWork(db: QuranDb, id: number): WorkRow | null {
  return db.getFirstSync<WorkRow>('SELECT * FROM works WHERE id = ?', [id]);
}

export function listSections(db: QuranDb, workId: number): SectionRow[] {
  return db.getAllSync<SectionRow>(
    'SELECT * FROM sections WHERE work_id = ? ORDER BY section_index',
    [workId]
  );
}

/** FTS over section bodies; tokens quoted so input cannot inject syntax. */
export function searchSections(
  db: QuranDb,
  query: string,
  limit = 30
): (SectionRow & { title: string })[] {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/"/g, ''))
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];
  const match = tokens.map((t) => `"${t}"`).join(' OR ');
  return db.getAllSync<SectionRow & { title: string }>(
    `SELECT s.*, w.title FROM sections_fts f
     JOIN sections s ON s.id = f.rowid
     JOIN works w ON w.id = s.work_id
     WHERE sections_fts MATCH ? ORDER BY s.id LIMIT ?`,
    [match, limit]
  );
}
