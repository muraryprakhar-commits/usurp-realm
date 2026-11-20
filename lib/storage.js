// Storage shared by the small Vercel functions in api/ (play counter, stats, cloud save).
// Upstash Redis comes first when its variables are set (KV_* from the Vercel integration, or UPSTASH_*).
// Otherwise the project's private Vercel Blob store is used: BLOB_STORE_ID with the deployment's OIDC token
// (how the Vercel dashboard connects a store now), or an older BLOB_READ_WRITE_TOKEN. @vercel/blob handles both.
// This file lives outside api/ so Vercel does not turn it into an endpoint of its own.

function creds() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

// 'redis', 'blob' or null (nothing connected).
function kind() {
  const c = creds();
  if (c.url && c.token) return 'redis';
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return 'blob';
  return null;
}

async function redis(cmds) {
  const { url, token } = creds();
  const r = await fetch(`${url}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return r.json();
}

// The SDK is loaded lazily so Redis-only deployments never touch it; tests swap it with setBlobSdk().
let sdk = null;
const blobSdk = () => sdk || (sdk = require('@vercel/blob'));
function setBlobSdk(s) { sdk = s; memo.clear(); }

const notFound = e => e && /not.?found/i.test(String(e.name) + String(e.message));

// A private JSON blob, or null when it does not exist. Returns { data, etag }.
async function blobGetJson(pathname) {
  const r = await blobSdk().get(pathname, { access: 'private', useCache: false }).catch(e => { if (notFound(e)) return null; throw e; });
  if (!r || r.statusCode !== 200) return null;
  return { data: JSON.parse(await new Response(r.stream).text()), etag: r.blob && r.blob.etag };
}

// Write a private JSON blob. With etag: only if nobody changed it since it was read. With create: only if it does not exist yet.
function blobPutJson(pathname, data, opts = {}) {
  const o = { access: 'private', addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 60 };
  if (opts.etag) Object.assign(o, { allowOverwrite: true, ifMatch: opts.etag });
  else o.allowOverwrite = !opts.create;
  return blobSdk().put(pathname, JSON.stringify(data), o);
}

// What this warm function instance last read or wrote, per pathname: { data, etag }. Lets the next update write straight
// away with ifMatch instead of reading first (a read is a Blob operation too), and still never loses a concurrent change,
// because a stale ETag just fails and triggers a fresh read.
const memo = new Map();

// Read-modify-write a JSON blob without losing concurrent updates. change(data) returns the new object, or null to skip
// writing. Returns the object written, or null when skipped.
async function blobUpdate(pathname, change, tries = 5) {
  let cur = memo.get(pathname) || await blobGetJson(pathname);
  for (let i = 0; i < tries; i++) {
    const base = cur && cur.data && typeof cur.data === 'object' && !Array.isArray(cur.data) ? JSON.parse(JSON.stringify(cur.data)) : {};
    const next = change(base);
    if (next === null) { if (cur) memo.set(pathname, cur); return null; }
    try {
      const r = await blobPutJson(pathname, next, cur && cur.etag ? { etag: cur.etag } : { create: true });
      memo.set(pathname, { data: next, etag: r && r.etag });
      return next;
    } catch (e) {
      // a lost race shows up as an ETag mismatch, or as "already exists" when two requests both created the file
      const raced = (e && e.name === 'BlobPreconditionFailedError') || /precondition|already exists|etag/i.test(String(e && e.message));
      memo.delete(pathname);
      if (!raced) throw e;
      await new Promise(r => setTimeout(r, 10 + Math.random() * 40 * (i + 1)));   // back off a little so racers spread out
      cur = await blobGetJson(pathname);
    }
  }
  throw new Error('blob_update_contended');
}

// Add 1 to obj[field] in a JSON blob.
async function blobIncrement(pathname, field, tries = 5) {
  const out = await blobUpdate(pathname, d => { d[field] = (Number(d[field]) || 0) + 1; return d; }, tries);
  return out[field];
}

// Pathnames under a prefix, following list() pages (a few hundred blobs at most here).
async function blobList(prefix, maxPages = 20) {
  const out = [];
  let cursor;
  for (let p = 0; p < maxPages; p++) {
    const r = await blobSdk().list({ prefix, cursor, limit: 1000 });
    for (const b of r.blobs) out.push(b.pathname);
    if (!r.hasMore) break;
    cursor = r.cursor;
  }
  return out;
}

module.exports = { creds, kind, redis, blobGetJson, blobPutJson, blobUpdate, blobIncrement, blobList, setBlobSdk };
