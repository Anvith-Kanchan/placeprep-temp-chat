import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(resolve(out, 'src/lib'), { recursive: true });
await mkdir(resolve(out, 'public'), { recursive: true });
await mkdir(resolve(out, 'src'), { recursive: true });

for (const [source, destination] of [
  ['index.html', 'index.html'],
  ['src/content.js', 'src/content.js'],
  ['src/main.js', 'src/main.js'],
  ['src/styles.css', 'src/styles.css'],
  ['src/lib/core.js', 'src/lib/core.js'],
  ['public/mark.svg', 'public/mark.svg'],
]) {
  await cp(resolve(root, source), resolve(out, destination));
}
console.log('Build complete: runtime-only static app copied to dist/.');
