// Share page for a crest: /c/CODE (rewritten to /api/share?d=CODE).
// Link previews (WhatsApp, iMessage, Discord, X, Slack) read the tags and show that crest; people are sent straight to the Studio.
const C = require('../crest-core.js');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

module.exports = (req, res) => {
  const code = String((req.query && req.query.d) || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 800);
  const d = code && C.dec(code);
  if (!d) { res.writeHead(302, { Location: '/crest.html' }); return res.end(); }
  const name = d.name.trim() || 'A noble house';
  const title = `${name}: a coat of arms`;
  const desc = quiz ? 'My heraldry quiz result. Take the free quiz to find your own coat of arms.' : (d.motto.trim() ? `"${d.motto.trim()}". ` : '') + 'Design your own coat of arms free at usurp.games.';
  const quiz = req.query && req.query.via === 'quiz';   // quiz results send friends to the quiz, not the studio
  const img = `https://usurp.games/api/og?d=${code}`, target = quiz ? `/coat-of-arms-quiz.html?r=${code}` : `/crest.html?d=${code}`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://usurp.games/crest.html">
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Crest Studio by Usurp"><meta property="og:url" content="https://usurp.games/c/${code}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Coat of arms of ${esc(name)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}">
<meta http-equiv="refresh" content="0;url=${target}"><script>location.replace(${JSON.stringify(target)})</script>
<style>body{background:#14110e;color:#e8dcc2;font-family:Georgia,serif;text-align:center;padding:60px 16px}a{color:#f3dc92}</style></head>
<body><p>Opening the crest of ${esc(name)}…</p><p><a href="${target}">Open it in Crest Studio</a></p></body></html>`);
};
