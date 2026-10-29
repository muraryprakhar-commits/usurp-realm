/* The Usurper: a medieval social deduction game for 4 to 10 players.
   Loyal knights secure the keep with tasks, some of which need several knights heaving together (their strength adds
   up). One or two hidden Usurpers strike knights down, sabotage the keep and fake their share of the heaving.
   Any knight can raise the alarm or ring the council bell; the council talks and votes to banish one suspect.

   Networking: one player's browser hosts the match (the whole simulation and the bots run there) and the others
   connect to it peer to peer with WebRTC, using the free PeerJS broker only to find each other. No game server.
   Solo play ("Play now") runs the same host code with bots and no network at all.
   Public matches allow only the preset quick-chat lines; free text is for private rooms of friends. */
(function () {
'use strict';
const { clamp, lerp } = UG;
const W = 540, H = 720, T = 48, COLS = 36, ROWS = 33, WW = COLS * T, WH = ROWS * T;
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const PREFIX = 'usurpgames-v1-';
const PUB_SLOTS = 6;

/* ================= the keep: rooms, corridors, stations ================= */
const ROOMS = [
  { id: 'chapel', name: 'Chapel', x: 1, y: 1, w: 9, h: 8, fl: ['#37323f', '#403a4a'], pat: 'check' },
  { id: 'treasury', name: 'Treasury', x: 13, y: 1, w: 10, h: 8, fl: ['#4a3f2c', '#544831'], pat: 'marble' },
  { id: 'tower', name: 'Bell Tower', x: 26, y: 1, w: 9, h: 8, fl: ['#3c3a36', '#46433e'], pat: 'round' },
  { id: 'armory', name: 'Armory', x: 1, y: 12, w: 9, h: 9, fl: ['#4b3424', '#573d2a'], pat: 'plank' },
  { id: 'hall', name: 'Great Hall', x: 13, y: 12, w: 10, h: 9, fl: ['#3f3830', '#4a423a'], pat: 'flag' },
  { id: 'kitchens', name: 'Kitchens', x: 26, y: 12, w: 9, h: 9, fl: ['#5a4a38', '#655343'], pat: 'tile' },
  { id: 'well', name: 'Courtyard Well', x: 1, y: 24, w: 9, h: 8, fl: ['#3a4630', '#435036'], pat: 'yard' },
  { id: 'gate', name: 'Gatehouse', x: 13, y: 24, w: 10, h: 8, fl: ['#45413b', '#4f4a44'], pat: 'cobble' },
  { id: 'stables', name: 'Stables', x: 26, y: 24, w: 9, h: 8, fl: ['#5b4a2c', '#665334'], pat: 'straw' },
];
const CORR = [[10, 4, 3, 2], [23, 4, 3, 2], [10, 15, 3, 2], [23, 15, 3, 2], [10, 27, 3, 2], [23, 27, 3, 2],
  [4, 9, 2, 3], [17, 9, 2, 3], [29, 9, 2, 3], [4, 21, 2, 3], [17, 21, 2, 3], [29, 21, 2, 3]];
const TABLE = { x: 15, y: 16, w: 6, h: 2 };   // the council table in the Great Hall: solid, but you can see over it
const grid = new Uint8Array(COLS * ROWS), roomOf = new Int8Array(COLS * ROWS).fill(-1);
ROOMS.forEach((r, i) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { grid[y * COLS + x] = 1; roomOf[y * COLS + x] = i; } });
CORR.forEach(([x0, y0, w, h]) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) grid[y * COLS + x] = 1; });
for (let y = TABLE.y; y < TABLE.y + TABLE.h; y++) for (let x = TABLE.x; x < TABLE.x + TABLE.w; x++) grid[y * COLS + x] = 2;
const tileAt = (px, py) => { const tx = Math.floor(px / T), ty = Math.floor(py / T); return tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS ? 0 : grid[ty * COLS + tx]; };
const walk = (px, py) => tileAt(px, py) === 1;
const roomAt = (px, py) => { const tx = Math.floor(px / T), ty = Math.floor(py / T); if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return null; const i = roomOf[ty * COLS + tx]; return i >= 0 ? ROOMS[i] : null; };
const roomName = (px, py) => { const r = roomAt(px, py); return r ? r.name : 'the corridors'; };
const R = 13;   // a knight's collision radius
const free = (x, y) => walk(x - R, y - R) && walk(x + R, y - R) && walk(x - R, y + R) && walk(x + R, y + R);
// line of sight: walls block it, the table does not
function los(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 14);
  for (let i = 1; i < n; i++) { if (tileAt(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) === 0) return false; }
  return true;
}
// shortest tile path (breadth first; the keep is only 36 x 33 tiles)
function path(x0, y0, x1, y1) {
  const s = Math.floor(y0 / T) * COLS + Math.floor(x0 / T), g = Math.floor(y1 / T) * COLS + Math.floor(x1 / T);
  if (grid[s] !== 1 || grid[g] !== 1) return null;
  const prev = new Int16Array(COLS * ROWS).fill(-1); prev[s] = s;
  const q = [s];
  for (let qi = 0; qi < q.length; qi++) {
    const c = q[qi]; if (c === g) break;
    const cx = c % COLS, cy = (c / COLS) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const n = ny * COLS + nx; if (grid[n] !== 1 || prev[n] >= 0) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (prev[g] < 0) return null;
  const out = []; for (let c = g; c !== s; c = prev[c]) out.push([(c % COLS + 0.5) * T, (((c / COLS) | 0) + 0.5) * T]);
  out.reverse(); if (out.length) out[out.length - 1] = [x1, y1]; else out.push([x1, y1]);
  return out;
}
const ST = [
  { id: 'candles', k: 'solo', tx: 5, ty: 2, name: 'Light the candles', dur: 3 },
  { id: 'coin', k: 'solo', tx: 17.5, ty: 2.5, name: 'Count the coin', dur: 4 },
  { id: 'beacon', k: 'solo', tx: 29.5, ty: 2.5, name: 'Feed the beacon', dur: 3 },
  { id: 'swords', k: 'solo', tx: 2.5, ty: 13.5, name: 'Sharpen the swords', dur: 3 },
  { id: 'banners', k: 'solo', tx: 14, ty: 13.5, name: 'Mend the banners', dur: 3 },
  { id: 'ovens', k: 'solo', tx: 33, ty: 13.5, name: 'Stoke the ovens', dur: 3 },
  { id: 'water', k: 'solo', tx: 5, ty: 27.5, name: 'Draw water', dur: 3 },
  { id: 'hinges', k: 'solo', tx: 14.5, ty: 25.5, name: 'Oil the hinges', dur: 2.5 },
  { id: 'horses', k: 'solo', tx: 32.5, ty: 25.5, name: 'Feed the horses', dur: 3 },
  { id: 'portcullis', k: 'heavy', tx: 18, ty: 30.6, name: 'Raise the portcullis', need: 7, dur: 4 },
  { id: 'bellh', k: 'heavy', tx: 31.5, ty: 6.5, name: 'Hoist the great bell', need: 6, dur: 4 },
  { id: 'cart', k: 'heavy', tx: 29, ty: 30, name: 'Lift the fallen cart', need: 6, dur: 4 },
  { id: 'pell', k: 'train', tx: 7, ty: 18, name: 'Train at the pell (+1 strength)', dur: 4 },
  { id: 'bell', k: 'bell', tx: 18, ty: 13, name: 'Ring the council bell' },
  { id: 'brazier', k: 'brazier', tx: 21.5, ty: 19.5, name: 'Relight the torches', dur: 2 },
  { id: 'postern', k: 'postern', tx: 21.5, ty: 29.6, name: 'Hold the postern shut', need: 5, dur: 3 },
  { id: 'f1', k: 'flag', tx: 2.5, ty: 7.5, to: 'f2' }, { id: 'f2', k: 'flag', tx: 33.5, ty: 30.5, to: 'f1' },
  { id: 'f3', k: 'flag', tx: 27.5, ty: 7.5, to: 'f4' }, { id: 'f4', k: 'flag', tx: 2.5, ty: 30.5, to: 'f3' },
  { id: 'f5', k: 'flag', tx: 2.5, ty: 19.5, to: 'f6' }, { id: 'f6', k: 'flag', tx: 33.5, ty: 19.5, to: 'f5' },
];
ST.forEach((s, i) => { s.i = i; s.x = s.tx * T; s.y = s.ty * T; s.room = roomName(s.x, s.y); });
const SID = Object.fromEntries(ST.map(s => [s.id, s]));
const SOLO = ST.filter(s => s.k === 'solo'), HEAVY = ST.filter(s => s.k === 'heavy');
const SEATS = [744, 800, 856, 912, 968].map(x => [x, 730]).concat([744, 800, 856, 912, 968].map(x => [x, 902]));
const PAL = [['Crimson', '#c8382c'], ['Azure', '#2f6fd0'], ['Verdant', '#2e9e57'], ['Gold', '#d8a72c'], ['Violet', '#8e4fc1'],
  ['Ivory', '#e7e0cf'], ['Sable', '#4a4541'], ['Amber', '#e07b28'], ['Teal', '#1f9c9a'], ['Rose', '#d4608f']];
const RANKS = [[0, 'Peasant'], [100, 'Squire'], [300, 'Knight'], [700, 'Baron'], [1500, 'Earl'], [3000, 'Duke'], [6000, 'Prince'], [10000, 'Sovereign']];
const rankOf = xp => { let r = RANKS[0][1]; for (const [n, t] of RANKS) if (xp >= n) r = t; return r; };
const CFG = { speed: 190, ghost: 215, vis: 235, visDark: 105, visU: 300, kill: 80, kcd: 30, kcd0: 16, report: 110, use: 62, sab0: 22, sabcd: 32, torch: 40, gate: 45, council: 75, result: 6 };

/* ================= small shared helpers ================= */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const now = () => performance.now() / 1000;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const BAD = /\b(fuck|shit|cunt|nigg|fag|bitch|slut|whore|rape|nazi|hitler|dick|cock|pussy|retard|kys)/i;
function cleanName(s) {
  s = String(s || '').replace(/[^A-Za-z0-9 '\-.]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return !s || BAD.test(s.replace(/[^a-z]/gi, '')) ? '' : s;
}
function cleanText(s) { s = String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 90); return BAD.test(s) ? '' : s; }
const QUICK = {
  loc: (a) => `I was in the ${a}.`, saw: (a) => `I saw ${a} near the body.`, strike: (a) => `I saw ${a} strike a knight down!`,
  fake: (a) => `${a} faked the heave. The strength did not add up.`, safe: (a) => `${a} was with me. I trust them.`,
  str: (a) => `My strength is ${a}.`, sus: (a) => `I suspect ${a}.`, vote: (a) => `I'm voting for ${a}.`,
  skip: () => "I don't know yet. Let's skip.", self: () => "It wasn't me, I swear on my house.", ok: () => 'Agreed.',
  where: (a) => `${a}, where were you?`,
};
const ROOM_NAMES = ROOMS.map(r => r.name);

/* ================= profile: rank and stats, kept on this device (and in the cloud when signed in) ================= */
const PROF_KEY = 'us-prof';
const prof = () => Object.assign({ xp: 0, g: 0, w: 0, uw: 0, ban: 0, tasks: 0 }, UG.store.get(PROF_KEY, {}));
function addProf(d) { const p = prof(); for (const k in d) p[k] = (p[k] || 0) + d[k]; UG.store.set(PROF_KEY, p); try { window.dispatchEvent(new CustomEvent('usurp-progress', { detail: { game: 'usurper', prof: p } })); } catch (e) {} return p; }
function myName() {
  const n = cleanName(UG.store.get('us-name', ''));
  if (n) return n;
  const k = UG.randomKnight(); const s = k.name.split(' of ')[0];
  UG.store.set('us-name', s); return s;
}

/* ================= transport: loopback (solo) or PeerJS (online) ================= */
let peerLib = null;
function loadPeer() {
  if (window.Peer) return Promise.resolve(window.Peer);
  if (peerLib) return peerLib;
  peerLib = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = (window.USURP_BASE || '/') + 'games/vendor/peerjs.min.js'; s.async = true;
    s.onload = () => res(window.Peer); s.onerror = () => { peerLib = null; rej(new Error('peer-load')); };
    document.head.appendChild(s);
  });
  return peerLib;
}
// Open a Peer with a given id (null = random). Resolves with the peer, or rejects with the PeerJS error type.
function openPeer(id) {
  return loadPeer().then(Peer => new Promise((res, rej) => {
    const p = id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
    let done = false;
    const t = setTimeout(() => { if (!done) { done = true; try { p.destroy(); } catch (e) {} rej('timeout'); } }, 12000);
    p.on('open', () => { if (done) return; done = true; clearTimeout(t); res(p); });
    p.on('error', e => { if (done) return; done = true; clearTimeout(t); try { p.destroy(); } catch (er) {} rej(e && e.type || 'error'); });
  }));
}

