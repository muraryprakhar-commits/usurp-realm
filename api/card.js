// Free crest e-card: /card/CODE?to=NAME&from=NAME&msg=TEXT (rewritten to /api/card?d=CODE&...).
// Link previews show the crest (api/og.js); opening the link reveals the crest with the message.
// Every card ends with "design your own" and "print this one", so each card sent is also an ad for Crest Studio.
const C = require('../crest-core.js');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

module.exports = (req, res) => {
  const q = req.query || {};
  const code = String(q.d || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 800);
  const d = code && C.dec(code);
  if (!d) { res.writeHead(302, { Location: '/crest.html' }); return res.end(); }
  const to = clean(q.to, 40), from = clean(q.from, 40), msg = clean(q.msg, 160);
  const house = d.name.trim() || 'your house';
  const title = to ? `A coat of arms for ${to}` : `The arms of ${house}`;
  const desc = from ? `${from} made you a coat of arms. Open your card.` : 'Someone made you a coat of arms. Open your card.';
  const img = `https://usurp.games/api/og?d=${code}`;
  const studio = `/crest.html?d=${code}`;
  const blazon = C.blazon(d), meaning = C.meaning(d);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="robots" content="noindex,follow"><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Crest Studio by Usurp"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${img}">
<meta name="theme-color" content="#14110e"><link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;700&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/pages.css">
<script>/* analytics: on unless this browser turned it off at /privacy.html#analytics */(function(w,d){var off=false;try{off=localStorage.getItem('ug-analytics')==='off'}catch(e){}w.UG_NOTRACK=off;if(off)return;(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(w,d,"clarity","script","yzjmha008x");var v=d.createElement('script');v.defer=true;v.src='/_vercel/insights/script.js';d.head.appendChild(v);})(window,document);</script>
<style>
.ecard{max-width:560px;margin:0 auto;padding:36px 16px 56px;text-align:center}
.ecard .cseal{opacity:0;transform:scale(.86) translateY(14px);animation:rise 1.1s .25s cubic-bezier(.2,.8,.2,1) forwards}
.ecard .cseal svg{width:min(78vw,380px);height:auto;margin:0 auto;filter:drop-shadow(0 18px 30px rgba(0,0,0,.6))}
.ecard .note{opacity:0;animation:fade .9s 1.2s forwards;background:#efe1bd;color:#2a1a0e;border:1px solid #9c7a45;padding:22px 20px;margin:22px auto 0;text-align:left;box-shadow:0 14px 30px rgba(0,0,0,.5)}
.ecard .note .to{font-family:var(--serif);font-weight:700;color:#7a1020;letter-spacing:.08em}
.ecard .note p{color:#2a1a0e;font-size:19px;margin-top:10px}
.ecard .note .from{font-style:italic;text-align:right}
.ecard .blz{font-style:italic;color:var(--gold-2);margin-top:18px}
.ecard .mean{color:var(--text);font-size:16px;margin-top:6px}
.ecard .acts{opacity:0;animation:fade .8s 1.8s forwards;display:grid;gap:12px;margin-top:24px}
@keyframes rise{to{opacity:1;transform:none}}@keyframes fade{to{opacity:1}}
@media (prefers-reduced-motion:reduce){.ecard .cseal,.ecard .note,.ecard .acts{animation:none;opacity:1;transform:none}}
</style></head><body><main class="ecard">
<p class="eyebrow">${to ? `For ${esc(to)}` : 'A coat of arms for you'}</p>
<h1 class="gilt" style="font-size:clamp(26px,7vw,40px);margin:8px 0 18px">The arms of ${esc(house)}</h1>
<div class="cseal">${C.svg(d, 'card', `Coat of arms of ${house}`)}</div>
${msg || from ? `<div class="note">${to ? `<div class="to">Dear ${esc(to)},</div>` : ''}${msg ? `<p>${esc(msg)}</p>` : ''}${from ? `<p class="from">${esc(from)}</p>` : ''}</div>` : ''}
<p class="blz">${esc(blazon)}</p><p class="mean">${esc(meaning)}</p>
<div class="acts">
<a class="btn big" href="${studio}" data-ev="card_print">Get this crest as print files, $9</a>
<a class="btn ghost" href="/crest.html" data-ev="card_design">Design your own coat of arms, free</a>
<a class="btn ghost" href="/coat-of-arms-quiz.html" data-ev="card_quiz">Take the heraldry quiz</a>
</div>
<p class="fine">Original heraldic artwork made with <a href="/crest.html">Crest Studio</a> at usurp.games. Not an official grant of arms.</p>
</main>
<script>document.addEventListener('click',function(e){var a=e.target.closest('[data-ev]');if(a&&window.clarity)try{clarity('event',a.dataset.ev)}catch(x){}});if(window.clarity)try{clarity('event','card_open')}catch(x){}</script>
</body></html>`);
};
