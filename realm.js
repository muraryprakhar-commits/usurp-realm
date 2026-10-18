/* Usurp: the Realm game layer on top of the Kingdom art (app.js + home.js).
   Prototype. All purchases are simulated. Founding Houses and their members are lore, not real users. */
(() => {
const q = s => document.querySelector(s);
const qa = s => document.querySelectorAll(s);

/* ============ EDIT HERE: game data ============ */
// Bands, top to bottom. names = [masculine, feminine]. floor = lifetime spend to claim a seat.
const BANDS = [
  { id:'king',   names:['King','Queen'],             slots:1,        floor:1,     ins:'king',     c:'#d4af5a', seats:'One seat',
    d:'Sits the throne and rules the Crown Lands. Every other soul in the realm is spending to take it from you.',
    p:['Your name and crest over the whole realm','3 free Decrees a week','Your reign is written into the Chronicle'] },
  { id:'grand',  names:['Grand Duke','Archduchess'], slots:4,        floor:14999, ins:'duke',     c:'#e2bf62', seats:'Four seats',
    d:'Stands at the right hand of the throne. One bad week from the crown, one bad week from ruin.',
    p:['Rules one of the great duchies','First to strike when the crown slips','1 free Decree a week'] },
  { id:'duke',   names:['Duke','Duchess'],           slots:10,       floor:4999,  ins:'duke',     c:'#b3242f', seats:'Ten seats',
    d:'Rules a great region of the map and sits on the High Council.',
    p:['Holds a region and raises its banner','May challenge any Grand Duke','1 free Decree a week'] },
  { id:'marq',   names:['Marquess','Marchioness'],   slots:25,       floor:1499,  ins:'marquess', c:'#8f1426', seats:'Guarded ground',
    d:'Keeper of the marches. Close enough to smell the throne.',
    p:['Command of a march on the map','Crest shown in the Throne Room','May challenge any Duke'] },
  { id:'earl',   names:['Earl','Countess'],          slots:60,       floor:499,   ins:'earl',     c:'#6b3a8a', seats:'Contested',
    d:'Lords of the shires. The most fought over rank in the realm.',
    p:['Named in the Throne Room roll','May raise a House banner','Voice in the Lesser Council'] },
  { id:'visc',   names:['Viscount','Viscountess'],   slots:120,      floor:199,   ins:'viscount', c:'#2f5a8a', seats:'Climbing',
    d:'Deputy to an Earl, with eyes on their seat.',
    p:['Sworn to a House of your choosing','Title shown beside your name','Access to the court chronicle'] },
  { id:'baron',  names:['Baron','Baroness'],         slots:250,      floor:79,    ins:'baron',    c:'#2f6a4a', seats:'The ambitious',
    d:'The first rank of true nobility. Most who reach it want more.',
    p:['Coronet shown beside your name','May petition to join a Great House','Entry to every Court Game'] },
  { id:'knight', names:['Knight','Dame'],            slots:500,      floor:29,    ins:'knight',   c:'#7a6a4a', seats:'The many',
    d:'Sworn swords. You have left the mud, but not by far.',
    p:['Entered into the Rolls of the realm','May ride in the Joust','Can be raised or cast down at any hour'] },
  { id:'free',   names:['Freeman','Freewoman'],      slots:Infinity, floor:9,     ins:'peasant',  c:'#5e5145', seats:'Unlimited',
    d:'Free of the mud, sworn to no lord. A name in the town rolls.',
    p:['Your name on the realm ladder','One step from knighthood','Free Court Games'] },
  { id:'peas',   names:['Peasant','Peasant'],        slots:Infinity, floor:0,     ins:'peasant',  c:'#4a4036', seats:'Everyone, at first',
    d:'Where every soul begins. No title, no crest, no protection.',
    p:['A name, and nothing else','Watch the court from the mud','One purchase away from rising'] },
];
const KNIGHT_IDX = 7;
// Founding Houses' members are fictional lore, never real customers. style: 0 = King/Duke titles, 1 = Queen/Duchess titles.
const LORE = [
  { id:'isolde', name:'Isolde Vire',   house:'vire',   spend:21400, style:1, fig:'Queen Isolde' },
  { id:'aurel',  name:'Aurel Calder',  house:'calder', spend:9800,  style:0, fig:'Aurel Calder' },
  { id:'sera',   name:'Sera Morrow',   house:'morrow', spend:2600,  style:1, fig:'Sera Morrow' },
  { id:'corvin', name:'Corvin Aldane', house:'aldane', spend:1800,  style:0, fig:'Corvin Aldane' },
  { id:'mael',   name:'Mael Raske',    house:'raske',  spend:720,   style:0, fig:'Mael Raske' },
  { id:'wren',   name:'Wren Hollen',   house:'hollen', spend:540,   style:1, fig:'Wren Hollen' },
];
const TRIVIA = [
  { q:'Which is the highest rank of hereditary nobility below the monarch in England?', o:['Duke','Earl','Baron'], a:0 },
  { q:'What is the wife of an Earl called?', o:['Baroness','Countess','Viscountess'], a:1 },
  { q:'What is the wife of a Marquess called?', o:['Marchioness','Duchess','Dame'], a:0 },
];
const KNIGHTS = ['Ser Brandt','Dame Ilse','Ser Hale','Dame Nessa','Ser Odo','Dame Tamsin','Ser Pell'];
const LORE_BANNERMEN = ['Marrow and Sons Forge','The Gilded Quill'];
const TIER_COL = { 'Bannerman':'#2f5a8a', 'Merchant House':'#2f6a4a', 'Noble House':'#7a1020' };
const WAITLIST = 'https://usurp-alpha.vercel.app/';
const CONTACT = 'hello@usurp.games';
// EDIT HERE: Dodo checkout links for the Founding Member Pass.
// LIVE: paste the live link once Dodo verifies the account. Empty = "Checkout opens soon" for the public.
// TEST: Dodo Test Mode link, only used when the page is opened with ?checkout=test (no real money).
const FOUNDER_CHECKOUT_LIVE = '';
const FOUNDER_CHECKOUT_TEST = 'https://test.checkout.dodopayments.com/buy/pdt_0NpzeJkuCRyChxLnZPd3k?quantity=1&redirect_url=https://usurp.games%2Fthanks.html';
const CHECKOUT_TEST_MODE = new URLSearchParams(location.search).get('checkout') === 'test';
const FOUNDER_CHECKOUT_URL = CHECKOUT_TEST_MODE ? FOUNDER_CHECKOUT_TEST : FOUNDER_CHECKOUT_LIVE;
const FOUNDER_PRICE = 29;

/* ============ state ============ */
const KEY = 'usurp-kingdom-v1';
const fresh = () => ({
  name:'Wanderer', style:0, spend:0, house:null,
  lore: LORE.map(l => ({ id:l.id, spend:l.spend })),
  log: (typeof CHRONICLE !== 'undefined' ? CHRONICLE : []).map(([d, t]) => ({ day:d, text:t, t:0 })),
  founderPayments: [],
  decrees: [{ who:'Queen Isolde Vire', house:'vire', lore:true, text:'The throne is held. Come and take it.', scope:'Whole realm', t:Date.now() }],
  weekStart: Date.now(), used:0, extra:0, badges:[], patrons:[], jousts:0,
});
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
if (!S || !Array.isArray(S.lore)) S = fresh();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
// Founding Member payments recorded by /thanks.html on this device. Each counts once.
function applyFounderPayments() {
  let F = null; try { F = JSON.parse(localStorage.getItem('usurp-founder-v1')); } catch (e) {}
  if (!F || !Array.isArray(F.payments)) return false;
  S.founderPayments = S.founderPayments || [];
  let added = false;
  F.payments.forEach(pid => {
    if (S.founderPayments.includes(pid)) return;
    S.founderPayments.push(pid); S.spend += FOUNDER_PRICE; added = true;
    if (!S.badges.includes('Founding Member')) S.badges.push('Founding Member');
    S.log.unshift({ t:Date.now(), text:`${S.name} became a Founding Member.` });
  });
  if (added) save();
  return added;
}

/* ============ helpers ============ */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const usd = n => '$' + Math.round(n).toLocaleString('en-US');
const bname = (i, style = S.style) => BANDS[i].names[style];
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
const loreDef = id => LORE.find(l => l.id === id);
const houseName = id => (H[id] ? H[id].name : '');
let toastT;
function toast(m) { const t = q('[data-toast]'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); }
function addLog(text) { S.log.unshift({ t:Date.now(), text }); S.log = S.log.slice(0, 30); }

function people() {
  const p = S.lore.map(l => { const d = loreDef(l.id); return { id:l.id, name:d.name, house:d.house, spend:l.spend, style:d.style, lore:true, order:0 }; });
  p.push({ id:'you', name:S.name, house:S.house, spend:S.spend, style:S.style, lore:false, order:1 });
  return p.sort((a, b) => b.spend - a.spend || a.order - b.order);
}
// Highest band whose floor you meet and whose seats are not yet taken by people ranked above you.
function ranks() {
  const count = {}, res = {};
  people().forEach(p => {
    for (let i = 0; i < BANDS.length; i++) {
      const b = BANDS[i];
      if (p.spend >= b.floor && (count[b.id] || 0) < b.slots) { count[b.id] = (count[b.id] || 0) + 1; res[p.id] = i; return; }
    }
    res[p.id] = BANDS.length - 1;
  });
  return res;
}
const bandHolders = i => { const r = ranks(); return people().filter(p => r[p.id] === i); };
// Spend needed to enter band i.
function entryPrice(i) {
  const b = BANDS[i];
  if (i === 0) { const top = people().filter(p => p.id !== 'you')[0]; return top ? top.spend + 1 : 1; }
  const h = bandHolders(i).filter(p => p.id !== 'you');
  if (b.slots !== Infinity && h.length >= b.slots) return Math.max(b.floor, h[h.length - 1].spend + 1);
  return b.floor;
}
function change(fn) {
  const before = ranks();
  fn();
  const after = ranks();
  people().forEach(p => {
    if (p.id !== 'you' && after[p.id] > before[p.id]) addLog(`${p.name} fell from ${bname(before[p.id], p.style)} to ${bname(after[p.id], p.style)}.`);
    if (p.id === 'you' && after.you < before.you) {
      addLog(after.you === 0 ? `${S.name} seized the throne.` : `${S.name} rose to ${bname(after.you)}.`);
      toast(after.you === 0 ? 'The crown is yours. Hold it.' : `You are now ${bname(after.you)}.`);
    }
  });
  save(); render();
}
function holder() { const r = ranks(); return people().find(p => r[p.id] === 0); }
function patronCrest(p, cls) {
  const h = { name:p.brand, c:[TIER_COL[p.tier] || '#3a342c', '#d4af5a'], div:'plain', ch:'q' };
  return crest(h, cls).replace('>?</text>', `>${esc((p.brand.trim()[0] || '?').toUpperCase())}</text>`);
}
function youCrest(cls) { return S.house && H[S.house] ? crest(H[S.house], cls) : insignia(BANDS[ranks().you].ins).replace('class="ins"', `class="${cls}"`); }

/* ============ chrome: header nav for this one-page realm ============ */
const NAV = [['#map', 'Map'], ['#throne', 'Throne'], ['#founders', 'Founders'], ['#ranks', 'Ranks'], ['#houses', 'Houses'], ['#decrees', 'Decrees'], ['#games', 'Games'], ['#charter', 'Charter']];
function chromeRealm() {
  const logo = crest(H.crown, 'logo').replace('class="logo"', 'width="30" height="36"');
  q('[data-head]').innerHTML = `<div class="head-in"><span class="torch" aria-hidden="true"></span>
    <a class="brand" href="#map">${logo}<span class="gilt">USURP</span></a>
    <nav class="nav" aria-label="Realm">${NAV.map(([u, t]) => `<a href="${u}">${t}</a>`).join('')}</nav>
    <span class="torch" aria-hidden="true"></span></div>`;
  q('[data-foot]').innerHTML = `<a class="brand" href="#map">${logo}<span class="gilt">USURP</span></a>
    <p>Prototype. Ladder purchases are simulated. The Founding Member Pass is the only real purchase.</p>
    <p>Every House, ruler, name and event shown is illustrative lore, not a real user.</p>
    <p>Numbers are a starting proposal, not final.</p>
    <p style="margin-top:10px"><a href="${WAITLIST}">Join the waitlist</a> · <a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refunds</a> · <a href="mailto:${CONTACT}">${CONTACT}</a></p>
    <p>Operated by Prakhar Murary, Jaipur, Rajasthan, India.</p>`;
  const links = [...qa('.nav a')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    NAV.forEach(([u]) => { const el = q(u); if (el) io.observe(el); });
  }
}

/* ============ renders ============ */
function syncLore() {
  // Keep the map's info panels and the House cards in step with the live ladder.
  const r = ranks(), ps = people(), hold = holder();
  Object.values(H).forEach(h => { if (!h._orig) h._orig = { lord:h.lord, rank:h.rank }; });
  ['vire', 'calder', 'morrow', 'aldane', 'raske', 'hollen'].forEach(id => {
    const top = ps.filter(p => p.lore && p.house === id)[0];
    if (top) { H[id].lord = top.name; H[id].rank = bname(r[top.id], top.style); }
  });
  H.crown.lord = hold.id === 'you' ? `${bname(0)} ${S.name} (you)` : `${bname(0, hold.style)} ${hold.name}`;
}
function renderMe() {
  const r = ranks(), mine = r.you, ps = people(), pos = ps.findIndex(p => p.id === 'you') + 1;
  const sworn = S.house && H[S.house] ? `<span class="badge house-b">Sworn to ${esc(houseName(S.house))}</span>` : '';
  q('[data-me]').innerHTML =
    `<div class="rl-card rank-card"><div class="rl-ins">${insignia(BANDS[mine].ins)}</div><div><span class="k">${esc(S.name)}, your rank</span><b class="gilt">${esc(bname(mine))}</b>
      <div class="badges">${sworn}${S.badges.map(b => `<span class="badge">${esc(b)}</span>`).join('')}</div></div></div>` +
    `<div class="rl-card"><span class="k">Court Standing (lifetime spend)</span><b>${usd(S.spend)}</b></div>` +
    `<div class="rl-card"><span class="k">Position in the realm</span><b>${pos} of ${ps.length}</b></div>`;
}
function renderThrone() {
  const r = ranks(), mine = r.you, ps = people(), pos = ps.findIndex(p => p.id === 'you') + 1, hold = holder();
  const art = q('[data-throne-art]'); if (!art.firstChild) art.innerHTML = throneArt();
  q('[data-holder]').textContent = hold.id === 'you' ? `${bname(0)} ${S.name}` : `${bname(0, hold.style)} ${hold.name}`;
  q('[data-holder-sub]').textContent = hold.id === 'you'
    ? 'That is you. Your reign lasts exactly as long as nobody spends more.'
    : `of ${houseName(hold.house)}, with ${usd(hold.spend)} in lifetime tribute. Out-spend that by a single dollar and the crown is yours.`;
  const next = mine > 0 ? mine - 1 : null, need = next !== null ? Math.max(0, entryPrice(next) - S.spend) : 0;
  const bn = q('[data-act="next"]');
  if (next === null) { bn.textContent = 'You hold the throne'; bn.disabled = true; }
  else { bn.disabled = false; bn.textContent = `Rise to ${bname(next)} for ${usd(need)}`; }
  const above = pos > 1 ? ps[pos - 2] : null, bu = q('[data-act="usurp"]');
  if (!above) { bu.textContent = 'Nobody is above you'; bu.disabled = true; }
  else { bu.disabled = false; bu.textContent = `Usurp ${above.name} for ${usd(above.spend - S.spend + 1)}`; }
  q('[data-board]').innerHTML = ps.map((p, i) => {
    const cr = p.id === 'you' ? youCrest('mini') : crest(H[p.house], 'mini');
    return `<tr class="${p.id === 'you' ? 'you' : ''}"><td>${i + 1}</td><td><span class="who-cell">${cr}<span>${esc(p.name)}${p.lore ? `<span class="tag">lore</span>` : `<span class="tag you-tag">you</span>`}<small>${p.house ? esc(houseName(p.house)) : 'Sworn to no House'}</small></span></span></td><td>${esc(bname(r[p.id], p.style))}</td><td class="num">${usd(p.spend)}</td></tr>`;
  }).join('');
  q('[data-chron-live]').innerHTML = S.log.map(e => `<li><time>${e.day ? esc(e.day) : ago(e.t)}</time><span>${esc(e.text)}</span></li>`).join('');
}
function renderLadder() {
  const mine = ranks().you;
  q('[data-ladder]').innerHTML = BANDS.map((b, i) => {
    const h = bandHolders(i), full = b.slots !== Infinity && h.length >= b.slots;
    const pct = b.slots === Infinity ? 0 : Math.round(h.length / b.slots * 100);
    const price = i === 0 ? 'Out-spend the holder' : (b.floor === 0 ? 'Free' : usd(b.floor));
    const seats = b.slots === Infinity ? 'Unlimited seats' : `${h.length} of ${b.slots} seats${full ? ' (full)' : ''}`;
    const needTxt = i === mine ? '<span class="here-chip">You are here</span>' : (i > mine ? '' : `<span class="need-chip">You need ${usd(Math.max(0, entryPrice(i) - S.spend))}</span>`);
    return `<article class="rank${i === 0 ? ' crown' : ''}${i === mine ? ' here' : ''}" style="--c:${b.c}">
      ${insignia(b.ins)}<div><h3>${esc(bname(i))}<small>${esc(b.seats)}</small></h3><p>${esc(b.d)}</p>
      <ul>${b.p.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="rank-meta"><span>Entry: <b>${price}</b></span><span>${seats}</span>${needTxt}</div>
      ${b.slots === Infinity ? '' : `<div class="fillbar"><i style="width:${pct}%"></i></div>`}</div></article>`;
  }).join('');
  q('[data-name]').value = S.name; q('[data-style]').value = String(S.style);
}
function renderHouses() {
  q('[data-houses-live]').innerHTML = HOUSES.map(h => {
    const swornHere = S.house === h.id, canSwear = !h.royal && !h.vacant;
    return `<article class="house frame${h.vacant ? ' vacant' : ''}${swornHere ? ' sworn' : ''}">
      ${crest(h)}
      ${h.royal ? '<span class="tag blood">Royal</span>' : h.vacant ? '<span class="tag">For a patron</span>' : '<span class="tag">Lore House</span>'}
      <h3>${esc(h.name)}</h3><p class="motto">“${esc(h.motto)}”</p>
      <dl><dt>Seat</dt><dd>${esc(h.seat)}</dd><dt>Lands</dt><dd>${esc(h.region)}</dd><dt>Head</dt><dd>${esc(h.lord)}${h.vacant || h.royal ? '' : `, ${esc(h.rank)}`}</dd></dl>
      ${canSwear ? `<button class="btn ${swornHere ? '' : 'ghost'} sm" data-swear="${h.id}">${swornHere ? 'Sworn ✓' : 'Swear fealty'}</button>` : ''}
      ${h.vacant ? '<a class="btn ghost sm" href="#spons">Sponsor this land</a>' : ''}
    </article>`;
  }).join('');
  q('[data-notice]').innerHTML =
    LORE_BANNERMEN.map(n => `<li><span class="nb-mark">⚜</span><span>${esc(n)}</span><span class="tag">lore</span></li>`).join('') +
    S.patrons.map(p => `<li>${patronCrest(p, 'mini')}<span>${esc(p.brand)}</span><span class="tag">${esc(p.tier)}, simulated</span></li>`).join('');
}
const allowance = mine => mine === 0 ? 3 : (mine <= 2 ? 1 : 0);
function renderDecrees() {
  const mine = ranks().you;
  if (Date.now() - S.weekStart > 7 * 864e5) { S.weekStart = Date.now(); S.used = 0; }
  const free = Math.max(0, allowance(mine) - S.used);
  q('[data-dallow]').textContent = `Free this week: ${free} of ${allowance(mine)}. Extra Decrees owned: ${S.extra}.`;
  const sel = q('[data-dscope]'), keep = sel.value;
  sel.innerHTML = '<option>Whole realm</option>' + BANDS.slice(0, KNIGHT_IDX + 1).map((b, i) => `<option>${esc(bname(i))} and above</option>`).join('');
  if (keep) sel.value = keep;
  q('[data-decrees]').innerHTML = S.decrees.map(d => `<li class="decree">${d.house && H[d.house] ? crest(H[d.house], 'mini') : '<span class="seal sm-seal"></span>'}
    <div><div class="d-head"><b>${esc(d.who)}</b>${d.lore ? '<span class="tag">lore</span>' : ''}<span class="tag">to ${esc(d.scope)}</span><time>${ago(d.t)}</time></div><p>${esc(d.text)}</p></div></li>`).join('');
}
function renderJoust() {
  const mine = ranks().you, el = q('[data-joust]');
  if (mine > KNIGHT_IDX) {
    el.innerHTML = `<div class="lock">Locked. Reach ${esc(bname(KNIGHT_IDX))} to enter. You need ${usd(Math.max(0, entryPrice(KNIGHT_IDX) - S.spend))} more.</div>`;
    return;
  }
  if (!q('[data-g="joust"]')) {
    el.innerHTML = `<button class="btn" data-g="joust">Enter the Joust, free</button><div class="res" data-r="joust"></div><p class="muted-s" data-jcount></p>`;
    q('[data-g="joust"]').onclick = joust;
  }
  q('[data-jcount]').textContent = `Tournaments entered: ${S.jousts}`;
}
function relabelCourt() {
  const stage = q('[data-court-stage]'); if (!stage || !stage.querySelector('.fig')) return;
  const r = ranks(), ps = people(), hold = holder();
  const setFig = (el, n, role) => { el.dataset.n = n; el.dataset.r = role; const t = el.querySelector('title'); if (t) t.textContent = `${n}. ${role}`; };
  stage.querySelectorAll('.fig').forEach(el => {
    if (!el.dataset.orig) el.dataset.orig = el.dataset.n + '|' + el.dataset.r;
    const [on, or] = el.dataset.orig.split('|');
    const lore = LORE.find(l => l.fig === on);
    el.classList.remove('you-fig');
    if (on === 'Queen Isolde') {
      if (hold.id === 'you') { setFig(el, `${bname(0)} ${S.name} (you)`, 'Holds the throne until someone outspends you'); el.classList.add('you-fig'); }
      else setFig(el, `${bname(0, hold.style)} ${hold.name}`, `${houseName(hold.house)}. Holds the throne with ${usd(hold.spend)} until someone outspends them`);
    } else if (lore) {
      const p = ps.find(x => x.id === lore.id);
      setFig(el, lore.name, `${bname(r[p.id], p.style)}, ${houseName(p.house)}. ${usd(p.spend)} lifetime tribute`);
    } else if (on === 'Joss') {
      if (hold.id === 'you') setFig(el, on, or);
      else { setFig(el, `${S.name} (you)`, `${bname(r.you)}. ${usd(S.spend)} lifetime. Spend to climb the steps`); el.classList.add('you-fig'); }
    }
  });
  const t = q('[data-court-title]');
  if (t) t.textContent = hold.id === 'you' ? `Your Court, ${bname(0)} ${S.name}` : `The Court of ${bname(0, hold.style)} ${hold.name.split(' ')[0]}`;
}
function render() {
  syncLore(); renderMe(); renderThrone(); renderLadder(); renderHouses(); renderDecrees(); renderJoust(); relabelCourt();
}

/* ============ actions ============ */
function joust() {
  S.jousts++;
  const names = ['Quarterfinal', 'Semifinal', 'Final'], out = [], foes = KNIGHTS.slice().sort(() => Math.random() - .5);
  let alive = true;
  for (let i = 0; i < 3 && alive; i++) { alive = Math.random() < .5; out.push(`${names[i]} vs ${foes[i]}: ${alive ? '<span class="ok">victory</span>' : '<span class="no">unhorsed</span>'}`); }
  if (alive) { out.push('<b class="ok">Champion of the Joust.</b>'); badge('Champion of the Joust'); addLog(`${S.name} won the Joust.`); }
  save(); render();
  q('[data-r="joust"]').innerHTML = out.join('<br>');
}
function badge(b) { if (!S.badges.includes(b)) { S.badges.push(b); toast('Badge earned: ' + b); } }
function swear(id) {
  if (!H[id] || H[id].royal || H[id].vacant) return;
  if (S.house === id) { toast(`You are already sworn to ${houseName(id)}.`); return; }
  S.house = id; addLog(`${S.name} swore fealty to ${houseName(id)}.`); save(); render();
  toast(`You are sworn to ${houseName(id)}. Their crest now flies beside your name.`);
}
function goTo(sel) { const el = q(sel); if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }

function wire() {
  q('[data-act="next"]').onclick = () => { const m = ranks().you; if (m === 0) return; const n = Math.max(0, entryPrice(m - 1) - S.spend); if (n > 0) change(() => { S.spend += n; }); };
  q('[data-act="usurp"]').onclick = () => { const ps = people(), pos = ps.findIndex(p => p.id === 'you'); if (pos === 0) return; const n = ps[pos - 1].spend - S.spend + 1; change(() => { S.spend += n; }); };
  q('[data-act="rival"]').onclick = () => {
    const l = S.lore[Math.floor(Math.random() * S.lore.length)], add = 200 + Math.floor(Math.random() * 3800), nm = loreDef(l.id).name;
    change(() => { l.spend += add; addLog(`${nm} spent ${usd(add)} (simulated rival).`); });
  };
  q('[data-spend]').onsubmit = e => { e.preventDefault(); const inp = q('[data-amt]'), n = Math.floor(+inp.value); if (!(n > 0)) { toast('Enter an amount above 0.'); return; } inp.value = ''; change(() => { S.spend += n; }); };
  q('[data-name]').onchange = e => { S.name = (e.target.value.trim() || 'Wanderer').slice(0, 24); save(); render(); };
  q('[data-style]').onchange = e => { S.style = +e.target.value; save(); render(); };
  q('[data-reset]').onclick = () => { if (confirm('Reset the whole prototype?')) { S = fresh(); save(); render(); toast('Realm reset.'); goTo('#map'); } };

  q('[data-spons]').id = 'spons';
  q('[data-spons]').onsubmit = e => {
    e.preventDefault();
    const b = q('[data-brand]').value.trim(); if (!b) { toast('Enter a brand name first.'); return; }
    const tier = q('[data-tier]').value;
    S.patrons.push({ brand:b, tier }); q('[data-brand]').value = ''; addLog(`${b} raised a ${tier} banner (simulated sponsorship).`);
    save(); render(); toast(`${b} now appears on the notice board (simulated).`);
  };

  q('[data-dbuy]').onclick = () => { S.extra++; save(); render(); toast('Extra Decree added for $2 (simulated).'); };
  q('[data-decree]').onsubmit = e => {
    e.preventDefault();
    const txt = q('[data-dtext]').value.trim(), m = q('[data-dmsg]'), mine = ranks().you;
    if (!txt) { m.textContent = 'Write a message first.'; return; }
    const free = Math.max(0, allowance(mine) - S.used);
    if (free > 0) S.used++; else if (S.extra > 0) S.extra--;
    else { m.textContent = 'No Decrees left. Buy an extra one for $2.'; return; }
    S.decrees.unshift({ who:`${bname(mine)} ${S.name}`, house:S.house, text:txt, scope:q('[data-dscope]').value, t:Date.now() });
    S.decrees = S.decrees.slice(0, 20); q('[data-dtext]').value = ''; m.textContent = ''; save(); render(); toast('Your Decree was sent to the realm.');
  };

  q('[data-g="dice"]').onclick = () => {
    let me = 0, st = 0; const out = [], d = () => 1 + Math.floor(Math.random() * 6);
    for (let i = 1; i <= 3; i++) { const a = d() + d(), b = d() + d(); out.push(`Round ${i}: you ${a}, Steward ${b}`); if (a > b) me++; else if (b > a) st++; }
    const won = me > st;
    q('[data-r="dice"]').innerHTML = out.join('<br>') + `<br><b class="${won ? 'ok' : 'no'}">${won ? 'You win the match.' : 'The Steward wins.'}</b>`;
    if (won) { badge('Dice Hand'); save(); render(); }
  };
  q('[data-trivia]').innerHTML = TRIVIA.map((t, i) => `<label class="fld"><span>${esc(t.q)}</span><select data-qn="${i}">${t.o.map((o, j) => `<option value="${j}">${esc(o)}</option>`).join('')}</select></label>`).join('');
  q('[data-g="trivia"]').onclick = () => {
    let s = 0; qa('[data-qn]').forEach(el => { if (+el.value === TRIVIA[+el.dataset.qn].a) s++; });
    const ok = s === TRIVIA.length;
    q('[data-r="trivia"]').innerHTML = `<b class="${ok ? 'ok' : 'no'}">${s} of ${TRIVIA.length} correct.${ok ? ' Scholar of the Court earned.' : ' Try again.'}</b>`;
    if (ok) { badge('Scholar of the Court'); save(); render(); }
  };
  q('[data-ico="dice"]').innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="#4a3310" stroke-width="2"><rect x="10" y="30" width="44" height="44" rx="7" fill="#efe3c6" transform="rotate(-12 32 52)"/><rect x="48" y="22" width="40" height="40" rx="7" fill="#e2bf62" transform="rotate(14 68 42)"/></g><g fill="#7a1020"><circle cx="22" cy="44" r="4"/><circle cx="32" cy="53" r="4"/><circle cx="41" cy="61" r="4"/><circle cx="62" cy="34" r="3.6"/><circle cx="74" cy="50" r="3.6"/></g></svg>`;
  q('[data-ico="trivia"]').innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="22" y="22" width="56" height="58" fill="#e9d9b4" stroke="#6e4f25" stroke-width="2"/><rect x="16" y="16" width="68" height="10" rx="5" fill="#8a6a3a"/><rect x="16" y="76" width="68" height="10" rx="5" fill="#8a6a3a"/><g stroke="#7a5a3a" stroke-width="2"><path d="M30 38h40M30 48h34M30 58h38"/></g><text x="50" y="72" text-anchor="middle" font-family="Cinzel Decorative,serif" font-weight="900" font-size="16" fill="#7a1020">?</text></svg>`;
  q('[data-ico="joust"]').innerHTML = insignia('knight');

  // Founding Member Pass: the one real purchase. Hosted checkout, nothing random.
  const fc = q('[data-founder-crest]');
  if (fc) fc.innerHTML = crest({ name:'Founding Member', c:['#5a0b16', '#d4af5a'], div:'chevron', ch:'crown' });
  const fp = q('[data-founder-price]'); if (fp) fp.textContent = usd(FOUNDER_PRICE);
  const fb = q('[data-founder-buy]');
  if (fb && FOUNDER_CHECKOUT_URL) {
    fb.href = FOUNDER_CHECKOUT_URL; fb.textContent = `Become a Founding Member, ${usd(FOUNDER_PRICE)}`;
    fb.removeAttribute('aria-disabled'); fb.rel = 'noopener';
    if (CHECKOUT_TEST_MODE) {
      fb.textContent += ' (test)';
      const note = document.createElement('p'); note.className = 'muted-s founder-fine';
      note.textContent = 'Test mode: Dodo test checkout, no real money. Use Dodo’s test card from their docs.';
      fb.closest('.actions').after(note);
    }
  } else if (fb) {
    fb.addEventListener('click', e => { e.preventDefault(); toast('Checkout opens soon. Join the waitlist in the footer to hear first.'); });
  }

  // Links that came from the Kingdom art (map info panel) route inside this page instead.
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('/join')) { e.preventDefault(); const id = new URLSearchParams(href.split('?')[1] || '').get('house'); if (id) swear(id); else goTo('#throne'); }
    else if (href === '/houses') { e.preventDefault(); goTo('#houses'); }
    else if (a.matches('[data-court-claim]')) { e.preventDefault(); q('[data-court-back]').click(); setTimeout(() => goTo('#throne'), 450); }
  });
  q('[data-houses-live]').addEventListener('click', e => { const b = e.target.closest('[data-swear]'); if (b) swear(b.dataset.swear); });
  const stage = q('[data-court-stage]');
  if (stage && 'MutationObserver' in window) new MutationObserver(() => relabelCourt()).observe(stage, { childList: true });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof H === 'undefined') return;
  const founded = applyFounderPayments();
  chromeRealm(); wire(); render();
  if (founded) toast('Welcome, Founder. Your badge and standing are updated.');
  const bar = q('.proto-bar');
  const setPB = () => document.documentElement.style.setProperty('--pbh', (bar ? bar.offsetHeight : 0) + 'px');
  setPB(); addEventListener('resize', setPB);
  // New content rendered above needs the reveal treatment too.
  if (typeof reveals === 'function') reveals();
});
})();