/* ================= HOST: the authoritative match (runs in one browser) ================= */
let HS = null;          // host state, only on the hosting browser
function newHost(opts) {
  HS = { ph: 'lobby', P: [], code: opts.code || '', pub: !!opts.pub, solo: !!opts.solo, fill: opts.fill || 7, cd: opts.pub ? 45 : 0,
    peer: opts.peer || null, bodies: [], heavy: {}, sab: null, sabcd: 0, tm: 0, chat: [], votes: {}, council: null,
    snapT: 0, lobbyT: 0, t: 0, nextId: 1, sayQ: [], over: null };
  if (HS.peer) {
    HS.peer.on('connection', conn => hostConn(conn));
    HS.peer.on('disconnected', () => { try { HS && HS.peer && HS.peer.reconnect(); } catch (e) {} });
  }
  return HS;
}
function hostConn(conn) {
  let id = null;
  conn.on('data', m => {
    if (!HS || !m || typeof m !== 'object') return;
    if (id) { const p = HS.P.find(q => q.id === id); if (p) p.seenAt = now(); }
    if (m.t === 'hi') {
      if (HS.ph !== 'lobby') { conn.send({ t: 'busy' }); setTimeout(() => conn.close(), 300); return; }
      const humans = HS.P.filter(p => !p.bot).length;
      if (humans >= 10) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); return; }
      id = 'p' + HS.nextId++;
      hostAdd({ id, name: m.name, design: m.d, xp: m.xp, conn });
      conn.send({ t: 'you', id });
      if (HS.pub && HS.cd > 15) HS.cd = Math.max(15, HS.cd - 10);
      hostLobby();
      return;
    }
    if (id) hostInput(id, m);
  });
  conn.on('close', () => { if (id) hostLeave(id); });
  conn.on('error', () => { if (id) hostLeave(id); });
}
function hostAdd({ id, name, design, xp, conn, bot }) {
  const used = new Set(HS.P.map(p => p.col));
  const col = PAL.findIndex((_, i) => !used.has(i));
  let nm = cleanName(name) || 'Knight';
  const names = new Set(HS.P.map(p => p.name)); let base = nm, n = 2; while (names.has(nm)) nm = `${base} ${n++}`;
  const d = design && typeof design === 'object' && design.f ? { f: String(design.f).slice(0, 9), d: String(design.d || '').slice(0, 9), c: String(design.c || '').slice(0, 9), div: String(design.div || 'plain').slice(0, 14), ch: String(design.ch || 'none').slice(0, 14), name: '', motto: '', bg: 'clear' } : null;
  const p = { seenAt: now(), id, name: nm, design: d, xp: +xp || 0, conn, bot: !!bot, col: col < 0 ? 0 : col, x: SEATS[0][0], y: SEATS[0][1], f: 1, mv: 0, use: 0, alive: true, role: 'loyal', str: 2, tr: false, tasks: [], bell: false, cd: 0, tp: 0, left: false };
  HS.P.push(p); return p;
}
function hostLeave(id) {
  const p = HS && HS.P.find(q => q.id === id); if (!p) return;
  if (HS.ph === 'lobby' || HS.ph === 'end') { HS.P = HS.P.filter(q => q.id !== id); hostLobby(); return; }
  // mid-match: a bot takes over the seat so the match can go on
  p.conn = null; p.bot = true; p.left = true; botInit(p);
  hostSay(null, `${p.name} left the keep. A squire takes their place.`);
}
function send(p, m) {
  if (p.id === 'h') return localRecv(m);
  if (p.conn && p.conn.open) { try { p.conn.send(m); } catch (e) {} }
}
const toAll = m => HS.P.forEach(p => { if (!p.bot) send(p, m); });
function hostLobby() {
  toAll({ t: 'lobby', code: HS.code, pub: HS.pub, solo: HS.solo, fill: HS.fill, cd: Math.ceil(HS.cd),
    P: HS.P.filter(p => !p.bot).map(p => ({ id: p.id, name: p.name, col: p.col, rank: rankOf(p.xp), host: p.id === 'h' })) });
}
function hostStart() {
  if (!HS || (HS.ph !== 'lobby' && HS.ph !== 'end')) return;
  HS.P = HS.P.filter(p => !p.bot);
  const target = clamp(Math.max(HS.fill, HS.P.length), 4, 10);
  const taken = new Set(HS.P.map(p => p.name));
  while (HS.P.length < target) {
    let k, nm; do { k = UG.randomKnight(); nm = k.name.split(' of ')[0]; } while (taken.has(nm));
    taken.add(nm);
    hostAdd({ id: 'b' + HS.nextId++, name: nm, design: k.design, bot: true });
  }
  const n = HS.P.length, nu = n >= 8 ? 2 : 1;
  const order = shuffle(HS.P.slice());
  HS.P.forEach(p => { p.role = 'loyal'; p.alive = true; p.str = Math.random() < 0.5 ? 2 : 3; p.tr = false; p.bell = false; p.cd = CFG.kcd0; p.use = 0; p.mv = 0; p.left = false; });
  order.slice(0, nu).forEach(p => { p.role = 'usurper'; });
  shuffle(HS.P.slice()).forEach((p, i) => { p.x = SEATS[i][0]; p.y = SEATS[i][1]; p.tp++; });
  HS.P.forEach(p => { p.tasks = shuffle(SOLO.slice()).slice(0, 4).map(s => ({ s: s.i, done: false, prog: 0 })); });
  HS.heavy = {}; HEAVY.forEach(s => { HS.heavy[s.id] = { sum: 0, cnt: 0, prog: 0, done: false }; });
  HS.bodies = []; HS.sab = null; HS.sabcd = CFG.sab0; HS.ph = 'play'; HS.t = 0; HS.chat = []; HS.votes = {}; HS.council = null; HS.over = null; HS.sayQ = [];
  HS.relight = 0; HS.gateHold = 0; HS.log = [];
  HS.P.forEach(p => { if (p.bot) botInit(p); });
  const meta = HS.P.map(p => ({ id: p.id, name: p.name, col: p.col, d: p.design, bot: p.bot }));
  const mates = HS.P.filter(p => p.role === 'usurper').map(p => p.id);
  HS.P.forEach(p => { if (!p.bot) send(p, { t: 'start', id: p.id, P: meta, role: p.role, mates: p.role === 'usurper' ? mates : [], str: p.str, pub: HS.pub, solo: HS.solo }); });
}
function progress() {
  let tot = 0, done = 0;
  HS.P.forEach(p => { if (p.role !== 'loyal') return; p.tasks.forEach(t => { tot++; if (t.done) done++; else done += t.prog * 0.9; }); });
  HEAVY.forEach(s => { tot += 3; const h = HS.heavy[s.id]; done += h.done ? 3 : h.prog * 2.7; });
  return tot ? done / tot : 0;
}
function hostInput(id, m) {
  const p = HS.P.find(q => q.id === id); if (!p || p.bot) return;
  if (m.t === 'in' && HS.ph === 'play') {
    const x = +m.x, y = +m.y;
    if (isFinite(x) && isFinite(y)) {
      if (!p.alive) { p.x = clamp(x, 0, WW); p.y = clamp(y, 0, WH); }
      else if (walk(x, y) && Math.hypot(x - p.x, y - p.y) < 260) { p.x = x; p.y = y; }
    }
    p.f = m.f < 0 ? -1 : 1; p.mv = m.mv ? 1 : 0; p.use = m.u ? 1 : 0;
  } else if (m.t === 'act') hostAct(p, m.a);
  else if (m.t === 'vote') hostVote(p, m.v);
  else if (m.t === 'chat') hostChat(p, m);
  else if (m.t === 'start' && p.id === 'h') hostStart();
  else if (m.t === 'name' && HS.ph === 'lobby') { const n = cleanName(m.n); if (n && !HS.P.some(q => q !== p && q.name === n)) { p.name = n; hostLobby(); } }
  else if (m.t === 'fill' && p.id === 'h') { HS.fill = clamp(+m.n || 7, 4, 10); hostLobby(); }
  else if (m.t === 'lobby' && p.id === 'h' && HS.ph === 'end') { HS.ph = 'lobby'; HS.P = HS.P.filter(q => !q.bot); HS.cd = HS.pub ? 30 : 0; hostLobby(); }
}
function nearSt(p, kind, r = CFG.use) { let best = null, bd = r; for (const s of ST) { if (kind && s.k !== kind) continue; const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = s; } } return best; }
function hostAct(p, a) {
  if (HS.ph !== 'play') return;
  if (a === 'strike') {
    if (p.role !== 'usurper' || !p.alive || p.cd > 0) return;
    let v = null, bd = CFG.kill;
    for (const q of HS.P) { if (q.alive && q.role === 'loyal') { const d = dist(p, q); if (d < bd && los(p.x, p.y, q.x, q.y)) { bd = d; v = q; } } }
    if (!v) return;
    v.alive = false; v.use = 0; HS.bodies.push({ id: v.id, x: v.x, y: v.y, t: HS.t, by: p.id }); HS.log.push('kill' + (v.bot ? '' : ':human'));
    p.cd = CFG.kcd;
    // witnesses: loyal bots that saw it know who it was
    HS.P.forEach(w => { if (w.bot && w.alive && w.role === 'loyal' && dist(w, p) < CFG.vis && los(w.x, w.y, p.x, p.y)) { w.sus[p.id] = 200; w.witness = p.id; } });
    toAll({ t: 'fx', k: 'strike', x: v.x, y: v.y, a: p.x, b: p.y });
    hostCheckWin();
  } else if (a === 'report') {
    if (!p.alive) return;
    const b = HS.bodies.find(b => Math.hypot(b.x - p.x, b.y - p.y) < CFG.report);
    if (b) hostCouncil(p, b);
  } else if (a === 'bell') {
    if (!p.alive || p.bell || HS.sab) return;
    if (Math.hypot(SID.bell.x - p.x, SID.bell.y - p.y) > CFG.use + 10) return;
    p.bell = true; hostCouncil(p, null);
  } else if (a === 'torch' || a === 'gate') {
    if (p.role !== 'usurper' || !p.alive || HS.sab || HS.sabcd > 0) return;
    HS.sab = a === 'torch' ? { k: 'torch', t: CFG.torch } : { k: 'gate', t: CFG.gate, hold: 0, sum: 0 };
    HS.relight = 0; HS.gateHold = 0;
    toAll({ t: 'fx', k: a });
  } else if (a === 'passage') {
    if (p.role !== 'usurper' || !p.alive) return;
    const f = nearSt(p, 'flag', 46); if (!f) return;
    const to = SID[f.to]; p.x = to.x; p.y = to.y; p.tp++;
  }
}
function hostCouncil(by, body) {
  HS.ph = 'council'; HS.tm = CFG.council; HS.votes = {}; HS.chat = []; HS.sab = null; HS.sabcd = CFG.sab0;
  const vic = body ? HS.P.find(q => q.id === body.id) : null;
  HS.log.push(body ? 'report' : 'bell');
  // bots reason about every body found since the last council, not only the one reported
  HS.council = { by: by.id, vic: vic ? vic.id : null, room: body ? roomName(body.x, body.y) : null, at: body ? { x: body.x, y: body.y } : null, td: body ? body.t : HS.t, t0: HS.t };
  // where everyone was when it was called (bots report this truthfully, usurper bots lie)
  HS.P.forEach(p => { p.wasIn = roomName(p.x, p.y); p.use = 0; });
  const alive = HS.P.filter(p => p.alive);
  alive.forEach((p, i) => { p.x = SEATS[i][0]; p.y = SEATS[i][1]; p.tp++; });
  HS.P.filter(p => !p.alive).forEach(p => { p.x = 868; p.y = 640; p.tp++; });
  HS.bodies = [];
  toAll({ t: 'council', by: by.id, vic: HS.council.vic, room: HS.council.room });
  HS.P.forEach(p => { if (p.bot) botCouncil(p); });
}
function hostSay(p, text, q, a) {
  const m = { t: 'chat', from: p ? p.id : null, s: text, q: q || null, a: a || null };
  HS.chat.push(m); toAll(m);
  HS.P.forEach(b => { if (b.bot && p && b !== p) botHear(b, p, q, a); });
}
function hostChat(p, m) {
  if (HS.ph !== 'council' || !p.alive) return;
  const said = (p.saidN || 0); if (said > 12) return; p.saidN = said + 1;
  if (m.q && QUICK[m.q]) {
    let arg = m.a, shown = arg;
    if (['saw', 'strike', 'fake', 'safe', 'sus', 'vote', 'where'].includes(m.q)) { const tg = HS.P.find(q => q.id === arg); if (!tg) return; shown = tg.name; }
    else if (m.q === 'loc') { if (!ROOM_NAMES.includes(arg) && arg !== 'corridors') return; }
    else if (m.q === 'str') { arg = clamp(+arg | 0, 1, 5); shown = arg; }
    hostSay(p, QUICK[m.q](shown), m.q, arg);
  } else if (m.s && !HS.pub) {
    const s = cleanText(m.s); if (s) hostSay(p, s);
  }
}
function hostVote(p, v) {
  if (HS.ph !== 'council' || !p.alive || HS.votes[p.id] !== undefined) return;
  if (v !== 'skip' && !HS.P.find(q => q.id === v && q.alive)) return;
  HS.votes[p.id] = v; toAll({ t: 'voted', id: p.id });
  if (HS.P.filter(q => q.alive).every(q => HS.votes[q.id] !== undefined)) HS.tm = Math.min(HS.tm, 1.2);
}
function hostTally() {
  const tally = {}; let skip = 0;
  Object.values(HS.votes).forEach(v => { if (v === 'skip') skip++; else tally[v] = (tally[v] || 0) + 1; });
  let top = null, topN = 0, tie = false;
  for (const id in tally) { if (tally[id] > topN) { top = id; topN = tally[id]; tie = false; } else if (tally[id] === topN) tie = true; }
  const out = top && !tie && topN > skip ? HS.P.find(q => q.id === top) : null;
  if (out) out.alive = false;
  HS.ph = 'result'; HS.tm = CFG.result;
  HS.lastOut = out ? out.id : null; HS.log.push(out ? 'ban:' + out.role : 'ban:none');
  toAll({ t: 'result', out: out ? out.id : null, role: out ? out.role : null, tally, skip, votes: HS.votes });
}
function hostCheckWin() {
  if (HS.ph === 'end' || HS.ph === 'lobby') return true;
  const aliveU = HS.P.filter(p => p.alive && p.role === 'usurper').length, aliveL = HS.P.filter(p => p.alive && p.role === 'loyal').length;
  let win = null, why = '';
  if (aliveU === 0) { win = 'loyal'; why = 'Every Usurper was banished.'; }
  else if (aliveU >= aliveL) { win = 'usurper'; why = 'The Usurpers now hold as many swords as the loyal knights.'; }
  else if (progress() >= 0.999) { win = 'loyal'; why = 'The keep is secured.'; }
  if (!win) return false;
  hostEnd(win, why); return true;
}
function hostEnd(win, why) {
  HS.ph = 'end'; HS.over = { win, why }; HS.endT = 0;
  const roles = {}; HS.P.forEach(p => { roles[p.id] = p.role; });
  toAll({ t: 'end', win, why, roles });
}
function hostTick(dt) {
  if (!HS) return;
  HS.t += dt;
  // a player whose browser went silent (closed the lid, lost signal) is dropped after 12 seconds
  if (!HS.solo) { const t = now(); HS.P.forEach(p => { if (!p.bot && p.id !== 'h' && t - p.seenAt > 12) { try { p.conn && p.conn.close(); } catch (e) {} hostLeave(p.id); } }); }
  if (HS.ph === 'lobby') {
    if (HS.pub && HS.cd > 0) { HS.cd -= dt; if (HS.cd <= 0) hostStart(); }
    HS.lobbyT -= dt; if (HS.lobbyT <= 0) { HS.lobbyT = 1; if (!HS.solo) hostLobby(); }
    return;
  }
  if (HS.ph === 'council') {
    HS.tm -= dt;
    for (let i = HS.sayQ.length - 1; i >= 0; i--) { const s = HS.sayQ[i]; s.at -= dt; if (s.at <= 0) { HS.sayQ.splice(i, 1); s.fn(); } }
    if (HS.tm <= 0) hostTally();
  } else if (HS.ph === 'result') {
    HS.tm -= dt;
    if (HS.tm <= 0) {
      HS.ph = 'play'; HS.P.forEach(p => { p.cd = CFG.kcd0; p.saidN = 0; if (p.bot) botAfterCouncil(p); });
      if (!hostCheckWin()) toAll({ t: 'resume' });
    }
  } else if (HS.ph === 'play') {
    playTick(dt);
  } else if (HS.ph === 'end' && !HS.solo) {
    HS.endT = (HS.endT || 0) + dt;
    if (HS.endT > 40) { HS.endT = 0; HS.ph = 'lobby'; HS.P = HS.P.filter(q => !q.bot); HS.cd = HS.pub ? 30 : 0; hostLobby(); }
  }
  HS.snapT -= dt;
  if (HS.snapT <= 0) { HS.snapT = 0.1; HS.P.forEach(p => { if (!p.bot) send(p, snap(p)); }); }
}
function playTick(dt) {
  if (HS.sabcd > 0 && !HS.sab) HS.sabcd -= dt;
  HS.P.forEach(p => { if (p.cd > 0) p.cd -= dt; });
  HS.P.forEach(p => { if (p.bot) botTick(p, dt); });
  // tasks: solo, training, heaving
  const heavers = {};
  for (const p of HS.P) {
    if (!p.use) continue;
    const s = nearSt(p, null); if (!s) continue;
    if (s.k === 'solo') {
      if (p.role !== 'loyal') continue;
      const t = p.tasks.find(t => t.s === s.i && !t.done); if (!t) continue;
      t.prog += dt / s.dur; if (t.prog >= 1) { t.done = true; t.prog = 1; if (!p.bot) send(p, { t: 'fx', k: 'done', s: s.i }); }
    } else if (!p.alive) continue;
    else if (s.k === 'train') {
      if (p.tr) continue; p.trp = (p.trp || 0) + dt / s.dur;
      if (p.trp >= 1) { p.tr = true; p.str = Math.min(4, p.str + 1); if (!p.bot) send(p, { t: 'fx', k: 'str', n: p.str }); }
    } else if (s.k === 'heavy' || s.k === 'postern') {
      (heavers[s.id] = heavers[s.id] || []).push(p);
    } else if (s.k === 'brazier' && HS.sab && HS.sab.k === 'torch') {
      HS.relight += dt / s.dur; if (HS.relight >= 1) { HS.sab = null; HS.sabcd = CFG.sabcd; toAll({ t: 'fx', k: 'fixed' }); }
    }
  }
  for (const s of HEAVY) {
    const h = HS.heavy[s.id], hv = heavers[s.id] || [];
    h.cnt = hv.length; h.sum = hv.reduce((a, p) => a + (p.role === 'usurper' ? 0 : p.str), 0);
    if (!h.done && h.sum >= s.need) { h.prog += dt / s.dur; if (h.prog >= 1) { h.done = true; h.prog = 1; toAll({ t: 'fx', k: 'heavy', s: s.i }); } }
    if (hv.some(p => p.role === 'usurper') && h.sum < s.need) hv.forEach(p => { if (p.bot && p.role === 'loyal') { p.fakeAt = s.id; p.fakeWith = hv.filter(q => q !== p).map(q => q.id); } });
  }
  if (HS.sab) {
    HS.sab.t -= dt;
    if (HS.sab.k === 'gate') {
      const hv = heavers.postern || [];
      HS.sab.sum = hv.reduce((a, p) => a + (p.role === 'usurper' ? 0 : p.str), 0); HS.sab.cnt = hv.length;
      if (HS.sab.sum >= SID.postern.need) { HS.gateHold += dt / SID.postern.dur; if (HS.gateHold >= 1) { HS.sab = null; HS.sabcd = CFG.sabcd; toAll({ t: 'fx', k: 'fixed' }); } }
      else HS.gateHold = Math.max(0, HS.gateHold - dt * 0.25);
      if (HS.sab && HS.sab.t <= 0) return hostEnd('usurper', 'The postern gate stood open and the enemy poured in.');
    } else if (HS.sab.t <= 0) { HS.sab = null; HS.sabcd = CFG.sabcd; toAll({ t: 'fx', k: 'fixed' }); }
  }
  HS.prog = progress();
  hostCheckWin();
}
function snap(to) {
  const seeGhosts = !to.alive;
  const P = HS.P.filter(p => p.alive || seeGhosts).map(p => [p.id, Math.round(p.x), Math.round(p.y), p.f, p.mv, p.alive ? 1 : 0, p.use && p.alive ? 1 : 0]);
  const Hv = {}; HEAVY.forEach(s => { const h = HS.heavy[s.id]; if (h) Hv[s.id] = [h.sum, h.cnt, +h.prog.toFixed(3), h.done ? 1 : 0]; });
  const sab = HS.sab ? { k: HS.sab.k, t: Math.ceil(HS.sab.t), sum: HS.sab.sum || 0, cnt: HS.sab.cnt || 0, hold: +(HS.sab.k === 'gate' ? HS.gateHold : HS.relight).toFixed(2) } : null;
  const t = to.tasks.map(t => [t.s, t.done ? 1 : 0, +t.prog.toFixed(2)]);
  return { t: 's', ph: HS.ph, tm: Math.ceil(HS.tm || 0), pr: +(HS.prog || 0).toFixed(3), P, B: HS.bodies.map(b => [b.id, Math.round(b.x), Math.round(b.y)]), Hv, sab,
    me: { cd: +Math.max(0, to.cd).toFixed(1), scd: Math.ceil(Math.max(0, HS.sabcd)), str: to.str, tr: to.tr ? 1 : (to.trp ? +to.trp.toFixed(2) : 0), tk: t, bl: to.bell ? 1 : 0, tp: [to.tp, Math.round(to.x), Math.round(to.y)], al: to.alive ? 1 : 0 } };
}

