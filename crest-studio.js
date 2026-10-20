/* Usurp Crest Studio: design a coat of arms, pay once, download print-ready files.
   A separate digital product. Buying artwork gives no rank, title or advantage in the Usurp game. */
(() => {
const $ = s => document.querySelector(s);

/* ============ EDIT HERE ============ */
const PRODUCT_ID = 'pdt_0Nq7l6osvcUL8N0wu65UL';           // Dodo live product: Custom Heraldic Crest
const PRICE = 9;                                            // must match the price set in Dodo
const KIT_ID = 'pdt_0Nq8R4zhafrgCTZA1HYkj';                // Dodo live product: Crest Logo Kit
const KIT_PRICE = 29;
const CHECKOUT = 'https://checkout.dodopayments.com/buy/';
const RETURN_URL = 'https://usurp.games/crest.html';
const CONTACT = 'hello@usurp.games';

const TINCTURES = [
  ['Gules', '#b3242f'], ['Murrey', '#7a1020'], ['Azure', '#1f4e8a'], ['Vert', '#1f5f3d'],
  ['Purpure', '#5a2a6e'], ['Sable', '#1d1915'], ['Or', '#d4af5a'], ['Argent', '#e8e4d8'],
];
const DIVISIONS = [['plain', 'Plain'], ['perpale', 'Per pale'], ['fess', 'Fess'], ['bend', 'Bend'], ['chevron', 'Chevron'], ['quarterly', 'Quarterly'], ['saltire', 'Saltire'], ['pale', 'Pale']];
const CHARGES = [['initial', 'Your initial'], ['tower', 'Tower'], ['sword', 'Sword'], ['crown', 'Crown'], ['key', 'Key'], ['crescent', 'Crescent'], ['rose', 'Rose'], ['mullet', 'Star'], ['none', 'None']];
const DEFAULT = { name:'House Ashford', motto:'Fortune Favours the Bold', f:'#7a1020', d:'#d4af5a', c:'#f3dc92', div:'chevron', ch:'initial', bg:'parch' };

/* ============ crest geometry (shield space 100 x 122) ============ */
const STROKE = '#1a0e05';
function charge(kind, col) {
  const s = `fill="${col}" stroke="${STROKE}" stroke-width="1.2"`;
  switch (kind) {
    case 'tower': return `<g ${s}><path d="M36 82V46h-4v-8h6v5h5v-5h6v5h6v-5h6v5h5v-5h6v8h-4v36z"/><path d="M45 82V68a5 5 0 0110 0v14z" fill="${STROKE}"/><rect x="47" y="52" width="6" height="8" fill="${STROKE}"/></g>`;
    case 'sword': return `<g ${s}><path d="M48 28h4v52h-4z"/><path d="M50 22l3 6h-6z"/><path d="M36 78h28v5H36z"/><path d="M48 83h4v10h-4z"/><circle cx="50" cy="96" r="4"/></g>`;
    case 'crescent': return `<path ${s} d="M62 36a24 24 0 100 40a19 19 0 110-40z"/>`;
    case 'key': return `<g ${s}><circle cx="50" cy="40" r="11"/><circle cx="50" cy="40" r="5" fill="${STROKE}"/><path d="M47 50h6v36h-6z"/><path d="M53 70h9v5h-9zM53 79h7v5h-7z"/></g>`;
    case 'rose': return `<g ${s}>${[0, 72, 144, 216, 288].map(a => `<circle cx="${(50 + 13 * Math.sin(a * Math.PI / 180)).toFixed(2)}" cy="${(58 - 13 * Math.cos(a * Math.PI / 180)).toFixed(2)}" r="10"/>`).join('')}<circle cx="50" cy="58" r="7" fill="#e7c55a"/></g>`;
    case 'mullet': { const p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, a = (i * 36 - 90) * Math.PI / 180; p.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(58 + r * Math.sin(a)).toFixed(1)}`); } return `<polygon ${s} points="${p.join(' ')}"/>`; }
    case 'crown': return `<g ${s}><path d="M28 74l-4-30 14 14 12-22 12 22 14-14-4 30z"/><rect x="28" y="74" width="44" height="9"/><circle cx="24" cy="42" r="3.5"/><circle cx="50" cy="34" r="3.5"/><circle cx="76" cy="42" r="3.5"/><circle cx="50" cy="78.5" r="2.6" fill="#b3242f"/><circle cx="38" cy="78.5" r="2" fill="#1f5f8a"/><circle cx="62" cy="78.5" r="2" fill="#1f5f8a"/></g>`;
  }
  return '';
}
function division(kind, c) {
  switch (kind) {
    case 'perpale': return `<rect x="50" y="0" width="50" height="122" fill="${c}"/>`;
    case 'fess': return `<rect x="0" y="40" width="100" height="30" fill="${c}"/>`;
    case 'bend': return `<path d="M0 10L10 0L100 90V112z" fill="${c}"/>`;
    case 'chevron': return `<path d="M0 100L50 50L100 100V80L50 30L0 80z" fill="${c}"/>`;
    case 'quarterly': return `<rect x="50" y="0" width="50" height="58" fill="${c}"/><rect x="0" y="58" width="50" height="64" fill="${c}"/>`;
    case 'saltire': return `<path d="M0 0h14l86 100v22h-14L0 14zM100 0H86L0 100v22h14L100 14z" fill="${c}"/>`;
    case 'pale': return `<rect x="36" y="0" width="28" height="122" fill="${c}"/>`;
  }
  return '';
}
const SHIELD = 'M6 6H94V56C94 88 72 106 50 116C28 106 6 88 6 56Z';
const initialOf = name => {
  const w = String(name || '').replace(/^(house|clan|family|the)\s+/i, '').trim();
  return (w.match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase();
};

/* ============ full artwork layout (1000 x 1250) ============
   Text is returned separately so the PNG can draw it with real fonts on a canvas. */
const W = 1000, HT = 1250, SX = 200, SY = 175, SC = 6;
const FONT_D = "'Cinzel Decorative', Georgia, serif", FONT = "'Cinzel', Georgia, serif";
function layout(d, uid = 'a', opts = {}) {
  const art = [];
  if (d.bg === 'parch') {
    art.push(`<rect width="${W}" height="${HT}" fill="#efe1bd"/>`,
      `<rect x="22" y="22" width="${W - 44}" height="${HT - 44}" fill="none" stroke="#9c7a45" stroke-width="4"/>`,
      `<rect x="36" y="36" width="${W - 72}" height="${HT - 72}" fill="none" stroke="#9c7a45" stroke-width="1.5"/>`);
  }
  // mantling flourishes behind the shield
  art.push(`<g fill="${d.f}" stroke="#5c4417" stroke-width="3" opacity=".95">
    <path d="M200 260C120 300 90 420 130 520C150 470 175 450 205 452C170 520 175 610 225 680L250 600C220 540 225 470 255 420Z"/>
    <path d="M800 260C880 300 910 420 870 520C850 470 825 450 795 452C830 520 825 610 775 680L750 600C780 540 775 470 745 420Z"/></g>`);
  const g = `g${uid}`, cp = `c${uid}`;
  const inner = d.ch === 'none' || d.ch === 'initial' ? '' : charge(d.ch, d.c);
  art.push(`<defs><clipPath id="${cp}"><path d="${SHIELD}"/></clipPath>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient></defs>
    <g transform="translate(${SX} ${SY}) scale(${SC})">
      <g clip-path="url(#${cp})"><rect width="100" height="122" fill="${d.f}"/>${division(d.div, d.d)}${inner}<rect width="100" height="122" fill="url(#${g})"/></g>
      <path d="${SHIELD}" fill="none" stroke="#d4af5a" stroke-width="4"/>
      <path d="${SHIELD}" fill="none" stroke="#5c4417" stroke-width="1" transform="translate(5 5) scale(.9)"/>
    </g>`);
  // motto ribbon
  if (!opts.noRibbon) art.push(`<g stroke="#5c4417" stroke-width="3">
    <path d="M120 1010L190 985L190 1085L120 1110L150 1060Z" fill="#c9b07a"/>
    <path d="M880 1010L810 985L810 1085L880 1110L850 1060Z" fill="#c9b07a"/>
    <path d="M180 975Q500 935 820 975V1075Q500 1035 180 1075Z" fill="#efe1bd"/></g>`);
  const ink = '#2a1a0e';
  const texts = [];
  const nm = String(d.name || '').trim();
  if (nm && !opts.noName) texts.push({ s:nm, x:W / 2, y:130, size:fitSize(nm, 64, 18), font:FONT_D, weight:900, fill:ink, stroke:null });
  const mt = String(d.motto || '').trim();
  if (mt && !opts.noRibbon) texts.push({ s:mt, x:W / 2, y:1030, size:fitSize(mt, 40, 26), font:FONT, weight:700, fill:'#7a1020', stroke:null });
  if (d.ch === 'initial') texts.push({ s:initialOf(nm), x:SX + 50 * SC, y:SY + 80 * SC, size:46 * SC, font:FONT_D, weight:900, fill:d.c, stroke:{ c:STROKE, w:6 } });
  return { art:art.join(''), texts };
}
function fitSize(s, base, maxChars) { return s.length <= maxChars ? base : Math.max(22, Math.round(base * maxChars / s.length)); }
const xesc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]));
function textSvg(t) {
  const st = t.stroke ? ` stroke="${t.stroke.c}" stroke-width="${t.stroke.w}" paint-order="stroke"` : '';
  return `<text x="${t.x}" y="${t.y}" text-anchor="middle" dominant-baseline="alphabetic" font-family="${t.font.replace(/"/g, '')}" font-weight="${t.weight}" font-size="${t.size}" fill="${t.fill}"${st}>${xesc(t.s)}</text>`;
}
function svgString(d, fontCss = '') {
  const L = layout(d, 'f');
  const style = fontCss ? `<style>${fontCss}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${HT}" width="${W}" height="${HT}">${style}${L.art}${L.texts.map(textSvg).join('')}</svg>`;
}

/* ============ design code (goes into Dodo metadata) ============ */
const enc = d => btoa(unescape(encodeURIComponent(JSON.stringify([d.name, d.motto, d.f, d.d, d.c, d.div, d.ch, d.bg])))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function dec(code) {
  try {
    const b = code.replace(/-/g, '+').replace(/_/g, '/');
    const a = JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4)))));
    const d = { name:a[0], motto:a[1], f:a[2], d:a[3], c:a[4], div:a[5], ch:a[6], bg:a[7] };
    return sanitize(d);
  } catch (e) { return null; }
}
const HEX = /^#[0-9a-f]{6}$/i;
function sanitize(d) {
  return {
    name: String(d.name || '').slice(0, 40), motto: String(d.motto || '').slice(0, 48),
    f: HEX.test(d.f) ? d.f : DEFAULT.f, d: HEX.test(d.d) ? d.d : DEFAULT.d, c: HEX.test(d.c) ? d.c : DEFAULT.c,
    div: DIVISIONS.some(x => x[0] === d.div) ? d.div : 'plain', ch: CHARGES.some(x => x[0] === d.ch) ? d.ch : 'initial',
    bg: d.bg === 'clear' ? 'clear' : 'parch',
  };
}

