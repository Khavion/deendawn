import { Asset } from 'expo-asset';
import { File, Directory, Paths } from 'expo-file-system';
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';

import { log } from '../../lib/log';

/**
 * library.db ships as a bundled asset (built + hash-pinned by the content
 * pipeline). expo-sqlite's provider handles one db (quran.db); this opens the
 * second by copying the asset into the SQLite directory once per bundle
 * version (size-compared), then opening it read-only.
 */
let cached: SQLiteDatabase | null = null;

export async function openLibraryDb(): Promise<SQLiteDatabase> {
  if (cached) return cached;
  const asset = Asset.fromModule(require('@/assets/db/library.db'));
  await asset.downloadAsync();
  const sqliteDir = new Directory(Paths.document, 'SQLite');
  if (!sqliteDir.exists) sqliteDir.create({ intermediates: true });
  const dest = new File(sqliteDir, 'library.db');
  const source = new File(asset.localUri!);
  if (!dest.exists || dest.size !== source.size) {
    if (dest.exists) dest.delete();
    source.copy(dest);
    log.info('library', 'library.db copied from bundle', { bytes: dest.size ?? 0 });
  }
  cached = openDatabaseSync('library.db');
  return cached;
}
