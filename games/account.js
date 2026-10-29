/* Usurp games: optional cloud save. Everyone plays as a guest by default and progress stays on this device.
   "Save my progress" makes a random save code in the browser (the code is the login: no email or password), and from
   then on rank, stats, best scores, player name and the Crest Studio design are copied to /api/save. Entering the code
   (or opening the link #save=CODE) on another device signs in there and merges both devices' progress.
   Saves are throttled (a finished match, leaving the page, or every few minutes at most) to stay well inside the free
   storage allowance. */
(function () {
'use strict';
const A = 'ua-code', LAST = 'ua-last', AT = 'ua-at';
const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} },
  json(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } },
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const track = ev => { try { if (!window.UG_NOTRACK && window.clarity) window.clarity('event', ev); } catch (e) {} };

function newCode() {
  const b = new Uint8Array(20); crypto.getRandomValues(b);
  let s = ''; for (let i = 0; i < 20; i++) { s += ALPHA[b[i] & 31]; if (i % 4 === 3 && i < 19) s += '-'; }
  return s;
}
// Accepts what people type: lower case, spaces, O for 0, I or L for 1, missing dashes.
function normal(c) {
  c = String(c || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V').replace(/[^0-9A-Z]/g, '');
  if (c.length !== 20 || [...c].some(ch => !ALPHA.includes(ch))) return '';
  return c.match(/.{4}/g).join('-');
}

/* ---------- what gets saved ---------- */
function collect() {
  const best = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^ug-best-[a-z0-9_-]+$/.test(k)) best[k.slice(8)] = Number(LS.json(k, 0)) || 0; } } catch (e) {}
  const out = { v: 1, best, prof: LS.json('us-prof', {}) };
  const name = LS.json('us-name', ''); if (name) out.name = name;
  const crest = LS.json('usurp-crest-v1', null); if (crest && typeof crest === 'object' && crest.f) out.crest = crest;
  return out;
}
// Merge cloud progress into this device: higher numbers win, a design or name only fills a gap.
function merge(d) {
  if (!d || typeof d !== 'object') return;
  if (d.best) for (const g in d.best) { const k = 'ug-best-' + g; if ((Number(d.best[g]) || 0) > (Number(LS.json(k, 0)) || 0)) LS.set(k, JSON.stringify(d.best[g])); }
  if (d.prof) { const p = LS.json('us-prof', {}); for (const k in d.prof) p[k] = Math.max(Number(p[k]) || 0, Number(d.prof[k]) || 0); LS.set('us-prof', JSON.stringify(p)); }
  if (d.name && !LS.json('us-name', '')) LS.set('us-name', JSON.stringify(d.name));
  if (d.crest && !LS.json('usurp-crest-v1', null)) LS.set('usurp-crest-v1', JSON.stringify(d.crest));
}
async function api(op, code, data) {
  const r = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op, code, data }) });
  let j = null; try { j = await r.json(); } catch (e) {}
  if (!j) throw new Error('network');
  return j;
}

/* ---------- syncing ---------- */
let busy = false, lastTry = 0, state = 'idle';
async function sync(force) {
  const code = LS.get(A); if (!code || busy) return;
  const body = JSON.stringify(collect());
  if (body === LS.get(LAST)) return;                          // nothing new since the last save
  const t = Date.now(); if (!force && t - lastTry < 180000) return;
  busy = true; lastTry = t;
  try {
    const j = await api('save', code, JSON.parse(body));
    if (j.ok) { LS.set(LAST, body); LS.set(AT, j.updated); state = 'saved'; }
    else state = j.error === 'not_connected' ? 'offline' : 'error';
  } catch (e) { state = 'error'; }
  busy = false; render();
}
// Save as the page goes away (closing the tab, switching apps on a phone). keepalive lets it finish.
function flush() {
  const code = LS.get(A); if (!code || Date.now() - lastTry < 60000) return;
  lastTry = Date.now();
  const body = JSON.stringify(collect()); if (body === LS.get(LAST)) return;
  try { fetch('/api/save', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'save', code, data: JSON.parse(body) }) }).then(r => r.json()).then(j => { if (j.ok) { LS.set(LAST, body); LS.set(AT, j.updated); } }).catch(() => {}); } catch (e) {}
}
async function pull() {
  const code = LS.get(A); if (!code) return;
  try { if (sessionStorage.getItem('ua-pulled') === code) return; } catch (e) {}
  try {
    const j = await api('load', code);
    if (j.ok && j.found) { merge(j.data); try { sessionStorage.setItem('ua-pulled', code); } catch (e) {} state = 'saved'; render(); sync(true); }
    else if (j.error === 'not_connected') { state = 'offline'; render(); }
  } catch (e) {}
}

