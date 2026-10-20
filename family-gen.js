/* Family crest generator: six heraldically sound crests seeded by a last name, rendered with crest-core.js
   so "Customize" opens the identical design in Crest Studio. */
(() => {
const C = window.CrestCore;
const data = JSON.parse(document.getElementById('fam-data').textContent);
const $ = s => document.querySelector(s);
const COLORS = ['#1f4e8a', '#1f5f3d', '#b3242f', '#7a1020', '#5a2a6e', '#1d1915'];
const METALS = ['#d4af5a', '#e8e4d8'];
const CHARGE_METALS = ['#f3dc92', '#e8e4d8', '#d4af5a'];
const DIVS = ['chevron', 'perpale', 'fess', 'bend', 'quarterly', 'saltire', 'pale', 'plain'];
const CHARGES = ['tower', 'key', 'rose', 'mullet', 'crescent', 'sword', 'crown'];
let surname = 'Carter', page = 0;

function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clean = s => String(s || '').replace(/[^\p{L}\p{M}' -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 30)
  .replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
function houseName(n) {
  if (/^(the|house|clan|family)\s/i.test(n)) return n.slice(0, 40);
  const full = `The ${n} Family`;
  return full.length <= 40 ? full : `House ${n}`.slice(0, 40);
}
function designs(n, pg) {
  const r = rng(hash(n.toLowerCase() + ':' + pg));
  const pick = a => a[Math.floor(r() * a.length)];
  const name = houseName(n), out = [];
  const divs = DIVS.slice().sort(() => r() - 0.5), charges = CHARGES.slice().sort(() => r() - 0.5);
  for (let i = 0; i < 6; i++) {
    out.push({ name, motto: pick(data.m), f: pick(COLORS), d: pick(METALS), c: pick(CHARGE_METALS),
      div: divs[i % divs.length], ch: (pg === 0 && i === 0) ? 'initial' : charges[i % charges.length], bg: 'parch' });
  }
  return out;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
function show() {
  const list = designs(surname, page);
  $('[data-results]').innerHTML = '<div class="gallery">' + list.map((d, i) =>
    `<figure class="card">${C.svg(d, `fg${page}_${i}`, `Family crest idea ${i + 1} for ${d.name}`)}<figcaption class="cap">${esc(d.motto)}</figcaption><p class="sub"><i>${esc(C.blazon(d))}</i></p><a class="btn ghost" href="${C.studioUrl(d)}">Customize</a></figure>`).join('') + '</div>';
  $('[data-status]').textContent = `Showing ${page ? 'more ' : ''}ideas for "${surname}".`;
}
function go(n) {
  const v = clean(n);
  if (!v) { $('[data-status]').textContent = 'Type a last name to see your crests.'; return; }
  surname = v; page = 0; show();
  try { history.replaceState(null, '', `?name=${encodeURIComponent(v)}`); } catch (e) {}
  if (window.clarity) try { window.clarity('event', 'surname_generate'); } catch (e) {}
}
$('[data-form]').addEventListener('submit', () => go($('[data-surname]').value));
$('[data-more]').addEventListener('click', () => { page++; show(); $('[data-results]').scrollIntoView({ behavior:'smooth', block:'start' }); });
const q = new URLSearchParams(location.search).get('name');
if (q) { $('[data-surname]').value = clean(q); go(q); }
})();