/* ================= BOTS (host side) ================= */
function botInit(b) {
  b.path = null; b.goal = null; b.wait = 0; b.think = Math.random() * 0.5; b.sus = b.sus || {}; b.seen = []; b.seenT = 0;
  b.witness = null; b.fakeAt = null; b.fakeWith = null; b.job = null; b.reportAt = 0; b.trainWish = Math.random() < 0.5; b.mood = Math.random();
  b.lastPos = { x: b.x, y: b.y }; b.stuck = 0;
}
function botAfterCouncil(b) { b.path = null; b.goal = null; b.job = null; b.wait = 1 + Math.random() * 2; b.reportAt = 0; b.witness = null; b.fakeAt = null; b.fakeWith = null; }
function botGo(b, x, y, job) {
  const pth = b.alive ? path(b.x, b.y, x, y) : [[x, y]];
  if (!pth) { b.path = null; b.job = null; return false; }
  b.path = pth; b.goal = { x, y }; b.job = job; return true;
}
function botVisible(b, q) { return dist(b, q) < (b.role === 'usurper' ? CFG.visU : CFG.vis) && los(b.x, b.y, q.x, q.y); }
function botTick(b, dt) {
  // movement along the path
  b.mv = 0;
  if (b.path && b.path.length && b.wait <= 0) {
    const [tx, ty] = b.path[0], dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy), sp = (b.alive ? CFG.speed : CFG.ghost) * 0.92 * dt;
    if (d <= sp) { b.x = tx; b.y = ty; b.path.shift(); }
    else { b.x += dx / d * sp; b.y += dy / d * sp; b.f = dx < 0 ? -1 : 1; b.mv = 1; }
  }
  if (b.wait > 0) b.wait -= dt;
  b.seenT -= dt;
  if (b.seenT <= 0 && b.alive) {          // remember who it saw where, for the council
    b.seenT = 1;
    HS.P.forEach(q => { if (q !== b && q.alive && botVisible(b, q)) b.seen.push({ t: HS.t, id: q.id, x: q.x, y: q.y }); });
    b.seen = b.seen.filter(s => HS.t - s.t < 70);
  }
  b.think -= dt; if (b.think > 0) return;
  b.think = 0.25 + Math.random() * 0.2;
  if (b.role === 'usurper' && b.alive) return botUsurper(b);
  return botLoyal(b);
}
function atGoal(b, r = 34) { return b.goal && Math.hypot(b.goal.x - b.x, b.goal.y - b.y) < r; }
function botLoyal(b) {
  const alive = b.alive;
  if (alive) {
    // a body in sight: go to it and raise the alarm
    const body = HS.bodies.find(x => Math.hypot(x.x - b.x, x.y - b.y) < CFG.vis && los(b.x, b.y, x.x, x.y));
    if (body) {
      if (!b.reportAt) b.reportAt = HS.t + 0.6 + Math.random() * 1.4;
      if (Math.hypot(body.x - b.x, body.y - b.y) < CFG.report - 10 && HS.t >= b.reportAt) { b.use = 0; return hostAct(b, 'report'); }
      if (b.job !== 'body') botGo(b, body.x, body.y, 'body');
      return;
    }
    // a witnessed strike: run to the bell and call the council
    if (b.witness && !b.bell && !HS.sab) {
      if (Math.hypot(SID.bell.x - b.x, SID.bell.y - b.y) < CFG.use) return hostAct(b, 'bell');
      if (b.job !== 'bell') botGo(b, SID.bell.x, SID.bell.y + 30, 'bell');
      return;
    }
    // sabotage: the postern needs strength, the torches need one knight
    if (HS.sab) {
      const st = HS.sab.k === 'gate' ? SID.postern : SID.brazier;
      if (b.sabGo === undefined) b.sabGo = HS.sab.k === 'gate' ? Math.random() < 0.8 : Math.random() < 0.45;
      if (b.sabGo) {
        if (Math.hypot(st.x - b.x, st.y - b.y) < CFG.use - 14) { b.use = 1; b.path = null; return; }
        b.use = 0; if (b.job !== 'sab') botGo(b, st.x + (Math.random() - 0.5) * 40, st.y - 20 + Math.random() * 20, 'sab');
        return;
      }
    } else b.sabGo = undefined;
  }
  // help with heaving that is already under way nearby
  if (alive && b.job !== 'heave') {
    for (const s of HEAVY) {
      const h = HS.heavy[s.id];
      if (!h.done && h.cnt > 0 && h.sum < s.need && Math.hypot(s.x - b.x, s.y - b.y) < 640 && Math.random() < 0.35) {
        b.use = 0; botGo(b, s.x + (Math.random() - 0.5) * 50, s.y - 10 - Math.random() * 30, 'heave'); b.heaveFor = s.id; b.jobT = 14; return;
      }
    }
  }
  // at a station: work it
  if (b.job && atGoal(b) && (!b.path || !b.path.length)) {
    if (b.job === 'heave') {
      const h = HS.heavy[b.heaveFor]; b.jobT -= 0.35;
      if (h.done || b.jobT <= 0) { b.use = 0; b.job = null; return; }
      b.use = 1; return;
    }
    if (b.job === 'task') {
      const t = b.tasks.find(t => t.s === b.taskS);
      if (!t || t.done) { b.use = 0; b.job = null; b.wait = 0.3 + Math.random() * 0.7; return; }
      b.use = 1; return;
    }
    if (b.job === 'train') { if (b.tr) { b.use = 0; b.job = null; } else b.use = 1; return; }
    b.use = 0; b.job = null;
  }
  if (b.job && b.path && b.path.length) return;
  if (b.job && !b.path) { b.job = null; }
  // pick something to do
  b.use = 0;
  const todo = b.tasks.filter(t => !t.done);
  if (alive && b.trainWish && !b.tr && Math.random() < 0.5) { b.trainWish = false; botGo(b, SID.pell.x + 20, SID.pell.y, 'train'); return; }
  const heavyTodo = HEAVY.filter(s => !HS.heavy[s.id].done);
  if (alive && heavyTodo.length && (!todo.length || Math.random() < 0.28)) {
    const s = UG.pick(heavyTodo); b.heaveFor = s.id; b.jobT = 12 + Math.random() * 6;
    botGo(b, s.x + (Math.random() - 0.5) * 60, s.y - 10 - Math.random() * 30, 'heave'); return;
  }
  if (todo.length) {
    todo.sort((a, c) => Math.hypot(ST[a.s].x - b.x, ST[a.s].y - b.y) - Math.hypot(ST[c.s].x - b.x, ST[c.s].y - b.y));
    const t = Math.random() < 0.75 ? todo[0] : UG.pick(todo), s = ST[t.s];
    b.taskS = t.s; botGo(b, s.x + (Math.random() - 0.5) * 24, s.y + 22, 'task'); return;
  }
  // nothing left: wander to a random room
  const r = UG.pick(ROOMS); botGo(b, (r.x + 1 + Math.random() * (r.w - 2)) * T, (r.y + 1 + Math.random() * (r.h - 2)) * T, 'wander');
  b.wait = 1 + Math.random() * 3;
}
function botUsurper(b) {
  // a body in sight that it did not make itself: sometimes report it to look innocent
  const body = HS.bodies.find(x => Math.hypot(x.x - b.x, x.y - b.y) < 140);
  if (body && body.by !== b.id && Math.random() < 0.25) return hostAct(b, 'report');
  if (body && body.by === b.id && b.job !== 'flee') {
    const f = nearSt(b, 'flag', 46);
    if (f && Math.random() < 0.6) { hostAct(b, 'passage'); b.path = null; b.job = null; return; }
    const far = shuffle(SOLO.slice()).find(s => Math.hypot(s.x - b.x, s.y - b.y) > 600) || SOLO[0];
    botGo(b, far.x, far.y + 22, 'flee'); return;
  }
  // strike a knight who is alone
  if (b.cd <= 0 && HS.t > 8) {
    const loyal = HS.P.filter(q => q.alive && q.role === 'loyal');
    let target = null, bd = 560;
    for (const q of loyal) {
      const d = dist(b, q); if (d > bd) continue;
      const watchers = loyal.filter(w => w !== q && (dist(w, q) < CFG.vis + 40 || dist(w, b) < CFG.vis + 40) && (los(w.x, w.y, q.x, q.y) || los(w.x, w.y, b.x, b.y)));
      if (watchers.length === 0) { bd = d; target = q; }
    }
    if (target) {
      if (dist(b, target) < CFG.kill - 8 && los(b.x, b.y, target.x, target.y)) { b.use = 0; hostAct(b, 'strike'); b.path = null; b.job = null; return; }
      b.use = 0; botGo(b, target.x, target.y, 'hunt'); b.path = b.path && b.path.slice(0, 6); return;
    }
  }
  // sabotage now and then
  if (!HS.sab && HS.sabcd <= 0 && Math.random() < 0.05 && HS.P.filter(p => p.role === 'usurper' && p.alive).every(p => p === b || !p.bot || Math.random() < 0.5)) {
    hostAct(b, Math.random() < 0.55 ? 'gate' : 'torch'); return;
  }
  // blend in: pretend to do tasks, and sometimes join a heave (and quietly add nothing)
  if (b.job && b.path && b.path.length) return;
  if (b.job === 'fake' && atGoal(b) && b.jobT > 0) { b.jobT -= 0.35; b.use = 1; return; }
  if (b.job === 'heave' && atGoal(b) && b.jobT > 0) { b.jobT -= 0.35; b.use = 1; if (HS.heavy[b.heaveFor].done) b.jobT = 0; return; }
  b.use = 0; b.job = null;
  const hv = HEAVY.find(s => { const h = HS.heavy[s.id]; return !h.done && h.cnt > 0 && Math.hypot(s.x - b.x, s.y - b.y) < 700; });
  if (hv && Math.random() < 0.45) { b.heaveFor = hv.id; b.jobT = 8; botGo(b, hv.x + (Math.random() - 0.5) * 50, hv.y - 15, 'heave'); return; }
  const s = UG.pick(SOLO); b.jobT = 2.5 + Math.random() * 2; botGo(b, s.x + (Math.random() - 0.5) * 24, s.y + 22, 'fake');
}
/* bots in council: say what they know (or, for Usurpers, what helps them), react to accusations, then vote */
function botSayLater(b, at, q, a) { HS.sayQ.push({ at, fn: () => { if (HS.ph === 'council' && b.alive) hostSay(b, QUICK[q](typeof a === 'string' && a[0] === '@' ? HS.P.find(p => p.id === a.slice(1)).name : a), q, typeof a === 'string' && a[0] === '@' ? a.slice(1) : a); } }); }
function botCouncil(b) {
  if (!b.alive) return;
  b.saidN = 0;
  const C = HS.council, mates = HS.P.filter(p => p.role === 'usurper').map(p => p.id);
  let t = 2.5 + Math.random() * 9;
  if (b.role === 'loyal') {
    b.nearList = [];
    if (C.at) {
      const td = C.td, vic = C.vic;
      // who it saw close to the spot around the time of the strike
      const near = new Set(b.seen.filter(s => s.id !== vic && Math.abs(s.t - td) < 9 && Math.hypot(s.x - C.at.x, s.y - C.at.y) < 320).map(s => s.id));
      // who it last saw walking with the victim
      const withVic = b.seen.filter(s => s.id === vic && td - s.t < 25 && td - s.t > -1);
      withVic.forEach(v => b.seen.forEach(s => { if (s.id !== vic && Math.abs(s.t - v.t) < 1.5 && Math.hypot(s.x - v.x, s.y - v.y) < 220) near.add(s.id); }));
      near.forEach(id => { b.sus[id] = (b.sus[id] || 0) + 32; });
      // alibis: seen far from the spot right when it happened
      b.seen.forEach(s => { if (Math.abs(s.t - td) < 4 && Math.hypot(s.x - C.at.x, s.y - C.at.y) > 650 && !near.has(s.id)) b.sus[s.id] = (b.sus[s.id] || 0) - 20; });
      b.nearList = [...near];
    }
    if (b.witness) botSayLater(b, t, 'strike', '@' + b.witness);
    else if (b.nearList.length >= 1 && b.nearList.length <= 2) botSayLater(b, t, 'saw', '@' + b.nearList.sort((x, y) => (b.sus[y] || 0) - (b.sus[x] || 0))[0]);
    else botSayLater(b, t, 'loc', b.wasIn === 'the corridors' ? 'corridors' : b.wasIn);
    t += 4 + Math.random() * 8;
    if (b.fakeAt && b.fakeWith && b.fakeWith.length) {
      b.fakeWith.forEach(id => { b.sus[id] = (b.sus[id] || 0) + 40 / b.fakeWith.length; });
      if (b.fakeWith.length === 1) botSayLater(b, t, 'fake', '@' + b.fakeWith[0]);
      else botSayLater(b, t, 'str', b.str);
      t += 3 + Math.random() * 5;
    }
  } else {
    const lieRoom = UG.pick(ROOM_NAMES);
    botSayLater(b, t, 'loc', lieRoom); t += 5 + Math.random() * 8;
    if (Math.random() < 0.35) {
      const cand = HS.P.filter(p => p.alive && !mates.includes(p.id) && p !== b);
      if (cand.length) { const v = UG.pick(cand); b.sus[v.id] = 60; botSayLater(b, t, 'sus', '@' + v.id); t += 4; }
    }
  }
  // vote, after listening a while
  HS.sayQ.push({ at: Math.min(CFG.council - 6, 22 + Math.random() * 30), fn: () => {
    if (HS.ph !== 'council' || !b.alive || HS.votes[b.id] !== undefined) return;
    let top = null, topV = 0;
    for (const id in b.sus) { const q = HS.P.find(p => p.id === id); if (!q || !q.alive || q === b) continue; if (b.role === 'usurper' && mates.includes(id)) continue; if (b.sus[id] > topV) { topV = b.sus[id]; top = id; } }
    if (b.role === 'usurper') {   // pile on to whoever the table is turning on
      const tally = {}; Object.values(HS.votes).forEach(v => { if (v !== 'skip' && !mates.includes(v)) tally[v] = (tally[v] || 0) + 1; });
      const lead = Object.keys(tally).sort((a, c) => tally[c] - tally[a])[0];
      return hostVote(b, lead || (topV >= 40 && Math.random() < 0.6 ? top : 'skip'));
    }
    hostVote(b, top && topV >= 26 ? top : 'skip');
  } });
}
function botHear(b, from, q, a) {
  if (!b.alive || !q) return;
  const tgt = a;
  if (['strike', 'saw', 'fake', 'sus', 'vote'].includes(q) && typeof tgt === 'string') {
    if (tgt === b.id) {
      if (b.role === 'loyal') b.sus[from.id] = (b.sus[from.id] || 0) + 12;
      if ((b.defended || 0) < 1) { b.defended = 1; HS.sayQ.push({ at: 1.5 + Math.random() * 2.5, fn: () => { if (HS.ph === 'council' && b.alive) hostSay(b, QUICK.self(), 'self'); } }); }
      return;
    }
    const w = { strike: 45, saw: 14, fake: 18, sus: 9, vote: 6 }[q];
    if (b.role === 'loyal' && b.witness !== tgt) {
      const trust = (b.sus[from.id] || 0) > 40 ? 0.3 : 1;
      b.sus[tgt] = (b.sus[tgt] || 0) + w * trust;
    }
  } else if (q === 'safe' && typeof tgt === 'string' && b.role === 'loyal') b.sus[tgt] = (b.sus[tgt] || 0) - 10;
}

