/**
 * model.lock — pinned Tier B artifacts (Rule 1.5f). Downloads come ONLY from
 * our R2 bucket; every file is SHA-256-verified before first load. Hashes are
 * PENDING until Zohaib uploads the files (BLOCKERS item A) — a pending
 * artifact can never pass verification, so Tier B stays inert.
 */
export interface ModelArtifact {
  id: string;
  filename: string;
  /** 64-hex sha256, or 'PENDING-UPLOAD'. */
  sha256: string;
  approxBytes: number;
  /** Path under the R2 public base URL (base itself comes from config). */
  path: string;
}

export const MODEL_LOCK: ModelArtifact[] = [
  {
    id: 'qwen3-1.7b-q4',
    filename: 'qwen3-1.7b-q4.gguf',
    sha256: 'PENDING-UPLOAD',
    approxBytes: 1_100_000_000,
    path: 'models/qwen3-1.7b-q4.gguf',
  },
  {
    id: 'qwen3-0.6b-q4',
    filename: 'qwen3-0.6b-q4.gguf',
    sha256: 'PENDING-UPLOAD',
    approxBytes: 450_000_000,
    path: 'models/qwen3-0.6b-q4.gguf',
  },
  {
    id: 'minilm-embeddings',
    filename: 'all-minilm-l6-v2.gguf',
    sha256: 'PENDING-UPLOAD',
    approxBytes: 25_000_000,
    path: 'models/all-minilm-l6-v2.gguf',
  },
  {
    id: 'ayah-embeddings',
    filename: 'ayah-embeddings.bin',
    sha256: 'PENDING-UPLOAD',
    approxBytes: 10_000_000,
    path: 'models/ayah-embeddings.bin',
  },
];

export function isDownloadable(a: ModelArtifact): boolean {
  return /^[0-9a-f]{64}$/.test(a.sha256);
}
