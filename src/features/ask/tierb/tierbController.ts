import type { DownloadState } from './downloadManager';
import type { DeviceTier } from './deviceTier';
import { isDownloadable, MODEL_LOCK, ModelArtifact } from './modelLock';

/**
 * Pure orchestration for the Tier B management card: which artifacts a device
 * needs, their combined size, and the single DownloadState the card renders.
 * No side effects and no native imports — the hook that drives real downloads
 * injects platform effects (downloadManager.DownloadPlatform). Ships inert:
 * every artifact is PENDING-UPLOAD (BLOCKERS A) so the derived state is always
 * `blocked: pendingUpload` until Zohaib uploads the files.
 */

/** The always-needed pieces plus the tier-appropriate generation model. */
export function selectArtifacts(tier: DeviceTier): ModelArtifact[] {
  const byId = (id: string) => MODEL_LOCK.find((a) => a.id === id)!;
  const generationModel = tier === 'rich' ? 'qwen3-1.7b-q4' : 'qwen3-0.6b-q4';
  return [byId(generationModel), byId('minilm-embeddings'), byId('ayah-embeddings')];
}

export function totalBytes(artifacts: ModelArtifact[]): number {
  return artifacts.reduce((sum, a) => sum + a.approxBytes, 0);
}

/** Human size label, e.g. "1.1 GB" or "485 MB". */
export function formatBytes(bytes: number): string {
  const GB = 1_000_000_000;
  const MB = 1_000_000;
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`;
  return `${Math.round(bytes / MB)} MB`;
}

/**
 * Collapse per-artifact states into the one the card shows. Worst-actionable
 * state wins: a block/failure the user must see beats an in-progress step.
 */
export function aggregateDownloadState(states: DownloadState[]): DownloadState {
  if (states.length === 0) return { phase: 'idle' };
  const blocked = states.find((s) => s.phase === 'blocked');
  if (blocked) return blocked;
  const failed = states.find((s) => s.phase === 'failed');
  if (failed) return failed;
  const downloading = states.filter(
    (s): s is Extract<DownloadState, { phase: 'downloading' }> => s.phase === 'downloading'
  );
  if (downloading.length > 0) {
    return {
      phase: 'downloading',
      receivedBytes: downloading.reduce((n, s) => n + s.receivedBytes, 0),
      totalBytes: downloading.reduce((n, s) => n + s.totalBytes, 0),
    };
  }
  if (states.some((s) => s.phase === 'verifying')) return { phase: 'verifying' };
  if (states.every((s) => s.phase === 'ready')) {
    return { phase: 'ready', localPath: '' };
  }
  return { phase: 'idle' };
}

/**
 * The card's state before any download is attempted, derived from device
 * eligibility and whether the pinned artifacts are actually downloadable yet.
 * Ineligible device and not-yet-published models are both honest blocks.
 */
export function initialControllerState(
  artifacts: ModelArtifact[],
  deviceEligible: boolean
): DownloadState {
  if (!deviceEligible) return { phase: 'blocked', reason: 'ineligibleDevice' };
  if (!artifacts.every(isDownloadable)) return { phase: 'blocked', reason: 'pendingUpload' };
  return { phase: 'idle' };
}
