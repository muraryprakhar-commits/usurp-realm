/* Usurp Crest Studio: design a coat of arms, pay once, download print-ready files.
   A separate digital product. Buying artwork gives no rank, title or advantage in the Usurp game. */
(() => {
const $ = s => document.querySelector(s);

/* ============ EDIT HERE ============ */
const PRODUCT_ID = 'pdt_0Nq7l6osvcUL8N0wu65UL';           // Dodo live product: Custom Heraldic Crest
const PRICE = 9;                                            // must match the price set in Dodo
const KIT_ID = 'pdt_0Nq8R4zhafrgCTZA1HYkj';                // Dodo live product: Crest Logo Kit
const KIT_PRICE = 29;
// Heirloom set: engraving, line art, stamp and seal files, coloring page, bookplates, house banner, A4 certificate.
// Leave HEIRLOOM_ID empty until the $19 product exists in Dodo; the tier stays hidden and the files ship with the Kit.
const HEIRLOOM_ID = '';
const HEIRLOOM_PRICE = 19;
const CHECKOUT = 'https://checkout.dodopayments.com/buy/';
const RETURN_URL = 'https://usurp.games/crest.html';
const CONTACT = 'hello@usurp.games';

/* ============ crest engine ============
   All geometry, design codes, blazon and meaning live in crest-core.js (loaded first by crest.html),
   so the Studio, the free tools, share images and e-cards always draw the same crest. */
const CC = window.CrestCore;
const { TINCTURES, DIVISIONS, CHARGES, DEFAULT, W, HT, FONT, FONT_D, layout, textSvg, enc, dec, sanitize } = CC;
function svgString(d, fontCss = '', look) {
  const L = layout(d, 'f', look ? { style:look } : undefined);
  const style = fontCss ? `<style>${fontCss}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${HT}" width="${W}" height="${HT}">${style}${L.art}${L.texts.map(textSvg).join('')}</svg>`;
}

/* ============ state + UI ============ */
const KEY = 'usurp-crest-v1';
let D;
try { D = sanitize(JSON.parse(localStorage.getItem(KEY)) || DEFAULT); } catch (e) { D = { ...DEFAULT }; }
// A shared link (?d=...) opens that design.
{ const shared = new URLSearchParams(location.search).get('d'); const sd = shared && dec(shared); if (sd) D = sd; }
// Links from the free tools (?motto=..., ?name=... or ?ch=emblem) fill in just that field and keep the rest of the design.
{ const q = new URLSearchParams(location.search), m = q.get('motto'), n = q.get('name'), c = q.get('ch');
  if (m) D.motto = m.slice(0, 48); if (n) D.name = n.slice(0, 40); if (c && CHARGES.some(x => x[0] === c)) D.ch = c; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} };
const GKEY = 'usurp-crest-gift';
const gift = () => { try { const g = JSON.parse(localStorage.getItem(GKEY)) || {}; return { to:String(g.to || '').slice(0, 40), from:String(g.from || '').slice(0, 40) }; } catch (e) { return { to:'', from:'' }; } };

/* "See it as": the same design in colour, as an engraving (traditional hatching), as line art, or as a round seal.
   The extra versions are previews of the Heirloom files. */
let VIEW = 'color', viewTok = 0, viewTimer = 0;
function preview() {
  const box = $('[data-preview]');
  if (VIEW === 'seal') box.innerHTML = sealSvgString(D, false, '', true);
  else if (VIEW === 'engraved') {
    clearTimeout(viewTimer); const tok = ++viewTok;
    viewTimer = setTimeout(async () => {
      try {
        const w = Math.min(1000, Math.round((box.clientWidth || 500) * Math.min(2, window.devicePixelRatio || 1)));
        const cv = await engraveCanvas({ ...D }, Math.max(600, w));
        if (tok !== viewTok || VIEW !== 'engraved') return;
        box.innerHTML = `<img src="${cv.toDataURL('image/png')}" alt="Your coat of arms as a traditional engraving" width="${W}" height="${HT}">`;
        cv.width = cv.height = 0;
      } catch (e) {}
    }, box.querySelector('img') ? 160 : 0);
  } else {
    const L = layout(D, 'p', VIEW === 'line' ? { style:'line' } : undefined);
    box.innerHTML = `<svg viewBox="0 0 ${W} ${HT}" role="img" aria-label="Preview of your coat of arms">${L.art}${L.texts.map(textSvg).join('')}</svg>`;
  }
  $('[data-price]').textContent = `$${PRICE}`;
  extras();
  const bb = $('[data-bb-art]');
  if (bb) {
    const S = layout({ ...D, bg:'clear' }, 'bb', { noName:true, noRibbon:true, shieldOnly:true });
    bb.innerHTML = `<svg viewBox="90 120 820 820" aria-hidden="true">${S.art}${S.texts.map(textSvg).join('')}</svg>`;
    $('[data-bb-name]').textContent = String(D.name).trim() || 'Your coat of arms';
  }
}
/* Phone-width sticky bar: a live mini crest and the buy button, shown while neither the preview nor the buy box is on screen. */
function buyBar() {
  const bar = $('[data-buybar]'), stage = $('.stage'), buy = $('.buy');
  if (!bar || !stage || !buy || !('IntersectionObserver' in window)) return;
  const seen = new Map([[stage, true], [buy, false]]);
  const set = () => bar.classList.toggle('on', !seen.get(stage) && !seen.get(buy) && $('[data-paid]').hidden);
  const io = new IntersectionObserver(es => { es.forEach(e => seen.set(e.target, e.isIntersecting)); set(); });
  io.observe(stage); io.observe(buy); document.body.classList.add('has-buybar');
  bar.querySelector('[data-bb-buy]').onclick = e => {
    e.preventDefault();
    if (window.clarity) try { window.clarity('event', 'buybar_click'); } catch (err) {}
    $('[data-buy]').click();
  };
  bar.querySelector('[data-bb-art]').onclick = () => stage.scrollIntoView({ behavior:'smooth', block:'start' });
}
// Live blazon, meaning and the thumbnails of everything in the $9 package.
function extras() {
  const m = $('[data-meaning]');
  if (m) {
    m.querySelector('[data-blazon]').textContent = CC.blazon(D);
    m.querySelector('[data-mean]').textContent = CC.meaning(D);
    const n = CC.tinctureNote(D), nn = m.querySelector('[data-tnote]'); nn.textContent = n; nn.hidden = !n;
  }
  const inc = $('[data-inc]');
  if (!inc) return;
  const full = (u, d, o) => { const L = layout(d, u, o); return `<svg viewBox="0 0 ${W} ${HT}" aria-hidden="true">${L.art}${L.texts.map(textSvg).join('')}</svg>`; };
  const shield = (u, vb) => { const L = layout({ ...D, bg:'clear' }, u, { noName:true, noRibbon:true, shieldOnly:true }); return `<svg viewBox="${vb}" aria-hidden="true">${L.art}${L.texts.map(textSvg).join('')}</svg>`; };
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
/* Emblem picker: tabs of icon buttons. Only the open tab is drawn, which keeps the page light on phones. */
const GROUP_OF = Object.fromEntries(CHARGES.map(([v, , g]) => [v, g]));
const LABEL_OF = Object.fromEntries(CHARGES.map(([v, n]) => [v, n]));
let embTab = null;
function embIcon(ch) {
  if (ch === 'initial') {
    const i0 = CC.initialOf(D.name), ini = i0 === '?' ? 'A' : i0, m = ini.length > 1 ? 0.6 : 1;
    return `<svg viewBox="16 22 68 80" aria-hidden="true"><text x="50" y="${60 + 20 * m}" text-anchor="middle" font-family="Cinzel Decorative, Georgia, serif" font-weight="900" font-size="${46 * m}" fill="#d4af5a" stroke="#1a0e05" stroke-width="${2.4 * m}" paint-order="stroke">${CC.xesc(ini)}</text></svg>`;
  }
  if (ch === 'none') return '<svg viewBox="16 22 68 80" aria-hidden="true"><path d="M36 46L64 78M64 46L36 78" stroke="#6b5a40" stroke-width="3" stroke-linecap="round"/></svg>';
  return `<svg viewBox="16 22 68 80" aria-hidden="true">${CC.charge(ch, '#d4af5a')}</svg>`;
}
function drawEmblems() {
  const tabs = $('[data-emb-tabs]'), grid = $('[data-f-ch]');
  if (!embTab) embTab = CC.POPULAR.includes(D.ch) ? 'popular' : (GROUP_OF[D.ch] || 'popular');
  tabs.innerHTML = CC.GROUPS.map(([g, n]) => `<button type="button" data-tab="${g}" aria-pressed="${g === embTab}">${n}</button>`).join('');
  const list = embTab === 'popular' ? CC.POPULAR : CHARGES.filter(c => c[2] === embTab).map(c => c[0]);
  grid.innerHTML = list.map(ch => `<button type="button" class="emb-b" role="radio" aria-checked="${ch === D.ch}" data-ch="${ch}">${embIcon(ch)}<span>${LABEL_OF[ch]}</span></button>`).join('');
}
function syncControls() {
  $('[data-f-name]').value = D.name; $('[data-f-motto]').value = D.motto;
  const es = $('[data-f-est]'); if (es) es.value = D.est || '';
  $('[data-f-div]').value = D.div;
  const hs = $('[data-f-helm]'); if (hs) { hs.value = D.helm; $('[data-f-sup]').value = D.sup; }
  document.querySelectorAll('[data-shape]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.shape === D.shape)));
  document.querySelectorAll('[data-f-n] button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === D.n)));
  document.querySelectorAll('.emb-b').forEach(b => b.setAttribute('aria-checked', String(b.dataset.ch === D.ch)));
  const cur = $('[data-emb-cur]'); if (cur) cur.textContent = LABEL_OF[D.ch] || '';
  $('[data-f-bg]').checked = D.bg === 'clear';
  document.querySelectorAll('.sw').forEach(b => b.setAttribute('aria-pressed', String(D[b.dataset.k] === b.dataset.v)));
}
function buyUrl(pid = PRODUCT_ID) {
  const p = new URLSearchParams({ quantity:'1', redirect_url:RETURN_URL, metadata_design:enc(D), showDiscounts:'false' });
  return `${CHECKOUT}${pid}?${p}`;
}
function wire() {
  const upd = () => { save(); preview(); syncControls(); };
  $('[data-f-div]').innerHTML = DIVISIONS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
  drawEmblems();
  swatches($('[data-sw-f]'), 'f'); swatches($('[data-sw-d]'), 'd'); swatches($('[data-sw-c]'), 'c');
  const shapes = $('[data-f-shape]');
  if (shapes) {
    shapes.innerHTML = CC.SHAPES.map(([v, n]) => `<button type="button" role="radio" data-shape="${v}" aria-checked="false" title="${n}"><svg viewBox="0 0 100 122" aria-hidden="true"><path d="${CC.SHIELDS[v]}"/></svg><span>${n}</span></button>`).join('');
    shapes.onclick = e => { const b = e.target.closest('[data-shape]'); if (b) { D.shape = b.dataset.shape; upd(); } };
    $('[data-f-n]').onclick = e => { const b = e.target.closest('[data-v]'); if (b) { D.n = +b.dataset.v; upd(); } };
    $('[data-f-helm]').innerHTML = CC.HELMS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
    $('[data-f-sup]').innerHTML = CC.SUPPORTERS.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
    $('[data-f-helm]').onchange = e => { D.helm = e.target.value; upd(); if (window.clarity) try { window.clarity('event', 'grand_helm'); } catch (err) {} };
    $('[data-f-sup]').onchange = e => { D.sup = e.target.value; upd(); if (window.clarity) try { window.clarity('event', 'grand_supporters'); } catch (err) {} };
  }
  $('[data-f-name]').oninput = e => {
    D.name = e.target.value.slice(0, 40); save(); preview();
    const ib = document.querySelector('.emb-b[data-ch="initial"]'); if (ib) ib.firstElementChild.outerHTML = embIcon('initial');
  };
  $('[data-f-motto]').oninput = e => { D.motto = e.target.value.slice(0, 48); save(); preview(); };
  const est = $('[data-f-est]');
  if (est) est.oninput = e => { D.est = e.target.value.slice(0, 28); save(); preview(); };
  const views = $('[data-view]');
  if (views) views.onclick = e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    VIEW = b.dataset.v;
    views.querySelectorAll('[data-v]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const vn = $('[data-view-note]');
    if (vn) {
      const what = { engraved:'The engraving uses the hatching heralds use to show colours in black and white, ready for signet rings, silver and glass.', line:'Line art is ready for colouring, embroidery, tattoo stencils and hand painting.', seal:'A round seal for a wax seal stamp, embosser, rubber stamp or stickers, in colour and solid black.' }[VIEW];
      vn.textContent = what ? `${what} ${HEIRLOOM_ID ? `Included in the Heirloom set ($${HEIRLOOM_PRICE}) and the Crest Logo Kit ($${KIT_PRICE}).` : `Included in the Crest Logo Kit ($${KIT_PRICE}).`}` : '';
      vn.hidden = !what;
    }
    preview();
    if (window.clarity) try { window.clarity('event', 'view_' + VIEW); } catch (err) {}
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (VIEW === 'seal') preview(); });
  $('[data-f-div]').onchange = e => { D.div = e.target.value; upd(); };
  $('[data-emb-tabs]').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) { embTab = b.dataset.tab; drawEmblems(); } };
  $('[data-f-ch]').onclick = e => {
    const b = e.target.closest('[data-ch]'); if (!b) return;
    D.ch = b.dataset.ch; upd();
    if (window.clarity) try { window.clarity('set', 'emblem', D.ch); } catch (err) {}
  };
  $('[data-f-bg]').onchange = e => { D.bg = e.target.checked ? 'clear' : 'parch'; upd(); };
  document.addEventListener('click', e => { const b = e.target.closest('.sw'); if (b) { D[b.dataset.k] = b.dataset.v; upd(); } });
  $('[data-random]').onclick = () => {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const t = TINCTURES.map(x => x[1]);
    D.f = pick(t); do { D.d = pick(t); } while (D.d === D.f); D.c = pick(['#f3dc92', '#e8e4d8', '#1d1915', '#b3242f']);
    D.div = pick(DIVISIONS)[0]; D.ch = pick(CHARGES.filter(c => c[0] !== 'none'))[0];
    D.shape = Math.random() < 0.7 ? 'heater' : pick(CC.SHAPES)[0]; D.n = Math.random() < 0.2 ? 3 : 1;
    D.helm = Math.random() < 0.35 ? pick(CC.HELMS.slice(1))[0] : 'none'; D.sup = Math.random() < 0.35 ? pick(CC.SUPPORTERS.slice(1))[0] : 'none';
    embTab = CC.POPULAR.includes(D.ch) ? 'popular' : GROUP_OF[D.ch]; drawEmblems(); upd();
  };
  $('[data-share]').onclick = () => shareDesign(D, note);
  const gt = $('[data-g-to]'), gf = $('[data-g-from]');
  if (gt && gf) {
    const G = gift(); gt.value = G.to; gf.value = G.from;
    const sg = () => { try { localStorage.setItem(GKEY, JSON.stringify({ to:gt.value.slice(0, 40), from:gf.value.slice(0, 40) })); } catch (e) {} };
    gt.oninput = sg; gf.oninput = sg;
  }
  const mk = $('[data-c-make]');
  if (mk) {
    const cardUrl = () => {
      const q = new URLSearchParams();
      const to = $('[data-c-to]').value.trim(), from = $('[data-c-from]').value.trim(), msg = $('[data-c-msg]').value.trim();
      if (to) q.set('to', to.slice(0, 40)); if (from) q.set('from', from.slice(0, 40)); if (msg) q.set('msg', msg.slice(0, 160));
      const qs = q.toString();
      return `https://usurp.games/card/${enc(D)}${qs ? '?' + qs : ''}`;
    };
    $('[data-c-preview]').onclick = e => { e.currentTarget.href = cardUrl(); };
    mk.onclick = async () => {
      const url = cardUrl(), to = $('[data-c-to]').value.trim();
      try {
        if (navigator.share && matchMedia('(pointer:coarse)').matches) await navigator.share({ title:'A coat of arms for you', text: to ? `${to}, I made you something:` : 'I made you something:', url });
        else { await navigator.clipboard.writeText(url); note('E-card link copied. Paste it into a message or email.'); }
      } catch (e) { note(url); }
      if (window.clarity) try { window.clarity('event', 'card_create'); } catch (err) {}
    };
  }
  const free = $('[data-free]');
  if (free) free.onclick = async () => {
    try { await downloadPng({ ...D }, 800, true); note('Preview saved. Share it anywhere. The $9 download is full size with no watermark.'); }
    catch (e) { note('Could not save the preview on this browser. Try "Copy link to my design" instead.'); }
    if (window.clarity) try { window.clarity('event', 'crest_free_preview'); } catch (err) {}
  };
  // Save for later: the visitor's own mail app opens with a link back to this exact design (no account, nothing stored by us).
  const mail = $('[data-mail]');
  if (mail) mail.onclick = e => {
    const nm = String(D.name).trim() || 'My coat of arms';
    const body = `${nm}: my coat of arms design, saved to finish later.\n\nOpen it again: https://usurp.games/crest.html?d=${enc(D)}\n\nDesigning is free. Print-ready files and a certificate of arms are $9.`;
    e.currentTarget.href = `mailto:?subject=${encodeURIComponent(`${nm}: my coat of arms`)}&body=${encodeURIComponent(body)}`;
    if (window.clarity) try { window.clarity('event', 'crest_email_self'); } catch (err) {}
  };
  const heir = $('[data-heir]');
  if (heir) {
    if (!HEIRLOOM_ID) heir.remove();
    else {
      heir.hidden = false;
      $('[data-buy-heir]').onclick = e => {
        if (!String(D.name).trim()) { e.preventDefault(); note('Add a name for your house first.'); $('[data-f-name]').focus(); return; }
        save(); e.currentTarget.href = buyUrl(HEIRLOOM_ID);
        if (window.clarity) try { window.clarity('event', 'heirloom_checkout'); } catch (err) {}
      };
    }
  }
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
  // The two typefaces used inside the artwork, embedded so SVG downloads look right anywhere. Served from this site.
  try {
    const faces = [['Cinzel Decorative', 900, '/fonts/cinzel-decorative-900-latin.woff2'], ['Cinzel', 700, '/fonts/cinzel-latin.woff2']];
    const parts = [];
    for (const [fam, w, url] of faces) {
      const r = await fetch(url); if (!r.ok) throw new Error('font ' + r.status);
      const u8 = new Uint8Array(await r.arrayBuffer());
      let bin = ''; for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      parts.push(`@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2')}`);
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
async function pngBlob(d, size, preview = false, style) {
  await document.fonts.load(`900 64px 'Cinzel Decorative'`); await document.fonts.load(`700 40px 'Cinzel'`);
  const L = layout(preview ? { ...d, bg:'parch' } : d, 'x', style ? { style } : undefined);
  const [cw, chh] = fitPx(size, Math.round(HT * size / W)), k = cw / W, cv = canvasOf(cw, chh);
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
  return await toBlob(cv);
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
// Encodes a canvas to PNG, then frees its memory (iPhones run out of canvas memory when a ZIP builds many images).
const toBlob = cv => new Promise(r => cv.toBlob(b => { r(b); cv.width = cv.height = 0; }, 'image/png'));

async function downloadCertificate(d, g) { saveBlob(await certBlob(d, g), `${fileBase(d)}-certificate-of-arms.png`); }
async function certBlob(d, g, a4 = false) {
  await fontsReady();
  const PW = a4 ? 2480 : 2550, PH = a4 ? 3508 : 3300, cv = canvasOf(PW, PH), ctx = cv.getContext('2d');   // US Letter or A4 at 300 dpi
  ctx.fillStyle = '#efe1bd'; ctx.fillRect(0, 0, PW, PH);
  ctx.strokeStyle = '#9c7a45'; ctx.lineWidth = 10; ctx.strokeRect(70, 70, PW - 140, PH - 140);
  ctx.lineWidth = 3; ctx.strokeRect(100, 100, PW - 200, PH - 200);
  ctx.strokeStyle = '#d4af5a'; ctx.lineWidth = 2; ctx.strokeRect(118, 118, PW - 236, PH - 236);
  // The words and crest are laid out on a US Letter grid; on A4 that grid is scaled to the width and centered.
  const CW = 2550, CHh = 3300, sc = PW / CW;
  ctx.save(); ctx.translate(0, (PH - CHh * sc) / 2); ctx.scale(sc, sc);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#7a1020'; ctx.font = `700 54px ${FONT}`; spaced(ctx, 'THE ARMS OF', CW / 2, 300, 14);
  const nm = String(d.name).trim() || 'Your House';
  ctx.fillStyle = '#2a1a0e'; fitText(ctx, nm, z => `900 ${z}px ${FONT_D}`, 140, 2100, 64); ctx.fillText(nm, CW / 2, 450);
  ctx.strokeStyle = '#9c7a45'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(CW / 2 - 420, 520); ctx.lineTo(CW / 2 + 420, 520); ctx.stroke();
  await drawCrest(ctx, { ...d, bg:'clear' }, (CW - W * 1.4) / 2, 345, 1.4, { noName:true });   // shield top near y 640, ribbon ends near y 1900
  let y = String(d.est || '').trim() ? 2110 : 2040;   // the date line sits under the ribbon, so the blazon moves down
  ctx.fillStyle = '#7a1020'; ctx.font = `700 40px ${FONT}`; spaced(ctx, 'BLAZON', CW / 2, y, 10); y += 86;
  ctx.fillStyle = '#2a1a0e'; ctx.font = `italic 64px ${FONT_B}`;
  for (const ln of wrapLines(ctx, CC.blazon(d), 1950)) { ctx.fillText(ln, CW / 2, y); y += 78; }
  y += 36; ctx.fillStyle = '#7a1020'; ctx.font = `700 40px ${FONT}`; spaced(ctx, 'WHAT IT MEANS', CW / 2, y, 10); y += 80;
  ctx.fillStyle = '#4a3420'; ctx.font = `50px ${FONT_B}`;
  for (const ln of wrapLines(ctx, CC.meaning(d), 1950)) { ctx.fillText(ln, CW / 2, y); y += 64; }
  const date = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const line = [g.to && `Presented to ${g.to}`, g.from && `by ${g.from}`].filter(Boolean).join(' ');
  y = Math.max(y + 90, 2780);
  ctx.fillStyle = '#2a1a0e';
  if (line) { fitText(ctx, line, z => `700 ${z}px ${FONT}`, 52, 2100, 30); ctx.fillText(line, CW / 2, y); y += 70; ctx.font = `46px ${FONT_B}`; ctx.fillText(date, CW / 2, y); }
  else { ctx.font = `48px ${FONT_B}`; ctx.fillText(`Designed ${date}`, CW / 2, y); }
  ctx.fillStyle = '#8a6a3a'; ctx.font = `32px ${FONT_B}`;
  ctx.fillText('Original heraldic artwork, not an official grant of arms. Designed at usurp.games', CW / 2, CHh - 150);
  ctx.restore();
  return await toBlob(cv);
}
async function downloadAvatar(d) { saveBlob(await avatarBlob(d, 1080, d.bg !== 'clear'), `${fileBase(d)}-profile-picture-1080.png`); }
// Square shield-only image. fill: true puts it on parchment, false leaves it transparent.
async function avatarBlob(d, S, fill) {
  await fontsReady();
  const cv = canvasOf(S, S), ctx = cv.getContext('2d');
  if (fill) { ctx.fillStyle = '#efe1bd'; ctx.fillRect(0, 0, S, S); }
  const k = S / 820; await drawCrest(ctx, { ...d, bg:'clear' }, -90 * k, -120 * k, k, { noName:true, noRibbon:true, shieldOnly:true });
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
  const L = layout({ ...d, bg:'clear' }, 's', { noName:true, noRibbon:true, shieldOnly:true });
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
  const k = s / 820; await drawCrest(ctx, { ...d, bg:'clear' }, x0 - 90 * k, y0 - 120 * k, k, { noName:true, noRibbon:true, shieldOnly:true });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const tx = x0 + s + gap, cy = h / 2;
  if (nm) { ctx.fillStyle = '#f3dc92'; ctx.font = `900 ${nameSize}px ${FONT_D}`; ctx.fillText(nm, tx, mt ? cy - nameSize * 0.08 : cy + nameSize * 0.35); }
  if (mt) { ctx.fillStyle = '#d4af5a'; ctx.font = `700 ${mottoSize}px ${FONT}`; ctx.fillText(mt, tx, cy + mottoSize * 1.55); }
  return await toBlob(cv);
}
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ');
async function brandSheetBlob(d) {
  await fontsReady();
  const BW = 2550, BH = 3300, cv = canvasOf(BW, BH), ctx = cv.getContext('2d');
  ctx.fillStyle = '#faf6ec'; ctx.fillRect(0, 0, BW, BH);
  ctx.fillStyle = '#14110e'; ctx.fillRect(0, 0, BW, 360);
  ctx.textAlign = 'left'; ctx.fillStyle = '#d4af5a'; ctx.font = `700 46px ${FONT}`; spaced(ctx, 'BRAND SHEET', 160, 150, 12);
  const nm = String(d.name).trim() || 'Your House';
  ctx.fillStyle = '#f3dc92'; fitText(ctx, nm, z => `900 ${z}px ${FONT_D}`, 110, 2200, 50); ctx.fillText(nm, 160, 280);
  await drawCrest(ctx, { ...d, bg:'clear' }, 120, 340, 0.95, { noName:true });          // left column, about 950 x 1190
  // colors
  let y = 520; const x = 1180;
  ctx.fillStyle = '#7a1020'; ctx.font = `700 40px ${FONT}`; spaced(ctx, 'COLORS', x, y, 10); y += 50;
  const tname = h => CC.tinctureName(h);
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
  block('BLAZON', [CC.blazon(d)]);
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
  return [
    `CREST LOGO KIT: ${String(d.name).trim()}`,
    `Motto: ${String(d.motto).trim() || '(none)'}`,
    `Blazon: ${CC.blazon(d)}`,
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
    'Your heirloom files (engraving, line art, stamp and wax seal designs, coloring page, bookplates, house banner and an',
    'A4 certificate) are a second ZIP, from the "heirloom files" button on the same download page.',
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

/* ============ Heirloom files ============
   Engraving (traditional hatching), line art, two-tone, a round seal, a coloring page, bookplates, a house banner and
   an A4 certificate. Sold as the Heirloom set and included in the Crest Logo Kit. */
// Safari (iPhone, iPad and Mac) refuses canvases over 16,777,216 pixels, so the biggest images are made a little smaller there.
const UAS = navigator.userAgent;
const WEBKIT = /iP(hone|ad|od)/.test(UAS) || (/Macintosh/.test(UAS) && navigator.maxTouchPoints > 1) || (/Safari\//.test(UAS) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg\/|OPR|Android/.test(UAS));
const MAXPX = WEBKIT ? 16000000 : 60000000;
function fitPx(w, h) { const a = w * h; if (a <= MAXPX) return [w, h]; const s = Math.sqrt(MAXPX / a); return [Math.floor(w * s), Math.floor(h * s)]; }

// Petra Sancta hatching, the system heralds have used since the 1600s to show colours in black and white:
// dots for gold, plain for silver, vertical lines for red, horizontal for blue, diagonals for green and purple,
// a grid for black. The crest is drawn in flat key colours ('key' style) and each pixel becomes its pattern.
const KEYPAL = [[0, 0, 0, 'k'], [255, 255, 255, 'w'], [255, 255, 0, 'Or'], [255, 0, 0, 'Gules'], [255, 128, 0, 'Murrey'], [0, 0, 255, 'Azure'], [0, 255, 0, 'Vert'], [255, 0, 255, 'Purpure'], [0, 255, 255, 'Sable']];
function hatch(ctx, w, h, sp) {
  const im = ctx.getImageData(0, 0, w, h), px = im.data, lw = Math.max(1, sp * 0.16), r2 = (sp * 0.14) ** 2, half = sp / 2, big = h * sp, cache = new Map();
  for (let y = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2], key = (r << 16) | (g << 8) | b;
      let t = cache.get(key);
      if (t === undefined) { let bd = 1e9; for (const p of KEYPAL) { const dd = (r - p[0]) * (r - p[0]) + (g - p[1]) * (g - p[1]) + (b - p[2]) * (b - p[2]); if (dd < bd) { bd = dd; t = p[3]; } } cache.set(key, t); }
      let on = false;
      switch (t) {
        case 'k': on = true; break;
        case 'Or': { const cx = x % sp, cy = (y + (Math.floor(x / sp) % 2) * half) % sp; on = (cx - half) * (cx - half) + (cy - half) * (cy - half) < r2; break; }
        case 'Gules': on = x % sp < lw; break;
        case 'Azure': on = y % sp < lw; break;
        case 'Vert': on = (x - y + big) % sp < lw * 1.25; break;        // diagonals from upper left to lower right
        case 'Purpure': on = (x + y) % sp < lw * 1.25; break;          // the other diagonal
        case 'Sable': on = x % sp < lw || y % sp < lw; break;
        case 'Murrey': on = (x - y + big) % sp < lw || (x + y) % sp < lw; break;
      }
      const v = on ? 24 : 255; px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);
}
async function engraveCanvas(d, width) {
  await fontsReady();
  const [cw, chh] = fitPx(width, Math.round(width * HT / W)), cv = canvasOf(cw, chh), ctx = cv.getContext('2d', { willReadFrequently:true });
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, chh);
  await drawCrest(ctx, { ...d, bg:'clear' }, 0, 0, cw / W, { style:'key' });
  hatch(ctx, cw, chh, Math.max(5, Math.round(cw / 110)));
  return cv;
}
async function engraveBlob(d, width) { return await toBlob(await engraveCanvas(d, width)); }

// Round seal: the shield in a ring with the house name over the top and the motto (or the date) under it.
// Drawn in a 1000 unit square. The vector version uses textPath; the PNG places each letter on the arc.
const SEAL = { out:488, beads:462, bandOut:438, bandIn:318, in2:304, top:353, bot:403, k:0.7, cy:512 };
let MCTX = null;
function measureArc(text, size) {
  MCTX = MCTX || canvasOf(8, 8).getContext('2d');
  MCTX.font = `700 ${size}px ${FONT}`;
  const sp = size * 0.1, ws = [...text].map(c => MCTX.measureText(c).width);
  return { ws, sp, total:ws.reduce((a, b) => a + b, 0) + sp * Math.max(0, ws.length - 1) };
}
function fitArc(text, r, maxAng, big, small) { let z = big; while (z > small && measureArc(text, z).total > r * maxAng) z -= 2; return z; }
function sealSpec(d) {
  const name = String(d.name).trim().toUpperCase(), low = (String(d.motto).trim() || String(d.est || '').trim()).toUpperCase();
  return { name, low, nz:name ? fitArc(name, SEAL.top, 2.62, 74, 28) : 0, lz:low ? fitArc(low, SEAL.bot, 2.3, 60, 24) : 0 };
}
const sealInk = mono => mono ? { paper:'#ffffff', rim:'#1a0e05', ring:'#1a0e05', bead:'#1a0e05', name:'#1a0e05', low:'#1a0e05', line:'#1a0e05' }
  : { paper:'#efe1bd', rim:'#5c4417', ring:'#d4af5a', bead:'#9c7a45', name:'#2a1a0e', low:'#7a1020', line:'#5c4417' };
function sealSvgString(d, mono, fontCssText = '', framed = false) {
  const S = sealSpec(d), c = sealInk(mono), k = SEAL.k, R = SEAL;
  const L = layout({ ...d, bg:'clear' }, mono ? 'sm' : 'sc', { noName:true, noRibbon:true, shieldOnly:true, noMantle:true, style:mono ? 'mono' : 'color' });
  const beads = Array.from({ length:96 }, (_, i) => { const a = i * Math.PI / 48; return `<circle cx="${(500 + R.beads * Math.cos(a)).toFixed(1)}" cy="${(500 + R.beads * Math.sin(a)).toFixed(1)}" r="6.5"/>`; }).join('');
  const dia = x => `<path d="M${x - 13} 500L${x} 490L${x + 13} 500L${x} 510Z"/>`;
  const tp = (id, s, z, fill) => s ? `<text font-family="Cinzel, Georgia, serif" font-weight="700" font-size="${z}" letter-spacing="${(z * 0.1).toFixed(1)}" fill="${fill}"><textPath href="#${id}" xlink:href="#${id}" startOffset="50%" text-anchor="middle">${CC.xesc(s)}</textPath></text>` : '';
  const id = mono ? 'sm' : 'sc';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${framed ? '0 -125 1000 1250' : '0 0 1000 1000'}" width="1000" height="${framed ? 1250 : 1000}"${framed ? ' role="img" aria-label="Your coat of arms as a round seal"' : ''}>${fontCssText ? `<style>${fontCssText}</style>` : ''}`
    + `<defs><path id="${id}T" d="M${500 - R.top} 500A${R.top} ${R.top} 0 0 1 ${500 + R.top} 500"/><path id="${id}B" d="M${500 - R.bot} 500A${R.bot} ${R.bot} 0 0 0 ${500 + R.bot} 500"/></defs>`
    + `<circle cx="500" cy="500" r="${R.out}" fill="${c.paper}" stroke="${c.rim}" stroke-width="${mono ? 14 : 20}"/>${mono ? '' : `<circle cx="500" cy="500" r="${R.out}" fill="none" stroke="${c.ring}" stroke-width="10"/>`}`
    + `<g fill="${c.bead}">${beads}</g><circle cx="500" cy="500" r="${R.bandOut}" fill="none" stroke="${c.line}" stroke-width="4"/>`
    + `<circle cx="500" cy="500" r="${R.bandIn}" fill="none" stroke="${c.line}" stroke-width="6"/><circle cx="500" cy="500" r="${R.in2}" fill="none" stroke="${c.line}" stroke-width="2"/>`
    + `<g fill="${c.low}">${dia(500 - 378)}${dia(500 + 378)}</g>${tp(id + 'T', S.name, S.nz, c.name)}${tp(id + 'B', S.low, S.lz, c.low)}`
    + `<g transform="translate(${(500 - 500 * k).toFixed(1)} ${(R.cy - 541 * k).toFixed(1)}) scale(${k})">${L.art}${L.texts.map(textSvg).join('')}</g></svg>`;
}
async function sealBlob(d, S, mono) {
  await fontsReady();
  const sp = sealSpec(d), c = sealInk(mono), R = SEAL, cv = canvasOf(S, S), ctx = cv.getContext('2d'), u = S / 1000;
  ctx.setTransform(u, 0, 0, u, 0, 0);
  const ring = (r, col, lw, fill) => { ctx.beginPath(); ctx.arc(500, 500, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); } };
  ring(R.out, c.rim, mono ? 14 : 20, c.paper); if (!mono) ring(R.out, c.ring, 10);
  ctx.fillStyle = c.bead;
  for (let i = 0; i < 96; i++) { const a = i * Math.PI / 48; ctx.beginPath(); ctx.arc(500 + R.beads * Math.cos(a), 500 + R.beads * Math.sin(a), 6.5, 0, Math.PI * 2); ctx.fill(); }
  ring(R.bandOut, c.line, 4); ring(R.bandIn, c.line, 6); ring(R.in2, c.line, 2);
  ctx.fillStyle = c.low;
  for (const x of [500 - 378, 500 + 378]) { ctx.beginPath(); ctx.moveTo(x - 13, 500); ctx.lineTo(x, 490); ctx.lineTo(x + 13, 500); ctx.lineTo(x, 510); ctx.closePath(); ctx.fill(); }
  const arc = (s, z, r, top, fill) => {
    if (!s) return;
    const m = measureArc(s, z);
    ctx.font = `700 ${z}px ${FONT}`; ctx.fillStyle = fill; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    let a = top ? -Math.PI / 2 - m.total / r / 2 : Math.PI / 2 + m.total / r / 2;
    [...s].forEach((ch, i) => {
      const w = m.ws[i], mid = top ? a + w / 2 / r : a - w / 2 / r;
      ctx.save(); ctx.translate(500 + r * Math.cos(mid), 500 + r * Math.sin(mid)); ctx.rotate(top ? mid + Math.PI / 2 : mid - Math.PI / 2); ctx.fillText(ch, 0, 0); ctx.restore();
      a = top ? a + (w + m.sp) / r : a - (w + m.sp) / r;
    });
  };
  arc(sp.name, sp.nz, R.top, true, c.name); arc(sp.low, sp.lz, R.bot, false, c.low);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  await drawCrest(ctx, { ...d, bg:'clear' }, (500 - 500 * R.k) * u, (R.cy - 541 * R.k) * u, R.k * u, { noName:true, noRibbon:true, shieldOnly:true, noMantle:true, style:mono ? 'mono' : 'color' });
  return await toBlob(cv);
}

// Coloring page: the crest as line art on US Letter, with a key telling which colour goes where.
async function coloringBlob(d) {
  await fontsReady();
  const PW = 2550, PH = 3300, cv = canvasOf(PW, PH), ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, PW, PH);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#1a0e05';
  ctx.font = `700 44px ${FONT}`; spaced(ctx, 'COLOUR IN THE ARMS OF', PW / 2, 200, 12);
  const nm = String(d.name).trim() || 'Your House';
  fitText(ctx, nm, z => `900 ${z}px ${FONT_D}`, 118, 2200, 56); ctx.fillText(nm, PW / 2, 336);
  await drawCrest(ctx, { ...d, bg:'clear' }, (PW - W * 1.78) / 2, 150, 1.78, { noName:true, style:'line' });
  const tn = h => CC.tinctureName(h), plain = h => CC.plainName(tn(h)) || 'any colour';
  const keys = [['Field', d.f]];
  if (d.div !== 'plain') keys.push(['Division', d.d]);
  if (d.ch !== 'none') keys.push([d.n === 3 ? 'Emblems' : 'Emblem', d.c]);
  if (d.sup !== 'none') keys.push(['Supporters', d.c]);
  ctx.font = `700 40px ${FONT}`; spaced(ctx, 'COLOUR KEY', PW / 2, 2470, 10);
  const colW = Math.min(560, 2200 / keys.length), x0 = PW / 2 - colW * keys.length / 2;
  keys.forEach(([label, hex], i) => {
    const cx = x0 + colW * (i + 0.5);
    ctx.beginPath(); ctx.arc(cx, 2620, 64, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = '#1a0e05'; ctx.stroke();
    ctx.fillStyle = '#1a0e05'; ctx.font = `700 40px ${FONT}`; ctx.fillText(label, cx, 2750);
    ctx.font = `44px ${FONT_B}`; ctx.fillText(`${plain(hex)} (${tn(hex)})`, cx, 2812);
  });
  ctx.fillStyle = '#555'; ctx.font = `italic 40px ${FONT_B}`;
  for (const [i, ln] of wrapLines(ctx, CC.blazon(d), 2100).slice(0, 2).entries()) ctx.fillText(ln, PW / 2, 2930 + i * 54);
  ctx.font = `32px ${FONT_B}`; ctx.fillText('Make your own coat of arms at usurp.games', PW / 2, PH - 110);
  return await toBlob(cv);
}

// Six "Ex libris" bookplates on one US Letter sheet, for full-sheet sticker paper.
async function bookplatesBlob(d) {
  await fontsReady();
  const PW = 2550, PH = 3300, cv = canvasOf(PW, PH), ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, PW, PH);
  const mx = 150, my = 150, gx = 100, gy = 75, bw = (PW - 2 * mx - gx) / 2, bh = (PH - 2 * my - 2 * gy) / 3;
  const one = canvasOf(Math.round(bw), Math.round(bh)), c = one.getContext('2d');
  c.fillStyle = '#f6edd6'; c.fillRect(0, 0, bw, bh);
  c.strokeStyle = '#5c4417'; c.lineWidth = 8; c.strokeRect(26, 26, bw - 52, bh - 52);
  c.strokeStyle = '#d4af5a'; c.lineWidth = 3; c.strokeRect(42, 42, bw - 84, bh - 84);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillStyle = '#7a1020'; c.font = `700 40px ${FONT}`; spaced(c, 'EX LIBRIS', bw / 2, 118, 14);
  const s = 470, k = s / 820;
  await drawCrest(c, { ...d, bg:'clear' }, bw / 2 - s / 2 - 90 * k, 140 - 120 * k, k, { noName:true, noRibbon:true, shieldOnly:true });
  const nm = String(d.name).trim() || 'Your House';
  c.fillStyle = '#2a1a0e'; fitText(c, nm, z => `900 ${z}px ${FONT_D}`, 62, bw - 180, 28); c.fillText(nm, bw / 2, 690);
  c.fillStyle = '#6b5a40'; c.font = `italic 36px ${FONT_B}`; c.fillText('This book belongs to', bw / 2, 770);
  c.strokeStyle = '#9c7a45'; c.lineWidth = 2; c.beginPath(); c.moveTo(150, 850); c.lineTo(bw - 150, 850); c.stroke();
  ctx.setLineDash([18, 14]); ctx.strokeStyle = '#b8b8b8'; ctx.lineWidth = 3;
  for (let r = 0; r < 3; r++) for (let q = 0; q < 2; q++) {
    const x = mx + q * (bw + gx), y = my + r * (bh + gy);
    ctx.drawImage(one, x, y); ctx.strokeRect(x - 12, y - 12, bw + 24, bh + 24);
  }
  ctx.setLineDash([]); one.width = one.height = 0;
  ctx.fillStyle = '#8a8a8a'; ctx.textAlign = 'center'; ctx.font = `30px ${FONT_B}`;
  ctx.fillText('Print on full-sheet sticker paper at 100% scale and cut along the dashed lines.', PW / 2, PH - 50);
  return await toBlob(cv);
}

// House banner: a tall swallowtail banner on a rod, in the field colour, with the shield, name and motto.
async function houseBannerBlob(d) {
  await fontsReady();
  const u = 2.4, cv = canvasOf(1000 * u, 2000 * u), ctx = cv.getContext('2d');    // 2400 x 4800 px: 8 x 16 in at 300 dpi
  ctx.setTransform(u, 0, 0, u, 0, 0);
  const light = ['Or', 'Argent'].includes(CC.tinctureName(d.f));
  const txt = light ? '#2a1a0e' : '#f3dc92', trim = light ? '#5c4417' : '#d4af5a';
  const body = (a, t, b, v) => { ctx.beginPath(); ctx.moveTo(130 + a, t); ctx.lineTo(870 - a, t); ctx.lineTo(870 - a, b); ctx.lineTo(500, v); ctx.lineTo(130 + a, b); ctx.closePath(); };
  body(0, 100, 1960, 1730); ctx.fillStyle = d.f; ctx.fill();
  const fold = ctx.createLinearGradient(130, 0, 870, 0);
  [[0, 'rgba(0,0,0,.30)'], [0.13, 'rgba(255,255,255,.10)'], [0.3, 'rgba(0,0,0,.14)'], [0.5, 'rgba(255,255,255,.12)'], [0.7, 'rgba(0,0,0,.14)'], [0.87, 'rgba(255,255,255,.10)'], [1, 'rgba(0,0,0,.30)']].forEach(([o, col]) => fold.addColorStop(o, col));
  ctx.fillStyle = fold; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#1a0e05'; ctx.stroke();
  body(32, 150, 1903, 1694); ctx.lineWidth = 10; ctx.strokeStyle = trim; ctx.stroke();
  body(48, 166, 1880, 1676); ctx.lineWidth = 2.5; ctx.stroke();
  // the rod and its finials
  const rod = ctx.createLinearGradient(0, 70, 0, 122); rod.addColorStop(0, '#7a5530'); rod.addColorStop(1, '#3a2410');
  ctx.fillStyle = rod; ctx.beginPath(); ctx.moveTo(70, 72); ctx.lineTo(930, 72); ctx.arcTo(946, 72, 946, 96, 24); ctx.arcTo(946, 120, 930, 120, 24); ctx.lineTo(70, 120); ctx.arcTo(54, 120, 54, 96, 24); ctx.arcTo(54, 72, 70, 72, 24); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#1a0e05'; ctx.stroke();
  for (const x of [48, 952]) { ctx.beginPath(); ctx.arc(x, 96, 36, 0, Math.PI * 2); ctx.fillStyle = '#d4af5a'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); ctx.beginPath(); ctx.arc(x - 9, 86, 10, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = txt;
  const nm = String(d.name).trim(), mt = String(d.motto).trim(), es = String(d.est || '').trim();
  if (nm) { fitText(ctx, nm, z => `900 ${z}px ${FONT_D}`, 92, 600, 34); ctx.fillText(nm, 500, 330); }
  ctx.strokeStyle = trim; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(300, 384); ctx.lineTo(470, 384); ctx.moveTo(530, 384); ctx.lineTo(700, 384); ctx.stroke();
  ctx.fillStyle = trim; ctx.beginPath(); ctx.moveTo(500, 370); ctx.lineTo(514, 384); ctx.lineTo(500, 398); ctx.lineTo(486, 384); ctx.closePath(); ctx.fill();
  ctx.fillStyle = txt;
  if (mt) {
    ctx.font = `700 58px ${FONT}`; let lines = wrapLines(ctx, mt, 600);
    if (lines.length > 2) { ctx.font = `700 44px ${FONT}`; lines = wrapLines(ctx, mt, 600).slice(0, 3); }
    lines.forEach((ln, i) => ctx.fillText(ln, 500, 1290 + i * 70));
  }
  if (es) { ctx.font = `700 40px ${FONT}`; spaced(ctx, es.toUpperCase(), 500, mt ? 1480 : 1300, 6); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const k = 1.06;
  await drawCrest(ctx, { ...d, bg:'clear' }, (500 - 500 * k) * u, (440 - 211 * k) * u, k * u, { noName:true, noRibbon:true, shieldOnly:true, noMantle:true });
  return await toBlob(cv);
}

function heirReadme(d, base) {
  return [
    `HEIRLOOM FILES: ${String(d.name).trim()}`,
    `Motto: ${String(d.motto).trim() || '(none)'}`,
    `Blazon: ${CC.blazon(d)}`,
    '',
    'WHAT IS IN THIS ZIP',
    `engrave/ ${base}-engraving.png        traditional heraldic hatching in black and white (see below), for signet rings,`,
    '                                       engraved silver, glass and wood, and laser engraving',
    `         ${base}-two-tone.svg / .png  solid black and white: rubber stamps, vinyl and Cricut cutting, laser engraving, embroidery`,
    `         ${base}-line-art.svg / .png  outlines only: embroidery, tattoo stencils, colouring and hand painting`,
    `seal/    ${base}-seal-black.svg / .png  round seal in solid black: the file to send for a wax seal stamp, embosser or rubber stamp`,
    `         ${base}-seal-color.svg / .png  the same seal in colour, for stickers, labels and coasters`,
    'print/   coloring-page.png             US Letter, 300 dpi, with a colour key (prints on A4 too: choose "fit to page")',
    '         bookplates.png                six "Ex libris" bookplates on one US Letter sheet, for full-sheet sticker paper',
    '         house-banner.png              tall swallowtail banner, 2400 x 4800 px: 8 x 16 in at 300 dpi, or larger at 150 dpi',
    '         certificate-of-arms-a4.png    the certificate of arms on A4 at 300 dpi',
    '',
    'THE HATCHING',
    'Heralds have shown colours in black and white this way since the 1600s (the Petra Sancta system):',
    'dots = gold (Or), plain = silver (Argent), vertical lines = red (Gules), horizontal lines = blue (Azure),',
    'diagonal lines down to the right = green (Vert), diagonal lines down to the left = purple (Purpure),',
    'a grid = black (Sable), crossed diagonals = mulberry (Murrey).',
    '',
    'TIPS',
    'Wax seals and stamps: most makers ask for a black and white file. Send the seal-black SVG (or PNG) and ask for a 25 to 30 mm seal.',
    'Engravers usually prefer the SVG files. The PNGs have transparent backgrounds except the engraving and print pages.',
    '',
    'LICENSE',
    'You may use these files for any lawful purpose, personal or commercial. This is original decorative artwork in the',
    'style of heraldry, not an official grant of arms. Fonts are free Google Fonts under the SIL Open Font License.',
    '',
    'Help or refunds (within 14 days): hello@usurp.games  ·  Make another: https://usurp.games/crest.html',
    '',
  ].join('\r\n');
}
async function heirBlob(d, g, onStep = () => {}) {
  const JSZip = await loadZip(), zip = new JSZip(), base = fileBase(d), css = await fontCss();
  const svg = s => new Blob([s], { type:'image/svg+xml' });
  const steps = [
    [`engrave/${base}-engraving.png`, () => engraveBlob(d, 4000)],
    [`engrave/${base}-two-tone.svg`, async () => svg(svgString({ ...d, bg:'clear' }, css, 'mono'))],
    [`engrave/${base}-two-tone.png`, () => pngBlob({ ...d, bg:'clear' }, 4000, false, 'mono')],
    [`engrave/${base}-line-art.svg`, async () => svg(svgString({ ...d, bg:'clear' }, css, 'line'))],
    [`engrave/${base}-line-art.png`, () => pngBlob({ ...d, bg:'clear' }, 4000, false, 'line')],
    [`seal/${base}-seal-black.svg`, async () => svg(sealSvgString(d, true, css))],
    [`seal/${base}-seal-black.png`, () => sealBlob(d, 2000, true)],
    [`seal/${base}-seal-color.svg`, async () => svg(sealSvgString(d, false, css))],
    [`seal/${base}-seal-color.png`, () => sealBlob(d, 2000, false)],
    ['print/coloring-page.png', () => coloringBlob(d)],
    ['print/bookplates.png', () => bookplatesBlob(d)],
    ['print/house-banner.png', () => houseBannerBlob(d)],
    ['print/certificate-of-arms-a4.png', () => certBlob(d, g, true)],
  ];
  for (let i = 0; i < steps.length; i++) { onStep(i + 1, steps.length); zip.file(steps[i][0], await steps[i][1]()); }
  zip.file('README.txt', heirReadme(d, base));
  return await zip.generateAsync({ type:'blob', compression:'STORE' });
}
async function downloadHeir(d, g, btn) {
  const label = btn ? btn.textContent : '';
  try {
    const blob = await heirBlob(d, g, (i, n) => { if (btn) btn.textContent = `Building your heirloom files… ${i} of ${n}`; });
    saveBlob(blob, `${fileBase(d)}-heirloom-files.zip`);
    if (window.clarity) try { window.clarity('event', 'heirloom_download'); } catch (e) {}
  } catch (e) {
    note(`Something went wrong building the ZIP. Try again on a computer, or email ${CONTACT} with your payment reference and we will send the files.`);
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
    if (r.ok && j.ok) { verified = true; design = j.design ? dec(j.design) : null; plan = ['kit', 'heirloom'].includes(j.plan) ? j.plan : 'crest'; }
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
  if (kb) { if (plan === 'kit') { kb.hidden = false; kb.onclick = () => downloadKit(d, gift(), kb); } else kb.remove(); }
  const hb = dl.querySelector('[data-dl-heir]');
  if (hb) { if (plan === 'kit' || plan === 'heirloom') { hb.hidden = false; hb.onclick = () => downloadHeir(d, gift(), hb); } else hb.remove(); }
  if (plan === 'kit') title.textContent = 'Your Crest Logo Kit is ready';
  if (plan === 'heirloom') title.textContent = 'Your Heirloom set is ready';
  box.scrollIntoView({ block:'start' });
  if (window.clarity) try { window.clarity('event', 'crest_purchase'); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  wire(); syncControls(); preview(); handleReturn(); buyBar();
});
// exposed for tests
window.__crest = { enc, dec, layout, sanitize };
// File builders are exposed only on a local test server (tools/press.py and the test scripts use them).
if (['localhost', '127.0.0.1'].includes(location.hostname)) Object.assign(window.__crest, { svgString, downloadCertificate, downloadAvatar, downloadWallpaper, gift, kitBlob, bannerBlob, brandSheetBlob,
  heirBlob, engraveBlob, sealBlob, sealSvgString, coloringBlob, bookplatesBlob, houseBannerBlob, certBlob, pngBlob });
})();
