import assert from 'node:assert/strict';
import { test } from 'node:test';
import { connectWalletEvents } from '../app/lib/wallet-events.ts';
import { createWalletRefreshQueue } from '../app/lib/wallet-refresh.ts';
import { forwardWalletStream } from '../app/lib/wallet-stream-proxy.ts';

function fixture() {
  const page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const network = new EventTarget();
  const sources = [];
  const state = { refreshes: 0, authChecks: 0, connected: false };
  const stop = connectWalletEvents({ page, network,
    refresh() { state.refreshes++; }, expired() { state.authChecks++; }, connected(value) { state.connected = value; },
    createSource(url) {
      assert.equal(url, '/api/gaming/wallet/events');
      const source = Object.assign(new EventTarget(), { closed: false, close() { this.closed = true; } });
      sources.push(source); return source;
    },
  });
  return { page, network, sources, state, stop, emit(type, source = sources.at(-1)) { source.dispatchEvent(new Event(type)); } };
}

test('no periodic wallet polling; ready and changed events refresh the balance', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = fixture(); t.after(f.stop);
  t.mock.timers.tick(120000);
  assert.equal(f.state.refreshes, 0);
  f.emit('wallet.ready'); f.emit('wallet.updated');
  assert.equal(f.state.refreshes, 2);
  assert.equal(f.state.connected, true);
  t.mock.timers.tick(120000);
  assert.equal(f.state.refreshes, 2);
});

test('hidden tabs disconnect; returning and reconnecting fetch current state and ignore stale streams', () => {
  const f = fixture(); const old = f.sources[0];
  f.emit('wallet.ready');
  f.page.visibilityState = 'hidden'; f.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(old.closed, true);
  f.emit('wallet.updated', old);
  assert.equal(f.state.refreshes, 1);
  f.page.visibilityState = 'visible'; f.page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.sources.length, 2);
  f.emit('wallet.ready');
  assert.equal(f.state.refreshes, 3);
  f.stop();
  f.emit('wallet.updated'); f.network.dispatchEvent(new Event('online'));
  assert.equal(f.sources.length, 2);
  assert.equal(f.state.refreshes, 3);
});

test('connection failures retry without polling the wallet; expired sessions stop reconnecting', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = fixture(); t.after(f.stop);
  f.emit('error');
  assert.equal(f.sources[0].closed, true);
  assert.equal(f.state.authChecks, 1);
  t.mock.timers.tick(2000);
  assert.equal(f.sources.length, 2);
  assert.equal(f.state.refreshes, 0);
  f.emit('wallet.ready');
  assert.equal(f.state.refreshes, 1);
  f.emit('session.expired');
  assert.equal(f.sources[1].closed, true);
  t.mock.timers.tick(120000);
  f.network.dispatchEvent(new Event('online'));
  assert.equal(f.sources.length, 2);
});

test('bursts queue one follow-up read and never overwrite a newer result with an older request', async () => {
  const releases = [];
  const balances = [];
  let reads = 0;
  const queue = createWalletRefreshQueue(async () => {
    const read = ++reads;
    await new Promise(resolve => releases.push(resolve));
    balances.push(read);
  });
  queue.refresh();
  for (let i = 0; i < 20; i++) queue.refresh();
  assert.equal(reads, 1);
  releases.shift()(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(reads, 2);
  releases.shift()(); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(balances, [1, 2]);
  assert.equal(reads, 2);
  queue.stop(); queue.refresh(); assert.equal(reads, 2);
});

test('stopping a wallet queue cancels queued work after an account switch', async () => {
  let release; let calls = 0;
  const queue = createWalletRefreshQueue(async () => { calls++; await new Promise(resolve => { release = resolve; }); });
  queue.refresh(); queue.refresh(); queue.stop(); release();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
});

test('stream proxy forwards chunks immediately and aborts upstream on browser disconnect', async () => {
  let upstream; let signal; let cancelled = false;
  const encoder = new TextEncoder();
  const response = await forwardWalletStream(new Request('https://portal.test/api/gaming/wallet/events?playerId=ignored'),
    'choicestakes_session=fixture', 'http://backend.test/', async (url, options) => {
      assert.equal(url, 'http://backend.test/api/v1/gaming/wallet/events');
      assert.equal(options.headers.get('Cookie'), 'choicestakes_session=fixture');
      signal = options.signal;
      return new Response(new ReadableStream({ start(c) { upstream = c; }, cancel() { cancelled = true; } }), {
        headers: { 'Content-Type': 'text/event-stream' },
      });
    });
  assert.equal(response.headers.get('x-accel-buffering'), 'no');
  const reader = response.body.getReader();
  upstream.enqueue(encoder.encode('event: wallet.ready\ndata: {}\n\n'));
  assert.match(new TextDecoder().decode((await reader.read()).value), /wallet.ready/);
  upstream.enqueue(encoder.encode('event: wallet.updated\ndata: {}\n\n'));
  assert.match(new TextDecoder().decode((await reader.read()).value), /wallet.updated/);
  await reader.cancel();
  assert.equal(signal.aborted, true);
  assert.equal(cancelled, true);
});

test('stream proxy rejects missing sessions, cross-site origins, and non-stream upstream responses', async () => {
  const neverFetch = async () => assert.fail('Unauthorized request reached backend');
  assert.equal((await forwardWalletStream(new Request('https://portal.test/api/gaming/wallet/events'), '', 'http://backend.test', neverFetch)).status, 401);
  assert.equal((await forwardWalletStream(new Request('https://portal.test/api/gaming/wallet/events', { headers: { Origin: 'https://attacker.test' } }), 'session', 'http://backend.test', neverFetch)).status, 403);
  assert.equal((await forwardWalletStream(new Request('https://portal.test/api/gaming/wallet/events'), 'session', 'http://backend.test', async () => Response.json({ secret: 'do not expose' }))).status, 503);
});
