import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

// Opt-in integration checks against a local production build. No player login,
// provider launch, or database writes are performed.
const origin = process.env.PORTAL_TEST_ORIGIN;
if (origin && !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname)) {
  throw new Error('PORTAL_TEST_ORIGIN must point to a local test server.');
}
const options = { skip: !origin };
const request = (path, init = {}) => fetch(new URL(path, origin), {
  redirect: 'manual', signal: AbortSignal.timeout(15000), ...init,
});

test('production routing serves known pages/assets and rejects unknown paths', options, async () => {
  for (const path of ['/login', '/register', '/promotions']) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /<html/);
    if (path === '/login') {
      const asset = html.match(/src="([^" ]*\/_next\/static\/chunks\/[^" ]+\.js)"/);
      assert.ok(asset, 'page includes a JS chunk');
      assert.equal((await request(asset[1])).status, 200);
    }
  }
  for (const path of ['/not-a-portal-page', '/' + 'z'.repeat(300), '/_next/static/chunks/missing.js']) {
    assert.equal((await request(path)).status, 404, path);
  }
  const protectedPage = await request('/sports');
  assert.equal(protectedPage.status, 307);
  assert.equal(new URL(protectedPage.headers.get('location'), origin).pathname, '/login');
  const api = await request('/api/player/not-an-endpoint');
  assert.equal(api.status, 404);
  assert.equal((await api.json()).success, false);
});

test('production Proxy rejects oversized chunks and malformed page actions', options, async () => {
  const longPath = '/_next/static/chunks/' + encodeURIComponent('M17.32 5H6.68 '.repeat(30));
  const response = await request(longPath);
  assert.equal(response.status, 414);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  for (const id of ['x', 'y']) {
    const result = await request('/login', {
      method: 'POST', headers: { 'next-action': id, 'content-type': 'text/plain' }, body: '[]',
    });
    assert.equal(result.status, 400);
  }
  const malformedForm = await request('/login', {
    method: 'POST', headers: { 'content-type': 'multipart/form-data' }, body: 'invalid form',
  });
  assert.equal(malformedForm.status, 400);
});

test('the built language Server Action still saves and renders the selected locale', options, async () => {
  const manifest = JSON.parse(await readFile(new URL('../.next/server/server-reference-manifest.json', import.meta.url), 'utf8'));
  const entry = Object.entries(manifest.node).find(([, action]) => action.exportedName === 'setLanguage');
  assert.ok(entry, 'build contains setLanguage');
  const headers = { 'next-action': entry[0], origin, accept: 'text/x-component' };
  const malformedForm = await request('/login', {
    method: 'POST', headers: { ...headers, 'content-type': 'multipart/form-data; boundary=missing' }, body: 'not multipart',
  });
  assert.equal(malformedForm.status, 415);
  const result = await request('/login', {
    method: 'POST', headers: { ...headers, 'content-type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(['fr']),
  });
  assert.equal(result.status, 200, await result.text());
  assert.match(result.headers.get('set-cookie') ?? '', /choicestakes-language=fr/);
  const page = await request('/login', { headers: { cookie: 'choicestakes-language=fr' } });
  assert.match(await page.text(), /<html lang="fr"/);
});
