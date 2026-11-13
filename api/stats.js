// Weekly play counts per game for /stats.html (and the Monday growth report): the last 12 weeks plus all time.
// Reads the same store the play counter writes: Upstash Redis when connected, otherwise the Vercel Blob week files.
const { isoWeek, GAMES, BLOB_WEEKLY_WRITES, BLOB_COUNTER_ON } = require('./play.js');
const storage = require('../lib/storage.js');

// { archery: { play, finish }, ... } from flat 'game:event' -> count pairs (Redis HGETALL arrays or Blob JSON objects).
function toObj(pairs) {
  const o = {};
  for (const [k, v] of pairs) {
    const [g, e] = String(k).split(':');
    if (!GAMES.includes(g) || (e !== 'play' && e !== 'finish')) continue;
    (o[g] = o[g] || { play: 0, finish: 0 })[e] += Number(v) || 0;
  }
  return o;
}
const fromRedis = arr => { const p = []; for (let i = 0; arr && i < arr.length; i += 2) p.push([arr[i], arr[i + 1]]); return toObj(p); };

// The Monday that starts each of the last 12 ISO weeks, newest first.
function lastWeeks(now) {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() || 7) - 1));
  return Array.from({ length: 12 }, (_, i) => { const d = new Date(monday); d.setUTCDate(d.getUTCDate() - 7 * i); return { week: isoWeek(d), start: d.toISOString().slice(0, 10) }; });
}

async function readRedis(weeks) {
  const out = await storage.redis([['HGETALL', 'plays:all'], ...weeks.map(w => ['HGETALL', `plays:${w.week}`])]);
  return { all: fromRedis(out[0] && out[0].result), counts: weeks.map((w, i) => fromRedis(out[i + 1] && out[i + 1].result)) };
}

// One file per week; all time is the sum of every week file there is. A finished week never changes again, so a warm
// instance keeps it in memory instead of reading it from Blob on every refresh.
const past = new Map();
async function readBlob(weeks) {
  const files = (await storage.blobList('plays/')).filter(p => /^plays\/\d{4}-W\d{2}\.json$/.test(p));
  const byWeek = {};
  await Promise.all(files.map(async p => {
    const wk = p.slice(6, -5);
    let d = past.get(wk);
    if (!d) {
      const r = await storage.blobGetJson(p);
      d = r && r.data && typeof r.data === 'object' ? r.data : {};
      if (wk < weeks[0].week) past.set(wk, d);
    }
    byWeek[wk] = d;
  }));
  const flags = d => ({ approx: Number(d && d._sampled) > 0, capped: Number(d && d._writes) >= BLOB_WEEKLY_WRITES });
  return {
    all: toObj([].concat(...Object.values(byWeek).map(d => Object.entries(d)))),
    counts: weeks.map(w => toObj(Object.entries(byWeek[w.week] || {}))),
    flags: weeks.map(w => flags(byWeek[w.week])),
  };
}

module.exports = async (req, res) => {
  const kind = storage.kind();
  if (!kind || (kind === 'blob' && !BLOB_COUNTER_ON())) {
    // The Blob counter is opt-in (see api/play.js), so Blob storage alone does not mean there are counts to show.
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, connected: false, reason: kind ? 'blob_counter_off' : 'no_store', games: GAMES, weeks: [], all: {} });
  }
  const now = new Date(), weeks = lastWeeks(now);
  try {
    const r = kind === 'redis' ? await readRedis(weeks) : await readBlob(weeks);
    // Blob reads count against the free plan's operations, so its answer is cached longer at the edge.
    res.setHeader('Cache-Control', `public, s-maxage=${kind === 'blob' ? 900 : 300}, stale-while-revalidate=600`);
    return res.status(200).json({
      ok: true, connected: true, store: kind, games: GAMES, updated: now.toISOString(),
      all: r.all, weeks: weeks.map((w, i) => Object.assign(w, { counts: r.counts[i] }, r.flags ? r.flags[i] : {})),
      ...(kind === 'blob' ? { budget: { weeklyWrites: BLOB_WEEKLY_WRITES, sampleFrom: Math.floor(BLOB_WEEKLY_WRITES * 0.6), sample: 10 } } : {}),
    });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ ok: false, connected: true, error: 'counter_unreachable' });
  }
};
module.exports.toObj = toObj;
module.exports.lastWeeks = lastWeeks;
module.exports._past = past;
