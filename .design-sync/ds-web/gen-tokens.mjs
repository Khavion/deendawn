// Generates tokens.css from src/lib/theme/tokens.ts (the single source of
// truth — DO NOT hand-edit tokens.css; re-run this after token changes).
// Emits CSS custom properties per theme mode plus spacing/radius/type scale,
// so the design agent and the DS pane see the real values.
import { build } from '../../.ds-sync/node_modules/esbuild/lib/main.js';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
const tmp = mkdtempSync(join(tmpdir(), 'ds-tokens-'));
const outfile = join(tmp, 'tokens.mjs');
await build({
  entryPoints: [join(repo, 'src/lib/theme/tokens.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  outfile,
  logLevel: 'silent',
});
const t = await import(pathToFileURL(outfile).href);

const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const lines = ['/* GENERATED from src/lib/theme/tokens.ts by gen-tokens.mjs — do not edit. */'];
const modes = Object.keys(t.palette);
for (const mode of modes) {
  const sel = mode === 'light' ? ':root' : `[data-theme="${mode}"]`;
  lines.push(`${sel} {`);
  for (const [k, v] of Object.entries(t.palette[mode])) {
    if (typeof v === 'string') lines.push(`  --color-${kebab(k)}: ${v};`);
  }
  lines.push('}');
}
lines.push(':root {');
for (const [k, v] of Object.entries(t.spacing)) lines.push(`  --spacing-${k}: ${v}px;`);
for (const [k, v] of Object.entries(t.radius)) lines.push(`  --radius-${k}: ${v}px;`);
for (const [k, v] of Object.entries(t.fontSize ?? {})) lines.push(`  --font-size-${kebab(k)}: ${v}px;`);
for (const [k, v] of Object.entries(t.fonts)) lines.push(`  --font-${kebab(k)}: '${v}';`);
lines.push('}');
writeFileSync(join(here, 'tokens.css'), lines.join('\n') + '\n');
console.log(`tokens.css written (${modes.join(', ')})`);