/* ============ state + UI ============ */
const KEY = 'usurp-crest-v1';
let D;
try { D = sanitize(JSON.parse(localStorage.getItem(KEY)) || DEFAULT); } catch (e) { D = { ...DEFAULT }; }
// A shared link (?d=...) opens that design.
{ const shared = new URLSearchParams(location.search).get('d'); const sd = shared && dec(shared); if (sd) D = sd; }
// Links from the free tools (?motto=... or ?name=...) fill in just that field and keep the rest of the design.
{ const q = new URLSearchParams(location.search), m = q.get('motto'), n = q.get('name');
  if (m) D.motto = m.slice(0, 48); if (n) D.name = n.slice(0, 40); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} };
const GKEY = 'usurp-crest-gift';
const gift = () => { try { const g = JSON.parse(localStorage.getItem(GKEY)) || {}; return { to:String(g.to || '').slice(0, 40), from:String(g.from || '').slice(0, 40) }; } catch (e) { return { to:'', from:'' }; } };

function preview() {
  const L = layout(D, 'p');
  $('[data-preview]').innerHTML = `<svg viewBox="0 0 ${W} ${HT}" role="img" aria-label="Preview of your coat of arms">${L.art}${L.texts.map(textSvg).join('')}</svg>`;
  $('[data-price]').textContent = `$${PRICE}`;
  extras();
}
// Live blazon, meaning and the thumbnails of everything in the $9 package.
function extras() {
  const CC = window.CrestCore;
  const m = $('[data-meaning]');
  if (m && CC) {
    m.querySelector('[data-blazon]').textContent = CC.blazon(D);
    m.querySelector('[data-mean]').textContent = CC.meaning(D);
    const n = CC.tinctureNote(D), nn = m.querySelector('[data-tnote]'); nn.textContent = n; nn.hidden = !n;
  }
  const inc = $('[data-inc]');
  if (!inc) return;
  const full = (u, d, o) => { const L = layout(d, u, o); return `<svg viewBox="0 0 ${W} ${HT}" aria-hidden="true">${L.art}${L.texts.map(textSvg).join('')}</svg>`; };
  const shield = (u, vb) => { const L = layout({ ...D, bg:'clear' }, u, { noName:true, noRibbon:true }); return `<svg viewBox="${vb}" aria-hidden="true">${L.art}${L.texts.map(textSvg).join('')}</svg>`; };
  inc.querySelector('[data-t-print]').innerHTML = full('t1', D);
  inc.querySelector('[data-t-cert]').innerHTML = `<div class="mini-cert"><span class="mc-k">The arms of</span><span class="mc-n"></span>${full('t2', { ...D, bg:'clear' }, { noName:true })}<span class="mc-l"></span><span class="mc-l"></span></div>`;
  inc.querySelector('.mc-n').textContent = String(D.name).trim() || 'Your house';
  inc.querySelector('[data-t-avatar]').innerHTML = shield('t3', '90 120 820 820');
  inc.querySelector('[data-t-wall]').innerHTML = shield('t4', '60 150 880 880');
  const bn = $('[data-t-banner]');
  if (bn) {
    bn.innerHTML = shield('t5', '90 120 820 820') + '<span class="bn-t"><b></b><i></i></span>';
    bn.querySelector('b').textContent = String(D.name).trim() || 'Your house'; bn.querySelector('i').textContent = String(D.motto).trim();
  }
}
function swatches(el, key) {
  el.innerHTML = TINCTURES.map(([n, c]) => `<button type="button" class="sw" style="--sw:${c}" data-k="${key}" data-v="${c}" aria-label="${n}" title="${n}"></button>`).join('');
}
function syncControls() {
  $('[data-f-name]').value = D.name; $('[data-f-motto]').value = D.motto;
  $('[data-f-div]').value = D.div; $('[data-f-ch]').value = D.ch;
  $('[data-f-bg]').checked = D.bg === 'clear';
  document.querySelectorAll('.sw').forEach(b => b.setAttribute('aria-pressed', String(D[b.dataset.k] === b.dataset.v)));
}
function buyUrl(pid = PRODUCT_ID) {
  const p = new URLSearchParams({ quantity:'1', redirect_url:RETURN_URL, metadata_design:enc(D), showDiscounts:'false' });
  return `${CHECKOUT}${pid}?${p}`;
}
function wire() {
  $('[data-f-div]').innerHTML = DIVISIONS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
  $('[data-f-ch]').innerHTML = CHARGES.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
  swatches($('[data-sw-f]'), 'f'); swatches($('[data-sw-d]'), 'd'); swatches($('[data-sw-c]'), 'c');
  const upd = () => { save(); preview(); syncControls(); };
  $('[data-f-name]').oninput = e => { D.name = e.target.value.slice(0, 40); save(); preview(); };
  $('[data-f-motto]').oninput = e => { D.motto = e.target.value.slice(0, 48); save(); preview(); };
  $('[data-f-div]').onchange = e => { D.div = e.target.value; upd(); };
  $('[data-f-ch]').onchange = e => { D.ch = e.target.value; upd(); };
  $('[data-f-bg]').onchange = e => { D.bg = e.target.checked ? 'clear' : 'parch'; upd(); };
  document.addEventListener('click', e => { const b = e.target.closest('.sw'); if (b) { D[b.dataset.k] = b.dataset.v; upd(); } });
  $('[data-random]').onclick = () => {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const t = TINCTURES.map(x => x[1]);
    D.f = pick(t); do { D.d = pick(t); } while (D.d === D.f); D.c = pick(['#f3dc92', '#e8e4d8', '#1d1915', '#b3242f']);
    D.div = pick(DIVISIONS)[0]; D.ch = pick(CHARGES.slice(0, 8))[0]; upd();
  };
  $('[data-share]').onclick = () => shareDesign(D, note);
  const gt = $('[data-g-to]'), gf = $('[data-g-from]');
  if (gt && gf) {
    const G = gift(); gt.value = G.to; gf.value = G.from;
    const sg = () => { try { localStorage.setItem(GKEY, JSON.stringify({ to:gt.value.slice(0, 40), from:gf.value.slice(0, 40) })); } catch (e) {} };
    gt.oninput = sg; gf.oninput = sg;
  }
  const free = $('[data-free]');
  if (free) free.onclick = async () => {
    try { await downloadPng({ ...D }, 800, true); note('Preview saved. Share it anywhere. The $9 download is full size with no watermark.'); }
    catch (e) { note('Could not save the preview on this browser. Try "Copy link to my design" instead.'); }
    if (window.clarity) try { window.clarity('event', 'crest_free_preview'); } catch (err) {}
  };
  const kitBtn = $('[data-buy-kit]');
  if (kitBtn) kitBtn.onclick = e => {
    if (!String(D.name).trim()) { e.preventDefault(); note('Add a name for your house first.'); $('[data-f-name]').focus(); return; }
    save(); e.currentTarget.href = buyUrl(KIT_ID);
    if (window.clarity) try { window.clarity('event', 'kit_checkout'); } catch (err) {}
  };
  $('[data-buy]').onclick = e => {
    if (!String(D.name).trim()) { e.preventDefault(); note('Add a name for your house first.'); $('[data-f-name]').focus(); return; }
    save(); e.currentTarget.href = buyUrl();
    if (window.clarity) try { window.clarity('event', 'crest_checkout'); } catch (err) {}
  };
}
// Share links (usurp.games/c/CODE) show the crest itself as the preview in chats and social apps.
async function shareDesign(d, say) {
  const url = `https://usurp.games/c/${enc(d)}`;
  try {
    if (navigator.share && matchMedia('(pointer:coarse)').matches) { await navigator.share({ title:'My coat of arms', text:'I designed my coat of arms. Make yours free:', url }); }
    else { await navigator.clipboard.writeText(url); say('Link copied. When you paste it, the preview shows your crest.'); }
  } catch (e) { say(url); }
  if (window.clarity) try { window.clarity('event', 'crest_share'); } catch (e) {}
}
function note(m) { const n = $('[data-note]'); n.textContent = m; n.hidden = !m; }

