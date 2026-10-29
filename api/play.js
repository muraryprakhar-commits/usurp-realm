// Counts game starts and finished games on usurp.games, per game and per week, for the stats page (/stats.html).
// Stores only counters (no cookies, no IP address, nothing about the player) in the Upstash Redis database linked to
// this Vercel project. Until that database is connected, this endpoint accepts the ping and does nothing.
const GAMES = ['archery', 'joust', 'castle', 'duel', 'siege', 'tafl', 'morris', 'usurper'];
const EVENTS = ['play', 'finish'];

function creds() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
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
  const { url, token } = creds();
  if (!url || !token) return res.status(204).end();
  const wk = `plays:${isoWeek(new Date())}`, field = `${g}:${e}`;
  try {
    await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['HINCRBY', wk, field, 1], ['HINCRBY', 'plays:all', field, 1], ['EXPIRE', wk, 60 * 60 * 24 * 420]]),
    });
  } catch (err) { /* a lost count is better than a slow game */ }
  return res.status(204).end();
};

module.exports.isoWeek = isoWeek;
module.exports.GAMES = GAMES;
module.exports.creds = creds;
