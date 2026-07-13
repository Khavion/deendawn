// Engineering placeholders (pure silence) so the adhan-sound epic is fully
// buildable and testable before license-cleared recordings arrive (BLOCKERS
// item B). Real recordings will be pipeline artifacts with checksums.
import { writeFileSync, mkdirSync } from 'node:fs';

function silentWav(seconds, sampleRate = 8000) {
  const samples = seconds * sampleRate;
  const dataSize = samples * 2; // 16-bit mono
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits/sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  return buf;
}

mkdirSync('assets/sounds', { recursive: true });
writeFileSync('assets/sounds/adhan-clip-placeholder.wav', silentWav(3));
writeFileSync('assets/sounds/adhan-full-placeholder.wav', silentWav(5));
console.log('placeholder sounds written (3s clip, 5s full)');
