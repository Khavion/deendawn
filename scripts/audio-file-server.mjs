/**
 * Local audio file server — serves the VERIFIED recitation set from
 * content-pipeline/audio/data/ with HTTP Range support, mirroring the R2
 * bucket layout ({reciterId}/NNN.mp3). Used to exercise the real streaming
 * player on emulators before the R2 bucket exists (BLOCKERS: R2 setup) and
 * to record the Play Store FGS demo video with real recitation.
 *
 * This is a dev tool: it binds localhost only and serves nothing but .mp3
 * files under the audio data directory.
 *
 * Usage: node scripts/audio-file-server.mjs   (listens on 8083)
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PORT = 8083;
const ROOT = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  'content-pipeline',
  'audio',
  'data'
);

const server = createServer((req, res) => {
  const m = /^\/([a-z0-9-]+)\/(\d{3})\.mp3$/.exec(req.url ?? '');
  if (!m) {
    res.writeHead(404).end();
    return;
  }
  const file = path.join(ROOT, m[1], `${m[2]}.mp3`);
  if (!existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  const { size } = statSync(file);
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    res.writeHead(206, {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': end - start + 1,
    });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    'Content-Length': size,
  });
  createReadStream(file).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`audio-file-server: http://localhost:${PORT} -> ${ROOT}`);
});
