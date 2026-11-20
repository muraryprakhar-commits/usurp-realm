// Counts game starts and finished games on usurp.games, per game and per week, for the stats page (/stats.html).
// Stores only counters (no cookies, no IP address, nothing about the player): in Upstash Redis when it is connected,
// otherwise - only when PLAY_COUNTER_BLOB=1 is set - in the project's private Vercel Blob store as one small JSON
// file of totals per week (plays/2026-W46.json, e.g. {"archery:play": 12, "archery:finish": 7}).
// With neither, it accepts the ping and does nothing.
//
// Why Blob counting is opt-in: the Hobby plan includes 2,000 Blob "advanced operations" (uploads, copies, lists) a
// month for the whole project, shared with cloud saves, and Vercel says that when limits are exceeded Blob access
// stops "until 30 days have passed" - saves included. A play counter is new traffic on that shared budget, so it
// stays off until someone turns it on knowing that. With PLAY_COUNTER_BLOB=1, each week's file allows at most
// BLOB_WEEKLY_WRITES successful writes (default 100). Past 60% of that it counts 1 play in 10 and adds 10, an
// unbiased estimate the stats page marks as approximate; at the limit it stops counting until Monday. Every retry
// after a lost race is another upload the cap cannot see, so retries stay few (BLOB_TRIES, default 2). These caps
// are hygiene, not a security guarantee: failed writes also consume quota (Vercel's docs do not say otherwise), no
// cap here bounds a deliberate flood of forged pings, and any reserve they leave for saves is an average-week
// approximation, not a worst case over a rolling 30 days. Vercel emails you as the plan nears its limits, and
// connecting Upstash Redis (free tier) makes every count exact with no Blob quota use at all.
const storage = require('../lib/storage.js');
const GAMES = ['archery', 'joust', 'castle', 'duel', 'siege', 'tafl', 'morris', 'usurper'];
const EVENTS = ['play', 'finish'];

const BLOB_WEEKLY_WRITES = Math.max(1, Number(process.env.PLAY_COUNTER_WEEKLY_WRITES) || 100);
const SAMPLE = 10;

// Retries after a lost race. Each try is one Blob upload against the shared quota, so keep this small; a play lost
// to heavy concurrency is acceptable (busy weeks are sampled and marked approximate anyway).
const BLOB_TRIES = () => Math.max(1, Number(process.env.PLAY_COUNTER_TRIES) || 2);

// Blob counting stays off unless explicitly enabled (see the header comment). Redis counting needs no opt-in:
// its increments are atomic and use no Blob quota.
const BLOB_COUNTER_ON = () => /^(1|true|on|yes)$/i.test(String(process.env.PLAY_COUNTER_BLOB || ''));

// One play or finish into a week's totals, within the write budget. Returns the new totals, or null for "do not write".
function bump(data, field, rnd = Math.random, limit = BLOB_WEEKLY_WRITES) {
  const w = Number(data._writes) || 0;
  if (w >= limit) return null;
  if (w >= Math.floor(limit * 0.6)) {
    if (rnd() >= 1 / SAMPLE) return null;
    data[field] = (Number(data[field]) || 0) + SAMPLE;
    data._sampled = (Number(data._sampled) || 0) + 1;
  } else {
    data[field] = (Number(data[field]) || 0) + 1;
  }
  data._writes = w + 1;
  return data;
}

// ISO week, e.g. '2026-W43' (weeks run Monday to Sunday, UTC).
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(), start = new Date(Date.UTC(y, 0, 1));
  const w = Math.ceil(((t - start) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();   // POST only, so links and crawlers never count
  const g = String((req.query && req.query.g) || ''), e = String((req.query && req.query.e) || 'play');
  if (!GAMES.includes(g) || !EVENTS.includes(e)) return res.status(400).json({ ok: false, error: 'bad_game_or_event' });
  // Only count pings sent from our own pages (browsers attach Origin or Referer to these requests; scripts that send neither are refused).
  const from = String(req.headers.origin || req.headers.referer || '');
  if (!/^https:\/\/(www\.)?usurp\.games(\/|$)/.test(from) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(from)) {
    return res.status(403).json({ ok: false, error: 'not_our_page' });
  }
  const kind = storage.kind();
  if (!kind) return res.status(204).end();
  const week = isoWeek(new Date()), field = `${g}:${e}`;
  try {
    if (kind === 'redis') {
      const wk = `plays:${week}`;
      await storage.redis([['HINCRBY', wk, field, 1], ['HINCRBY', 'plays:all', field, 1], ['EXPIRE', wk, 60 * 60 * 24 * 420]]);
    } else if (BLOB_COUNTER_ON()) {
      await storage.blobUpdate(`plays/${week}.json`, d => bump(d, field), BLOB_TRIES());
    }
  } catch (err) { /* a lost count is better than a slow game */ }
  return res.status(204).end();
};

module.exports.isoWeek = isoWeek;
module.exports.GAMES = GAMES;
module.exports.bump = bump;
module.exports.BLOB_WEEKLY_WRITES = BLOB_WEEKLY_WRITES;
module.exports.BLOB_COUNTER_ON = BLOB_COUNTER_ON;
module.exports.creds = storage.creds;   // kept for older callers
