/* Usurp games: the shared engine for the medieval games at /games/.
   One responsive canvas per game, a fixed-step-free loop, pointer and keyboard input, a tiny synthesized sound kit,
   overlays for start and results screens, best scores, sharing, the player's own coat of arms (from Crest Studio)
   and random heraldry for opponents, ad slots, and play tracking. No libraries, no image files. */
(function () {
'use strict';
const UG = window.UG = {};
const ADS = window.USURP_ADS || {};   // { client, slot, h5, test, sponsor, ga } written by tools/build.py; empty means house ads only
// Embedded on someone else's site (/embed/*.html): no ad network and no analytics, links open in a new tab,
// and the game never scrolls the host page.
const EMBED = UG.embed = !!window.USURP_EMBED;
// Hosted on a game portal (a build from tools/portal.py): only the portal's own ad SDK, no links out, no house ads,
// and ads only at natural breaks (a level won or lost), never on a button press.
const PORTAL = UG.portal = window.USURP_PORTAL || '';
const BASE = window.USURP_BASE || '/';
const SITE = 'https://usurp.games';
const CG = () => (PORTAL === 'crazygames' && window.CrazyGames && window.CrazyGames.SDK) || null;
let cgReady = false;
if (PORTAL === 'crazygames') {
  const sdk = CG();
  if (sdk) sdk.init().then(() => { cgReady = true; }).catch(() => {});
}

/* ---------- small helpers ---------- */
UG.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
UG.lerp = (a, b, t) => a + (b - a) * t;
UG.rand = (a, b) => a + Math.random() * (b - a);
UG.pick = (a, r = Math.random) => a[Math.floor(r() * a.length)];
UG.ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
UG.seeded = seed => { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
UG.store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
UG.font = (size, weight = 700, fam = 'Cinzel') => `${weight} ${size}px '${fam}', Georgia, serif`;
UG.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- tracking: Microsoft Clarity events (already on every page), and GA4 if an ID is configured ---------- */
let GAME = 'games';
UG.track = (ev, extra) => {
  try { if (window.clarity) window.clarity('event', `${ev}_${GAME}`); } catch (e) {}
  try { if (window.gtag && ADS.ga) window.gtag('event', ev, Object.assign({ game: GAME }, extra || {})); } catch (e) {}
};

/* ---------- sound: everything is synthesized, so there is nothing to download ---------- */
const AU = { ctx: null, out: null, noise: null, muted: UG.store.get('ug-muted', false) };
function ac() {
  if (!AU.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AU.ctx = new C(); AU.out = AU.ctx.createGain(); AU.out.gain.value = AU.muted ? 0 : 0.55; AU.out.connect(AU.ctx.destination);
    const b = AU.ctx.createBuffer(1, AU.ctx.sampleRate, AU.ctx.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    AU.noise = b;
  }
  if (AU.ctx.state === 'suspended') AU.ctx.resume();
  return AU.ctx;
}
function tone(f, dur, type = 'sine', vol = 0.3, to = null, delay = 0) {
  const c = ac(); if (!c || AU.muted) return;
  const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AU.out); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.3, ft = 'lowpass', f = 1000, q = 1, delay = 0, to = null, attack = 0.005) {
  const c = ac(); if (!c || AU.muted) return;
  const t = c.currentTime + delay, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = AU.noise; s.loop = true; fl.type = ft; fl.frequency.setValueAtTime(f, t); fl.Q.value = q; if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(AU.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
UG.sfx = {
  click: () => tone(720, 0.05, 'square', 0.05),
  draw: () => noise(0.5, 0.06, 'bandpass', 400, 2, 0, 900, 0.2),
  twang: () => { tone(196, 0.3, 'triangle', 0.22, 82); noise(0.07, 0.12, 'highpass', 2500); },
  whoosh: () => noise(0.32, 0.16, 'bandpass', 500, 1.4, 0, 2600, 0.04),
  thunk: () => { tone(150, 0.14, 'sine', 0.5, 55); noise(0.05, 0.22, 'lowpass', 1100); },
  clash: () => { [1, 2.7, 5.2, 8.3].forEach((m, i) => tone(480 * m, 0.45 - i * 0.08, 'triangle', 0.1)); noise(0.1, 0.22, 'highpass', 3200); },
  hit: () => { noise(0.18, 0.35, 'lowpass', 600); tone(95, 0.2, 'sine', 0.35, 45); },
  crack: () => { noise(0.3, 0.42, 'bandpass', 1500, 0.7, 0, 400); tone(260, 0.12, 'square', 0.08, 110); },
  gallop: () => { tone(72, 0.08, 'sine', 0.3, 48); noise(0.05, 0.1, 'lowpass', 350); },
  cheer: (v = 0.16) => { noise(1.6, v, 'bandpass', 1200, 0.5, 0, 900, 0.25); noise(1.2, v * 0.6, 'bandpass', 2400, 0.6, 0.1, null, 0.2); },
  groan: () => noise(0.9, 0.1, 'bandpass', 500, 0.8, 0, 260, 0.15),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.16, 'square', 0.07, null, i * 0.13)),
  fail: () => { tone(330, 0.35, 'sawtooth', 0.08, 140); tone(247, 0.45, 'sawtooth', 0.06, 110, 0.12); },
  coin: () => { tone(988, 0.08, 'square', 0.06); tone(1319, 0.22, 'square', 0.06, null, 0.07); },
  boom: () => { noise(0.6, 0.45, 'lowpass', 400, 1, 0, 80); tone(60, 0.5, 'sine', 0.45, 30); },
};
UG.buzz = ms => { try { if (navigator.vibrate && !AU.muted) navigator.vibrate(ms); } catch (e) {} };
function setMuted(m) { AU.muted = m; UG.store.set('ug-muted', m); if (AU.out) AU.out.gain.value = m ? 0 : 0.55; try { if (window.adConfig) window.adConfig({ sound: m ? 'off' : 'on' }); } catch (e) {} }

/* ---------- heraldry: the player's own crest from Crest Studio, and random arms for opponents ---------- */
let corePromise = null;
UG.core = () => {
  if (window.CrestCore) return Promise.resolve(window.CrestCore);
  if (!corePromise) corePromise = new Promise(res => { const s = document.createElement('script'); s.src = BASE + 'crest-core.js'; s.async = true; s.onload = () => res(window.CrestCore || null); s.onerror = () => res(null); document.head.appendChild(s); });
  return corePromise;
};
UG.myDesign = () => { try { const d = JSON.parse(localStorage.getItem('usurp-crest-v1')); return d && typeof d === 'object' && d.f ? d : null; } catch (e) { return null; } };
const imgs = new Map();
// An Image of just the shield (no name, ribbon or mantling). rec.ready turns true once it can be drawn.
UG.shield = (design) => {
  const key = JSON.stringify(design);
  if (imgs.has(key)) return imgs.get(key);
  const rec = { img: new Image(), ready: false, design };
  imgs.set(key, rec);
  UG.core().then(C => {
    if (!C) return;
    const d = C.sanitize(design), L = C.layout(Object.assign({}, d, { bg: 'clear', helm: 'none', sup: 'none' }), 'ug' + imgs.size, { noName: true, noRibbon: true, shieldOnly: true, noMantle: true });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="218 181 564 720" width="282" height="360">${L.art}${L.texts.map(C.textSvg).join('')}</svg>`;
    rec.img.onload = () => { rec.ready = true; };
    rec.img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  return rec;
};
UG.SHIELD_RATIO = 720 / 564;
const COLS = ['#b3242f', '#7a1020', '#1f4e8a', '#1f5f3d', '#5a2a6e', '#1d1915'], METS = ['#d4af5a', '#e8e4d8'];
const DIVS = ['plain', 'plain', 'perpale', 'perfess', 'perbend', 'chevron', 'fess', 'pale', 'bend', 'saltire', 'cross', 'quarterly', 'chief', 'bordure', 'paly', 'barry', 'checky', 'gyronny', 'pile', 'perchevron'];
const CHS = ['lion', 'eagle', 'dragon', 'griffin', 'wolf', 'bear', 'stag', 'boar', 'raven', 'tower', 'sword', 'swords', 'crown', 'key', 'crescent', 'mullet', 'sun', 'fleur', 'rose', 'tree', 'axe', 'hammer', 'horse', 'unicorn', 'owl', 'phoenix', 'none'];
const HOUSES = ['Thornwall', 'Ravenmere', 'Ashford', 'Stormhold', 'Silvervale', 'Emberwick', 'Greycombe', 'Frostgard', 'Duskhaven', 'Ironridge', 'Wrenbourne', 'Oakshaw', 'Blackmoor', 'Highcliff', 'Redfern', 'Goldcrest', 'Wyvernhold', 'Marrowdale', 'Coldbrook', 'Brightwater', 'Hollowmere', 'Stonebridge', 'Westmarch', 'Ambergate'];
const SIRS = ['Aldric', 'Bertrand', 'Cedric', 'Edmund', 'Godfrey', 'Hugo', 'Leofric', 'Osric', 'Roland', 'Tristan', 'Gawain', 'Percival', 'Baldwin', 'Conrad', 'Alaric', 'Darius'];
const DAMES = ['Isolde', 'Matilda', 'Elinor', 'Rowena', 'Brienne', 'Adela', 'Gwendolyn', 'Sybil', 'Eleanor', 'Cecily'];
UG.randomKnight = (r = Math.random) => {
  const metalField = r() < 0.3, f = metalField ? UG.pick(METS, r) : UG.pick(COLS, r);
  const d = metalField ? UG.pick(COLS, r) : UG.pick(METS, r);
  const c = metalField ? UG.pick(COLS.filter(x => x !== d), r) : UG.pick(METS, r);
  const house = UG.pick(HOUSES, r), dame = r() < 0.3;
  const name = `${dame ? 'Dame' : 'Sir'} ${UG.pick(dame ? DAMES : SIRS, r)} of ${house}`;
  return { name, house, design: { name: `House ${house}`, motto: '', f, d, c, div: UG.pick(DIVS, r), ch: UG.pick(CHS, r), bg: 'clear' } };
};
// The player's knight: their Crest Studio design if they have one, otherwise a handsome default.
UG.player = () => {
  const d = UG.myDesign();
  if (d) return { mine: true, name: String(d.name || 'Your house').trim() || 'Your house', design: d };
  return { mine: false, name: 'You', design: { name: 'Your House', motto: '', f: '#1f4e8a', d: '#d4af5a', c: '#d4af5a', div: 'plain', ch: 'lion', bg: 'clear' } };
};
// Draws a cached shield image centered at (x, y) with height h, or a plain stand-in while it loads.
UG.drawShield = (ctx, rec, x, y, h, alpha = 1) => {
  const w = h / UG.SHIELD_RATIO;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (rec && rec.ready) ctx.drawImage(rec.img, x - w / 2, y - h / 2, w, h);
  else {
    const s = h / 122; ctx.translate(x - 50 * s, y - 61 * s); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(94, 6); ctx.lineTo(94, 56); ctx.bezierCurveTo(94, 88, 72, 106, 50, 116); ctx.bezierCurveTo(28, 106, 6, 88, 6, 56); ctx.closePath();
    ctx.fillStyle = (rec && rec.design && rec.design.f) || '#7a1020'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#d4af5a'; ctx.stroke();
  }
  ctx.restore();
};

/* ---------- ads: banner slot below the game, and a between-rounds break ---------- */
// adsState: 'off' until a network is configured, then 'loading', 'ready', or 'failed' (blocked by an ad blocker,
// offline, or refused). Every path falls back to the house ad, so a blocked or empty ad never leaves a hole or a stall.
let adsState = 'off', h5Ready = false;
function loadAdsense() {
  if (adsState !== 'off' || !ADS.client) return;
  adsState = 'loading';
  window.adsbygoogle = window.adsbygoogle || [];
  if (ADS.h5) {
    window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    window.adConfig({ preloadAdBreaks: 'on', sound: AU.muted ? 'off' : 'on', onReady: () => { h5Ready = true; } });
  }
  const s = document.createElement('script');
  s.async = true; s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADS.client)}`;
  if (ADS.h5) { s.setAttribute('data-ad-frequency-hint', ADS.freq || '60s'); if (ADS.test) s.setAttribute('data-adbreak-test', 'on'); }
  if (ADS.test && !ADS.h5) s.setAttribute('data-adtest', 'on');
  s.onload = () => { adsState = 'ready'; };
  s.onerror = () => { adsState = 'failed'; UG.track('ad_blocked'); document.querySelectorAll('[data-ad-slot].ad-net').forEach(houseFill); };
  document.head.appendChild(s);
}
function crestCard(cls) {
  if (PORTAL) return '';
  const me = UG.myDesign();
  return `<a class="${cls}" href="${EMBED ? `${SITE}/crest.html?from=embed-${GAME}` : '/crest.html'}" data-house-ad><span class="hb-art" data-hb-art></span><span class="hb-t"><b>${me ? 'Your arms deserve a frame' : 'Ride under your own banner'}</b><span>${me ? 'Print-ready files of your coat of arms, a certificate and a wallpaper, $9.' : 'Design your coat of arms free. It appears on your knight in every game.'}</span></span><span class="btn">${me ? 'Get my files' : 'Design my crest'}</span></a>`;
}
function fillHouseArt(root) {
  const el = root.querySelector('[data-hb-art]'); if (!el) return;
  const p = UG.player(); UG.core().then(C => {
    if (!C) return;
    const L = C.layout(Object.assign({}, C.sanitize(p.design), { bg: 'clear' }), 'hb', { noName: true, noRibbon: true, shieldOnly: true, noMantle: true });
    el.innerHTML = `<svg viewBox="218 181 564 720" aria-hidden="true">${L.art}${L.texts.map(C.textSvg).join('')}</svg>`;
  });
}
// The house ad: a Crest Studio card, or a directly sold sponsor banner when one is configured.
function houseFill(slot) {
  slot.classList.remove('ad-net');
  if (slot.__house !== undefined) { slot.innerHTML = slot.__house; return; }   // a slot that came with its own house content
  const sp = ADS.sponsor;
  if (sp && sp.href && sp.img) {
    slot.innerHTML = `<span class="ad-lbl">Sponsor</span><a class="sponsor" href="${sp.href}" rel="sponsored noopener" target="_blank"><img src="${sp.img}" alt="${(sp.alt || 'Sponsor').replace(/"/g, '&quot;')}" width="728" height="90" loading="lazy"></a>`;
    slot.querySelector('a').addEventListener('click', () => UG.track('sponsor_click'));
    return;
  }
  slot.innerHTML = crestCard('house-bn') + '<p class="ad-sell">Want your brand here? <a href="/advertise.html">Advertise on these games</a></p>';
  fillHouseArt(slot);
  slot.querySelector('[data-house-ad]').addEventListener('click', () => UG.track('house_click'));
}
UG.mountBanner = () => {
  if (PORTAL) return;
  document.querySelectorAll('[data-ad-slot]').forEach(slot => {
    if (slot.dataset.filled) return;
    if (!slot.offsetWidth) return;              // a rail hidden on this screen size: leave it empty, so no ad loads unseen
    slot.dataset.filled = '1';
    if (slot.dataset.house === 'static' && slot.__house === undefined) slot.__house = slot.innerHTML;
    if (!(ADS.client && ADS.slot) || adsState === 'failed') return houseFill(slot);
    slot.classList.add('ad-net');
    slot.innerHTML = `<span class="ad-lbl">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="${ADS.client}" data-ad-slot="${ADS.slot}" data-ad-format="auto" data-full-width-responsive="true"${ADS.test ? ' data-adtest="on"' : ''}></ins>`;
    loadAdsense();
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    const ins = slot.querySelector('ins');
    // Google marks an empty slot data-ad-status="unfilled"; show the house ad there instead of a blank box.
    const check = () => { if (!ins.isConnected) return true; const st = ins.getAttribute('data-ad-status'); if (st === 'unfilled') { UG.track('ad_unfilled'); houseFill(slot); return true; } return st === 'filled'; };
    if ('MutationObserver' in window) { const mo = new MutationObserver(() => { if (check()) mo.disconnect(); }); mo.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] }); }
    setTimeout(() => { if (ins.isConnected && !ins.getAttribute('data-ad-status') && !ins.querySelector('iframe')) houseFill(slot); }, 10000);
  });
};
/* Between rounds: Google's game interstitial when it is switched on and its library is ready (Google decides whether an
   ad is available and applies its own frequency limits), otherwise an occasional, skippable Crest Studio card. Never
   before the first round of a visit and never during play; if no ad starts within 2.5 s, the next round just begins. */
let roundsStarted = 0, lastHouse = 0, roundsDone = 0;
UG.between = (game, done) => {
  roundsStarted++;
  if (PORTAL) return done();                    // portals get their ad at the natural break instead (see screen)
  if (roundsStarted < 2) return done();
  if (ADS.client && ADS.h5 && window.adBreak && adsState !== 'failed' && (h5Ready || adsState === 'ready')) {
    let finished = false, started = false;
    const fin = () => { if (finished) return; finished = true; clearTimeout(t1); clearTimeout(t2); game.resumeAudio(); done(); };
    const t1 = setTimeout(() => { if (!started) fin(); }, 2500);
    const t2 = setTimeout(fin, 45000);
    window.adBreak({ type: 'next', name: `${GAME}-round-${roundsStarted}`,
      beforeAd: () => { started = true; game.pauseAudio(); UG.track('ad_start'); },
      afterAd: () => game.resumeAudio(),
      adBreakDone: info => { UG.track('ad_' + ((info && info.breakStatus) || 'done')); fin(); } });
    return;
  }
  const now = Date.now();
  if (roundsStarted % 3 === 0 && now - lastHouse > 120000) { lastHouse = now; return game.houseBreak(done); }
  done();
};

/* ---------- the game shell ---------- */
UG.start = function (spec) {
  GAME = spec.id;
  try { if (window.clarity) window.clarity('set', 'game', GAME); } catch (e) {}
  const root = document.querySelector(`[data-game="${spec.id}"]`); if (!root) return;
  document.body.classList.add('ug-page');
  const W = spec.W || 540, H = spec.H || 720;
  const cv = document.createElement('canvas'); cv.className = 'ug-c'; cv.setAttribute('aria-label', spec.label || spec.title); cv.setAttribute('role', 'img');
  root.prepend(cv);
  const ctx = cv.getContext('2d');
  root.insertAdjacentHTML('beforeend', '<div class="ug-ov" data-ov><div class="ug-card" data-card></div></div><div class="ug-live" aria-live="polite" data-live></div>');
  // Sound and full-screen buttons sit in a bar under the game, so they never cover the score or controls.
  let wrap = root.parentElement;
  if (!wrap.classList.contains('ug-wrap')) { wrap = document.createElement('div'); wrap.className = 'ug-wrap'; root.before(wrap); wrap.append(root); }
  const ICON = {
    on: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    off: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    fs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>' };
  wrap.insertAdjacentHTML('beforeend', `<div class="ug-bar"><span class="ug-bestl" data-bestl></span><span class="ug-rot">Hold your phone upright for a bigger game</span><span class="ug-bar-r"><button type="button" class="ug-tb" data-mute aria-pressed="${AU.muted}" aria-label="Sound off">${AU.muted ? ICON.off : ICON.on}</button><button type="button" class="ug-tb" data-fs aria-label="Full screen">${ICON.fs}</button></span></div>`);
  const ov = root.querySelector('[data-ov]'), card = root.querySelector('[data-card]'), live = root.querySelector('[data-live]'), bestl = wrap.querySelector('[data-bestl]');
  const showBest = () => { bestl.textContent = UG.store.get(`ug-best-${spec.id}`, 0) ? `Your best: ${UG.store.get(`ug-best-${spec.id}`, 0)}${spec.bestUnit || ''}` : ''; };
  showBest();
  let scale = 1, dpr = 1;
  function fit() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr)); scale = cv.width / W;
    root.classList.toggle('ug-small', r.height < 470); root.classList.toggle('ug-tiny', r.height < 380);
  }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(cv); else window.addEventListener('resize', fit);

  const g = {
    W, H, ctx, root, t: 0, state: 'menu', best: UG.store.get(`ug-best-${spec.id}`, 0),
    shakeAmt: 0, shakeT: 0, parts: [], pops: [], ptr: { down: false, x: W / 2, y: H / 2, sx: 0, sy: 0, id: null },
    say: m => { live.textContent = m; },
    shake(a = 8, d = 0.3) { if (UG.reduced) return; this.shakeAmt = Math.max(this.shakeAmt, a); this.shakeT = Math.max(this.shakeT, d); },
    burst(x, y, n, o = {}) {
      for (let i = 0; i < n; i++) {
        const a = (o.dir !== undefined ? o.dir : 0) + (Math.random() - 0.5) * (o.spread !== undefined ? o.spread : Math.PI * 2), v = UG.rand(o.v0 || 60, o.v1 || 260);
        this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: UG.rand(o.l0 || 0.4, o.l1 || 0.9), c: Array.isArray(o.c) ? UG.pick(o.c) : (o.c || '#f3dc92'), s: UG.rand(o.s0 || 2, o.s1 || 5), g: o.g !== undefined ? o.g : 600, sh: o.shape || 'sq', rot: Math.random() * 6, vr: UG.rand(-10, 10) });
      }
    },
    pop(text, x, y, o = {}) { this.pops.push({ text, x, y, life: 0, max: o.max || 1.1, c: o.c || '#f3dc92', size: o.size || 34, rise: o.rise !== undefined ? o.rise : 60 }); },
    // 0: not a best, 1: beat a previous best, 2: the first score ever logged on this device
    setBest(v) { if (v > this.best) { const first = !this.best; this.best = v; UG.store.set(`ug-best-${spec.id}`, v); showBest(); return first ? 2 : 1; } return 0; },
    bestLine(nb) { return nb === 1 ? 'A new personal best!' : nb === 2 ? '' : `Your best: ${this.best}`; },
    pauseAudio() { if (AU.ctx && AU.ctx.state === 'running') AU.ctx.suspend(); },
    resumeAudio() { if (AU.ctx && AU.ctx.state === 'suspended') AU.ctx.resume(); },
    // Overlay screens. o: { kicker, title, big, sub, lines[], html, primary:{label,on}, secondary:{label,on}, cta }
    screen(o) {
      if (PORTAL) {
        o = Object.assign({}, o, { cta: false });
        if (o.secondary && /friend/i.test(o.secondary.label)) delete o.secondary;
        try { const sdk = CG(); if (sdk && cgReady) sdk.game.gameplayStop(); } catch (e) {}
        // A level won or lost is the natural break for the portal's ad. The card waits until the ad is over.
        if ((o.brk || (o.lines && o.title && o.primary)) && !o._adDone && CG() && cgReady && roundsDone++ > 0) {
          const self = this; let fin = false;
          const go = () => { if (fin) return; fin = true; self.resumeAudio(); self.screen(Object.assign({}, o, { _adDone: true })); };
          setTimeout(go, 40000);
          try { CG().ad.requestAd('midgame', { adStarted: () => { self.pauseAudio(); UG.track('ad_start'); }, adFinished: go, adError: go }); } catch (e) { go(); }
          return;
        }
      }
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      card.innerHTML = (o.kicker ? `<p class="ug-k">${esc(o.kicker)}</p>` : '') + (o.title ? `<h2 class="ug-t">${esc(o.title)}</h2>` : '')
        + (o.big !== undefined ? `<p class="ug-big">${esc(o.big)}</p>` : '') + (o.sub ? `<p class="ug-sub">${esc(o.sub)}</p>` : '')
        + (o.lines && o.lines.filter(Boolean).length ? `<ul class="ug-lines">${o.lines.filter(Boolean).map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : '') + (o.html || '')
        + (o.choices ? `<div class="ug-choices">${o.choices.map((c, i) => `<button type="button" class="ug-choice" data-c="${i}"><b>${esc(c.label)}</b><span>${esc(c.sub || '')}</span></button>`).join('')}</div>` : '')
        + `<div class="ug-btns">${o.primary ? `<button type="button" class="btn big" data-p>${esc(o.primary.label)}</button>` : ''}${o.secondary ? `<button type="button" class="btn ghost" data-s>${esc(o.secondary.label)}</button>` : ''}</div>`
        + (o.cta ? crestCard('ug-crest') : '');
      card.classList.toggle('ug-res', !!o.cta);
      if (o.cta) { fillHouseArt(card); const a = card.querySelector('[data-house-ad]'); a.addEventListener('click', () => UG.track('crest_click')); }
      if (o.choices) card.querySelectorAll('[data-c]').forEach(btn => { btn.onclick = () => { UG.sfx.click(); o.choices[+btn.dataset.c].on(); }; });
      const p = card.querySelector('[data-p]') || card.querySelector('[data-c]'), s = card.querySelector('[data-s]');
      if (p && o.primary) p.onclick = () => { UG.sfx.click(); o.primary.on(); };
      if (s) s.onclick = () => { UG.sfx.click(); o.secondary.on(); };
      ov.hidden = false; root.classList.add('ov-on');
      if (o.title) this.say(`${o.title}${o.big !== undefined ? ': ' + o.big : ''}`);
      if (p && AU.ctx) setTimeout(() => { try { p.focus({ preventScroll: true }); } catch (e) {} }, 30);   // not on first load, so Space still scrolls the page
    },
    hide() {
      ov.hidden = true; root.classList.remove('ov-on'); try { cv.focus({ preventScroll: true }); } catch (e) {}
      try { const sdk = CG(); if (sdk && cgReady) sdk.game.gameplayStart(); } catch (e) {}
      // bring the whole game on screen when play starts (phones held sideways, or after scrolling)
      const r = root.getBoundingClientRect();
      if (!EMBED && !PORTAL && (r.top < 0 || r.bottom > innerHeight)) root.scrollIntoView({ block: r.height > innerHeight ? 'start' : 'center', behavior: UG.reduced ? 'auto' : 'smooth' });
    },
    // An occasional break between rounds when no ad network is switched on: one tap to continue.
    houseBreak(done) {
      const sp = ADS.sponsor;
      if (sp && sp.href && sp.img) {                // a directly sold sponsor takes the round break
        UG.track('sponsor_break');
        this.screen({ kicker: 'Intermission', title: sp.title || 'Today\u2019s tournament sponsor', html: `<a class="sponsor-card" href="${sp.href}" rel="sponsored noopener" target="_blank"><img src="${sp.img}" alt="${String(sp.alt || 'Sponsor').replace(/"/g, '&quot;')}" width="728" height="90"></a>`,
          primary: { label: 'Continue', on: () => { this.hide(); done(); } } });
        const a = card.querySelector('.sponsor-card'); if (a) a.addEventListener('click', () => UG.track('sponsor_click'));
        return;
      }
      UG.track('house_break');
      this.screen({ kicker: 'Intermission', title: 'Fly your own colours', sub: 'Design your coat of arms and it rides with you in every game.', cta: true,
        primary: { label: 'Continue', on: () => { this.hide(); done(); } } });
    },
    share(text) {
      // Always share the game's own page (the canonical URL), also from an embed on another site.
      const can = document.querySelector('link[rel="canonical"]');
      const url = (can && can.href) || location.href.split('#')[0].split('?')[0];
      UG.track('share');
      const b = card.querySelector('[data-s]');
      const copied = () => { this.say('Copied. Paste it anywhere to challenge a friend.'); if (b) { const l = b.textContent; b.textContent = 'Copied!'; setTimeout(() => { b.textContent = l; }, 1600); } };
      // Inside an embed the host page may not allow sharing or the clipboard; then open the game's page instead.
      const copy = () => (navigator.clipboard ? navigator.clipboard.writeText(`${text} ${url}`) : Promise.reject()).then(copied).catch(() => { if (EMBED) window.open(url, '_blank', 'noopener'); });
      if (navigator.share && matchMedia('(pointer:coarse)').matches) { navigator.share({ title: document.title, text, url }).catch(e => { if (!e || e.name !== 'AbortError') copy(); }); return; }
      copy();
    },
  };

  // Pointer input in game coordinates. Overlay screens sit above the canvas, so taps on buttons never reach the game.
  const toGame = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  cv.addEventListener('pointerdown', e => {
    ac(); const [x, y] = toGame(e);
    g.ptr.down = true; g.ptr.x = g.ptr.sx = x; g.ptr.y = g.ptr.sy = y; g.ptr.id = e.pointerId;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    if (spec.down) spec.down(g, x, y, e); e.preventDefault();
  });
  cv.addEventListener('pointermove', e => { const [x, y] = toGame(e); const dx = x - g.ptr.x, dy = y - g.ptr.y; g.ptr.x = x; g.ptr.y = y; if (spec.move) spec.move(g, x, y, dx, dy, e); });
  const up = e => { if (!g.ptr.down) return; g.ptr.down = false; const [x, y] = toGame(e); if (spec.up) spec.up(g, x, y, e); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', e => e.preventDefault());
  const GAME_KEYS = [' ', 'Spacebar', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S'];
  const inView = () => { const r = root.getBoundingClientRect(); return r.bottom > 80 && r.top < innerHeight - 80; };
  window.addEventListener('keydown', e => {
    if (!inView() || e.target.closest && e.target.closest('input, textarea, select')) return;
    if (!ov.hidden) { const ae = document.activeElement; if (e.key === 'Enter' && (!ae || ae === document.body)) { const p = card.querySelector('[data-p]'); if (p) { e.preventDefault(); p.click(); } } return; }
    if (GAME_KEYS.includes(e.key)) { e.preventDefault(); ac(); if (!e.repeat && spec.key) spec.key(g, e.key, true); }
  });
  window.addEventListener('keyup', e => { if (ov.hidden && GAME_KEYS.includes(e.key) && spec.key) spec.key(g, e.key, false); });

  const mute = wrap.querySelector('[data-mute]');
  mute.onclick = () => { setMuted(!AU.muted); mute.innerHTML = AU.muted ? ICON.off : ICON.on; mute.setAttribute('aria-pressed', String(AU.muted)); if (!AU.muted) { ac(); UG.sfx.click(); } };
  const fsb = wrap.querySelector('[data-fs]');
  if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) fsb.remove();
  else fsb.onclick = () => {
    const el = wrap;
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    UG.track('fullscreen');
  };

  // Main loop. It stops while the tab is hidden or the game is scrolled out of view, and slows to about 15 frames a
  // second behind the start and results cards, which saves battery on phones.
  let last = 0, raf = 0, lastDraw = 0, onScreen = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => {
    onScreen = es[0].isIntersecting;
    if (onScreen && !raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
  }).observe(root);
  function frame(ts) {
    if (!onScreen) { raf = 0; return; }
    if (!ov.hidden && ts - lastDraw < 60) { raf = requestAnimationFrame(frame); return; }
    lastDraw = ts;
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
    g.t += dt;
    const live = !window.__ugFreeze;   // tests and screenshots can freeze the action and still draw it
    if (spec.update && live) spec.update(g, dt);
    if (live) for (const p of g.parts) { p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
    g.parts = g.parts.filter(p => p.life < p.max);
    if (live) for (const p of g.pops) p.life += dt;
    g.pops = g.pops.filter(p => p.life < p.max);
    if (g.shakeT > 0) g.shakeT -= dt; else g.shakeAmt = 0;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (g.shakeT > 0) ctx.translate((Math.random() - 0.5) * g.shakeAmt, (Math.random() - 0.5) * g.shakeAmt);
    spec.draw(g, ctx);
    for (const p of g.parts) {
      const a = 1 - p.life / p.max; ctx.globalAlpha = a; ctx.fillStyle = p.c;
      if (p.sh === 'dot') { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill(); }
      else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.s, -p.s * (p.sh === 'splinter' ? 0.25 : 1), p.s * 2, p.s * (p.sh === 'splinter' ? 0.5 : 2)); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
    for (const p of g.pops) {
      const k = p.life / p.max, a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3, sc = k < 0.15 ? UG.ease.outBack(k / 0.15) : 1;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y - p.rise * UG.ease.outCubic(k)); ctx.scale(sc, sc);
      ctx.font = UG.font(p.size, 900, 'Cinzel Decorative'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(3, p.size / 7); ctx.strokeStyle = 'rgba(20,14,8,.9)'; ctx.lineJoin = 'round'; ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.c; ctx.fillText(p.text, 0, 0); ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; if (spec.pause) spec.pause(g); g.pauseAudio(); }
    else if (!raf) { last = 0; raf = requestAnimationFrame(frame); g.resumeAudio(); }
  });
  if (spec.init) spec.init(g);
  raf = requestAnimationFrame(frame);
  // Warm up the crest engine and ads once the game is on screen, so the first paint stays fast.
  const idle = window.requestIdleCallback || (f => setTimeout(f, 1200));
  idle(() => { UG.core(); UG.mountBanner(); if (ADS.client && ADS.h5) loadAdsense(); });
  return g;
};
// Share row under each game: count which network people share to, and copy the game's link.
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('[data-share]'); if (!a) return;
  UG.track('share_' + a.dataset.share);
  if (a.dataset.share !== 'link') return;
  const url = a.dataset.url || location.href.split('#')[0].split('?')[0];
  const ok = () => { const l = a.dataset.l || (a.dataset.l = a.textContent); a.textContent = 'Link copied'; setTimeout(() => { a.textContent = l; }, 1800); };
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(ok).catch(() => { try { window.prompt('Copy this link:', url); } catch (err) {} });
});
// "Put this game on your website": copy the embed code from the box next to the button.
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
  const box = b.closest('[data-emb]'), ta = box && box.querySelector('textarea'); if (!ta) return;
  const ok = () => { const l = b.dataset.l || (b.dataset.l = b.textContent); b.textContent = 'Copied!'; setTimeout(() => { b.textContent = l; }, 1800); };
  ta.focus(); ta.select();
  (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(ok).catch(() => { try { if (document.execCommand('copy')) ok(); } catch (err) {} });
  try { if (window.clarity) window.clarity('event', `embed_copy_${box.dataset.emb}`); } catch (err) {}
});
// Pages without a game (the games hub) still fill their ad slot once the page is idle.
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('[data-game]') || !document.querySelector('[data-ad-slot]')) return;
  (window.requestIdleCallback || (f => setTimeout(f, 1200)))(() => UG.mountBanner());
});
})();