/* ============ downloads ============ */
let FONT_CSS = null;
async function fontCss() {
  if (FONT_CSS !== null) return FONT_CSS;
  try {
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&family=Cinzel:wght@700&display=swap')).text();
    const parts = [];
    const blocks = [...css.matchAll(/@font-face\s*{[^}]*}/g)].map(m => m[0]);
    const basic = blocks.filter(b => b.includes('U+0000-00FF'));
    for (const block of (basic.length ? basic : blocks)) {
      const url = (block.match(/url\((https:[^)]+)\)/) || [])[1];
      if (!url) continue;
      const buf = await (await fetch(url)).arrayBuffer();
      let bin = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      parts.push(block.replace(url, `data:font/woff2;base64,${btoa(bin)}`));
    }
    FONT_CSS = parts.join('\n');
  } catch (e) { FONT_CSS = ''; }
  return FONT_CSS;
}
const fileBase = d => (String(d.name).trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'crest').toLowerCase();
function saveBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
async function svgBlob(d) { return new Blob([svgString(d, await fontCss())], { type:'image/svg+xml' }); }
async function downloadSvg(d) { saveBlob(await svgBlob(d), `${fileBase(d)}-coat-of-arms.svg`); }
async function downloadPng(d, size, preview = false) { saveBlob(await pngBlob(d, size, preview), preview ? `${fileBase(d)}-crest-preview.png` : `${fileBase(d)}-coat-of-arms-${size}px.png`); }
async function pngBlob(d, size, preview = false) {
  await document.fonts.load(`900 64px 'Cinzel Decorative'`); await document.fonts.load(`700 40px 'Cinzel'`);
  const L = layout(preview ? { ...d, bg:'parch' } : d, 'x');
  const k = size / W, cv = document.createElement('canvas');
  cv.width = Math.round(W * k); cv.height = Math.round(HT * k);
  const ctx = cv.getContext('2d');
  const img = new Image();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${HT}" width="${cv.width}" height="${cv.height}">${L.art}</svg>`;
  await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  ctx.drawImage(img, 0, 0, cv.width, cv.height);
  ctx.scale(k, k); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const t of L.texts) {
    ctx.font = `${t.weight} ${t.size}px ${t.font}`;
    if (t.stroke) { ctx.lineWidth = t.stroke.w * 2; ctx.strokeStyle = t.stroke.c; ctx.lineJoin = 'round'; ctx.strokeText(t.s, t.x, t.y); }
    ctx.fillStyle = t.fill; ctx.fillText(t.s, t.x, t.y);
  }
  if (preview) {
    // Free preview: diagonal watermark across the shield plus a credit line, so it can be shared but not printed.
    ctx.save(); ctx.translate(W / 2, HT * 0.46); ctx.rotate(-24 * Math.PI / 180);
    ctx.font = `700 64px ${FONT}`; ctx.fillStyle = 'rgba(122,16,32,.30)';
    ctx.fillText('PREVIEW · USURP.GAMES', 0, 0); ctx.fillText('PREVIEW · USURP.GAMES', 0, 150); ctx.restore();
    ctx.font = `700 26px ${FONT}`; ctx.fillStyle = '#5c4417';
    ctx.fillText('Design yours free at usurp.games/crest', W / 2, HT - 70);
  }
  return await new Promise(r => cv.toBlob(r, 'image/png'));
}