/* ================= CLIENT: what this browser sees and controls ================= */
const CL = { mode: 'menu', id: null, meta: {}, role: null, mates: [], str: 2, ph: null, snap: null, pos: {}, me: { x: SEATS[0][0], y: SEATS[0][1], f: 1 },
  tp: -1, tasks: [], chat: [], voted: {}, myVote: null, council: null, result: null, end: null, conn: null, peer: null, sendT: 0, fxs: [], pub: false, solo: false,
  lobby: null, host: false, sabMenu: false, sel: null, alive: true, tok: 0 };
let G = null;   // the engine's game object
const shields = {};
function shieldFor(id) { if (!shields[id]) { const m = CL.meta[id]; shields[id] = UG.shield(m && m.d ? m.d : { f: PAL[m ? m.col : 0][1], d: '#d4af5a', c: '#d4af5a', div: 'plain', ch: 'none', name: '', motto: '', bg: 'clear' }); } return shields[id]; }
function localRecv(m) { setTimeout(() => clientRecv(JSON.parse(JSON.stringify(m))), 0); }
function clientSend(m) {
  if (CL.host) { if (HS) hostInput('h', m); return; }
  if (CL.conn && CL.conn.open) { try { CL.conn.send(m); } catch (e) {} }
}
function clientRecv(m) {
  if (!m || !m.t) return;
  CL.lastMsg = now();
  switch (m.t) {
    case 'you': CL.id = m.id; break;
    case 'lobby':
      CL.lobby = m; if (CL.joinWait) CL.joinWait('ok');
      if (CL.mode === 'match') break;
      if (CL.mode !== 'lobby') { CL.mode = 'lobby'; G.hide(); if (pan) pan.dataset.kind = ''; }
      showLobby(); break;
    case 'busy': case 'full':
      if (CL.joinWait) { CL.joinWait(m.t); break; }
      leave(true); G.screen({ kicker: 'The Usurper', title: 'Could not join', sub: m.t === 'busy' ? 'That room is in the middle of a match. Try again in a few minutes.' : 'That room is full.', primary: { label: 'Back', on: () => menu() } });
      break;
    case 'start': startMatch(m); break;
    case 's': CL.snap = m; applySnap(m); break;
    case 'council': CL.council = m; CL.chat = []; CL.voted = {}; CL.myVote = null; CL.sel = null; CL.ph = 'council'; showCouncil(); UG.sfx.clash(); UG.buzz(60); break;
    case 'chat': CL.chat.push(m); if (CL.ph === 'council') renderChat(); break;
    case 'voted': CL.voted[m.id] = 1; if (CL.ph === 'council') renderCouncilPlayers(); break;
    case 'result': CL.result = m; CL.ph = 'result'; showResult(m); break;
    case 'resume': CL.ph = 'play'; hidePanel(); break;
    case 'fx': onFx(m); break;
    case 'end': onEnd(m); break;
  }
}
function startMatch(m) {
  CL.mode = 'match'; CL.id = m.id; CL.meta = {}; m.P.forEach(p => { CL.meta[p.id] = p; });
  Object.keys(shields).forEach(k => delete shields[k]);
  CL.role = m.role; CL.mates = m.mates || []; CL.str = m.str; CL.pub = m.pub; CL.solo = m.solo; CL.ph = 'intro'; CL.pos = {}; CL.tp = -1; CL.alive = true;
  CL.end = null; CL.result = null; CL.council = null; CL.fxs = []; CL.chat = []; CL.sabMenu = false; CL.introT = 4.2;
  hidePanel(); G.hide();
  UG.track('play');
  UG.sfx.fanfare();
  G.say(CL.role === 'usurper' ? 'You are the Usurper.' : 'You are a loyal knight.');
}
function applySnap(m) {
  if (CL.ph !== 'intro' || m.ph !== 'play') CL.ph = m.ph === 'play' && CL.ph === 'intro' ? 'intro' : m.ph;
  const me = m.me;
  if (me.tp[0] !== CL.tp) { CL.tp = me.tp[0]; CL.me.x = me.tp[1]; CL.me.y = me.tp[2]; }
  CL.alive = !!me.al; CL.str = me.str; CL.tasks = me.tk;
  const seen = new Set();
  m.P.forEach(([id, x, y, f, mv, al, hv]) => {
    seen.add(id);
    const p = CL.pos[id] || (CL.pos[id] = { x, y, tx: x, ty: y, f, mv: 0, al: 1, hv: 0, walk: 0 });
    p.tx = x; p.ty = y; p.f = f; p.mv = mv; p.al = al; p.hv = hv;
    if (Math.hypot(p.x - x, p.y - y) > 300) { p.x = x; p.y = y; }
  });
  Object.keys(CL.pos).forEach(id => { if (!seen.has(id)) delete CL.pos[id]; });
}
function onFx(m) {
  const v = vision();
  if (m.k === 'strike') { if (!CL.alive || Math.hypot(m.x - CL.me.x, m.y - CL.me.y) < v + 40) { UG.sfx.hit(); G.shake(5, 0.2); } }
  else if (m.k === 'done') { UG.sfx.coin(); UG.buzz(25); G.pop('Done!', W / 2, H / 2 - 120, { size: 30 }); addProf({ tasks: 1 }); }
  else if (m.k === 'str') { UG.sfx.fanfare(); G.pop(`Strength ${m.n}!`, W / 2, H / 2 - 120, { size: 30 }); }
  else if (m.k === 'heavy') { UG.sfx.boom(); G.pop(`${ST[m.s].name.split(' ').slice(-1)[0]} done!`, W / 2, H / 2 - 150, { size: 26 }); }
  else if (m.k === 'gate' || m.k === 'torch') { UG.sfx.fail(); UG.buzz([80, 60, 80]); CL.fxs.push({ k: m.k, t: 0 }); }
  else if (m.k === 'fixed') { UG.sfx.coin(); }
}
function onEnd(m) {
  CL.end = m; CL.ph = 'end'; CL.mode = 'end'; hidePanel(); if (pan) pan.dataset.kind = '';
  const mine = m.roles[CL.id], won = mine === m.win;
  const p = addProf({ g: 1, w: won ? 1 : 0, uw: won && mine === 'usurper' ? 1 : 0, xp: 20 + (won ? 40 : 0) + (CL.result && CL.result.out && CL.myVote === CL.result.out && CL.result.role === 'usurper' ? 20 : 0) });
  UG.track('finish');
  if (won) UG.sfx.fanfare(); else UG.sfx.groan();
  const usurpers = Object.keys(m.roles).filter(id => m.roles[id] === 'usurper').map(id => (CL.meta[id] || {}).name).join(' and ');
  const show = () => G.screen({ kicker: m.win === 'loyal' ? 'The keep holds' : 'The keep has fallen', title: won ? 'Victory!' : 'Defeat',
    sub: m.why, lines: [`The Usurper${usurpers.includes(' and ') ? 's were' : ' was'} ${usurpers}.`, `Your rank: ${rankOf(p.xp)} (${p.xp} renown)`, `Games ${p.g} · wins ${p.w}`],
    primary: CL.host ? { label: CL.solo ? 'Play again' : 'Back to the lobby', on: () => { G.hide(); if (CL.solo) { hostStart(); } else clientSend({ t: 'lobby' }); } } : { label: 'Waiting for the host…', on: () => {} },
    secondary: { label: CL.solo ? 'Main menu' : 'Leave', on: () => leave() }, cta: true });
  UG.between(G, show);
}
function leave(quiet) {
  try { if (CL.conn) CL.conn.close(); } catch (e) {}
  try { if (CL.peer) CL.peer.destroy(); } catch (e) {}
  try { if (HS && HS.peer) HS.peer.destroy(); } catch (e) {}
  HS = null; CL.conn = null; CL.peer = null; CL.host = false; CL.mode = 'menu'; CL.ph = null; CL.lobby = null; hidePanel();
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  if (!quiet) menu();
}
function vision() {
  if (!CL.alive) return 9999;
  if (CL.role === 'usurper') return CFG.visU;
  const s = CL.snap && CL.snap.sab;
  return s && s.k === 'torch' ? CFG.visDark : CFG.vis;
}