/* ---------- the strip under the game, and its dialog ---------- */
let bar = null, dlg = null;
function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : new Date(iso).toLocaleDateString();
}
function render() {
  if (!bar) return;
  const code = LS.get(A), p = LS.json('us-prof', {});
  const rank = p && p.xp ? ` · ${p.xp} renown` : '';
  if (!code) {
    bar.innerHTML = `<span class="ua-t"><b>Playing as a guest</b><span>Your rank and scores are kept on this device only${rank}.</span></span>
      <span class="ua-b"><button type="button" class="btn" data-ua="new">Save my progress</button><button type="button" class="btn ghost" data-ua="in">I have a save code</button></span>`;
  } else {
    const at = LS.get(AT);
    const msg = state === 'offline' ? 'Cloud save is not switched on yet, so progress stays on this device for now.' : state === 'error' ? 'Could not reach the cloud just now. It will try again.' : at ? `Saved to the cloud ${ago(at)}${rank}.` : `Signed in${rank}.`;
    bar.innerHTML = `<span class="ua-t"><b>Progress saved · code …${esc(code.slice(-4))}</b><span>${esc(msg)}</span></span>
      <span class="ua-b"><button type="button" class="btn ghost" data-ua="show">Show my code</button><button type="button" class="btn ghost" data-ua="out">Sign out</button></span>`;
  }
  bar.querySelectorAll('[data-ua]').forEach(b => { b.onclick = () => act(b.dataset.ua); });
}
function modal(html) {
  if (!dlg) {
    dlg = document.createElement('dialog'); dlg.className = 'ua-dlg'; document.body.appendChild(dlg);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }
  dlg.innerHTML = `<div class="ua-in"><button type="button" class="ua-x" aria-label="Close" data-x>×</button>${html}</div>`;
  dlg.querySelector('[data-x]').onclick = () => dlg.close();
  if (!dlg.open) { try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); } }
  return dlg;
}
function showCode(code, fresh) {
  const link = `${location.origin}/games/#save=${code}`;
  const mail = `mailto:?subject=${encodeURIComponent('My Usurp save code')}&body=${encodeURIComponent(`My save code for the games at usurp.games:\n\n${code}\n\nOpen this link on any device to load my progress:\n${link}\n`)}`;
  const d = modal(`<p class="ug-k">${fresh ? 'Your progress is saved' : 'Your save code'}</p>
    <h2 class="ug-t">Keep this code</h2>
    <p class="ua-code" data-code>${esc(code)}</p>
    <p class="ua-note">This code is your login. Enter it on another phone or computer to carry on with the same rank, stats, best scores and coat of arms. There is no password reset: if you lose the code, the progress is gone. Anyone with the code can load your progress, so share it only with yourself.</p>
    <div class="ua-row"><button type="button" class="btn" data-copy-code>Copy code</button><a class="btn ghost" href="${esc(mail)}">Email it to myself</a><button type="button" class="btn ghost" data-copy-link>Copy sign-in link</button></div>
    ${fresh ? '<button type="button" class="btn big ua-done" data-done>I have kept my code</button>' : ''}`);
  const copy = (txt, b) => (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { const l = b.textContent; b.textContent = 'Copied!'; setTimeout(() => { b.textContent = l; }, 1500); }).catch(() => { try { window.prompt('Copy this:', txt); } catch (e) {} });
  d.querySelector('[data-copy-code]').onclick = e => copy(code, e.target);
  d.querySelector('[data-copy-link]').onclick = e => copy(link, e.target);
  const done = d.querySelector('[data-done]'); if (done) done.onclick = () => d.close();
}
function askCode(prefill) {
  const d = modal(`<p class="ug-k">Sign in</p><h2 class="ug-t">Enter your save code</h2>
    <form data-f><input class="us-in ua-input" name="c" value="${esc(prefill || '')}" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Save code">
    <p class="ua-note" data-msg>Your progress on this device is merged with the saved progress: the higher rank and scores win.</p>
    <div class="ua-row"><button class="btn big" type="submit">Load my progress</button></div></form>`);
  const f = d.querySelector('[data-f]'), msg = d.querySelector('[data-msg]'), inp = f.querySelector('input');
  setTimeout(() => { try { inp.focus(); } catch (e) {} }, 50);
  f.onsubmit = async e => {
    e.preventDefault();
    const code = normal(inp.value);
    if (!code) { msg.textContent = 'That does not look like a save code. It has 20 letters and numbers in five groups of four.'; return; }
    msg.textContent = 'Checking…';
    try {
      const j = await api('load', code);
      if (j.error === 'not_connected') { msg.textContent = 'Cloud save is not switched on yet. Please try again later.'; return; }
      if (!j.ok) { msg.textContent = 'Could not check that code just now. Please try again.'; return; }
      if (!j.found) { msg.textContent = 'No progress is saved under that code. Check it for typos.'; return; }
      merge(j.data); LS.set(A, code); LS.set(LAST, null); LS.set(AT, j.updated);
      try { sessionStorage.setItem('ua-pulled', code); } catch (er) {}
      track('save_signin'); state = 'saved'; d.close(); render(); sync(true);
      setTimeout(() => location.reload(), 300);           // the games read progress at load
    } catch (er) { msg.textContent = 'Could not reach the server. Check your connection and try again.'; }
  };
}
async function act(a) {
  if (a === 'new') {
    const code = newCode();
    try {
      const j = await api('save', code, collect());
      if (!j.ok) { modal(`<h2 class="ug-t">Cloud save is not available yet</h2><p class="ua-note">${j.error === 'not_connected' ? 'Saving progress to the cloud is being switched on. Your progress is safe on this device in the meantime.' : 'Could not save just now. Please try again in a minute.'}</p>`); return; }
      LS.set(A, code); LS.set(LAST, JSON.stringify(collect())); LS.set(AT, j.updated); state = 'saved';
      track('save_create'); render(); showCode(code, true);
    } catch (e) { modal('<h2 class="ug-t">Could not save</h2><p class="ua-note">Check your connection and try again.</p>'); }
  } else if (a === 'in') askCode();
  else if (a === 'show') showCode(LS.get(A), false);
  else if (a === 'out') {
    const d = modal(`<h2 class="ug-t">Sign out?</h2><p class="ua-note">Your progress stays saved under your code, and stays on this device too. Make sure you have the code before you sign out: it is the only way back in.</p>
      <div class="ua-row"><button type="button" class="btn" data-yes>Sign out</button><button type="button" class="btn ghost" data-no>Cancel</button></div>`);
    d.querySelector('[data-no]').onclick = () => d.close();
    d.querySelector('[data-yes]').onclick = async () => { await sync(true); LS.set(A, null); LS.set(LAST, null); LS.set(AT, null); state = 'idle'; d.close(); render(); track('save_signout'); };
  }
}

function mount() {
  const anchor = document.querySelector('.gm-share') || document.querySelector('#games');
  if (!anchor) return;
  bar = document.createElement('div'); bar.className = 'ua-bar'; bar.setAttribute('aria-label', 'Your progress');
  if (anchor.id === 'games') anchor.before(bar); else anchor.after(bar);
  render();
  const m = /[#&]save=([0-9A-Za-z-]{20,29})/.exec(location.hash);
  if (m) { history.replaceState(null, '', location.pathname + location.search); if (!LS.get(A) || LS.get(A) !== normal(m[1])) askCode(normal(m[1]) || m[1]); }
  pull();
}
window.addEventListener('usurp-progress', () => sync(false));
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
setInterval(() => sync(false), 200000);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
window.UA = { collect, merge, normal, sync };
})();
