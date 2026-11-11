// Counts game starts and finished games on usurp.games, per game and per week, for the stats page (/stats.html).
// Stores only counters (no cookies, no IP address, nothing about the player): in Upstash Redis when it is connected,
// otherwise in the project's private Vercel Blob store as one small JSON file of totals per week (plays/2026-W46.json,
// e.g. {"archery:play": 12, "archery:finish": 7}). With neither connected, it accepts the ping and does nothing.
//
// Blob budget: the Hobby plan includes 2,000 Blob writes a month for the whole project, shared with cloud saves, and
// going over locks Blob (saves included) for 30 days. So each week's file allows at most BLOB_WEEKLY_WRITES writes
// (default 200, under 1,000 in any 30 days). Past 60% of that it counts 1 play in 10 and adds 10, an unbiased estimate
// the stats page marks as approximate; at the limit it stops counting until Monday. Redis has no such limit.
const storage = require('../lib/storage.js');
const GAMES = ['archery', 'joust', 'castle', 'duel', 'siege', 'tafl', 'morris', 'usurper'];
const EVENTS = ['play', 'finish'];

const BLOB_WEEKLY_WRITES = Math.max(1, Number(process.env.PLAY_COUNTER_WEEKLY_WRITES) || 200);
const SAMPLE = 10;

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
    } else {
      await storage.blobUpdate(`plays/${week}.json`, d => bump(d, field));
    }
  } catch (err) { /* a lost count is better than a slow game */ }
  return res.status(204).end();
};

module.exports.isoWeek = isoWeek;
module.exports.GAMES = GAMES;
module.exports.bump = bump;
module.exports.BLOB_WEEKLY_WRITES = BLOB_WEEKLY_WRITES;
module.exports.creds = storage.creds;   // kept for older callers