/* ================= starting: solo, quick match, private room, join ================= */
function hello() { return { t: 'hi', name: myName(), d: UG.myDesign(), xp: prof().xp }; }
function playSolo() {
  leave(true);
  newHost({ solo: true, fill: 7 }); CL.host = true; CL.solo = true; CL.id = 'h';
  hostAdd({ id: 'h', name: myName(), design: UG.myDesign(), xp: prof().xp });
  hostStart();
}
function makeCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
function busy(title, sub) { G.screen({ kicker: 'The Usurper', title, sub, secondary: { label: 'Cancel', on: () => { CL.tok++; leave(); } } }); }
function hostRoom(pub, slot) {
  const code = pub ? 'pub-' + slot : makeCode();
  return openPeer(PREFIX + code).then(peer => {
    newHost({ code: pub ? '' : code, pub, peer, fill: 7 }); CL.host = true; CL.solo = false; CL.id = 'h'; CL.pub = pub;
    hostAdd({ id: 'h', name: myName(), design: UG.myDesign(), xp: prof().xp });
    if (!pub) history.replaceState(null, '', '#room=' + code);
    CL.mode = 'lobby'; G.hide(); hostLobby();
    UG.track(pub ? 'host_public' : 'host_private');
    return true;
  });
}
function join(code) {
  return new Promise((res, rej) => {
    let settled = false;
    const fin = (ok, v) => { if (settled) return; settled = true; clearTimeout(t); CL.joinWait = null; (ok ? res : rej)(v); };
    const t = setTimeout(() => fin(false, 'timeout'), 11000);
    CL.joinWait = r => fin(true, r);
    const go = peer => {
      CL.peer = peer;
      const conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
      CL.conn = conn;
      peer.on('error', e => fin(false, e && e.type || 'error'));
      conn.on('open', () => { CL.lastMsg = now(); conn.send(hello()); });
      conn.on('data', m => { if (CL.conn === conn) clientRecv(m); });
      conn.on('close', () => {
        if (CL.conn !== conn) return;
        if (!settled) return fin(false, 'closed');
        if (CL.mode === 'match' || CL.mode === 'lobby' || CL.mode === 'end') lostHost();
      });
    };
    if (CL.peer && !CL.peer.destroyed && CL.peer.open) go(CL.peer); else openPeer(null).then(go).catch(e => fin(false, e));
  });
}
function dropConn() { const c = CL.conn; CL.conn = null; try { if (c) c.close(); } catch (e) {} }
async function quickMatch() {
  leave(true);
  const tok = ++CL.tok;
  busy('Finding a match', 'Looking for knights to play with…');
  UG.track('quick');
  try {
    for (let i = 1; i <= PUB_SLOTS; i++) {
      if (tok !== CL.tok) return;   // cancelled
      try { await hostRoom(true, i); if (tok !== CL.tok) leave(); return; }
      catch (e) {
        if (tok !== CL.tok) return;
        if (e !== 'unavailable-id') throw e;
        const r = await join('pub-' + i).catch(() => 'gone');
        if (tok !== CL.tok) { if (r === 'ok') leave(); return; }
        if (r === 'ok') return;
        dropConn();
      }
    }
    if (tok === CL.tok) netFail('Every public room is busy right now.');
  } catch (e) { if (tok === CL.tok) netFail(); }
}
async function privateRoom() {
  leave(true); busy('Opening a room', 'Setting up your private keep…');
  try { await hostRoom(false); } catch (e) { if (e === 'unavailable-id') { try { await hostRoom(false); return; } catch (er) {} } netFail(); }
}
async function joinCode(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (code.length !== 4) return menu();
  leave(true); busy('Joining room ' + code, 'Knocking on the gate…');
  history.replaceState(null, '', '#room=' + code);
  try {
    const r = await join(code);
    if (r !== 'ok') { leave(true); G.screen({ kicker: 'The Usurper', title: 'Could not join', sub: r === 'busy' ? 'That room is in the middle of a match. Try again in a few minutes.' : 'That room is full.', primary: { label: 'Back', on: () => menu() } }); return; }
    UG.track('join');
  } catch (e) {
    leave(true);
    G.screen({ kicker: 'The Usurper', title: 'Room not found', sub: e === 'peer-unavailable' ? `No open room with the code ${code}. Check the code, or ask your friend to open the room again.` : 'Could not reach the room. Check your connection and try again.',
      primary: { label: 'Back', on: () => menu() } });
  }
}
function netFail(msg) {
  leave(true);
  G.screen({ kicker: 'The Usurper', title: 'Online play is unavailable', sub: (msg || 'Could not connect to other players from this network.') + ' You can still play right now against computer knights.',
    primary: { label: 'Play with bots', on: () => playSolo() }, secondary: { label: 'Back', on: () => menu() } });
}

/* ================= panels (lobby, council, results) drawn as HTML over the game ================= */
let pan = null;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function panel(html, cls) {
  if (!pan) { pan = document.createElement('div'); pan.className = 'us-pan'; G.root.appendChild(pan); }
  pan.className = 'us-pan ' + (cls || ''); pan.hidden = false; pan.innerHTML = html; pan.dataset.kind = ''; G.root.classList.add('ov-on');
  return pan;
}
function hidePanel() { if (pan) { pan.hidden = true; pan.innerHTML = ''; pan.dataset.kind = ''; } if (G) G.root.classList.remove('ov-on'); }
function dot(col) { return `<i class="us-dot" style="background:${PAL[col] ? PAL[col][1] : '#888'}"></i>`; }
function showLobby() {
  const L = CL.lobby; if (!L) return;
  const link = `${location.origin}${location.pathname}#room=${L.code}`;
  const host = CL.host, humans = L.P.length, fill = Math.max(L.fill, humans);
  if (pan && !pan.hidden && pan.dataset.kind === 'lobby' + L.code) {   // already showing: refresh in place (keeps typing and focus)
    const list = pan.querySelector('[data-plist]'); if (list) list.innerHTML = lobbyList(L);
    const cd = pan.querySelector('[data-cd]'); if (cd) cd.textContent = lobbyCd(L, humans, fill);
    const fb = pan.querySelector('[data-filln]'); if (fb) fb.textContent = fill;
    pan.querySelectorAll('[data-fill]').forEach(b => { b.onclick = () => { UG.sfx.click(); clientSend({ t: 'fill', n: fill + +b.dataset.fill }); }; });
    return;
  }
  const share = L.pub ? '' : `<div class="us-share"><p>Room code</p><b class="us-code">${esc(L.code)}</b>
    <div class="us-row"><button type="button" class="btn" data-copy-room>Copy invite link</button>
    <a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Join my game of The Usurper, a medieval social deduction game. Room ' + L.code + ': ' + link)}">WhatsApp</a></div></div>`;
  panel(`<div class="us-card"><p class="ug-k">${L.pub ? 'Public match' : 'Private room'}</p><h2 class="ug-t">The Keep</h2>
    ${share}
    <label class="us-lbl" for="us-name">Your name</label><input id="us-name" class="us-in" maxlength="16" value="${esc(myName())}" autocomplete="off">
    <ul class="us-plist" data-plist>${lobbyList(L)}</ul>
    <p class="us-cd" data-cd>${lobbyCd(L, humans, fill)}</p>
    ${sponsorHtml()}
    ${host ? `<div class="us-row us-fill"><span>Knights in the match</span><button type="button" class="ug-tb" data-fill="-1" aria-label="Fewer">−</button><b data-filln>${fill}</b><button type="button" class="ug-tb" data-fill="1" aria-label="More">+</button></div>` : ''}
    <div class="ug-btns">${host ? `<button type="button" class="btn big" data-go>Start the match</button>` : ''}<button type="button" class="btn ghost" data-leave>Leave</button></div>
    <p class="us-note">${L.pub ? 'Public matches use quick chat only. Computer knights fill any empty seats.' : 'Share the code or link with friends. Up to 10 players; computer knights fill empty seats.' + (host ? ' You are hosting: keep this page open until the match ends.' : '')}</p></div>`, 'us-lobby');
  pan.dataset.kind = 'lobby' + L.code;
  const spa = pan.querySelector('[data-sp]'); if (spa) { UG.track('sponsor_view'); spa.addEventListener('click', () => UG.track('sponsor_click')); }
  const inp = pan.querySelector('#us-name');
  inp.addEventListener('change', () => { const n = cleanName(inp.value); if (n) { UG.store.set('us-name', n); inp.value = n; clientSend({ t: 'name', n }); } else inp.value = myName(); });
  pan.querySelectorAll('[data-fill]').forEach(b => { b.onclick = () => { UG.sfx.click(); clientSend({ t: 'fill', n: fill + +b.dataset.fill }); }; });
  const go = pan.querySelector('[data-go]'); if (go) go.onclick = () => { UG.sfx.click(); const n = cleanName(inp.value); if (n) UG.store.set('us-name', n); if (HS) { const me = HS.P.find(p => p.id === 'h'); if (me && n) me.name = n; } clientSend({ t: 'start' }); };
  pan.querySelector('[data-leave]').onclick = () => { UG.sfx.click(); leave(); };
  const cp = pan.querySelector('[data-copy-room]');
  if (cp) cp.onclick = () => { UG.track('invite_copy'); (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => { cp.textContent = 'Link copied!'; setTimeout(() => { cp.textContent = 'Copy invite link'; }, 1600); }).catch(() => { try { window.prompt('Copy this link:', link); } catch (e) {} }); };
}
// a directly sold sponsor (set in tools/build.py) gets the lobby, the best-watched spot in the game; otherwise an offer to buy it
function sponsorHtml() {
  const sp = (window.USURP_ADS || {}).sponsor;
  if (sp && sp.href && sp.img) return `<p class="ad-lbl" style="margin-top:12px">Sponsor</p><a class="us-sp" href="${esc(sp.href)}" rel="sponsored noopener" target="_blank" data-sp><img src="${esc(sp.img)}" alt="${esc(sp.alt || 'Sponsor')}" width="728" height="90" loading="lazy"></a>`;
  return '<p class="us-note">Want your brand on the Great Hall banners? <a href="/advertise.html" target="_blank" rel="noopener">Sponsor The Usurper</a></p>';
}
function lobbyList(L) { return L.P.map(p => `<li>${dot(p.col)}<b>${esc(p.name)}</b><span>${esc(p.rank)}${p.host ? ' · host' : ''}${p.id === CL.id ? ' · you' : ''}</span></li>`).join(''); }
function lobbyCd(L, humans, fill) {
  const bots = Math.max(0, fill - humans);
  return (L.pub && L.cd > 0 ? `Starting in ${L.cd}s. ` : '') + `${humans} player${humans === 1 ? '' : 's'}${bots ? ` + ${bots} computer knight${bots === 1 ? '' : 's'}` : ''}.`;
}
function showCouncil() {
  const C = CL.council, by = CL.meta[C.by], vic = C.vic && CL.meta[C.vic];
  const why = vic ? `${esc(by.name)} found ${esc(vic.name)} struck down in the ${esc(C.room === 'the corridors' ? 'corridors' : C.room)}.` : `${esc(by.name)} rang the council bell.`;
  const free = !CL.pub && !CL.solo;
  panel(`<div class="us-council"><div class="us-ch"><p class="ug-k">Council of the Keep</p><p class="us-why">${why}</p><p class="us-tm" data-tm></p></div>
    <div class="us-grid" data-grid></div>
    <div class="us-acts" data-acts></div>
    <div class="us-log" data-log aria-live="polite"></div>
    <div class="us-quick" data-quick></div>
    ${free ? '<form class="us-say" data-say><input class="us-in" maxlength="90" placeholder="Say something…" aria-label="Say something" autocomplete="off"><button class="btn" type="submit">Say</button></form>' : ''}
    </div>`, 'us-cpan');
  renderCouncilPlayers(); renderChat(); renderQuick();
  const f = pan.querySelector('[data-say]');
  if (f) f.onsubmit = e => { e.preventDefault(); const i = f.querySelector('input'); const s = cleanText(i.value); if (s) clientSend({ t: 'chat', s }); i.value = ''; };
}
function renderCouncilPlayers() {
  if (!pan || CL.ph !== 'council') return;
  const g = pan.querySelector('[data-grid]'); if (!g) return;
  const alive = new Set((CL.snap ? CL.snap.P : []).filter(p => p[5]).map(p => p[0]));
  g.innerHTML = Object.values(CL.meta).map(m => {
    const dead = !alive.has(m.id) && m.id !== CL.id ? true : (m.id === CL.id && !CL.alive);
    const mate = CL.mates.includes(m.id) && m.id !== CL.id;
    return `<button type="button" class="us-pc${dead ? ' dead' : ''}${CL.sel === m.id ? ' sel' : ''}${mate ? ' mate' : ''}" data-p="${m.id}" ${dead ? 'disabled' : ''}>${dot(m.col)}<b>${esc(m.name)}</b>${CL.voted[m.id] ? '<em>voted</em>' : ''}${dead ? '<em>fallen</em>' : ''}${m.id === CL.id ? '<em>you</em>' : ''}${mate ? '<em>Usurper</em>' : ''}</button>`;
  }).join('');
  g.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => { UG.sfx.click(); CL.sel = CL.sel === b.dataset.p ? null : b.dataset.p; renderCouncilPlayers(); renderActs(); }; });
  renderActs();
}
function renderActs() {
  const a = pan && pan.querySelector('[data-acts]'); if (!a) return;
  if (!CL.alive) { a.innerHTML = '<p class="us-note">You have fallen. Watch, but the dead cannot speak or vote.</p>'; return; }
  if (CL.myVote) { a.innerHTML = `<p class="us-note">You voted ${CL.myVote === 'skip' ? 'to skip' : 'for ' + esc(CL.meta[CL.myVote].name)}.</p>`; return; }
  if (!CL.sel || CL.sel === CL.id) { a.innerHTML = '<p class="us-note">Tap a knight to accuse or vote. Or</p><button type="button" class="btn ghost" data-vote="skip">Skip vote</button>'; }
  else {
    const n = esc(CL.meta[CL.sel].name);
    a.innerHTML = `<button type="button" class="btn" data-vote="${CL.sel}">Banish ${n}</button><button type="button" class="us-q" data-q="sus" data-a="${CL.sel}">Suspect</button><button type="button" class="us-q" data-q="saw" data-a="${CL.sel}">Near the body</button><button type="button" class="us-q" data-q="fake" data-a="${CL.sel}">Faked the heave</button><button type="button" class="us-q" data-q="strike" data-a="${CL.sel}">Saw the strike</button><button type="button" class="us-q" data-q="safe" data-a="${CL.sel}">Trust them</button><button type="button" class="us-q" data-q="where" data-a="${CL.sel}">Where were you?</button>`;
  }
  a.querySelectorAll('[data-vote]').forEach(b => { b.onclick = () => { UG.sfx.click(); CL.myVote = b.dataset.vote; clientSend({ t: 'vote', v: b.dataset.vote }); renderActs(); }; });
  bindQuick(a);
}
function renderQuick() {
  const q = pan && pan.querySelector('[data-quick]'); if (!q) return;
  if (!CL.alive) { q.innerHTML = ''; return; }
  q.innerHTML = `<select class="us-sel" data-loc aria-label="Where I was"><option value="">I was in…</option>${ROOM_NAMES.map(r => `<option>${esc(r)}</option>`).join('')}<option value="corridors">the corridors</option></select>
    <select class="us-sel" data-str aria-label="My strength"><option value="">My strength is…</option>${[2, 3, 4].map(n => `<option>${n}</option>`).join('')}</select>
    <button type="button" class="us-q" data-q="skip">Skip</button><button type="button" class="us-q" data-q="self">Not me</button><button type="button" class="us-q" data-q="ok">Agreed</button>`;
  q.querySelector('[data-loc]').onchange = e => { if (e.target.value) { clientSend({ t: 'chat', q: 'loc', a: e.target.value }); e.target.value = ''; } };
  q.querySelector('[data-str]').onchange = e => { if (e.target.value) { clientSend({ t: 'chat', q: 'str', a: +e.target.value }); e.target.value = ''; } };
  bindQuick(q);
}
function bindQuick(root) { root.querySelectorAll('[data-q]').forEach(b => { b.onclick = () => { UG.sfx.click(); clientSend({ t: 'chat', q: b.dataset.q, a: b.dataset.a || null }); }; }); }
function renderChat() {
  const l = pan && pan.querySelector('[data-log]'); if (!l) return;
  l.innerHTML = CL.chat.map(m => { const p = m.from && CL.meta[m.from]; return `<p>${p ? dot(p.col) + `<b>${esc(p.name)}</b> ` : '<i>Herald:</i> '}${esc(m.s)}</p>`; }).join('') || '<p class="us-note">The council is silent. Speak up.</p>';
  l.scrollTop = l.scrollHeight;
}
function showResult(m) {
  const out = m.out && CL.meta[m.out];
  const lines = Object.entries(m.tally).sort((a, b) => b[1] - a[1]).map(([id, n]) => `${esc(CL.meta[id].name)}: ${n}`).concat(m.skip ? [`Skipped: ${m.skip}`] : []);
  panel(`<div class="us-card us-res"><p class="ug-k">The council has spoken</p><h2 class="ug-t">${out ? `${esc(out.name)} is banished` : 'No one is banished'}</h2>
    ${out ? `<p class="us-big ${m.role === 'usurper' ? 'red' : ''}">${m.role === 'usurper' ? 'They were the Usurper!' : 'They were loyal.'}</p>` : '<p class="ug-sub">The vote was tied or skipped.</p>'}
    <p class="us-note">${lines.join(' · ') || 'No votes.'}</p></div>`, 'us-rpan');
  if (out) { if (m.role === 'usurper') UG.sfx.cheer(); else UG.sfx.groan(); }
  if (m.out === CL.id) CL.alive = false;
  if (CL.myVote && m.out === CL.myVote && m.role === 'usurper') addProf({ ban: 1, xp: 10 });
}

