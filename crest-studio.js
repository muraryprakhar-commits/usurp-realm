/* Usurp Crest Studio: design a coat of arms, pay once, download print-ready files.
   A separate digital product. Buying artwork gives no rank, title or advantage in the Usurp game. */
(() => {
const $ = s => document.querySelector(s);

/* ============ EDIT HERE ============ */
const PRODUCT_ID = 'pdt_0Nq7l6osvcUL8N0wu65UL';           // Dodo live product: Custom Heraldic Crest
const PRICE = 9;                                            // must match the price set in Dodo
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
function layout(d, uid = 'a') {
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
  art.push(`<g stroke="#5c4417" stroke-width="3">
    <path d="M120 1010L190 985L190 1085L120 1110L150 1060Z" fill="#c9b07a"/>
    <path d="M880 1010L810 985L810 1085L880 1110L850 1060Z" fill="#c9b07a"/>
    <path d="M180 975Q500 935 820 975V1075Q500 1035 180 1075Z" fill="#efe1bd"/></g>`);
  const ink = '#2a1a0e';
  const texts = [];
  const nm = String(d.name || '').trim();
  if (nm) texts.push({ s:nm, x:W / 2, y:130, size:fitSize(nm, 64, 18), font:FONT_D, weight:900, fill:ink, stroke:null });
  const mt = String(d.motto || '').trim();
  if (mt) texts.push({ s:mt, x:W / 2, y:1030, size:fitSize(mt, 40, 26), font:FONT, weight:700, fill:'#7a1020', stroke:null });
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
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} };

function preview() {
  const L = layout(D, 'p');
  $('[data-preview]').innerHTML = `<svg viewBox="0 0 ${W} ${HT}" role="img" aria-label="Preview of your coat of arms">${L.art}${L.texts.map(textSvg).join('')}</svg>`;
  $('[data-price]').textContent = `$${PRICE}`;
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
function buyUrl() {
  const p = new URLSearchParams({ quantity:'1', redirect_url:RETURN_URL, metadata_design:enc(D), showDiscounts:'false' });
  return `${CHECKOUT}${PRODUCT_ID}?${p}`;
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
  $('[data-buy]').onclick = e => {
    if (!String(D.name).trim()) { e.preventDefault(); note('Add a name for your house first.'); $('[data-f-name]').focus(); return; }
    save(); e.currentTarget.href = buyUrl();
  };
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
async function downloadSvg(d) { saveBlob(new Blob([svgString(d, await fontCss())], { type:'image/svg+xml' }), `${fileBase(d)}-coat-of-arms.svg`); }
async function downloadPng(d, size) {
  await document.fonts.load(`900 64px 'Cinzel Decorative'`); await document.fonts.load(`700 40px 'Cinzel'`);
  const L = layout(d, 'x');
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
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  saveBlob(blob, `${fileBase(d)}-coat-of-arms-${size}px.png`);
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
  let design = null, verified = false;
  try {
    const r = await fetch(`/api/verify?payment_id=${encodeURIComponent(pid)}`);
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) { verified = true; design = j.design ? dec(j.design) : null; }
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
  box.scrollIntoView({ block:'start' });
  if (window.clarity) try { window.clarity('event', 'crest_purchase'); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  wire(); syncControls(); preview(); handleReturn();
});
// exposed for tests
window.__crest = { enc, dec, layout, svgString, sanitize };
})();
