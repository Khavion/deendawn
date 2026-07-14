import nacl from 'tweetnacl';

import {
  EMBEDDED_PUBLIC_KEY,
  fromBase64,
  isRealPublicKey,
  manifestToArtifacts,
  verifyManifest,
} from '../manifest';
import { isDownloadable } from '../modelLock';

const toB64 = (u: Uint8Array) => Buffer.from(u).toString('base64');

const goodManifest = JSON.stringify({
  version: 1,
  artifacts: [
    {
      id: 'qwen3-1.7b-q4',
      filename: 'qwen3-1.7b-q4.gguf',
      sha256: 'a'.repeat(64),
      bytes: 1_100_000_000,
      path: 'models/qwen3-1.7b-q4.gguf',
    },
  ],
});

function sign(message: string) {
  const kp = nacl.sign.keyPair();
  const sig = nacl.sign.detached(new Uint8Array(Buffer.from(message, 'utf8')), kp.secretKey);
  return { publicKeyB64: toB64(kp.publicKey), signatureB64: toB64(sig) };
}

describe('verifyManifest', () => {
  it('accepts a correctly-signed, well-formed manifest', () => {
    const { publicKeyB64, signatureB64 } = sign(goodManifest);
    const m = verifyManifest(goodManifest, signatureB64, publicKeyB64);
    expect(m).not.toBeNull();
    expect(m?.artifacts[0].id).toBe('qwen3-1.7b-q4');
  });

  it('rejects a tampered manifest (signature no longer matches)', () => {
    const { publicKeyB64, signatureB64 } = sign(goodManifest);
    const tampered = goodManifest.replace('1100000000', '1');
    expect(verifyManifest(tampered, signatureB64, publicKeyB64)).toBeNull();
  });

  it('rejects a valid signature from the WRONG key', () => {
    const { signatureB64 } = sign(goodManifest);
    const otherKey = toB64(nacl.sign.keyPair().publicKey);
    expect(verifyManifest(goodManifest, signatureB64, otherKey)).toBeNull();
  });

  it('fails closed on the placeholder embedded key', () => {
    const { signatureB64 } = sign(goodManifest);
    // Default key is the PENDING placeholder → always null.
    expect(verifyManifest(goodManifest, signatureB64)).toBeNull();
    expect(isRealPublicKey(EMBEDDED_PUBLIC_KEY)).toBe(false);
  });

  it('rejects malformed base64 signature/key without throwing', () => {
    const { publicKeyB64 } = sign(goodManifest);
    expect(verifyManifest(goodManifest, 'not base64!!', publicKeyB64)).toBeNull();
    expect(verifyManifest(goodManifest, toB64(new Uint8Array(64)), '@@bad@@')).toBeNull();
  });

  it('rejects a signed but structurally-invalid manifest', () => {
    const bad = JSON.stringify({
      version: 1,
      artifacts: [{ id: 'x', filename: 'y', sha256: 'tooshort', bytes: 1, path: 'models/y' }],
    });
    const { publicKeyB64, signatureB64 } = sign(bad);
    expect(verifyManifest(bad, signatureB64, publicKeyB64)).toBeNull();
  });

  it('rejects a signed manifest whose path escapes or is absolute (even if signed)', () => {
    for (const path of ['../secrets/x.gguf', 'https://evil.com/x.gguf']) {
      const m = JSON.stringify({
        version: 1,
        artifacts: [
          { id: 'x', filename: 'x.gguf', sha256: 'a'.repeat(64), bytes: 10, path },
        ],
      });
      const { publicKeyB64, signatureB64 } = sign(m);
      expect(verifyManifest(m, signatureB64, publicKeyB64)).toBeNull();
    }
  });

  it('rejects signature over DIFFERENT bytes than presented (re-serialization guard)', () => {
    const { publicKeyB64, signatureB64 } = sign(goodManifest);
    // Same logical JSON, different whitespace → different bytes → must fail.
    const reserialized = JSON.stringify(JSON.parse(goodManifest), null, 2);
    expect(verifyManifest(reserialized, signatureB64, publicKeyB64)).toBeNull();
  });
});

describe('manifestToArtifacts', () => {
  it('maps a verified manifest into downloadable ModelArtifacts', () => {
    const { publicKeyB64, signatureB64 } = sign(goodManifest);
    const m = verifyManifest(goodManifest, signatureB64, publicKeyB64)!;
    const artifacts = manifestToArtifacts(m);
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]).toEqual({
      id: 'qwen3-1.7b-q4',
      filename: 'qwen3-1.7b-q4.gguf',
      sha256: 'a'.repeat(64),
      approxBytes: 1_100_000_000,
      path: 'models/qwen3-1.7b-q4.gguf',
    });
    // A real 64-hex sha256 from a signed manifest is immediately downloadable.
    expect(isDownloadable(artifacts[0])).toBe(true);
  });
});

describe('fromBase64', () => {
  it('round-trips and rejects non-canonical input', () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    expect(fromBase64(toB64(bytes))).toEqual(bytes);
    expect(fromBase64('!!!')).toBeNull();
    expect(fromBase64('')).toEqual(new Uint8Array([]));
  });
});
