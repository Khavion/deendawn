/**
 * @jest-environment node
 *
 * iOS silently falls back to the default sound for notification audio over
 * 30 seconds — this gate makes that failure impossible to ship (E3 spec).
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SOUNDS_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'sounds');

/** Duration of a PCM RIFF/WAVE file from its header. */
function wavDurationSeconds(buf: Buffer): number {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('not a RIFF/WAVE file');
  }
  const byteRate = buf.readUInt32LE(28);
  // find the data chunk
  let offset = 12;
  while (offset < buf.length - 8) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'data') return size / byteRate;
    offset += 8 + size + (size % 2);
  }
  throw new Error('no data chunk');
}

describe('notification sound assets', () => {
  const wavs = readdirSync(SOUNDS_DIR).filter((f) => f.endsWith('.wav'));

  test('the bundled adhan clip exists', () => {
    expect(wavs).toContain('adhan_clip_placeholder.wav');
    expect(wavs).toContain('adhan_full_placeholder.wav');
  });

  test.each(wavs.filter((f) => f.includes('clip')))(
    '%s is under the 30s iOS notification-sound limit',
    (file) => {
      const duration = wavDurationSeconds(readFileSync(path.join(SOUNDS_DIR, file)));
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(30);
    }
  );

  test.each(wavs)('%s parses as a valid WAVE file', (file) => {
    expect(() => wavDurationSeconds(readFileSync(path.join(SOUNDS_DIR, file)))).not.toThrow();
  });
});
