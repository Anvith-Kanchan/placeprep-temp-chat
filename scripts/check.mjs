import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname);
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const js = await readFile(resolve(root, 'src/main.js'), 'utf8');
const css = await readFile(resolve(root, 'src/styles.css'), 'utf8');
const content = await readFile(resolve(root, 'src/content.js'), 'utf8');
const core = await readFile(resolve(root, 'src/lib/core.js'), 'utf8');
for (const [label, value, patterns] of [
  ['HTML entry', html, [/id="root"/, /src="\/src\/main.js"/]],
  ['Application module', js, [/addEventListener/, /renderApp/, /assessmentQuestions/]],
  ['State helpers', core, [/localStorage/, /writeState/, /scoreAssessment/]],
  ['Stylesheet', css, [/\.app-shell/, /@media/]],
  ['Learning content', content, [/assessmentQuestions/, /processStages/, /topics/]],
]) {
  for (const pattern of patterns) if (!pattern.test(value)) throw new Error(`${label} is missing ${pattern}`);
}
await access(resolve(root, 'public/mark.svg'));
console.log('Project checks passed: entry point, app module, responsive styles, curriculum data and icon are present.');