/* ============ the rest of the $9 package: certificate, profile picture, phone wallpaper ============ */
const FONT_B = "'IM Fell English', Georgia, serif";
async function fontsReady() {
  const f = [`900 64px 'Cinzel Decorative'`, `700 40px 'Cinzel'`, `40px 'IM Fell English'`, `italic 40px 'IM Fell English'`];
  for (const x of f) { try { await document.fonts.load(x); } catch (e) {} }
}
function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// Draws the crest at (x, y), scale k, in artwork units: shapes as an image, words as canvas text with the real fonts.
async function drawCrest(ctx, d, x, y, k, opts = {}) {
  const L = layout(d, 'z', opts);
  const img = new Image();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${HT}" width="${Math.round(W * k)}" height="${Math.round(HT * k)}">${L.art}</svg>`;
  await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  ctx.drawImage(img, x, y, W * k, HT * k);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const t of L.texts) {
    ctx.font = `${t.weight} ${t.size}px ${t.font}`;
    if (t.stroke) { ctx.lineWidth = t.stroke.w * 2; ctx.strokeStyle = t.stroke.c; ctx.lineJoin = 'round'; ctx.strokeText(t.s, t.x, t.y); }
    ctx.fillStyle = t.fill; ctx.fillText(t.s, t.x, t.y);
  }
  ctx.restore();
}
function wrapLines(ctx, text, maxW) {
  const out = []; let cur = '';
  for (const w of String(text).split(/\s+/)) { const t = cur ? cur + ' ' + w : w; if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); return out;
}
function fitText(ctx, text, fontAt, size, maxW, min) { let z = size; ctx.font = fontAt(z); while (z > min && ctx.measureText(text).width > maxW) { z -= 4; ctx.font = fontAt(z); } }
function spaced(ctx, text, x, y, px) { if ('letterSpacing' in ctx) { ctx.letterSpacing = px + 'px'; ctx.fillText(text, x, y); ctx.letterSpacing = '0px'; } else ctx.fillText(text, x, y); }
const toBlob = cv => new Promise(r => cv.toBlob(r, 'image/png'));

