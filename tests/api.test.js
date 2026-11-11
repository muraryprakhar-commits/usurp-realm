// Tests for the play counter, stats and cloud save functions. Run from the repo root:  node --test tests/
// Uses an in-memory stand-in for @vercel/blob that enforces the same ETag rules as the real store
// (ifMatch must match, allowOverwrite:false fails on an existing file), so lost-update races show up here.
const test = require('node:test');
const assert = require('node:assert');
const storage = require('../lib/storage.js');
const play = require('../api/play.js');
const stats = require('../api/stats.js');
const save = require('../api/save.js');

const ENV = ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN'];
function env(vars) { for (const k of ENV) delete process.env[k]; Object.assign(process.env, vars); }

function fakeBlob() {
  const files = new Map(); let n = 0; const ops = { get: 0, put: 0, list: 0 };
  const tick = () => new Promise(r => setImmediate(r));   // let other requests interleave, like the network does
  class BlobPreconditionFailedError extends Error { constructor() { super('Precondition failed: ETag mismatch.'); this.name = 'BlobPreconditionFailedError'; } }
  return {
    files, ops,
    async get(p) { ops.get++; await tick(); const f = files.get(p); if (!f) return null; return { statusCode: 200, stream: new Blob([f.body]).stream(), blob: { pathname: p, etag: f.etag } }; },
    async put(p, body, o) {
      ops.put++; await tick();
      const f = files.get(p);
      if (o.ifMatch && (!f || f.etag !== o.ifMatch)) throw new BlobPreconditionFailedError();
      if (f && !o.allowOverwrite) throw new Error('Vercel Blob: This blob already exists, use `allowOverwrite: true` if you want to overwrite it.');
      assert.strictEqual(o.access, 'private');
      files.set(p, { body: String(body), etag: `"e${++n}"` });
      return { pathname: p, etag: files.get(p).etag };
    },
    async list({ prefix }) { ops.list++; await tick(); return { blobs: [...files.keys()].filter(k => k.startsWith(prefix)).map(pathname => ({ pathname })), hasMore: false }; },
  };
}

function call(handler, { method = 'POST', query = {}, headers = { origin: 'https://usurp.games' }, body } = {}) {
  return new Promise(resolve => {
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, status(c) { this.statusCode = c; return this; },
      json(o) { resolve({ status: this.statusCode, body: o, headers: this.headers }); }, end() { resolve({ status: this.statusCode, body: null, headers: this.headers }); } };
    handler({ method, query, headers, body }, res);
  });
}

test('storage picks Redis first, then Blob, else nothing', () => {
  env({}); assert.strictEqual(storage.kind(), null);
  env({ BLOB_STORE_ID: 'store_x' }); assert.strictEqual(storage.kind(), 'blob');
  env({ BLOB_READ_WRITE_TOKEN: 'tok' }); assert.strictEqual(storage.kind(), 'blob');
  env({ BLOB_STORE_ID: 'store_x', KV_REST_API_URL: 'https://r', KV_REST_API_TOKEN: 't' }); assert.strictEqual(storage.kind(), 'redis');
  env({ UPSTASH_REDIS_REST_URL: 'https://r', UPSTASH_REDIS_REST_TOKEN: 't' }); assert.strictEqual(storage.kind(), 'redis');
});

test('play: refuses GET, unknown games and other sites before touching storage', async () => {
  const b = fakeBlob(); storage.setBlobSdk(b); env({ BLOB_STORE_ID: 'store_x' });
  assert.strictEqual((await call(play, { method: 'GET', query: { g: 'joust' } })).status, 405);
  assert.strictEqual((await call(play, { query: { g: 'chess' } })).status, 400);
  assert.strictEqual((await call(play, { query: { g: 'joust', e: 'win' } })).status, 400);
  assert.strictEqual((await call(play, { query: { g: 'joust' }, headers: { origin: 'https://evil.example' } })).status, 403);
  assert.strictEqual((await call(play, { query: { g: 'joust' }, headers: {} })).status, 403);
  assert.strictEqual(b.files.size, 0);
});

test('play with nothing connected answers 204 and stores nothing', async () => {
  env({}); const r = await call(play, { query: { g: 'joust' } });
  assert.strictEqual(r.status, 204);
  const s = await call(stats, { method: 'GET' });
  assert.deepStrictEqual([s.body.connected, s.body.weeks.length], [false, 0]);
});

