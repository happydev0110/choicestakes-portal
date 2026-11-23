import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rejectMalformedRequest } from '../app/lib/request-guard.ts';

const actionId = '40' + 'a'.repeat(40);
function check(pathname, method = 'GET', headers = {}) {
  return rejectMalformedRequest({ pathname, method, headers: new Headers(headers) });
}

test('malformed chunk URLs cannot reach the prerender filesystem cache', () => {
  const snippet = '`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link\'s `<a>` tag.';
  assert.equal(check('/_next/static/chunks/' + encodeURIComponent(snippet)).status, 414);
  assert.equal(check('/_next/static/chunks/' + encodeURIComponent('界'.repeat(81))).status, 414);
  assert.equal(check('/_next/static/chunks/%invalid').status, 400);
});

test('normal navigation, static assets, and dynamic provider paths pass through', () => {
  for (const path of ['/', '/casino', '/sports', '/login', '/play/71dc9527-af3c-5466-8563-6e5da86a8188', '/providers/' + encodeURIComponent('Studio 日本'), '/_next/static/chunks/%5Broot-of-the-server%5D__123._.js', '/_next/static/css/123.css', '/assets/logo.png']) {
    assert.equal(check(path), null, path);
    assert.equal(check(path, 'HEAD'), null, path);
  }
});

test('page POSTs reject invalid action identifiers and multipart scanner payloads', () => {
  for (const id of [undefined, '', 'x', 'y', 'a'.repeat(41), 'z'.repeat(42), 'a'.repeat(43)]) {
    assert.equal(check('/casino', 'POST', { 'content-type': 'text/plain', ...(id === undefined ? {} : { 'next-action': id }) }).status, 400);
  }
  for (const type of ['multipart/form-data', 'multipart/form-data; boundary=missing', 'application/x-www-form-urlencoded', 'application/json']) {
    assert.equal(check('/', 'POST', { 'next-action': actionId, 'content-type': type }).status, 415);
  }
});

test('language actions and JSON API requests retain their existing validation', () => {
  assert.equal(check('/casino', 'POST', { 'next-action': actionId, 'content-type': 'text/plain;charset=UTF-8' }), null);
  for (const path of ['/api/player/login', '/api/player/register', '/api/gaming/games/game-id/launch', '/api/gaming/wallet/events']) {
    assert.equal(check(path, 'POST', { 'content-type': 'application/json' }), null);
  }
  assert.equal(check('/api/uploads', 'POST', { 'content-type': 'multipart/form-data; boundary=upload' }), null);
});