async function downloadCertificate(d, g) { saveBlob(await certBlob(d, g), `${fileBase(d)}-certificate-of-arms.png`); }
async function certBlob(d, g) {
  await fontsReady();
  const CC = window.CrestCore, CW = 2550, CHh = 3300, cv = canvasOf(CW, CHh), ctx = cv.getContext('2d');   // US Letter at 300 dpi
  ctx.fillStyle = '#efe1bd'; ctx.fillRect(0, 0, CW, CHh);
  ctx.strokeStyle = '#9c7a45'; ctx.lineWidth = 10; ctx.strokeRect(70, 70, CW - 140, CHh - 140);
  ctx.lineWidth = 3; ctx.strokeRect(100, 100, CW - 200, CHh - 200);
  ctx.strokeStyle = '#d4af5a'; ctx.lineWidth = 2; ctx.strokeRect(118, 118, CW - 236, CHh - 236);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#7a1020'; ctx.font = `700 54px ${FONT}`; spaced(ctx, 'THE ARMS OF', CW / 2, 300, 14);
  const nm = String(d.name).trim() || 'Your House';
  ctx.fillStyle = '#2a1a0e'; fitText(ctx, nm, z => `900 ${z}px ${FONT_D}`, 140, 2100, 64); ctx.fillText(nm, CW / 2, 450);
  ctx.strokeStyle = '#9c7a45'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(CW / 2 - 420, 520); ctx.lineTo(CW / 2 + 420, 520); ctx.stroke();
  await drawCrest(ctx, { ...d, bg:'clear' }, (CW - W * 1.4) / 2, 345, 1.4, { noName:true });   // shield top near y 640, ribbon ends near y 1900
  let y = 2040;
  ctx.fillStyle = '#7a1020'; ctx.font = `700 40px ${FONT}`; spaced(ctx, 'BLAZON', CW / 2, y, 10); y += 86;
  ctx.fillStyle = '#2a1a0e'; ctx.font = `italic 64px ${FONT_B}`;
  for (const ln of wrapLines(ctx, CC ? CC.blazon(d) : '', 1950)) { ctx.fillText(ln, CW / 2, y); y += 78; }
  y += 36; ctx.fillStyle = '#7a1020'; ctx.font = `700 40px ${FONT}`; spaced(ctx, 'WHAT IT MEANS', CW / 2, y, 10); y += 80;
  ctx.fillStyle = '#4a3420'; ctx.font = `50px ${FONT_B}`;
  for (const ln of wrapLines(ctx, CC ? CC.meaning(d) : '', 1950)) { ctx.fillText(ln, CW / 2, y); y += 64; }
  const date = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const line = [g.to && `Presented to ${g.to}`, g.from && `by ${g.from}`].filter(Boolean).join(' ');
  y = Math.max(y + 90, 2780);
  ctx.fillStyle = '#2a1a0e';
  if (line) { fitText(ctx, line, z => `700 ${z}px ${FONT}`, 52, 2100, 30); ctx.fillText(line, CW / 2, y); y += 70; ctx.font = `46px ${FONT_B}`; ctx.fillText(date, CW / 2, y); }
  else { ctx.font = `48px ${FONT_B}`; ctx.fillText(`Designed ${date}`, CW / 2, y); }
  ctx.fillStyle = '#8a6a3a'; ctx.font = `32px ${FONT_B}`;
  ctx.fillText('Original heraldic artwork, not an official grant of arms. Designed at usurp.games', CW / 2, CHh - 150);
  return await toBlob(cv);
}
async function downloadAvatar(d) { saveBlob(await avatarBlob(d, 1080, d.bg !== 'clear'), `${fileBase(d)}-profile-picture-1080.png`); }
// Square shield-only image. fill: true puts it on parchment, false leaves it transparent.
async function avatarBlob(d, S, fill) {
  await fontsReady();
  const cv = canvasOf(S, S), ctx = cv.getContext('2d');
  if (fill) { ctx.fillStyle = '#efe1bd'; ctx.fillRect(0, 0, S, S); }
  const k = S / 820; await drawCrest(ctx, { ...d, bg:'clear' }, -90 * k, -120 * k, k, { noName:true, noRibbon:true });
  return await toBlob(cv);
}
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
async function downloadWallpaper(d) { saveBlob(await wallBlob(d), `${fileBase(d)}-phone-wallpaper.png`); }
async function wallBlob(d) {
  await fontsReady();
  const WW = 1170, WH = 2532, cv = canvasOf(WW, WH), ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, WH); g.addColorStop(0, '#0c0a08'); g.addColorStop(.55, '#1d1814'); g.addColorStop(1, '#0c0a08');
  ctx.fillStyle = g; ctx.fillRect(0, 0, WW, WH);
  const rg = ctx.createRadialGradient(WW / 2, 1450, 40, WW / 2, 1450, 760); rg.addColorStop(0, rgba(d.f, .5)); rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, WW, WH);
  const k = 1.1; await drawCrest(ctx, { ...d, bg:'clear' }, (WW - W * k) / 2, 1450 - 541 * k, k, { noName:true, noRibbon:true });
  ctx.textAlign = 'center';
  const mt = String(d.motto).trim();
  if (mt) { ctx.fillStyle = '#f3dc92'; fitText(ctx, mt, z => `700 ${z}px ${FONT}`, 62, 1000, 34); ctx.fillText(mt, WW / 2, 2090); }
  const nm = String(d.name).trim();
  if (nm) { ctx.fillStyle = '#a8997c'; fitText(ctx, nm, z => `900 ${z}px ${FONT_D}`, 46, 1000, 28); ctx.fillText(nm, WW / 2, mt ? 2170 : 2090); }
  return await toBlob(cv);
}

