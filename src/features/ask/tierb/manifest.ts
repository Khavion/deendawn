import nacl from 'tweetnacl';

import type { ModelArtifact } from './modelLock';

/**
 * Signed model manifest (research Rec #8 — supply-chain authenticity).
 *
 * The in-binary `model.lock` already makes downloads integrity-safe: a
 * compromised R2 bucket cannot substitute a different file with the same
 * SHA-256. This module adds the missing capability — authenticating a manifest
 * fetched FROM R2 so the set of downloadable models can be updated or rotated
 * post-launch WITHOUT an app release, without ever trusting the bucket.
 *
 * The manifest is signed offline with an Ed25519 private key (held out of the
 * repo and off any server); the app embeds only the PUBLIC key. Verification is
 * pure JS (tweetnacl) — no native module, runs in Hermes.
 *
 * DORMANT: like the rest of Tier B, this ships inert. EMBEDDED_PUBLIC_KEY is a
 * placeholder until the real keypair is generated alongside the model upload
 * (BLOCKERS A); with the placeholder, verification always fails closed (returns
 * null), so no unauthenticated manifest is ever trusted.
 */

export interface ManifestArtifact {
  id: string;
  filename: string;
  /** 64-hex sha256 of the file. */
  sha256: string;
  bytes: number;
  /** Path under the R2 public base URL. */
  path: string;
}

export interface ModelManifest {
  version: number;
  artifacts: ManifestArtifact[];
}

/** Base64 of the Ed25519 public key. Placeholder → verification fails closed. */
export const EMBEDDED_PUBLIC_KEY = 'PENDING-KEYGEN';

export function isRealPublicKey(keyB64: string): boolean {
  if (keyB64 === 'PENDING-KEYGEN') return false;
  const bytes = fromBase64(keyB64);
  return bytes !== null && bytes.length === nacl.sign.publicKeyLength;
}

/** Strict base64 → bytes; returns null on malformed input (never throws). */
export function fromBase64(b64: string): Uint8Array | null {
  if (typeof b64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) return null;
  try {
    // Buffer exists in RN (Hermes provides it); atob is not guaranteed.
    const buf = Buffer.from(b64, 'base64');
    // Reject non-canonical base64 (Buffer is lenient) by round-tripping.
    if (buf.toString('base64') !== b64) return null;
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

function isHex64(s: unknown): s is string {
  return typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);
}

function validShape(value: unknown): value is ModelManifest {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  if (typeof m.version !== 'number' || !Array.isArray(m.artifacts)) return false;
  return m.artifacts.every((a) => {
    if (typeof a !== 'object' || a === null) return false;
    const x = a as Record<string, unknown>;
    return (
      typeof x.id === 'string' &&
      typeof x.filename === 'string' &&
      isHex64(x.sha256) &&
      typeof x.bytes === 'number' &&
      x.bytes > 0 &&
      typeof x.path === 'string' &&
      // Never trust an absolute URL or a path that escapes the models prefix.
      !x.path.includes('..') &&
      !/^[a-z]+:\/\//i.test(x.path)
    );
  });
}

/**
 * Verify an Ed25519 detached signature over the EXACT manifest bytes, then
 * parse + structurally validate. Returns the manifest only if the signature is
 * valid AND the shape is sound; returns null on ANY failure (fails closed).
 *
 * `manifestJson` must be the exact UTF-8 string that was signed — do not
 * re-serialize before verifying, or the bytes (and the signature) won't match.
 */
export function verifyManifest(
  manifestJson: string,
  signatureB64: string,
  publicKeyB64: string = EMBEDDED_PUBLIC_KEY
): ModelManifest | null {
  const pub = fromBase64(publicKeyB64);
  const sig = fromBase64(signatureB64);
  if (!pub || pub.length !== nacl.sign.publicKeyLength) return null;
  if (!sig || sig.length !== nacl.sign.signatureLength) return null;

  const message = new Uint8Array(Buffer.from(manifestJson, 'utf8'));
  let ok = false;
  try {
    ok = nacl.sign.detached.verify(message, sig, pub);
  } catch {
    return null;
  }
  if (!ok) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(manifestJson);
  } catch {
    return null;
  }
  return validShape(parsed) ? parsed : null;
}

/**
 * Map a VERIFIED manifest's artifacts to the download manager's `ModelArtifact`
 * shape so an authenticated manifest can drive `ensureArtifact` directly. Only
 * call this on the result of `verifyManifest` — never on raw network JSON.
 */
export function manifestToArtifacts(manifest: ModelManifest): ModelArtifact[] {
  return manifest.artifacts.map((a) => ({
    id: a.id,
    filename: a.filename,
    sha256: a.sha256,
    approxBytes: a.bytes,
    path: a.path,
  }));
}