/* ================= menu ================= */
function menu() {
  CL.mode = 'menu'; hidePanel();
  const p = prof();
  G.screen({ kicker: 'Medieval social deduction', title: 'The Usurper',
    sub: 'Loyal knights secure the keep. A hidden Usurper strikes from the shadows. Heave together, talk it out, and banish the traitor.',
    lines: [p.g ? `${rankOf(p.xp)} · ${p.xp} renown · ${p.w} wins` : 'Free · 4 to 10 players · phone or computer'],
    choices: [
      { label: 'Play now', sub: 'Instant match against computer knights', on: () => playSolo() },
      { label: 'Quick match online', sub: 'Join knights from anywhere', on: () => quickMatch() },
      { label: 'Private room', sub: 'Invite friends with a link', on: () => privateRoom() },
      { label: 'Join with a code', sub: 'Your friend has a 4-letter code', on: () => askCode() },
    ] });
}
function askCode() {
  G.screen({ kicker: 'The Usurper', title: 'Join a room', html: '<input class="us-in us-codein" maxlength="4" placeholder="ABCD" aria-label="Room code" autocomplete="off" autocapitalize="characters">',
    primary: { label: 'Join', on: () => joinCode(G.root.querySelector('.us-codein').value) }, secondary: { label: 'Back', on: () => menu() } });
  const i = G.root.querySelector('.us-codein'); setTimeout(() => { try { i.focus(); } catch (e) {} }, 50);
  i.addEventListener('keydown', e => { if (e.key === 'Enter') joinCode(i.value); });
}
function help(g, resume) {
  g.screen({ kicker: 'How to play', title: 'The Usurper', html: `<ol class="ug-howto">
    <li><b>Loyal knights</b> finish their tasks around the keep. Heavy tasks (the portcullis, the bell, the cart) need several knights heaving at once: your strengths add up.</li>
    <li><b>The Usurper</b> strikes knights down, sabotages the keep and can fake a heave, adding nothing. Watch the strength total.</li>
    <li>Find a fallen knight? <b>Raise the alarm</b>. Suspicious? Ring the <b>council bell</b> in the Great Hall (once each).</li>
    <li>In council, say where you were, accuse, defend, then vote. The most votes is banished.</li>
    <li>Train at the pell in the Armory for +1 strength.</li></ol>
    <p class="ug-sub">Move: drag anywhere or WASD. Use or heave: hold the big button or Space. Usurper: Q strike, F sabotage.</p>`,
    primary: { label: resume ? 'Back to the game' : 'Got it', on: () => { if (resume) resume(); else if (CL.mode === 'menu') menu(); else g.hide(); } } });
}

