const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const test = require('node:test');
const load = async (file) => import(`data:text/javascript;base64,${Buffer.from(await fs.readFile(new URL('../' + file, `file://${__filename.replaceAll('\\', '/')}`), 'utf8')).toString('base64')}`);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
const session = { sessionId: 'session-1', token: 'secret-token', expiresAt: Date.now() + 60000 };

test('known internal CTA does not weaken external URL safety', async () => {
  const { safeInternalRoute, safeHttpUrl } = await load('js/utils.js');
  assert.equal(typeof safeInternalRoute, 'function');
  assert.equal(safeInternalRoute('#revia.html'), '#revia.html');
  for (const url of ['#evil.html', '#revia.html?token=secret', 'javascript:alert(1)', '//evil.test']) assert.equal(safeInternalRoute(url), '');
  assert.equal(safeHttpUrl('#revia.html'), '');
});

test('client module exists for isolated in-memory sessions', async () => {
  assert.ok(await fs.stat('js/revia/api-client.js').catch(() => false), 'public demo needs an API client');
});

test('lost submission response retries identical body and key, without replaying successful inference', async () => {
  const { ReviaClient } = await load('js/revia/api-client.js');
  const submissions = []; let polls = 0;
  const client = new ReviaClient('https://relay.example', { fetch: async (url, options) => {
    if (url.endsWith('/sessions')) return json(session);
    assert.equal(options.headers.Authorization, 'Bearer secret-token');
    if (url.endsWith('/messages')) {
      submissions.push(options.body);
      if (submissions.length === 1) throw new TypeError('connection lost');
      return json({ requestId: 'r1', state: 'queued' });
    }
    polls++; return json({ requestId: 'r1', state: 'completed', text: '<img src=x onerror=alert(1)>' });
  }, pollMs: 1 });
  await client.start('invite');
  await assert.rejects(client.send('Hello'));
  assert.equal(client.hasPending, true);
  const result = await client.retry();
  assert.equal(submissions[0], submissions[1]);
  assert.equal(JSON.parse(submissions[0]).text, 'Hello');
  assert.equal(result.text, '<img src=x onerror=alert(1)>');
  assert.equal(polls, 1);
  assert.equal(client.hasPending, false);
});

test('cleanup destroys a late-created session and rejects future work', async () => {
  const { ReviaClient } = await load('js/revia/api-client.js');
  let release; const calls = [];
  const client = new ReviaClient('https://relay.example', { fetch: async (url, options) => {
    calls.push([url, options]);
    if (url.endsWith('/sessions')) return new Promise(resolve => { release = () => resolve(json(session)); });
    return json({});
  }});
  const start = client.start('invite');
  client.destroy(); release();
  await assert.rejects(start);
  assert.equal(calls.filter(([url, opts]) => url.endsWith('/session') && opts.method === 'DELETE').length, 1);
  assert.equal(client.active, false);
  await assert.rejects(client.send('later'));
});

test('Unicode bounds and public relay configuration fail closed', async () => {
  const { messageLimits, validateConfig } = await load('js/revia/api-client.js');
  assert.equal(messageLimits('😀'.repeat(2000)).valid, true);
  assert.equal(messageLimits('😀'.repeat(2001)).valid, false);
  assert.equal(messageLimits('  ').valid, false);
  assert.equal(validateConfig({ enabled: false, relayUrl: '' }), null);
  for (const relayUrl of ['http://localhost:3000', 'https://x.test/path', 'https://u:p@x.test', 'https://x.test/?token=x']) assert.equal(validateConfig({ enabled: true, relayUrl }), null);
  assert.equal(validateConfig({ enabled: true, relayUrl: 'https://relay.example' }), 'https://relay.example');
});

test('poll cancellation aborts in-flight fetch and forgets pending text', async () => {
  const { ReviaClient } = await load('js/revia/api-client.js');
  let polling; const reachedPoll = new Promise(resolve => { polling = resolve; });
  const client = new ReviaClient('https://relay.example', { pollMs: 1, fetch: async (url, options) => {
    if (url.endsWith('/sessions')) return json(session);
    if (url.endsWith('/messages')) return json({ requestId: 'r1', state: 'running' });
    if (url.endsWith('/cancel')) return json({ requestId: 'r1', state: 'cancelled' });
    polling();
    return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
  }});
  await client.start('invite');
  const turn = client.send('hello');
  const rejection = assert.rejects(turn);
  await reachedPoll; await client.cancel(); await rejection;
  assert.equal(client.hasPending, false);
});

test('late completed response cannot publish after cancellation', async () => {
  const { ReviaClient } = await load('js/revia/api-client.js');
  let release; let polling; const states = [];
  const reachedPoll = new Promise(resolve => { polling = resolve; });
  const client = new ReviaClient('https://relay.example', { onState: state => states.push(state), fetch: async (url) => {
    if (url.endsWith('/sessions')) return json(session);
    if (url.endsWith('/messages')) return json({ requestId: 'r1', state: 'running' });
    if (url.endsWith('/cancel')) return json({ state: 'cancelled' });
    polling(); return new Promise(resolve => { release = () => resolve(json({ requestId: 'r1', state: 'completed', text: 'stale' })); });
  }});
  await client.start('invite'); const turn = client.send('hello');
  await reachedPoll; await client.cancel(); release();
  await assert.rejects(turn);
  assert.equal(states.includes('completed'), false);
});

test('request lifetime includes time spent waiting to retry', async () => {
  const { ReviaClient } = await load('js/revia/api-client.js');
  let now = 0; let posts = 0;
  const client = new ReviaClient('https://relay.example', { now: () => now, fetch: async url => {
    if (url.endsWith('/sessions')) return json(session);
    posts++; throw new TypeError('lost response');
  }});
  await client.start('invite'); await assert.rejects(client.send('hello'));
  now = 120001;
  await assert.rejects(client.retry(), error => error.code === 'expired');
  assert.equal(posts, 1); assert.equal(client.hasPending, false);
});
