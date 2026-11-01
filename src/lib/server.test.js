import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'node:net';

const projectRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
  return port;
}

async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Server exited early with ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch { /* server is still starting */ }
    await delay(100);
  }
  throw new Error('Server did not become ready within four seconds');
}

test('HTTP server serves app assets and safely falls back for unknown routes', async (t) => {
  const port = await freePort();
  const child = spawn(process.execPath, ['server.mjs', `--port=${port}`], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  t.after(() => { child.kill('SIGTERM'); });

  const base = `http://127.0.0.1:${port}`;
  const home = await waitForServer(`${base}/`, child);
  assert.match(home.headers.get('content-type'), /text\/html/);
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(home.headers.get('x-frame-options'), 'DENY');
  assert.match(home.headers.get('content-security-policy'), /default-src 'self'/);
  assert.match(await home.text(), /RoundZero — Placement preparation/);

  const moduleResponse = await fetch(`${base}/src/main.js`);
  assert.equal(moduleResponse.status, 200);
  assert.match(moduleResponse.headers.get('content-type'), /javascript/);
  assert.match(await moduleResponse.text(), /renderApp/);

  const cssResponse = await fetch(`${base}/src/styles.css`);
  assert.equal(cssResponse.status, 200);
  assert.match(cssResponse.headers.get('content-type'), /text\/css/);

  const missing = await fetch(`${base}/a-client-side-route`);
  assert.equal(missing.status, 200);
  assert.match(await missing.text(), /id="root"/);

  const traversal = await fetch(`${base}/%2e%2e%2f%2e%2e%2fetc%2fpasswd`);
  assert.equal(traversal.status, 200);
  assert.match(await traversal.text(), /id="root"/);
  assert.doesNotMatch(stderr, /EADDRINUSE|MODULE_NOT_FOUND/);
});


test('built preview serves only runtime assets and can load its module graph', async (t) => {
  const port = await freePort();
  const child = spawn(process.execPath, ['server.mjs', '--dist', `--port=${port}`], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => { child.kill('SIGTERM'); });
  const base = `http://127.0.0.1:${port}`;
  const home = await waitForServer(`${base}/`, child);
  assert.match(await home.text(), /RoundZero — Placement preparation/);
  const files = ['/src/main.js', '/src/content.js', '/src/lib/core.js', '/src/styles.css', '/public/mark.svg'];
  for (const file of files) {
    const response = await fetch(`${base}${file}`);
    assert.equal(response.status, 200, `${file} should load from the build`);
    assert.ok(Number(response.headers.get('content-length') ?? 1) > 0);
  }
  const noTests = await fetch(`${base}/src/lib/core.test.js`);
  assert.equal(noTests.status, 200); // SPA fallback is expected for unknown paths.
  assert.match(await noTests.text(), /id="root"/);
});
