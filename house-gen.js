/* Fantasy house name generator: a name, a motto and a full sigil, rendered with crest-core.js
   so "Open in Crest Studio" opens the exact same design. */
(() => {
const C = window.CrestCore;
const data = JSON.parse(document.getElementById('house-data').textContent);
const $ = s => document.querySelector(s);
const pick = a => a[Math.floor(Math.random() * a.length)];
const COLORS = ['#b3242f', '#7a1020', '#1f4e8a', '#1f5f3d', '#5a2a6e', '#1d1915'];   // gules, murrey, azure, vert, purpure, sable
const METALS = ['#d4af5a', '#e8e4d8'];                                               // or, argent
const DIVS = ['perpale', 'fess', 'bend', 'chevron', 'quarterly', 'saltire', 'pale', 'plain'];
const CHARGES = ['lion', 'eagle', 'dragon', 'griffin', 'wolf', 'bear', 'stag', 'raven', 'owl', 'boar', 'phoenix', 'unicorn', 'horse',
  'tower', 'sword', 'swords', 'crown', 'key', 'crescent', 'rose', 'mullet', 'sun', 'flame', 'tree', 'fleur', 'mountain', 'ship', 'axe'];
const NOUN = { tower:'Tower', sword:'Sword', swords:'Blades', crown:'Crown', key:'Key', crescent:'Crescent', rose:'Rose', mullet:'Star',
  lion:'Lion', eagle:'Eagle', dragon:'Dragon', griffin:'Griffin', wolf:'Wolf', bear:'Bear', stag:'Stag', raven:'Raven', owl:'Owl', boar:'Boar',
  phoenix:'Phoenix', unicorn:'Unicorn', horse:'Horse', sun:'Sun', flame:'Flame', tree:'Oak', fleur:'Lily', mountain:'Peak', ship:'Ship', axe:'Axe' };
const ADJ = { '#f3dc92':'Golden', '#d4af5a':'Golden', '#e8e4d8':'Silver' };
let style = 'house', cur = null, n = 0;
const base = () => pick(data.a) + pick(data.b);
function nameFor(st, d) {
  if (st === 'guild') return `The ${base()} Guild`;
  if (st === 'order') {
    if (!d || !NOUN[d.ch]) return `Order of ${base()}`;
    const adj = Math.random() < 0.5 ? (ADJ[d.c] || 'Iron') : pick(['Iron', 'Black', 'Crimson', 'Silent', 'Last', 'Dawn', 'Hollow']);
    return `Order of the ${adj} ${NOUN[d.ch]}`;
  }
  if (st === 'clan') return `Clan ${base()}`;
  return `House ${base()}`;
}
function design() {
  const dm = pick(METALS);
  const d = { motto: pick(data.m), f: pick(COLORS), d: dm, c: dm === '#d4af5a' ? '#e8e4d8' : pick(['#f3dc92', '#d4af5a']), div: pick(DIVS), ch: Math.random() < 0.08 ? 'initial' : pick(CHARGES), bg: 'parch' };
  d.name = nameFor(style, d);
  return d;
}
function show(d) {
  cur = d; n++;
  $('[data-art]').innerHTML = C.svg(d, 'hg' + n, `Sigil of ${d.name}`);
  $('[data-name]').textContent = d.name;
  $('[data-motto]').textContent = `"${d.motto}"`;
  $('[data-open]').href = C.studioUrl(d);
  const alts = [0, 1, 2].map(() => nameFor(style, d)).filter((x, i, a) => x !== d.name && a.indexOf(x) === i);
  const box = $('[data-alts]');
  box.textContent = alts.length ? 'Or try: ' : '';
  alts.forEach(a => { const b = document.createElement('button'); b.type = 'button'; b.textContent = a; b.onclick = () => show({ ...cur, name: a }); box.appendChild(b); });
}
$('[data-gen]').addEventListener('click', () => { show(design()); if (window.clarity) try { window.clarity('event', 'house_generate'); } catch (e) {} });
document.querySelectorAll('[data-style]').forEach(b => b.addEventListener('click', () => {
  style = b.dataset.style;
  document.querySelectorAll('[data-style]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  show(design());
}));
$('[data-open]').addEventListener('click', () => { if (window.clarity) try { window.clarity('event', 'house_open_studio'); } catch (e) {} });
})();