/* ============ Crest Logo Kit ($29): everything above plus logo, icon, social and brand files in one ZIP ============ */
function shieldSvgString(d, fontCssText = '') {
  const L = layout({ ...d, bg:'clear' }, 's', { noName:true, noRibbon:true });
  const style = fontCssText ? `<style>${fontCssText}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="90 120 820 820" width="820" height="820">${style}${L.art}${L.texts.map(textSvg).join('')}</svg>`;
}
// Banner: dark stone background, a glow in the field color, the shield and the house name and motto, centered in the safe area.
async function bannerBlob(d, w, h, safeW = w, safeH = h) {
  await fontsReady();
  const cv = canvasOf(w, h), ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0c0a08'); g.addColorStop(.5, '#1d1814'); g.addColorStop(1, '#0c0a08');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const s = Math.round(Math.min(safeH * 0.86, safeW * 0.34));
  const rg = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.45); rg.addColorStop(0, rgba(d.f, .45)); rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
  const nm = String(d.name).trim(), mt = String(d.motto).trim();
  const maxText = safeW - s - s * 0.18 - safeW * 0.06;
  let nameSize = Math.round(s * 0.2); ctx.font = `900 ${nameSize}px ${FONT_D}`;
  while (nameSize > 14 && ctx.measureText(nm).width > maxText) { nameSize -= 2; ctx.font = `900 ${nameSize}px ${FONT_D}`; }
  const nameW = nm ? ctx.measureText(nm).width : 0;
  let mottoSize = Math.round(nameSize * 0.5); ctx.font = `700 ${mottoSize}px ${FONT}`;
  while (mottoSize > 10 && ctx.measureText(mt).width > maxText) { mottoSize -= 1; ctx.font = `700 ${mottoSize}px ${FONT}`; }
  const mottoW = mt ? ctx.measureText(mt).width : 0;
  const textW = Math.max(nameW, mottoW), gap = textW ? s * 0.18 : 0, total = s + gap + textW;
  const x0 = (w - total) / 2, y0 = (h - s) / 2;
  const k = s / 820; await drawCrest(ctx, { ...d, bg:'clear' }, x0 - 90 * k, y0 - 120 * k, k, { noName:true, noRibbon:true });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const tx = x0 + s + gap, cy = h / 2;
  if (nm) { ctx.fillStyle = '#f3dc92'; ctx.font = `900 ${nameSize}px ${FONT_D}`; ctx.fillText(nm, tx, mt ? cy - nameSize * 0.08 : cy + nameSize * 0.35); }
  if (mt) { ctx.fillStyle = '#d4af5a'; ctx.font = `700 ${mottoSize}px ${FONT}`; ctx.fillText(mt, tx, cy + mottoSize * 1.55); }
  return await toBlob(cv);
}
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ');
async function brandSheetBlob(d) {
  await fontsReady();
  const CC = window.CrestCore, BW = 2550, BH = 3300, cv = canvasOf(BW, BH), ctx = cv.getContext('2d');
  ctx.fillStyle = '#faf6ec'; ctx.fillRect(0, 0, BW, BH);
  ctx.fillStyle = '#14110e'; ctx.fillRect(0, 0, BW, 360);
  ctx.textAlign = 'left'; ctx.fillStyle = '#d4af5a'; ctx.font = `700 46px ${FONT}`; spaced(ctx, 'BRAND SHEET', 160, 150, 12);
  const nm = String(d.name).trim() || 'Your House';
  ctx.fillStyle = '#f3dc92'; fitText(ctx, nm, z => `900 ${z}px ${FONT_D}`, 110, 2200, 50); ctx.fillText(nm, 160, 280);
  await drawCrest(ctx, { ...d, bg:'clear' }, 120, 340, 0.95, { noName:true });          // left column, about 950 x 1190
  // colors
  let y = 520; const x = 1180;
  ctx.fillStyle = '#7a1020'; ctx.font = `700 40px ${FONT}`; spaced(ctx, 'COLORS', x, y, 10); y += 50;
  const tname = h => (CC && CC.blazon({ ...D, f:h, div:'plain', ch:'none' }).replace('.', '')) || '';
  const sw = [['Field', d.f], ['Division', d.d], ['Emblem', d.c], ['Gold trim', '#d4af5a'], ['Ink', '#2a1a0e'], ['Parchment', '#efe1bd']];
  for (const [label, hx] of sw) {
    ctx.fillStyle = hx; ctx.fillRect(x, y, 150, 150); ctx.strokeStyle = '#5c4417'; ctx.lineWidth = 3; ctx.strokeRect(x, y, 150, 150);
    ctx.fillStyle = '#2a1a0e'; ctx.font = `700 44px ${FONT}`; ctx.fillText(label, x + 190, y + 55);
    ctx.font = `40px ${FONT_B}`; ctx.fillStyle = '#4a3420';
    const heraldic = ['Field', 'Division', 'Emblem'].includes(label) ? `  ·  ${tname(hx)}` : '';
    ctx.fillText(`HEX ${hx.toUpperCase()}   RGB ${hexRgb(hx)}${heraldic}`, x + 190, y + 115);
    y += 190;
  }
  // type and usage
  y = Math.max(y + 40, 1700);
  const block = (title, lines) => {
    ctx.fillStyle = '#7a1020'; ctx.font = `700 40px ${FONT}`; spaced(ctx, title, 160, y, 10); y += 70;
    ctx.fillStyle = '#2a1a0e'; ctx.font = `46px ${FONT_B}`;
    for (const l of lines) for (const ln of wrapLines(ctx, l, 2200)) { ctx.fillText(ln, 160, y); y += 62; }
    y += 50;
  };
  block('TYPEFACES', ['Headings and house name: Cinzel Decorative. Motto and labels: Cinzel. Body text: IM Fell English. All three are free Google Fonts under the SIL Open Font License, so you can use them anywhere.']);
  block('BLAZON', [CC ? CC.blazon(d) : '']);
  block('USING YOUR CREST', [
    'Use the transparent files on websites, merch and dark or photo backgrounds; use the parchment version for framed prints.',
    'Below about 120 px wide, switch to the shield-only files so the emblem stays readable.',
    'Leave clear space around the crest of at least a tenth of its width. Do not stretch, recolor or crop through the shield.',
  ]);
  ctx.fillStyle = '#8a6a3a'; ctx.font = `32px ${FONT_B}`; ctx.textAlign = 'center';
  ctx.fillText('Original heraldic artwork made with Crest Studio at usurp.games. Not an official grant of arms.', BW / 2, BH - 110);
  return await toBlob(cv);
}
function kitReadme(d, base) {
  const CC = window.CrestCore;
  return [
    `CREST LOGO KIT: ${String(d.name).trim()}`,
    `Motto: ${String(d.motto).trim() || '(none)'}`,
    `Blazon: ${CC ? CC.blazon(d) : ''}`,
    '',
    'WHAT IS IN THIS ZIP',
    `logo/   ${base}-crest-transparent-4000.png  full crest, transparent background (4000 x 5000 px)`,
    `        ${base}-crest-parchment-4000.png    full crest on parchment, for framed prints`,
    `        ${base}-crest-1200.png              web size`,
    `        ${base}-crest.svg                   full crest, vector, scales to any size`,
    `        ${base}-shield-transparent-2048.png shield only, square, transparent`,
    `        ${base}-shield.svg                  shield only, vector`,
    'icons/  favicon-32.png, favicon-48.png, icon-192.png, icon-512.png (transparent), apple-touch-icon-180.png (on parchment)',
    'social/ profile-picture-1080.png, discord-server-icon-512.png, x-header-1500x500.png,',
    '        linkedin-banner-1584x396.png, youtube-banner-2560x1440.png (artwork kept inside the TV and mobile safe area)',
    'print/  certificate-of-arms.png (US Letter, 300 dpi), phone-wallpaper.png',
    'brand/  brand-sheet.png (colors with HEX and RGB, typefaces, usage notes)',
    '',
    'LICENSE',
    'You may use these files for any lawful purpose, personal or commercial, including logos, branding, merchandise, print and web.',
    'Other people can make similar designs with the same tool, so the design is not exclusive to you. If you want to register it',
    'as a trademark, search for conflicts first and take advice where you are. This is original decorative artwork in the style of',
    'heraldry, not an official grant of arms. Fonts are free Google Fonts under the SIL Open Font License.',
    '',
    'Help or refunds (within 14 days): hello@usurp.games  ·  Make another: https://usurp.games/crest.html',
    '',
  ].join('\r\n');
}
async function loadZip() {
  if (window.JSZip) return window.JSZip;
  await new Promise((ok, bad) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; sc.onload = ok; sc.onerror = bad; document.head.appendChild(sc); });
  return window.JSZip;
}
async function kitBlob(d, g, onStep = () => {}) {
  const JSZip = await loadZip(), zip = new JSZip(), base = fileBase(d), css = await fontCss();
  const steps = [
    ['logo/' + base + '-crest-transparent-4000.png', () => pngBlob({ ...d, bg:'clear' }, 4000)],
    ['logo/' + base + '-crest-parchment-4000.png', () => pngBlob({ ...d, bg:'parch' }, 4000)],
    ['logo/' + base + '-crest-1200.png', () => pngBlob(d, 1200)],
    ['logo/' + base + '-crest.svg', async () => new Blob([svgString({ ...d, bg:'clear' }, css)], { type:'image/svg+xml' })],
    ['logo/' + base + '-shield-transparent-2048.png', () => avatarBlob(d, 2048, false)],
    ['logo/' + base + '-shield.svg', async () => new Blob([shieldSvgString(d, css)], { type:'image/svg+xml' })],
    ['icons/favicon-32.png', () => avatarBlob(d, 32, false)],
    ['icons/favicon-48.png', () => avatarBlob(d, 48, false)],
    ['icons/icon-192.png', () => avatarBlob(d, 192, false)],
    ['icons/icon-512.png', () => avatarBlob(d, 512, false)],
    ['icons/apple-touch-icon-180.png', () => avatarBlob(d, 180, true)],
    ['social/profile-picture-1080.png', () => avatarBlob(d, 1080, true)],
    ['social/discord-server-icon-512.png', () => avatarBlob(d, 512, true)],
    ['social/x-header-1500x500.png', () => bannerBlob(d, 1500, 500, 1100, 340)],
    ['social/linkedin-banner-1584x396.png', () => bannerBlob(d, 1584, 396, 1000, 300)],
    ['social/youtube-banner-2560x1440.png', () => bannerBlob(d, 2560, 1440, 1546, 423)],
    ['print/certificate-of-arms.png', () => certBlob(d, g)],
    ['print/phone-wallpaper.png', () => wallBlob(d)],
    ['brand/brand-sheet.png', () => brandSheetBlob(d)],
  ];
  for (let i = 0; i < steps.length; i++) { onStep(i + 1, steps.length); zip.file(steps[i][0], await steps[i][1]()); }
  zip.file('README.txt', kitReadme(d, base));
  return await zip.generateAsync({ type:'blob', compression:'STORE' });
}
async function downloadKit(d, g, btn) {
  const label = btn ? btn.textContent : '';
  try {
    const blob = await kitBlob(d, g, (i, n) => { if (btn) btn.textContent = `Building your kit… ${i} of ${n}`; });
    saveBlob(blob, `${fileBase(d)}-crest-logo-kit.zip`);
    if (window.clarity) try { window.clarity('event', 'kit_download'); } catch (e) {}
  } catch (e) {
    note(`Something went wrong building the ZIP. Download the files one by one above, or email ${CONTACT} with your payment reference.`);
  } finally { if (btn) btn.textContent = label; }
}

