// Optional cloud save for the games: rank, stats, best scores, player name and the Crest Studio design.
// There are no usernames, emails or passwords. A player who asks to save their progress gets a random save code
// (100 bits, made in their browser); the server only ever sees that code, stores the progress under a SHA-256 hash
// of it, and anyone holding the code can load it on another device. Nothing else about the player is kept.
// Storage: the project's Upstash Redis when connected (KV_*/UPSTASH_* variables), otherwise a private Vercel Blob
// store (BLOB_READ_WRITE_TOKEN). With neither, it answers { ok: false, error: 'not_connected' } and the games keep
// working with progress on the device only.
const crypto = require('crypto');
const { creds } = require('./play.js');

const CODE = /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){4}$/;   // Crockford base32, 5 groups of 4
const MAX = 12000;                                                    // bytes of progress JSON
const KEYS = ['name', 'prof', 'best', 'crest', 'v'];

const idOf = code => crypto.createHash('sha256').update('usurp-save:' + code).digest('hex');

// Keep only what the games write, in the shapes they write it.
function clean(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const o = {};
  for (const k of KEYS) if (d[k] !== undefined) o[k] = d[k];
  if (o.name !== undefined) o.name = String(o.name).slice(0, 24);
  for (const k of ['prof', 'best']) {
    if (o[k] === undefined) continue;
    if (!o[k] || typeof o[k] !== 'object' || Array.isArray(o[k])) return null;
    const n = {};
    for (const [kk, vv] of Object.entries(o[k]).slice(0, 40)) { const x = Number(vv); if (/^[a-z0-9_-]{1,24}$/i.test(kk) && isFinite(x) && x >= 0) n[kk] = Math.min(x, 1e9); }
    o[k] = n;
  }
  if (o.crest !== undefined && (o.crest === null || typeof o.crest !== 'object' || Array.isArray(o.crest))) delete o.crest;
  return JSON.stringify(o).length > MAX ? null : o;
}

async function redis(url, token, cmds) {
  const r = await fetch(`${url}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return r.json();
}

const store = {
  kind() { const c = creds(); if (c.url && c.token) return 'redis'; if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob'; return null; },
  async load(id) {
    if (this.kind() === 'redis') {
      const { url, token } = creds();
      const out = await redis(url, token, [['GET', `save:${id}`]]);
      const v = out[0] && out[0].result; return v ? JSON.parse(v) : null;
    }
    const { get } = require('@vercel/blob');
    const r = await get(`saves/${id}.json`, { access: 'private', useCache: false }).catch(e => { if (e && /not.?found/i.test(e.name + e.message)) return null; throw e; });
    if (!r || r.statusCode !== 200) return null;
    return JSON.parse(await new Response(r.stream).text());
  },
  async save(id, rec) {
    if (this.kind() === 'redis') {
      const { url, token } = creds();
      // at most 20 saves a minute per code, and kept for two years after the last save
      const out = await redis(url, token, [['INCR', `saverate:${id}`], ['EXPIRE', `saverate:${id}`, 60]]);
      if (Number(out[0] && out[0].result) > 20) return 'slow';
      await redis(url, token, [['SET', `save:${id}`, JSON.stringify(rec), 'EX', 60 * 60 * 24 * 730]]);
      return 'ok';
    }
    const { put } = require('@vercel/blob');
    await put(`saves/${id}.json`, JSON.stringify(rec), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 60 });
    return 'ok';
  },
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'post_only' });
  const from = String(req.headers.origin || req.headers.referer || '');
  if (!/^https:\/\/(www\.)?usurp\.games(\/|$)/.test(from) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(from)) return res.status(403).json({ ok: false, error: 'not_our_page' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, error: 'bad_request' });
  const code = String(b.code || '').toUpperCase();
  if (!CODE.test(code)) return res.status(400).json({ ok: false, error: 'bad_code' });
  const kind = store.kind();
  if (!kind) return res.status(200).json({ ok: false, error: 'not_connected' });
  const id = idOf(code);
  try {
    if (b.op === 'load') {
      const rec = await store.load(id);
      return res.status(200).json(rec ? { ok: true, found: true, data: rec.data, updated: rec.updated } : { ok: true, found: false });
    }
    if (b.op === 'save') {
      const data = clean(b.data);
      if (!data) return res.status(400).json({ ok: false, error: 'bad_data' });
      const updated = new Date().toISOString();
      const r = await store.save(id, { v: 1, data, updated });
      if (r === 'slow') return res.status(429).json({ ok: false, error: 'too_many_saves' });
      return res.status(200).json({ ok: true, updated });
    }
    return res.status(400).json({ ok: false, error: 'bad_op' });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'storage_unreachable' });
  }
};
module.exports.clean = clean;
module.exports.CODE = CODE;
