/**
 * Dev-only audio server for exercising the streaming player before licensed
 * recitation recordings exist (docs/BLOCKERS.md item 2). Serves a synthesized
 * 60-second gentle tone — clearly NOT recitation; the app shows a persistent
 * "DEV audio" badge whenever this source is used (constitution rule 1: no
 * generated content is ever presented as religious content).
 *
 * Any GET /{reciterId}/{NNN}.m4a returns the same tone, with HTTP Range
 * support (AVPlayer requires byte-range requests for streaming).
 *
 * Usage: node scripts/dev-audio-server.mjs   (listens on 8083)
 */
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 8083;
const CACHE_DIR = join(tmpdir(), 'deendawn-dev-audio');
const M4A_PATH = join(CACHE_DIR, 'dev-tone.m4a');

function synthesizeWav(path) {
  const sampleRate = 22050;
  const seconds = 60;
  const n = sampleRate * seconds;
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const tSec = i / sampleRate;
    // A soft two-note pattern with slow tremolo so seeking is audible in dev.
    const freq = Math.floor(tSec / 2) % 2 === 0 ? 293.66 : 220;
    const envelope = 0.18 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.25 * tSec));
    const sample = Math.sin(2 * Math.PI * freq * tSec) * envelope;
    data.writeInt16LE(Math.round(sample * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([header, data]));
}

function ensureTone() {
  if (existsSync(M4A_PATH) && statSync(M4A_PATH).size > 0) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  const wavPath = join(CACHE_DIR, 'dev-tone.wav');
  synthesizeWav(wavPath);
  // macOS built-in AAC encoder; m4a streams cleanly through AVPlayer.
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', wavPath, M4A_PATH]);
  console.log(`generated ${M4A_PATH}`);
}

ensureTone();
const tone = readFileSync(M4A_PATH);

const server = createServer((req, res) => {
  if (req.method !== 'GET' || !/^\/[\w-]+\/\d{3}\.m4a$/.test(req.url ?? '')) {
    res.writeHead(404).end();
    return;
  }
  const range = req.headers.range;
  const total = tone.length;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m?.[1] ? parseInt(m[1], 10) : 0;
    const end = m?.[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
    if (start >= total || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${total}` }).end();
      return;
    }
    res.writeHead(206, {
      'Content-Type': 'audio/mp4',
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
    });
    res.end(tone.subarray(start, end + 1));
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'audio/mp4',
    'Content-Length': total,
    'Accept-Ranges': 'bytes',
  });
  res.end(tone);
});

server.listen(PORT, () => console.log(`dev audio server on http://localhost:${PORT}`));
