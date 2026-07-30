import { Asset } from 'expo-asset';
import { File, Directory, Paths } from 'expo-file-system';
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';

import { log } from '../../lib/log';

/**
 * library.db ships as a bundled asset (built + hash-pinned by the content
 * pipeline). expo-sqlite's provider handles one db (quran.db); this opens the
 * second by copying the asset into the SQLite directory once per bundle
 * version (size-compared), then opening it read-only.
 *
 * File.copy() is ASYNC in SDK 57 — it MUST be awaited. The original
 * fire-and-forget call let openDatabaseSync win the race, create an empty
 * library.db, fail every query, and the late copy then rejected with
 * "Destination already exists" (hit on Android from a wiped container,
 * 2026-07-30). The in-flight promise is cached so concurrent callers share
 * one copy+open sequence.
 */
let cached: SQLiteDatabase | null = null;
let opening: Promise<SQLiteDatabase> | null = null;

export function openLibraryDb(): Promise<SQLiteDatabase> {
  if (cached) return Promise.resolve(cached);
  if (opening) return opening;
  opening = (async () => {
    try {
      const asset = Asset.fromModule(require('@/assets/db/library.db'));
      await asset.downloadAsync();
      const sqliteDir = new Directory(Paths.document, 'SQLite');
      if (!sqliteDir.exists) sqliteDir.create({ intermediates: true });
      const dest = new File(sqliteDir, 'library.db');
      const source = new File(asset.localUri!);
      if (!dest.exists || dest.size !== source.size) {
        await source.copy(dest, { overwrite: true });
        log.info('library', 'library.db copied from bundle', { bytes: dest.size ?? 0 });
      }
      cached = openDatabaseSync('library.db');
      return cached;
    } finally {
      // On failure the next call starts a fresh sequence (no poisoned cache).
      opening = null;
    }
  })();
  return opening;
}