test('play counts into one Blob file of totals per ISO week, and keeps nothing else', async () => {
  const b = fakeBlob(); storage.setBlobSdk(b); env({ BLOB_STORE_ID: 'store_x' });
  await call(play, { query: { g: 'archery' } });
  await call(play, { query: { g: 'archery' } });
  await call(play, { query: { g: 'archery', e: 'finish' } });
  await call(play, { query: { g: 'usurper' }, headers: { referer: 'https://www.usurp.games/games/the-usurper.html' } });
  const wk = `plays/${play.isoWeek(new Date())}.json`;
  assert.deepStrictEqual([...b.files.keys()], [wk]);
  assert.deepStrictEqual(JSON.parse(b.files.get(wk).body), { 'archery:play': 2, 'archery:finish': 1, 'usurper:play': 1, _writes: 4 });
  // a warm instance writes straight from what it last wrote: one read for the first ping, none after
  assert.deepStrictEqual([b.ops.get, b.ops.put], [1, 4]);
});

test('simultaneous plays are all counted (no lost updates)', async () => {
  const b = fakeBlob(); storage.setBlobSdk(b); env({ BLOB_STORE_ID: 'store_x' });
  await Promise.all(Array.from({ length: 4 }, () => call(play, { query: { g: 'duel' } })));
  const wk = `plays/${play.isoWeek(new Date())}.json`;
  assert.strictEqual(JSON.parse(b.files.get(wk).body)['duel:play'], 4);
  // heavier contention through the helper itself (more tries than a live request uses)
  await Promise.all(Array.from({ length: 12 }, () => storage.blobIncrement('plays/test.json', 'x', 40)));
  assert.strictEqual(JSON.parse(b.files.get('plays/test.json').body).x, 12);
});

test('a Blob failure never breaks the game: the ping still answers 204', async () => {
  storage.setBlobSdk({ get: async () => { throw new Error('network'); }, put: async () => { throw new Error('network'); } });
  env({ BLOB_STORE_ID: 'store_x' });
  assert.strictEqual((await call(play, { query: { g: 'joust' } })).status, 204);
});

test('stats reads the Blob week files: this week, earlier weeks and all time', async () => {
  const b = fakeBlob(); storage.setBlobSdk(b); env({ BLOB_STORE_ID: 'store_x' }); stats._past.clear();
  const weeks = stats.lastWeeks(new Date());
  await storage.blobPutJson(`plays/${weeks[0].week}.json`, { 'joust:play': 3, 'joust:finish': 1 });
  await storage.blobPutJson(`plays/${weeks[1].week}.json`, { 'joust:play': 2, 'tafl:play': 5 });
  await storage.blobPutJson('plays/2025-W01.json', { 'joust:play': 10, 'bogus:play': 99 });   // older than 12 weeks: all time only
  await storage.blobPutJson('saves/abc.json', { v: 1 });                                     // other data is ignored
  const r = await call(stats, { method: 'GET' });
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual([r.body.connected, r.body.store], [true, 'blob']);
  assert.deepStrictEqual(r.body.all, { joust: { play: 15, finish: 1 }, tafl: { play: 5, finish: 0 } });
  assert.deepStrictEqual(r.body.weeks[0].counts, { joust: { play: 3, finish: 1 } });
  assert.deepStrictEqual(r.body.weeks[1].counts, { joust: { play: 2, finish: 0 }, tafl: { play: 5, finish: 0 } });
  assert.strictEqual(r.body.weeks.length, 12);
  assert.match(r.headers['cache-control'], /s-maxage=900/);
  // finished weeks are kept in memory: a second refresh reads only the current week again
  const before = b.ops.get; await call(stats, { method: 'GET' });
  assert.strictEqual(b.ops.get - before, 1);
});

test('stats reports an unreachable store as 502, not as zero plays', async () => {
  storage.setBlobSdk({ list: async () => { throw new Error('down'); } }); env({ BLOB_STORE_ID: 'store_x' });
  const r = await call(stats, { method: 'GET' });
  assert.deepStrictEqual([r.status, r.body.error], [502, 'counter_unreachable']);
});

