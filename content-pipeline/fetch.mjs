// content:fetch — download pinned sources byte-for-byte into data/.
// Bytes are stored exactly as received; verification happens in verify.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR, loadSources, sha256, markPipelineRan } from './lib.mjs';

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  const sources = loadSources();
  for (const src of sources) {
    process.stdout.write(`fetching ${src.id} ... `);
    const res = await fetch(src.url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`${src.id}: HTTP ${res.status} from ${src.url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new Error(`${src.id}: empty response`);
    writeFileSync(path.join(DATA_DIR, src.file), buf);
    console.log(`${buf.length} bytes sha256=${sha256(buf)}`);
  }
  markPipelineRan();
  console.log(`\nFetched ${sources.length} artifacts into content-pipeline/data/.`);
  console.log('Next: npm run content:verify (or content:pin for first-time artifacts).');
}

main().catch((err) => {
  console.error(`FETCH FAILED: ${err.message}`);
  process.exit(1);
});
