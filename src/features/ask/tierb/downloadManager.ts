import { isDownloadable, ModelArtifact } from './modelLock';

/**
 * Tier B download manager (Rule 1.5f + §2 privacy): R2-only URLs, Wi-Fi-only
 * by default, resumable, SHA-256 verified before ready, deletable. All
 * platform effects are injected so the state machine is fully tested.
 */
export type DownloadState =
  | { phase: 'idle' }
  | { phase: 'blocked'; reason: 'pendingUpload' | 'cellular' | 'ineligibleDevice' }
  | { phase: 'downloading'; receivedBytes: number; totalBytes: number }
  | { phase: 'verifying' }
  | { phase: 'ready'; localPath: string }
  | { phase: 'failed'; reason: 'network' | 'hashMismatch' };

export interface DownloadPlatform {
  isWifi(): Promise<boolean>;
  /** Resumable fetch to a local path; reports progress; resolves when done. */
  download(
    url: string,
    destination: string,
    onProgress: (received: number, total: number) => void
  ): Promise<void>;
  sha256OfFile(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
}

export interface DownloadConfig {
  /** Our bucket only — never a third-party host. */
  r2BaseUrl: string;
  /** Documents dir (not Caches — survives OS cleanup). */
  documentsDir: string;
  allowCellular: boolean;
  deviceEligible: boolean;
}

export async function ensureArtifact(
  artifact: ModelArtifact,
  config: DownloadConfig,
  platform: DownloadPlatform,
  onState: (s: DownloadState) => void
): Promise<DownloadState> {
  const emit = (s: DownloadState) => {
    onState(s);
    return s;
  };

  if (!config.deviceEligible) return emit({ phase: 'blocked', reason: 'ineligibleDevice' });
  if (!isDownloadable(artifact)) return emit({ phase: 'blocked', reason: 'pendingUpload' });

  const localPath = `${config.documentsDir}/${artifact.filename}`;

  // Already present and intact?
  if (await platform.fileExists(localPath)) {
    emit({ phase: 'verifying' });
    if ((await platform.sha256OfFile(localPath)) === artifact.sha256) {
      return emit({ phase: 'ready', localPath });
    }
    await platform.deleteFile(localPath); // corrupt/stale — refetch
  }

  if (!config.allowCellular && !(await platform.isWifi())) {
    return emit({ phase: 'blocked', reason: 'cellular' });
  }

  try {
    await platform.download(`${config.r2BaseUrl}/${artifact.path}`, localPath, (received, total) =>
      emit({ phase: 'downloading', receivedBytes: received, totalBytes: total })
    );
  } catch {
    return emit({ phase: 'failed', reason: 'network' });
  }

  emit({ phase: 'verifying' });
  const digest = await platform.sha256OfFile(localPath);
  if (digest !== artifact.sha256) {
    await platform.deleteFile(localPath);
    return emit({ phase: 'failed', reason: 'hashMismatch' });
  }
  return emit({ phase: 'ready', localPath });
}

/** Settings "delete downloads" — frees everything Tier B ever stored. */
export async function deleteAllArtifacts(
  artifacts: ModelArtifact[],
  documentsDir: string,
  platform: Pick<DownloadPlatform, 'deleteFile' | 'fileExists'>
): Promise<number> {
  let deleted = 0;
  for (const artifact of artifacts) {
    const p = `${documentsDir}/${artifact.filename}`;
    if (await platform.fileExists(p)) {
      await platform.deleteFile(p);
      deleted++;
    }
  }
  return deleted;
}