test('Redis stays first: play and stats use the Redis pipeline when it is connected', async () => {
  const b = fakeBlob(); storage.setBlobSdk(b);
  env({ BLOB_STORE_ID: 'store_x', KV_REST_API_URL: 'https://redis.test', KV_REST_API_TOKEN: 't' });
  const sent = []; const orig = global.fetch;
  global.fetch = async (url, init) => {
    const cmds = JSON.parse(init.body); sent.push(cmds);
    const result = cmds.map(c => ({ result: c[0] === 'HGETALL' ? (c[1] === 'plays:all' ? ['morris:play', '7'] : []) : 1 }));
    return { ok: true, json: async () => result };
  };
  try {
    assert.strictEqual((await call(play, { query: { g: 'morris' } })).status, 204);
    assert.strictEqual(sent[0][0][0], 'HINCRBY');
    const r = await call(stats, { method: 'GET' });
    assert.deepStrictEqual([r.body.store, r.body.all], ['redis', { morris: { play: 7, finish: 0 } }]);
    assert.strictEqual(b.files.size, 0);
  } finally { global.fetch = orig; }
});

test('cloud save still round-trips through the shared Blob storage', async () => {
  const b = fakeBlob(); storage.setBlobSdk(b); env({ BLOB_STORE_ID: 'store_x' });
  const code = 'ABCD-EFGH-JKMN-PQRS-TVWX';
  const s = await call(save, { body: { op: 'save', code, data: { name: 'Ser Test', best: { joust: 12 } } } });
  assert.strictEqual(s.body.ok, true);
  const l = await call(save, { body: { op: 'load', code } });
  assert.deepStrictEqual([l.body.found, l.body.data.name, l.body.data.best.joust], [true, 'Ser Test', 12]);
  const miss = await call(save, { body: { op: 'load', code: 'ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ' } });
  assert.deepStrictEqual([miss.body.ok, miss.body.found], [true, false]);
  assert.ok([...b.files.keys()].every(k => /^saves\/[0-9a-f]{64}\.json$/.test(k)), 'saves are stored under a hash, never the code');
});

test('weekly Blob write budget: exact, then 1-in-10 sampling, then stop', () => {
  const L = 20;   // small limit for the test; live default is play.BLOB_WEEKLY_WRITES
  assert.strictEqual(play.BLOB_WEEKLY_WRITES, 200);
  let d = {};
  for (let i = 0; i < 12; i++) d = play.bump(d, 'joust:play', () => 0.99, L);   // first 60% are exact
  assert.deepStrictEqual(d, { 'joust:play': 12, _writes: 12 });
  assert.strictEqual(play.bump({ ...d }, 'joust:play', () => 0.5, L), null);       // sampled out: no write at all
  d = play.bump(d, 'joust:play', () => 0.05, L);                                    // sampled in: counts 10
  assert.deepStrictEqual(d, { 'joust:play': 22, _writes: 13, _sampled: 1 });
  assert.strictEqual(play.bump({ 'joust:play': 90, _writes: L }, 'joust:play', () => 0, L), null);   // at the limit: nothing
});

test('stats flags estimated and capped weeks', async () => {
  const b = fakeBlob(); storage.setBlobSdk(b); env({ BLOB_STORE_ID: 'store_x' }); stats._past.clear();
  const weeks = stats.lastWeeks(new Date());
  await storage.blobPutJson(`plays/${weeks[0].week}.json`, { 'joust:play': 150, _writes: 125, _sampled: 5 });
  await storage.blobPutJson(`plays/${weeks[1].week}.json`, { 'joust:play': 900, _writes: 200, _sampled: 80 });
  const r = await call(stats, { method: 'GET' });
  assert.deepStrictEqual([r.body.weeks[0].approx, r.body.weeks[0].capped], [true, false]);
  assert.deepStrictEqual([r.body.weeks[1].approx, r.body.weeks[1].capped], [true, true]);
  assert.deepStrictEqual([r.body.weeks[2].approx, r.body.weeks[2].capped], [false, false]);
  assert.deepStrictEqual(r.body.budget, { weeklyWrites: 200, sampleFrom: 120, sample: 10 });
  assert.deepStrictEqual(r.body.all, { joust: { play: 1050, finish: 0 } });   // bookkeeping fields never show as games
});

test('a stale cached ETag (another instance wrote meanwhile) re-reads instead of overwriting', async () => {
  const b = fakeBlob(); storage.setBlobSdk(b); env({ BLOB_STORE_ID: 'store_x' });
  await storage.blobIncrement('plays/t.json', 'x');                    // this instance now remembers etag e1
  const other = JSON.parse(b.files.get('plays/t.json').body); other.x = 5;
  await b.put('plays/t.json', JSON.stringify(other), { access: 'private', allowOverwrite: true });   // someone else: x = 5
  assert.strictEqual(await storage.blobIncrement('plays/t.json', 'x'), 6);
});