/* ============ return from checkout ============ */
async function handleReturn() {
  const p = new URLSearchParams(location.search);
  const pid = p.get('payment_id'), status = (p.get('status') || '').toLowerCase();
  if (!pid) return;
  const box = $('[data-paid]'); box.hidden = false;
  const title = $('[data-paid-title]'), msg = $('[data-paid-msg]'), dl = $('[data-dl]');
  $('[data-paid-ref]').textContent = `Payment reference: ${pid}`;
  if (status && status !== 'succeeded') {
    title.textContent = 'Payment not completed';
    msg.textContent = 'Your payment did not go through and you have not been charged. Your design is saved, so you can try again below.';
    return;
  }
  title.textContent = 'Checking your payment…'; msg.textContent = 'One moment.';
  let design = null, verified = false, plan = 'crest';
  try {
    const r = await fetch(`/api/verify?payment_id=${encodeURIComponent(pid)}`);
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) { verified = true; design = j.design ? dec(j.design) : null; plan = j.plan === 'kit' ? 'kit' : 'crest'; }
    else if (r.status === 503 && status === 'succeeded') { verified = true; }  // verification not configured yet: trust the checkout redirect
    else { title.textContent = 'We could not confirm this payment'; msg.innerHTML = `If you were charged, email <a href="mailto:${CONTACT}?subject=Crest%20order%20${encodeURIComponent(pid)}">${CONTACT}</a> with your payment reference and we will send your files.`; return; }
  } catch (e) {
    if (status === 'succeeded') verified = true;
  }
  if (!verified) return;
  if (design) { D = design; save(); syncControls(); preview(); }
  title.textContent = 'Your coat of arms is ready';
  msg.textContent = 'Thank you. Download your files below. A receipt from Dodo Payments is on its way to your email. Keep this page open, or come back to it from the link in your receipt email.';
  try { const k = 'usurp-crest-paid'; const a = JSON.parse(localStorage.getItem(k) || '[]'); if (!a.includes(pid)) { a.push(pid); localStorage.setItem(k, JSON.stringify(a)); } } catch (e) {}
  const d = { ...D };
  dl.hidden = false;
  dl.querySelector('[data-dl-svg]').onclick = () => downloadSvg(d);
  dl.querySelector('[data-dl-png]').onclick = () => downloadPng(d, 4000);
  dl.querySelector('[data-dl-png-s]').onclick = () => downloadPng(d, 1200);
  const on = (sel, fn) => { const el = dl.querySelector(sel); if (el) el.onclick = fn; };
  on('[data-dl-cert]', () => downloadCertificate(d, gift()));
  on('[data-dl-avatar]', () => downloadAvatar(d));
  on('[data-dl-wall]', () => downloadWallpaper(d));
  const sp = $('[data-share-paid]');
  if (sp) sp.onclick = () => shareDesign(d, m => { $('[data-paid-ref]').textContent = m; });
  const kb = dl.querySelector('[data-dl-kit]');
  if (kb) { kb.hidden = plan !== 'kit'; kb.onclick = () => downloadKit(d, gift(), kb); }
  if (plan === 'kit') title.textContent = 'Your Crest Logo Kit is ready';
  box.scrollIntoView({ block:'start' });
  if (window.clarity) try { window.clarity('event', 'crest_purchase'); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  wire(); syncControls(); preview(); handleReturn();
});
// exposed for tests
window.__crest = { enc, dec, layout, svgString, sanitize, downloadCertificate, downloadAvatar, downloadWallpaper, gift, kitBlob, bannerBlob, brandSheetBlob };
})();
