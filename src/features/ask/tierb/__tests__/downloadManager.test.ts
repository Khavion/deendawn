/**
 * @jest-environment node
 */
import { createHash } from 'node:crypto';

import { deleteAllArtifacts, DownloadPlatform, ensureArtifact } from '../downloadManager';
import { isDownloadable, MODEL_LOCK, ModelArtifact } from '../modelLock';

const BYTES = Buffer.from('tiny stub model weights');
const HASH = createHash('sha256').update(BYTES).digest('hex');

const artifact: ModelArtifact = {
  id: 'stub',
  filename: 'stub.gguf',
  sha256: HASH,
  approxBytes: BYTES.length,
  path: 'models/stub.gguf',
};

function fakePlatform(opts: {
  wifi?: boolean;
  files?: Map<string, Buffer>;
  failDownload?: boolean;
  corrupt?: boolean;
}): DownloadPlatform & { files: Map<string, Buffer> } {
  const files = opts.files ?? new Map<string, Buffer>();
  return {
    files,
    isWifi: async () => opts.wifi ?? true,
    download: async (_url, dest, onProgress) => {
      if (opts.failDownload) throw new Error('network');
      onProgress(BYTES.length / 2, BYTES.length);
      files.set(dest, opts.corrupt ? Buffer.from('corrupted!!') : BYTES);
      onProgress(BYTES.length, BYTES.length);
    },
    sha256OfFile: async (p) =>
      createHash('sha256')
        .update(files.get(p) ?? Buffer.alloc(0))
        .digest('hex'),
    deleteFile: async (p) => void files.delete(p),
    fileExists: async (p) => files.has(p),
  };
}

const config = {
  r2BaseUrl: 'https://r2.example',
  documentsDir: '/docs',
  allowCellular: false,
  deviceEligible: true,
};

describe('model.lock', () => {
  test('all real artifacts are pending upload — Tier B is inert until item A lands', () => {
    expect(MODEL_LOCK.length).toBeGreaterThanOrEqual(4);
    for (const a of MODEL_LOCK) expect(isDownloadable(a)).toBe(false);
  });
});

describe('ensureArtifact', () => {
  test('happy path: wifi download, verify, ready', async () => {
    const states: string[] = [];
    const result = await ensureArtifact(artifact, config, fakePlatform({}), (s) =>
      states.push(s.phase)
    );
    expect(result).toEqual({ phase: 'ready', localPath: '/docs/stub.gguf' });
    expect(states).toContain('downloading');
    expect(states).toContain('verifying');
  });

  test('pending-upload artifacts are blocked before any network use', async () => {
    const platform = fakePlatform({});
    const spy = jest.spyOn(platform, 'download');
    const result = await ensureArtifact(MODEL_LOCK[0], config, platform, () => {});
    expect(result).toEqual({ phase: 'blocked', reason: 'pendingUpload' });
    expect(spy).not.toHaveBeenCalled();
  });

  test('ineligible devices never see a download', async () => {
    const result = await ensureArtifact(
      artifact,
      { ...config, deviceEligible: false },
      fakePlatform({}),
      () => {}
    );
    expect(result).toEqual({ phase: 'blocked', reason: 'ineligibleDevice' });
  });

  test('cellular is blocked by default; allowed when opted in', async () => {
    const noWifi = fakePlatform({ wifi: false });
    expect((await ensureArtifact(artifact, config, noWifi, () => {})).phase).toBe('blocked');
    const allowed = await ensureArtifact(
      artifact,
      { ...config, allowCellular: true },
      fakePlatform({ wifi: false }),
      () => {}
    );
    expect(allowed.phase).toBe('ready');
  });

  test('hash mismatch deletes the file and fails safe', async () => {
    const platform = fakePlatform({ corrupt: true });
    const result = await ensureArtifact(artifact, config, platform, () => {});
    expect(result).toEqual({ phase: 'failed', reason: 'hashMismatch' });
    expect(platform.files.has('/docs/stub.gguf')).toBe(false);
  });

  test('existing intact file short-circuits to ready; stale file is refetched', async () => {
    const platform = fakePlatform({ files: new Map([['/docs/stub.gguf', BYTES]]) });
    const spy = jest.spyOn(platform, 'download');
    const result = await ensureArtifact(artifact, config, platform, () => {});
    expect(result.phase).toBe('ready');
    expect(spy).not.toHaveBeenCalled();

    const stale = fakePlatform({ files: new Map([['/docs/stub.gguf', Buffer.from('old')]]) });
    const refetched = await ensureArtifact(artifact, config, stale, () => {});
    expect(refetched.phase).toBe('ready');
  });

  test('network failure surfaces as failed:network', async () => {
    const result = await ensureArtifact(
      artifact,
      config,
      fakePlatform({ failDownload: true }),
      () => {}
    );
    expect(result).toEqual({ phase: 'failed', reason: 'network' });
  });
});

describe('deleteAllArtifacts', () => {
  test('frees everything and reports the count', async () => {
    const platform = fakePlatform({
      files: new Map([
        ['/docs/stub.gguf', BYTES],
        ['/docs/other.bin', BYTES],
      ]),
    });
    const deleted = await deleteAllArtifacts(
      [artifact, { ...artifact, filename: 'other.bin' }, { ...artifact, filename: 'missing.bin' }],
      '/docs',
      platform
    );
    expect(deleted).toBe(2);
    expect(platform.files.size).toBe(0);
  });
});