/* ================= input ================= */
const keys = {}; const ptrs = new Map(); let stick = null; const btnHeld = {};
function buttons() {
  const out = [];
  if (CL.mode !== 'match' || CL.ph !== 'play') return out;
  const me = CL.me, ctx = context();
  out.push({ id: 'use', x: W - 76, y: H - 84, r: 50, label: ctx.label, on: !!ctx.k, hold: ctx.hold, k: ctx.k, prog: ctx.prog });
  if (CL.role === 'usurper' && CL.alive) {
    const cd = CL.snap ? CL.snap.me.cd : 0, tgt = strikeTarget();
    out.push({ id: 'strike', x: W - 76, y: H - 200, r: 40, label: cd > 0 ? Math.ceil(cd) + '' : 'Strike', on: cd <= 0 && !!tgt, red: true });
    const scd = CL.snap ? CL.snap.me.scd : 0, sabOn = !!(CL.snap && CL.snap.sab);
    out.push({ id: 'sab', x: W - 186, y: H - 70, r: 34, label: scd > 0 && !sabOn ? scd + '' : 'Sabotage', on: scd <= 0 && !sabOn, red: true, small: true });
    if (CL.sabMenu) { out.push({ id: 'torch', x: W - 186, y: H - 160, r: 34, label: 'Torches', on: true, red: true, small: true }); out.push({ id: 'gate', x: W - 186, y: H - 240, r: 34, label: 'Postern', on: true, red: true, small: true }); }
  }
  void me;
  return out;
}
function strikeTarget() {
  if (!CL.snap) return null; let best = null, bd = CFG.kill;
  for (const [id, x, y, , , al] of CL.snap.P) { if (!al || id === CL.id || CL.mates.includes(id)) continue; const d = Math.hypot(x - CL.me.x, y - CL.me.y); if (d < bd && los(CL.me.x, CL.me.y, x, y)) { bd = d; best = id; } }
  return best;
}
// What the big button does here: raise the alarm, ring the bell, a task, a heave, the secret passage
function context() {
  const me = CL.me, sn = CL.snap; if (!sn) return { label: 'Use' };
  if (CL.alive && sn.B.some(([, x, y]) => Math.hypot(x - me.x, y - me.y) < CFG.report)) return { k: 'report', label: 'Alarm!' };
  let near = null, bd = CFG.use;
  for (const s of ST) { const d = Math.hypot(s.x - me.x, s.y - me.y); if (d < bd) { bd = d; near = s; } }
  if (!near) return { label: 'Use' };
  if (near.k === 'flag') return CL.role === 'usurper' && CL.alive ? { k: 'passage', label: 'Passage' } : { label: 'Use' };
  if (near.k === 'bell') return CL.alive && !sn.me.bl && !sn.sab ? { k: 'bell', label: 'Ring bell' } : { label: 'Use' };
  if (near.k === 'solo') { const t = sn.me.tk.find(t => t[0] === near.i && !t[1]); return t ? { k: 'task', hold: true, label: 'Hold', prog: t[2], st: near } : { label: 'Use' }; }
  if (!CL.alive) return { label: 'Use' };
  if (near.k === 'train') return sn.me.tr >= 1 ? { label: 'Trained' } : { k: 'train', hold: true, label: 'Train', prog: sn.me.tr, st: near };
  if (near.k === 'heavy') { const h = sn.Hv[near.id]; return h && h[3] ? { label: 'Done' } : { k: 'heave', hold: true, label: 'Heave', prog: h ? h[2] : 0, st: near }; }
  if (near.k === 'brazier') return sn.sab && sn.sab.k === 'torch' ? { k: 'relight', hold: true, label: 'Relight', prog: sn.sab.hold, st: near } : { label: 'Use' };
  if (near.k === 'postern') return sn.sab && sn.sab.k === 'gate' ? { k: 'postern', hold: true, label: 'Hold shut', prog: sn.sab.hold, st: near } : { label: 'Use' };
  return { label: 'Use' };
}
function press(id) {
  if (id === 'use') {
    const c = context();
    if (c.k === 'report') clientSend({ t: 'act', a: 'report' });
    else if (c.k === 'bell') clientSend({ t: 'act', a: 'bell' });
    else if (c.k === 'passage') clientSend({ t: 'act', a: 'passage' });
    btnHeld.use = true;
  } else if (id === 'strike') clientSend({ t: 'act', a: 'strike' });
  else if (id === 'sab') CL.sabMenu = !CL.sabMenu;
  else if (id === 'torch' || id === 'gate') { CL.sabMenu = false; clientSend({ t: 'act', a: id }); }
  UG.sfx.click();
}
function bindInput(g) {
  const cv = g.root.querySelector('canvas');
  const toGame = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  cv.addEventListener('pointerdown', e => {
    if (CL.mode !== 'match') return;
    const [x, y] = toGame(e);
    const b = buttons().find(b => Math.hypot(b.x - x, b.y - y) < b.r + 8);
    if (b) { ptrs.set(e.pointerId, { btn: b.id }); if (b.on || b.id === 'use') press(b.id); return; }
    if (CL.sabMenu) CL.sabMenu = false;
    if (!stick) { stick = { id: e.pointerId, x0: x, y0: y, x, y }; ptrs.set(e.pointerId, { stick: true }); }
  });
  cv.addEventListener('pointermove', e => { if (stick && e.pointerId === stick.id) { const [x, y] = toGame(e); stick.x = x; stick.y = y; } });
  const up = e => { const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (!p) return; if (p.stick) stick = null; if (p.btn === 'use') btnHeld.use = false; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('lostpointercapture', up);
  const map = { ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ' ': 'use', e: 'use', E: 'use' };
  window.addEventListener('keydown', e => {
    if (CL.mode !== 'match' || (e.target.closest && e.target.closest('input, textarea, select, button'))) return;
    const k = map[e.key];
    if (k) { if (!keys[k] && k === 'use') press('use'); keys[k] = true; e.preventDefault(); return; }
    if (CL.ph !== 'play') return;
    if (e.key === 'q' || e.key === 'Q') press('strike');
    else if (e.key === 'r' || e.key === 'R') { if (context().k === 'report') press('use'); }
    else if (e.key === 'f' || e.key === 'F') press('sab');
    else if (CL.sabMenu && (e.key === '1' || e.key === '2')) press(e.key === '1' ? 'torch' : 'gate');
  });
  window.addEventListener('keyup', e => { const k = map[e.key]; if (k) { keys[k] = false; if (k === 'use') btnHeld.use = false; } });
  window.addEventListener('blur', () => { Object.keys(keys).forEach(k => { keys[k] = false; }); btnHeld.use = false; stick = null; });
}

/* ================= per-frame client update ================= */
function lostHost() {
  leave(true);
  G.screen({ kicker: 'The Usurper', title: 'Connection lost', sub: 'The host left or the connection dropped, so the match is over.', primary: { label: 'Back to the menu', on: () => menu() } });
}
function clientUpdate(g, dt) {
  if (!CL.host && CL.conn && CL.mode !== 'menu') {
    if (now() - (CL.lastMsg || now()) > 9) return lostHost();
  }
  if (CL.mode !== 'match') return;
  if (CL.ph === 'intro') { CL.introT -= dt; if (CL.introT <= 0) CL.ph = (CL.snap && CL.snap.ph) || 'play'; }
  const me = CL.me;
  let mx = 0, my = 0;
  if (keys.l) mx -= 1; if (keys.r) mx += 1; if (keys.u) my -= 1; if (keys.d) my += 1;
  if (stick) { const dx = stick.x - stick.x0, dy = stick.y - stick.y0, d = Math.hypot(dx, dy); if (d > 8) { mx = dx / Math.max(d, 50); my = dy / Math.max(d, 50); } }
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  const canMove = CL.ph === 'play';
  let moving = 0;
  if (canMove && ml > 0.05) {
    const sp = (CL.alive ? CFG.speed : CFG.ghost) * dt;
    const nx = me.x + mx * sp, ny = me.y + my * sp;
    if (!CL.alive) { me.x = clamp(nx, T, WW - T); me.y = clamp(ny, T, WH - T); }
    else { if (free(nx, me.y)) me.x = nx; if (free(me.x, ny)) me.y = ny; }
    if (Math.abs(mx) > 0.15) me.f = mx < 0 ? -1 : 1;
    moving = 1;
  }
  me.walk = (me.walk || 0) + (moving ? dt * 10 : 0);
  // smooth everyone else toward the host's positions
  const k = 1 - Math.pow(0.0005, dt);
  for (const id in CL.pos) { const p = CL.pos[id]; const ox = p.x; p.x = lerp(p.x, p.tx, k); p.y = lerp(p.y, p.ty, k); p.walk = (p.walk || 0) + (Math.abs(p.x - ox) > 0.3 || p.mv ? dt * 10 : 0); }
  for (const f of CL.fxs) f.t += dt; CL.fxs = CL.fxs.filter(f => f.t < 2.5);
  const use = canMove && (btnHeld.use || keys.use) && !!context().hold;
  CL.sendT -= dt;
  if (CL.sendT <= 0 || use !== CL.lastUse) { CL.sendT = 1 / 15; CL.lastUse = use; clientSend({ t: 'in', x: Math.round(me.x), y: Math.round(me.y), f: me.f, mv: moving, u: use ? 1 : 0 }); }
  // the council timer and the lobby countdown in the panels
  if (pan && !pan.hidden && CL.snap) { const tm = pan.querySelector('[data-tm]'); if (tm) tm.textContent = `${CL.snap.tm}s left to talk and vote`; }
}

/* ================= drawing ================= */
let mapCv = null, MS = 1;
function rng(seed) { return UG.seeded(seed); }
function buildMap() {
  MS = (window.devicePixelRatio || 1) > 1.4 ? 1.5 : 1;
  mapCv = document.createElement('canvas'); mapCv.width = Math.round(WW * MS); mapCv.height = Math.round(WH * MS);
  const c = mapCv.getContext('2d'); c.scale(MS, MS);
  c.fillStyle = '#0b0907'; c.fillRect(0, 0, WW, WH);
  const r = rng(7);
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    const v = grid[ty * COLS + tx], x = tx * T, y = ty * T;
    if (v === 0) continue;
    const ri = roomOf[ty * COLS + tx], room = ri >= 0 ? ROOMS[ri] : null;
    const fl = room ? room.fl : ['#2f2a25', '#36302a'], pat = room ? room.pat : 'flag';
    c.fillStyle = fl[(tx + ty) % 2 && pat === 'check' ? 1 : 0]; c.fillRect(x, y, T, T);
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1;
    if (pat === 'plank') { for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? fl[1] : fl[0]; c.fillRect(x, y + i * 12, T, 12); c.strokeRect(x + ((tx * 7 + i * 13) % 40), y + i * 12, 0.5, 12); } c.strokeRect(x, y, T, T); }
    else if (pat === 'tile') { c.strokeRect(x + 0.5, y + 0.5, 24, 24); c.strokeRect(x + 24.5, y + 0.5, 23, 24); c.strokeRect(x + 0.5, y + 24.5, 24, 23); c.strokeRect(x + 24.5, y + 24.5, 23, 23); }
    else if (pat === 'cobble' || pat === 'round') { for (let i = 0; i < 5; i++) { c.fillStyle = r() < 0.5 ? fl[1] : fl[0]; c.beginPath(); c.ellipse(x + 6 + r() * 36, y + 6 + r() * 36, 8 + r() * 6, 6 + r() * 5, r() * 3, 0, 6.283); c.fill(); c.stroke(); } }
    else if (pat === 'straw') { c.strokeStyle = 'rgba(230,200,120,.18)'; for (let i = 0; i < 9; i++) { const a = r() * 6.283, sx = x + r() * T, sy = y + r() * T; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * 10, sy + Math.sin(a) * 10); c.stroke(); } }
    else if (pat === 'yard') { c.fillStyle = 'rgba(120,150,80,.25)'; for (let i = 0; i < 6; i++) c.fillRect(x + r() * T, y + r() * T, 2, 4); c.strokeRect(x, y, T, T); }
    else if (pat === 'marble') { c.strokeStyle = 'rgba(255,230,170,.08)'; c.beginPath(); c.moveTo(x, y + r() * T); c.bezierCurveTo(x + 16, y + r() * T, x + 32, y + r() * T, x + T, y + r() * T); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.strokeRect(x, y, T, T); }
    else { c.fillStyle = fl[r() < 0.5 ? 1 : 0]; c.fillRect(x + 2, y + 2, T - 4, T - 4); c.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1); }
  }
  // walls: a dark top and a lit face wherever floor lies to the south
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    if (grid[ty * COLS + tx] !== 0) continue;
    const x = tx * T, y = ty * T, below = ty + 1 < ROWS && grid[(ty + 1) * COLS + tx] !== 0;
    let nearFloor = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = tx + dx, ny = ty + dy; if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && grid[ny * COLS + nx] !== 0) nearFloor = true; }
    if (!nearFloor) continue;
    c.fillStyle = '#1d1915'; c.fillRect(x, y, T, T);
    if (below) {
      c.fillStyle = '#5a5046'; c.fillRect(x, y + T * 0.35, T, T * 0.65);
      c.strokeStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 3; i++) { const yy = y + T * 0.35 + i * 10.5; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + T, yy); c.stroke(); c.beginPath(); c.moveTo(x + ((i % 2) ? 12 : 30), yy); c.lineTo(x + ((i % 2) ? 12 : 30), yy + 10.5); c.stroke(); }
      c.fillStyle = '#2b251f'; c.fillRect(x, y + T * 0.3, T, 4);
    } else { c.fillStyle = '#26211c'; c.fillRect(x + 3, y + 3, T - 6, T - 6); }
  }
  // furniture and set dressing
  c.fillStyle = 'rgba(122,16,32,.55)'; c.fillRect(17.2 * T, 12 * T, 1.6 * T, 9 * T);   // the hall's red runner
  const tb = TABLE; c.fillStyle = '#5b3d22'; c.fillRect(tb.x * T + 4, tb.y * T + 6, tb.w * T - 8, tb.h * T - 12); c.fillStyle = '#6e4a2a'; c.fillRect(tb.x * T + 8, tb.y * T + 10, tb.w * T - 16, tb.h * T - 24);
  const prop = (x, y, w, h, col, edge) => { c.fillStyle = col; c.fillRect(x, y, w, h); if (edge) { c.strokeStyle = edge; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2); } };
  prop(3.5 * T, 1.15 * T, 3 * T, 0.7 * T, '#5c5050', '#8a7d6a');           // chapel altar
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) prop((2 + j * 4.2) * T, (3.6 + i * 1.3) * T, 2.6 * T, 0.45 * T, '#4a3220');   // pews
  for (let i = 0; i < 4; i++) { c.fillStyle = '#6b4a1e'; c.fillRect((14 + i * 2.2) * T, 5.6 * T, T * 1.2, T * 0.9); c.fillStyle = '#d4af5a'; c.fillRect((14.1 + i * 2.2) * T, 5.5 * T, T, 6); }  // treasure chests
  prop(1.2 * T, 12.15 * T, 4 * T, 0.6 * T, '#3d3a36', '#777');              // weapon rack
  prop(32 * T, 12.15 * T, 2.8 * T, 0.9 * T, '#3b2a20', '#8a4a20');          // ovens
  prop(28 * T, 16.5 * T, 3 * T, 1.2 * T, '#5b3d22', '#7a5434');             // kitchen table
  c.fillStyle = '#5a5552'; c.beginPath(); c.arc(5 * T, 27.5 * T - 30, 26, 0, 6.283); c.fill(); c.fillStyle = '#16222b'; c.beginPath(); c.arc(5 * T, 27.5 * T - 30, 17, 0, 6.283); c.fill();  // the well
  for (let i = 0; i < 4; i++) prop((27 + i * 2) * T, 24.1 * T, 1.6 * T, 0.8 * T, '#4b3a22', '#6d5532');   // stalls
  c.fillStyle = '#2b2622'; c.fillRect(15.5 * T, 31 * T, 5 * T, 12); c.strokeStyle = '#6f675e'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo((15.6 + i * 0.6) * T, 31 * T); c.lineTo((15.6 + i * 0.6) * T, 31 * T + 12); c.stroke(); }  // portcullis
  // banners hanging on the Great Hall's north wall: a sponsor's name when one is booked
  const spn = String(((window.USURP_ADS || {}).sponsor || {}).name || '').slice(0, 22);
  [[14.2, '#7a1020'], [19.4, '#1f4e8a']].forEach(([bx, col]) => {
    const x = bx * T, y = 11 * T + 22, w = 2.4 * T, h = 64;
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x + w / 2, y + h - 14); c.lineTo(x, y + h); c.closePath(); c.fill();
    c.strokeStyle = '#d4af5a'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#d4af5a'; c.fillRect(x - 4, y - 4, w + 8, 5);
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f3dc92';
    const words = spn ? spn.split(' ') : ['USURP', '.GAMES'];
    let fs = 15; c.font = UG.font(fs, 900); while (fs > 8 && words.some(wd => c.measureText(wd).width > w - 10)) { fs--; c.font = UG.font(fs, 900); }
    words.slice(0, 3).forEach((wd, i, a) => c.fillText(wd.toUpperCase(), x + w / 2, y + 22 + (i - (a.length - 1) / 2) * (fs + 2)));
    c.restore();
  });
  // room names painted on the floor
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = UG.font(22, 700);
  ROOMS.forEach(rm => { c.fillStyle = 'rgba(232,222,198,.12)'; c.fillText(rm.name.toUpperCase(), (rm.x + rm.w / 2) * T, (rm.y + rm.h - 0.6) * T); });
}
const TORCHES = [[3, 1], [7, 1], [15, 1], [21, 1], [28, 1], [33, 1], [3, 12], [7, 12], [14, 12], [22, 12], [28, 12], [3, 24], [7, 24], [15, 24], [21, 24], [28, 24], [33, 24]];
function drawKnight(ctx, x, y, col, f, walk, o = {}) {
  const c = PAL[col] ? PAL[col][1] : '#888', bob = Math.sin(walk) * 2;
  ctx.save(); ctx.translate(x, y);
  if (o.ghost) { ctx.globalAlpha *= 0.45; }
  if (!o.ghost) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 20, 16, 6, 0, 0, 6.283); ctx.fill(); }
  // legs
  if (!o.ghost) { ctx.fillStyle = '#2a241e'; const l = Math.sin(walk) * 4; ctx.fillRect(-9, 10 + l * 0.5, 7, 10 - l * 0.5); ctx.fillRect(2, 10 - l * 0.5, 7, 10 + l * 0.5); }
  // body (tabard)
  ctx.translate(0, bob * (o.ghost ? 0 : 1));
  ctx.fillStyle = c; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-16, 16, -12, 16); ctx.lineTo(12, 16); ctx.quadraticCurveTo(16, 16, 14, -4); ctx.quadraticCurveTo(0, -12, -14, -4); ctx.fill(); ctx.stroke();
  if (o.ghost) { ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx.lineTo(-12 + i * 4, 16 + (i % 2 ? 5 : 0)); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-3, -6, 6, 21);
  // arms up while heaving
  if (o.heave) { ctx.strokeStyle = '#9aa3ad'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-15, -20); ctx.moveTo(12, -2); ctx.lineTo(15, -20); ctx.stroke(); }
  // helm
  ctx.fillStyle = '#a8b0b8'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -15, 11, 0, 6.283); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1b1a1a'; ctx.fillRect(f > 0 ? -2 : -9, -17, 11, 3);
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-2, -27); ctx.quadraticCurveTo(-f * 10, -36, -f * 14, -26); ctx.lineTo(2, -25); ctx.fill();   // plume
  // shield on the arm, with their arms
  if (!o.ghost && o.shield && !o.heave) UG.drawShield(ctx, o.shield, f * 15, 4, 22);
  ctx.restore();
  if (o.name) {
    ctx.font = UG.font(15, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,8,6,.85)'; ctx.strokeText(o.name, x, y - 44); ctx.fillStyle = o.red ? '#ff7a6b' : o.me ? '#ffe9a8' : '#efe6d2'; ctx.fillText(o.name, x, y - 44);
  }
}
function drawBody(ctx, x, y, col) {
  const c = PAL[col] ? PAL[col][1] : '#888';
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 6, 24, 9, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = c; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 2, 20, 11, 0.1, 0, 6.283); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#a8b0b8'; ctx.beginPath(); ctx.arc(24, -6, 8, 0, 6.283); ctx.fill(); ctx.stroke();   // helm knocked off
  ctx.strokeStyle = '#cfc8b8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26, 12); ctx.lineTo(4, -10); ctx.stroke();   // dropped sword
  ctx.restore();
}
function cam() { const m = CL.me; return [clamp(m.x - W / 2, -40, WW - W + 40), clamp(m.y - H / 2 + 30, -40, WH - H + 40)]; }
function drawWorld(g, ctx) {
  if (!mapCv) buildMap();
  const [cx, cy] = cam(), sn = CL.snap, me = CL.me, v = vision();
  ctx.fillStyle = '#0b0907'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(-cx, -cy);
  ctx.drawImage(mapCv, cx * MS, cy * MS, W * MS, H * MS, cx, cy, W, H);
  // torches flicker on the walls
  const dark = sn && sn.sab && sn.sab.k === 'torch';
  for (const [tx, ty] of TORCHES) {
    const x = (tx + 0.5) * T, y = ty * T + 6; if (x < cx - 60 || x > cx + W + 60 || y < cy - 60 || y > cy + H + 60) continue;
    if (!dark) { const fl = 0.7 + 0.3 * Math.sin(g.t * 9 + tx); const gr = ctx.createRadialGradient(x, y, 2, x, y, 70); gr.addColorStop(0, `rgba(255,170,70,${0.28 * fl})`); gr.addColorStop(1, 'rgba(255,170,70,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 70, y - 70, 140, 140); ctx.fillStyle = '#ffcf6a'; ctx.beginPath(); ctx.ellipse(x, y - 4, 4, 7 * fl, 0, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 2, y, 4, 10);
  }
  // stations: your tasks glow gold, heavy tasks show their strength (labels go on top of the knights, below)
  const labels = [];
  if (sn) for (const s of ST) {
    if (s.x < cx - 80 || s.x > cx + W + 80 || s.y < cy - 80 || s.y > cy + H + 80) continue;
    let glow = null, label = null;
    if (s.k === 'solo') { const t = sn.me.tk.find(t => t[0] === s.i); if (t && !t[1] && CL.role === 'loyal') glow = '#ffd76a'; drawStation(ctx, s, !!(t && t[1])); }
    else if (s.k === 'heavy') {
      const h = sn.Hv[s.id]; drawStation(ctx, s, h && h[3]);
      if (h && !h[3]) { glow = CL.role === 'loyal' ? '#ff9f43' : null; if (h[1] > 0) label = `Strength ${h[0]}/${s.need} · ${h[1]} heaving`; }
    }
    else if (s.k === 'train') { drawStation(ctx, s, sn.me.tr >= 1); if (CL.role === 'loyal' && sn.me.tr < 1 && CL.alive) glow = '#9ad1ff'; }
    else if (s.k === 'bell') { drawStation(ctx, s); }
    else if (s.k === 'brazier') { drawStation(ctx, s, !dark); if (dark) glow = '#ff5a4a'; }
    else if (s.k === 'postern') { drawStation(ctx, s, !(sn.sab && sn.sab.k === 'gate')); if (sn.sab && sn.sab.k === 'gate') { glow = '#ff5a4a'; label = `Strength ${sn.sab.sum}/${s.need} · ${sn.sab.cnt} holding`; } }
    else if (s.k === 'flag' && CL.role === 'usurper') { ctx.strokeStyle = 'rgba(255,90,74,.6)'; ctx.lineWidth = 2; ctx.strokeRect(s.x - 18, s.y - 18, 36, 36); }
    if (glow) { const a = 0.45 + 0.35 * Math.sin(g.t * 4); ctx.strokeStyle = glow; ctx.globalAlpha = a; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, 26, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
    if (label) labels.push([label, s.x, s.y - 112]);
  }
  // bodies, then knights from back to front
  if (sn) {
    const canSee = (x, y) => !CL.alive || (Math.hypot(x - me.x, y - me.y) < v + 20 && los(me.x, me.y, x, y));
    sn.B.forEach(([id, x, y]) => { if (canSee(x, y)) drawBody(ctx, x, y, (CL.meta[id] || {}).col); });
    const list = [];
    for (const id in CL.pos) { if (id === CL.id) continue; const p = CL.pos[id]; if (!canSee(p.x, p.y) && p.al) continue; list.push([id, p]); }
    list.push([CL.id, { x: me.x, y: me.y, f: me.f, walk: me.walk, al: CL.alive ? 1 : 0, hv: (btnHeld.use || keys.use) && context().k === 'heave' ? 1 : 0 }]);
    list.sort((a, b) => a[1].y - b[1].y);
    for (const [id, p] of list) {
      const m = CL.meta[id] || {};
      drawKnight(ctx, p.x, p.y, m.col, p.f || 1, p.walk || 0, { ghost: !p.al, heave: !!p.hv, shield: shieldFor(id), name: m.name, me: id === CL.id, red: CL.role === 'usurper' && CL.mates.includes(id) });
    }
  }
  ctx.font = UG.font(15, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [t, x, y] of labels) { const w = ctx.measureText(t).width + 18; ctx.fillStyle = 'rgba(60,30,8,.88)'; ctx.fillRect(x - w / 2, y - 13, w, 26); ctx.strokeStyle = '#ff9f43'; ctx.lineWidth = 1.5; ctx.strokeRect(x - w / 2, y - 13, w, 26); ctx.fillStyle = '#ffe2b0'; ctx.fillText(t, x, y); }
  ctx.restore();
  // fog: everything beyond your sight goes dark (the dead see all)
  if (CL.alive) {
    const sx = me.x - cx, sy = me.y - cy;
    const gr = ctx.createRadialGradient(sx, sy, v * 0.6, sx, sy, v);
    gr.addColorStop(0, 'rgba(6,5,4,0)'); gr.addColorStop(1, 'rgba(6,5,4,.8)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  drawHud(g, ctx);
}
function drawStation(ctx, s, done) {
  const x = s.x, y = s.y;
  ctx.save(); ctx.translate(x, y);
  switch (s.id) {
    case 'candles': for (let i = -1; i <= 1; i++) { ctx.fillStyle = '#efe6d2'; ctx.fillRect(i * 12 - 3, -8, 6, 16); if (done) { ctx.fillStyle = '#ffcf6a'; ctx.beginPath(); ctx.ellipse(i * 12, -12, 3, 5, 0, 0, 6.283); ctx.fill(); } } break;
    case 'coin': ctx.fillStyle = '#6b4a1e'; ctx.fillRect(-18, -10, 36, 20); ctx.fillStyle = '#d4af5a'; for (let i = 0; i < (done ? 5 : 2); i++) { ctx.beginPath(); ctx.arc(-10 + i * 5, -12 - i % 2 * 3, 5, 0, 6.283); ctx.fill(); } break;
    case 'beacon': ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.283); ctx.fill(); if (done) { ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.ellipse(0, -8, 10, 16, 0, 0, 6.283); ctx.fill(); } break;
    case 'swords': ctx.strokeStyle = done ? '#e8eef4' : '#8a8f94'; ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 10, 12); ctx.lineTo(i * 10, -16); ctx.stroke(); } break;
    case 'banners': ctx.fillStyle = done ? '#b3242f' : '#5a2a2a'; ctx.fillRect(-12, -22, 24, 30); ctx.fillStyle = '#d4af5a'; ctx.fillRect(-12, -24, 24, 4); break;
    case 'ovens': ctx.fillStyle = done ? '#ff7a2a' : '#4a2a1a'; ctx.beginPath(); ctx.arc(0, -4, 12, Math.PI, 0); ctx.fill(); break;
    case 'water': ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-9, -2, 18, 14); ctx.fillStyle = done ? '#5aa0d8' : '#2a2a2a'; ctx.fillRect(-7, -2, 14, 4); break;
    case 'hinges': ctx.fillStyle = '#5a5046'; ctx.fillRect(-16, -16, 32, 32); ctx.fillStyle = done ? '#d4af5a' : '#3a3530'; ctx.fillRect(-12, -10, 8, 6); ctx.fillRect(-12, 4, 8, 6); break;
    case 'horses': ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-14, -4, 28, 12); ctx.fillStyle = done ? '#d8c070' : '#5a4a2a'; ctx.fillRect(-12, -8, 24, 6); break;
    case 'portcullis': ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#8a7d6a'; ctx.lineWidth = 4; for (let a = 0; a < 4; a++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a * 1.57 + (done ? 0.6 : 0)) * 20, Math.sin(a * 1.57 + (done ? 0.6 : 0)) * 20); ctx.stroke(); } break;
    case 'bellh': ctx.fillStyle = done ? '#d4af5a' : '#8a6a3a'; ctx.beginPath(); ctx.moveTo(-14, 10); ctx.quadraticCurveTo(-14, -18, 0, -18); ctx.quadraticCurveTo(14, -18, 14, 10); ctx.closePath(); ctx.fill(); break;
    case 'cart': ctx.save(); ctx.rotate(done ? 0 : 0.5); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-24, -12, 48, 24); ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(-14, 14, 8, 0, 6.283); ctx.arc(14, 14, 8, 0, 6.283); ctx.fill(); ctx.restore(); break;
    case 'pell': ctx.fillStyle = '#7a5434'; ctx.fillRect(-6, -26, 12, 40); ctx.fillStyle = '#5b3d22'; ctx.fillRect(-16, -14, 32, 6); break;
    case 'bell': ctx.fillStyle = '#d4af5a'; ctx.beginPath(); ctx.moveTo(-10, 6); ctx.quadraticCurveTo(-10, -14, 0, -14); ctx.quadraticCurveTo(10, -14, 10, 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7a5a20'; ctx.fillRect(-12, 6, 24, 3); break;
    case 'brazier': ctx.fillStyle = '#3a3530'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.283); ctx.fill(); if (done) { ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.ellipse(0, -8, 8, 13, 0, 0, 6.283); ctx.fill(); } break;
    case 'postern': ctx.fillStyle = done ? '#4a3220' : '#1a120c'; ctx.fillRect(-14, -20, 28, 34); ctx.strokeStyle = '#8a7d6a'; ctx.strokeRect(-14, -20, 28, 34); break;
  }
  ctx.restore();
}
function button(ctx, b) {
  ctx.save();
  ctx.globalAlpha = b.on ? 0.95 : 0.4;
  ctx.fillStyle = b.red ? 'rgba(120,20,24,.85)' : 'rgba(30,24,16,.85)'; ctx.strokeStyle = b.red ? '#ff7a6b' : '#d4af5a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill(); ctx.stroke();
  if (b.prog > 0 && b.prog < 1) { ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 6, -Math.PI / 2, -Math.PI / 2 + b.prog * 6.283); ctx.stroke(); }
  ctx.fillStyle = '#fff3cf'; ctx.font = UG.font(b.small ? 13 : 17, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.label, b.x, b.y, b.r * 1.8);
  ctx.restore();
}
function drawHud(g, ctx) {
  const sn = CL.snap; if (!sn) return;
  // progress bar
  ctx.fillStyle = 'rgba(12,10,8,.78)'; ctx.fillRect(10, 10, 300, 30); ctx.strokeStyle = '#8a6f3c'; ctx.lineWidth = 1; ctx.strokeRect(10.5, 10.5, 299, 29);
  ctx.fillStyle = '#2e9e57'; ctx.fillRect(14, 14, 292 * clamp(sn.pr, 0, 1), 22);
  ctx.font = UG.font(15, 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff3cf'; ctx.fillText(`Keep secured ${Math.round(sn.pr * 100)}%`, 20, 25);
  // role and tasks
  const u = CL.role === 'usurper';
  const LH = 21, tl = u ? 1 : sn.me.tk.length;
  ctx.fillStyle = 'rgba(12,10,8,.72)'; ctx.fillRect(10, 46, 330, 30 + tl * LH);
  ctx.font = UG.font(15, 900); ctx.fillStyle = u ? '#ff7a6b' : '#9fe0b4';
  ctx.fillText(!CL.alive ? (u ? 'USURPER · fallen' : 'GHOST · finish tasks') : u ? `USURPER · strike unseen` : `LOYAL · strength ${sn.me.str}`, 18, 61);
  ctx.font = UG.font(15, 700);
  if (u) { ctx.fillStyle = '#d8c8a8'; ctx.fillText(CL.mates.length > 1 ? `Ally: ${CL.mates.filter(i => i !== CL.id).map(i => CL.meta[i].name).join(', ')}` : 'Fake tasks. Fake heaves.', 18, 61 + LH); }
  else sn.me.tk.forEach((t, i) => { const s = ST[t[0]]; ctx.fillStyle = t[1] ? '#7d8a6f' : '#efe6d2'; ctx.fillText(`${t[1] ? '✓' : '○'} ${s.room}: ${s.name.replace(/^(\w+) the /, '$1 ')}`, 18, 61 + (i + 1) * LH); });
  // minimap
  const mmW = 108, mmH = mmW * WH / WW, mx = W - mmW - 10, my = 10, k = mmW / WW;
  ctx.fillStyle = 'rgba(12,10,8,.8)'; ctx.fillRect(mx - 3, my - 3, mmW + 6, mmH + 6);
  ctx.fillStyle = '#4a4036'; ROOMS.forEach(r => ctx.fillRect(mx + r.x * T * k, my + r.y * T * k, r.w * T * k, r.h * T * k)); CORR.forEach(([x, y, w, h]) => ctx.fillRect(mx + x * T * k, my + y * T * k, w * T * k, h * T * k));
  if (CL.role === 'loyal') { ctx.fillStyle = '#ffd76a'; sn.me.tk.forEach(t => { if (!t[1]) { const s = ST[t[0]]; ctx.fillRect(mx + s.x * k - 2, my + s.y * k - 2, 4, 4); } }); ctx.fillStyle = '#ff9f43'; HEAVY.forEach(s => { const h = sn.Hv[s.id]; if (h && !h[3]) ctx.fillRect(mx + s.x * k - 2, my + s.y * k - 2, 4, 4); }); }
  if (sn.sab) { const s = sn.sab.k === 'gate' ? SID.postern : SID.brazier; ctx.fillStyle = `rgba(255,90,74,${0.5 + 0.5 * Math.sin(g.t * 8)})`; ctx.beginPath(); ctx.arc(mx + s.x * k, my + s.y * k, 5, 0, 6.283); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx + CL.me.x * k, my + CL.me.y * k, 3, 0, 6.283); ctx.fill();
  // where am I
  ctx.font = UG.font(15, 700); ctx.textAlign = 'right'; ctx.fillStyle = '#d8c8a8'; ctx.fillText(roomName(CL.me.x, CL.me.y), W - 12, my + mmH + 16);
  // sabotage banner
  if (sn.sab) {
    const by = 86 + tl * LH;
    ctx.fillStyle = `rgba(120,20,24,${0.75 + 0.2 * Math.sin(g.t * 6)})`; ctx.fillRect(0, by, W, 44);
    ctx.font = UG.font(14, 900); ctx.textAlign = 'center'; ctx.fillStyle = '#fff3cf';
    if (sn.sab.k === 'gate') { ctx.fillText(`POSTERN BREACHED · ${sn.sab.t}s`, W / 2, by + 14); ctx.font = UG.font(13, 700); ctx.fillText(`Hold it shut in the Gatehouse: strength ${sn.sab.sum}/${SID.postern.need}`, W / 2, by + 32); }
    else { ctx.fillText('TORCHES DOUSED', W / 2, by + 14); ctx.font = UG.font(13, 700); ctx.fillText('Relight the brazier in the Great Hall', W / 2, by + 32); }
  }
  // what the button will do here
  const c = context();
  if (c.st && CL.ph === 'play') {
    ctx.font = UG.font(16, 700); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(12,10,8,.8)'; const txt = c.k === 'heave' ? `${c.st.name}: needs strength ${c.st.need}` : c.st.name;
    const tw = Math.min(W - 8, ctx.measureText(txt).width + 20); ctx.fillRect(W / 2 - tw / 2, H - 186, tw, 30); ctx.fillStyle = '#ffe9a8'; ctx.fillText(txt, W / 2, H - 171, W - 16);
  }
  buttons().forEach(b => button(ctx, b));
  // the move stick
  if (stick) { ctx.strokeStyle = 'rgba(255,233,168,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(stick.x0, stick.y0, 50, 0, 6.283); ctx.stroke(); const dx = stick.x - stick.x0, dy = stick.y - stick.y0, d = Math.min(50, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); ctx.fillStyle = 'rgba(255,233,168,.55)'; ctx.beginPath(); ctx.arc(stick.x0 + Math.cos(a) * d, stick.y0 + Math.sin(a) * d, 20, 0, 6.283); ctx.fill(); }
  else if (CL.ph === 'play' && G.t - (CL.startT || 0) < 12) { ctx.font = UG.font(15, 700); ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,233,168,.75)'; ctx.fillText(matchMedia('(pointer:coarse)').matches ? 'Drag anywhere to move' : 'WASD or arrows to move · hold Space to use', 16, H - 24); }
  // intro card: your role
  if (CL.ph === 'intro') {
    const a = clamp(CL.introT, 0, 1); ctx.fillStyle = `rgba(6,5,4,${0.85 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = UG.font(16, 700); ctx.fillStyle = '#d8c8a8'; ctx.fillText('You are', W / 2, H / 2 - 70);
    ctx.font = UG.font(44, 900, 'Cinzel Decorative'); ctx.fillStyle = u ? '#ff6b5b' : '#9fe0b4'; ctx.fillText(u ? 'The Usurper' : 'Loyal', W / 2, H / 2 - 20);
    ctx.font = UG.font(15, 700); ctx.fillStyle = '#efe6d2';
    const sub = u ? (CL.mates.length > 1 ? `Your ally: ${CL.mates.filter(i => i !== CL.id).map(i => CL.meta[i].name).join(', ')}` : 'Strike the knights down unseen.') : `Strength ${CL.str}. ${Object.values(CL.meta).length >= 8 ? 'Two Usurpers' : 'One Usurper'} hide among you.`;
    ctx.fillText(sub, W / 2, H / 2 + 26); ctx.globalAlpha = 1;
    CL.startT = G.t;
  }
}
function drawBackdrop(g, ctx) {
  if (!mapCv) buildMap();
  const t = g.t * 12;
  const x = (Math.sin(t / 90) * 0.5 + 0.5) * (WW - W), y = (Math.cos(t / 120) * 0.5 + 0.5) * (WH - H);
  ctx.drawImage(mapCv, x * MS, y * MS, W * MS, H * MS, 0, 0, W, H);
  ctx.fillStyle = 'rgba(6,5,4,.55)'; ctx.fillRect(0, 0, W, H);
}

/* ================= engine hook-up ================= */
G = UG.start({
  id: 'usurper', title: 'The Usurper', label: 'The Usurper, a medieval social deduction game', W, H, help,
  init(g) {
    G = g; bindInput(g);
    const m = /room=([A-Za-z]{4})/.exec(location.hash);
    if (m) {
      g.screen({ kicker: 'You are invited', title: 'The Usurper', sub: `A friend invited you to room ${m[1].toUpperCase()}. Loyal knights against a hidden Usurper.`,
        html: `<label class="us-lbl" for="us-n0">Your name</label><input id="us-n0" class="us-in" maxlength="16" value="${esc(myName())}" autocomplete="off">`,
        primary: { label: 'Join the room', on: () => { const n = cleanName(g.root.querySelector('#us-n0').value); if (n) UG.store.set('us-name', n); joinCode(m[1]); } },
        secondary: { label: 'Main menu', on: () => leave() } });
    } else menu();
    if (LOCAL) window.__us = { CL, get HS() { return HS; }, ST, SID, press, keys, btnHeld, hostStart, playSolo, context, los, path, WW, WH, CFG,
      ff(sec) { for (let i = 0; i < sec * 20 && HS && HS.ph !== 'end'; i++) hostTick(0.05); return HS && HS.ph; } };
  },
  update(g, dt) { if (HS) { hostTick(Math.min(dt, 0.05)); lastHost = now(); } clientUpdate(g, dt); },
  draw(g, ctx) { if (CL.mode === 'match') drawWorld(g, ctx); else drawBackdrop(g, ctx); },
  pause() { Object.keys(keys).forEach(k => { keys[k] = false; }); btnHeld.use = false; stick = null; },
});
// Keep the simulation running while the tab is hidden if this browser is the host of an online match
let lastHost = now();
setInterval(() => { if (!CL.host && CL.conn && CL.mode !== 'menu') clientSend({ t: 'ping' }); }, 2000);
setInterval(() => { const t = now(); if (HS && !HS.solo && t - lastHost > 0.3) { hostTick(Math.min(1, t - lastHost)); lastHost = t; } }, 250);
window.addEventListener('beforeunload', e => { if (HS && !HS.solo && HS.P.some(p => !p.bot && p.id !== 'h') && CL.mode !== 'menu') { e.preventDefault(); e.returnValue = ''; } });
})();
