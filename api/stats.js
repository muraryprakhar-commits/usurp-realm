// Weekly play counts per game for /stats.html (and the Monday growth report): the last 12 weeks plus all time.
const { isoWeek, GAMES, creds } = require('./play.js');

module.exports = async (req, res) => {
  const { url, token } = creds();
  if (!url || !token) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, connected: false, games: GAMES, weeks: [], all: {} });
  }
  // The Monday that starts each of the last 12 ISO weeks, newest first.
  const now = new Date(), monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() || 7) - 1));
  const weeks = Array.from({ length: 12 }, (_, i) => { const d = new Date(monday); d.setUTCDate(d.getUTCDate() - 7 * i); return { week: isoWeek(d), start: d.toISOString().slice(0, 10) }; });
  try {
    const r = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['HGETALL', 'plays:all'], ...weeks.map(w => ['HGETALL', `plays:${w.week}`])]),
    });
    if (!r.ok) throw new Error('redis ' + r.status);
    const out = await r.json();
    const toObj = arr => {
      const o = {};
      for (let i = 0; arr && i < arr.length; i += 2) {
        const [g, e] = String(arr[i]).split(':');
        if (!GAMES.includes(g)) continue;
        (o[g] = o[g] || { play: 0, finish: 0 })[e] = Number(arr[i + 1]) || 0;
      }
      return o;
    };
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      ok: true, connected: true, games: GAMES, updated: now.toISOString(),
      all: toObj(out[0] && out[0].result),
      weeks: weeks.map((w, i) => Object.assign(w, { counts: toObj(out[i + 1] && out[i + 1].result) })),
    });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ ok: false, connected: true, error: 'counter_unreachable' });
  }
};
