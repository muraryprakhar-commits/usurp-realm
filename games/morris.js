/* Nine Men's Morris: the medieval board game of mills. Place nine pieces, then slide them along the lines; three in a row
   (a mill) lets you take one of your opponent's pieces. Play the computer at three strengths, or a friend on one device. */
(function () {
'use strict';
const { clamp, lerp, ease } = UG;
const W = 540, H = 720, X0 = 36, Y0 = 136, U = 78;

/* ---------- the board: 24 points on three squares, numbered ring by ring, clockwise from each top-left corner ---------- */
const RING = [[0, 0], [3, 0], [6, 0], [6, 3], [6, 6], [3, 6], [0, 6], [0, 3]];
const PTS = new Array(24);
// ring r is inset by r grid steps on every side
for (let r = 0; r < 3; r++) RING.forEach(([gx, gy], k) => {
  const ix = gx === 0 ? r : gx === 6 ? 6 - r : 3, iy = gy === 0 ? r : gy === 6 ? 6 - r : 3;
  PTS[r * 8 + k] = [X0 + ix * U, Y0 + iy * U];
});
const ADJ = PTS.map(() => []);
for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) {
  const i = r * 8 + k; ADJ[i].push(r * 8 + (k + 1) % 8, r * 8 + (k + 7) % 8);
  if (k % 2 === 1) { if (r > 0) ADJ[i].push(i - 8); if (r < 2) ADJ[i].push(i + 8); }
}
const MILLS = [];
for (let r = 0; r < 3; r++) for (const k of [0, 2, 4, 6]) MILLS.push([r * 8 + k, r * 8 + k + 1, r * 8 + (k + 2) % 8]);
for (const k of [1, 3, 5, 7]) MILLS.push([k, 8 + k, 16 + k]);
const MILLS_OF = PTS.map((_, i) => MILLS.filter(m => m.includes(i)));
const LEVELS = [
  { id: 1, name: 'Squire', sub: 'Easy: learning the game', depth: 1, ms: 60, slip: 0.35, base: 100 },
  { id: 2, name: 'Knight', sub: 'Normal: plans a few moves ahead', depth: 4, ms: 260, slip: 0, base: 250 },
  { id: 3, name: 'Lord', sub: 'Hard: thinks deep and rarely slips', depth: 9, ms: 650, slip: 0, base: 500 },
];

/* ---------- rules ---------- */
function count(b, p) { let n = 0; for (let i = 0; i < 24; i++) if (b[i] === p) n++; return n; }
function inMill(b, i) {
  const p = b[i]; if (!p) return false;
  for (const [a, c, d] of MILLS_OF[i]) if (b[a] === p && b[c] === p && b[d] === p) return true;
  return false;
}
function removable(b, o) {
  const free = [], all = [];
  for (let i = 0; i < 24; i++) if (b[i] === o) { all.push(i); if (!inMill(b, i)) free.push(i); }
  return free.length ? free : all;      // pieces in mills may be taken only when every piece is in one
}
function canFly(b, h, p) { return h[p] === 0 && count(b, p) === 3; }
// Every legal move for p: { f: from (-1 = from the hand), t: to, r: piece removed (-1 = none) }.
function gen(b, h, p) {
  const o = 3 - p, out = [];
  const add = (f, t) => {
    if (f >= 0) b[f] = 0; b[t] = p;
    if (inMill(b, t)) { const rs = removable(b, o); if (rs.length) for (const r of rs) out.push({ f, t, r }); else out.push({ f, t, r: -1 }); }
    else out.push({ f, t, r: -1 });
    b[t] = 0; if (f >= 0) b[f] = p;
  };
  if (h[p] > 0) { for (let t = 0; t < 24; t++) if (!b[t]) add(-1, t); }
  else if (count(b, p) === 3) { for (let f = 0; f < 24; f++) if (b[f] === p) for (let t = 0; t < 24; t++) if (!b[t]) add(f, t); }
  else for (let f = 0; f < 24; f++) if (b[f] === p) for (const t of ADJ[f]) if (!b[t]) add(f, t);
  return out;
}
function make(b, h, p, m) { if (m.f < 0) h[p]--; else b[m.f] = 0; b[m.t] = p; if (m.r >= 0) b[m.r] = 0; }
function unmake(b, h, p, m) { if (m.r >= 0) b[m.r] = 3 - p; b[m.t] = 0; if (m.f < 0) h[p]++; else b[m.f] = p; }
function lost(b, h, p) { return count(b, p) + h[p] < 3 || (h[p] === 0 && gen(b, h, p).length === 0); }

/* ---------- the computer: alpha-beta search with iterative deepening inside a time budget ---------- */
const WIN = 100000;
function side(b, h, p) {
  let mills = 0, twos = 0, mob = 0;
  for (const m of MILLS) {
    let mine = 0, empty = 0;
    for (const i of m) { if (b[i] === p) mine++; else if (!b[i]) empty++; }
    if (mine === 3) mills++; else if (mine === 2 && empty === 1) twos++;
  }
  const n = count(b, p);
  let blocked = 0;
  for (let i = 0; i < 24; i++) if (b[i] === p) { let free = 0; for (const t of ADJ[i]) if (!b[t]) free++; mob += free; if (!free) blocked++; }
  const flying = h[p] === 0 && n === 3;
  return { n: n + h[p], mills, twos, mob: flying ? 12 : mob, blocked: flying ? 0 : blocked, stuck: h[p] === 0 && n > 3 && mob === 0 };
}
// Material first, then mills and half-made mills, then room to move: a side hemmed in during the placing phase loses later.
function evaluate(b, h, p) {
  const a = side(b, h, p), c = side(b, h, 3 - p);
  if (c.stuck) return WIN / 2; if (a.stuck) return -WIN / 2;
  return 120 * (a.n - c.n) + 12 * (a.mills - c.mills) + 8 * (a.twos - c.twos) + 4 * (a.mob - c.mob) - 7 * (a.blocked - c.blocked);
}
let deadline = 0, nodes = 0;
const TIMEOUT = {};
function negamax(b, h, p, depth, alpha, beta, ply) {
  if ((++nodes & 1023) === 0 && performance.now() > deadline) throw TIMEOUT;
  if (count(b, p) + h[p] < 3) return -WIN + ply;
  const ms = gen(b, h, p);
  if (!ms.length) return -WIN + ply;
  if (depth === 0) return evaluate(b, h, p);
  ms.sort((x, y) => (y.r >= 0) - (x.r >= 0));
  let best = -Infinity;
  for (const m of ms) {
    make(b, h, p, m);
    const v = -negamax(b, h, 3 - p, depth - 1, -beta, -alpha, ply + 1);
    unmake(b, h, p, m);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}
function think(b0, h0, p, L) {
  const b = Int8Array.from(b0), h = h0.slice();
  let ms = gen(b, h, p);
  for (let i = ms.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ms[i], ms[j]] = [ms[j], ms[i]]; }
  if (L.slip && Math.random() < L.slip) return ms[0];
  ms.sort((x, y) => (y.r >= 0) - (x.r >= 0));
  deadline = performance.now() + L.ms; nodes = 0;
  let pick = ms[0];
  for (let d = 1; d <= L.depth; d++) {
    try {
      let best = -Infinity, bm = ms[0], alpha = -Infinity;
      const scored = [];
      for (const m of ms) {
        make(b, h, p, m);
        const v = -negamax(b, h, 3 - p, d - 1, -Infinity, -alpha, 1);
        unmake(b, h, p, m);
        scored.push([v, m]);
        if (v > best) { best = v; bm = m; }
        if (v > alpha) alpha = v;
      }
      pick = bm;
      scored.sort((x, y) => y[0] - x[0]); ms = scored.map(s => s[1]);   // best first next time: better pruning
      if (best >= WIN - 50) break;
    } catch (e) { if (e !== TIMEOUT) throw e; break; }
  }
  return pick;
}

/* ---------- game state ---------- */
let S = null, me = null, myShield = null, opp = null, oppShield = null, mode = { ai: true, level: LEVELS[1] }, games = 0;
const wins = UG.store.get('ug-morris-wins', { 1: 0, 2: 0, 3: 0 });
function lum(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function colours() {
  const p = me.design, A = { f: p.f || '#1f4e8a', d: p.d && p.d !== p.f ? p.d : '#d4af5a' };
  let B = { f: opp.design.f, d: opp.design.d && opp.design.d !== opp.design.f ? opp.design.d : '#d4af5a' };
  if (Math.abs(lum(A.f) - lum(B.f)) < 0.3) B = lum(A.f) > 0.4 ? { f: '#1d1915', d: '#c9a84f' } : { f: '#efe6d0', d: '#7a1020' };
  return { 1: A, 2: B };
}
function name(p) { return mode.ai ? (p === 1 ? (me.mine ? me.name : 'You') : opp.name.split(' of ')[0]) : `Player ${p}`; }
function newGame(g) {
  games++;
  if (mode.ai) { opp = UG.randomKnight(); oppShield = UG.shield(opp.design); }
  else { opp = { name: 'Player 2', design: { name: 'Player 2', motto: '', f: '#efe6d0', d: '#7a1020', c: '#7a1020', div: 'chevron', ch: 'raven', bg: 'clear' } }; oppShield = UG.shield(opp.design); }
  S = { b: new Int8Array(24), h: [0, 9, 9], turn: games % 2 === 1 ? 1 : 2, sel: -1, removing: false, anim: null, fades: [], mill: null, last: null,
        thinking: 0, over: false, plies: 0, quiet: 0, seen: new Map(), cur: 0, kb: false, col: colours(), msg: '', msgT: 0, hint: games <= 1 };
  g.state = 'play';
  if (S.turn === 2 && mode.ai) S.thinking = 0.6;
  S.msg = S.turn === 1 ? (mode.ai ? 'You place first' : 'Player 1 places first') : (mode.ai ? `${name(2)} places first` : 'Player 2 places first'); S.msgT = 2;
  UG.track('play', { level: mode.ai ? mode.level.id : 0 });
  g.say(S.msg);
}
const human = p => !mode.ai || p === 1;
function phaseOf(p) { return S.h[p] > 0 ? 'place' : canFly(S.b, S.h, p) ? 'fly' : 'move'; }
function targets(f) {
  if (f < 0) return [];
  const out = [];
  if (canFly(S.b, S.h, S.turn)) { for (let t = 0; t < 24; t++) if (!S.b[t]) out.push(t); }
  else for (const t of ADJ[f]) if (!S.b[t]) out.push(t);
  return out;
}
function handPos(p, idx) { const n = 9, gap = 34, x0 = W / 2 - (n - 1) * gap / 2; return [x0 + idx * gap, p === 1 ? 652 : 88]; }

// Plays a move. Human moves land at once; the computer's slide in. Removal animates after the move lands.
function play(g, m, animate) {
  const p = S.turn, [x1, y1] = PTS[m.t];
  const [x0, y0] = m.f < 0 ? handPos(p, S.h[p] - 1) : PTS[m.f];
  S.sel = -1;
  const land = () => {
    S.anim = null;
    S.b[m.t] = p; if (m.f < 0) S.h[p]--; else S.b[m.f] = 0;
    S.last = { f: m.f, t: m.t, p };
    UG.sfx.thunk(); g.burst(x1, y1, 6, { c: ['#c8a46a', '#8a6237'], v0: 30, v1: 110, g: 300, l1: 0.4, s0: 1.5, s1: 3 });
    const formed = inMill(S.b, m.t);
    if (formed) {
      const mm = MILLS_OF[m.t].find(([a, c, d]) => S.b[a] === p && S.b[c] === p && S.b[d] === p);
      S.mill = { pts: mm, t: 0, p }; UG.sfx.clash(); UG.buzz(25); g.shake(4, 0.15);
      g.say(`${name(p)} made a mill`);
    }
    if (formed && m.r === undefined) {                       // a human move: now pick a piece to take
      const rs = removable(S.b, 3 - p);
      if (rs.length) { S.removing = true; S.msg = 'Mill! Take one of their pieces'; S.msgT = 99; return; }
    }
    if (formed && m.r >= 0) { S.wait = { t: 0.45, fn: () => take(g, m.r) }; return; }   // let the mill show, then take
    endTurn(g, false);
  };
  if (animate) { S.anim = { f: m.f, p, x0, y0, x1, y1, k: 0, dur: m.f < 0 ? 0.42 : 0.32 + (canFly(S.b, S.h, p) ? 0.12 : 0), done: land }; UG.sfx.whoosh(); }
  else land();
}
function take(g, i) {
  const o = S.b[i]; S.b[i] = 0; S.removing = false; S.msg = ''; S.msgT = 0;
  const [x, y] = PTS[i];
  S.fades.push({ i, p: o, k: 0 });
  UG.sfx.hit(); g.burst(x, y, 16, { c: [S.col[o].f, S.col[o].d, '#e8dcc2'], v0: 60, v1: 240, g: 420, l1: 0.7 });
  g.pop('Taken', x, y - 34, { c: o === 1 && mode.ai ? '#e9a7a0' : '#ffd76a', size: 24, max: 0.9 });
  g.say(`${name(3 - o)} took a piece`);
  endTurn(g, true);
}
function endTurn(g, captured) {
  S.plies++;
  const placing = S.h[1] > 0 || S.h[2] > 0;
  S.quiet = captured || placing ? 0 : S.quiet + 1;
  S.turn = 3 - S.turn;
  const p = S.turn;
  if (lost(S.b, S.h, p)) return finish(g, 3 - p, count(S.b, p) + S.h[p] < 3 ? 'pieces' : 'blocked');
  if (!placing) {
    const key = S.b.join('') + p;
    const n = (S.seen.get(key) || 0) + 1; S.seen.set(key, n);
    if (n >= 3) return finish(g, 0, 'repeat');
    if (S.quiet >= 60) return finish(g, 0, 'quiet');
  }
  if (phaseOf(p) === 'fly' && !(S.flew && S.flew[p])) { S.flew = S.flew || {}; S.flew[p] = 1; S.msg = `${name(p)} is down to three: flying!`; S.msgT = 2.4; }
  else if (!placing && S.plies === 18 && !S.movedTold) { S.movedTold = 1; S.msg = 'All placed. Now slide along the lines'; S.msgT = 2.6; }
  if (mode.ai && p === 2) S.thinking = 0.45;
  else if (!mode.ai) g.say(`${name(p)} to play`);
}
function finish(g, winner, why) {
  S.over = true; g.state = 'over';
  const L = mode.level, mine = winner === 1, left = count(S.b, 1) + S.h[1];
  const whyTxt = { pieces: 'down to two pieces', blocked: 'with no move left', repeat: 'by repetition', quiet: 'after 30 moves each without a capture' }[why];
  setTimeout(() => {
    if (!mode.ai) {
      UG.track('finish', { two: 1 });
      if (winner) UG.sfx.fanfare();
      g.screen({ kicker: winner ? `Player ${3 - winner} is ${whyTxt}` : `A draw ${whyTxt}`, title: winner ? `Player ${winner} wins!` : 'A draw', big: undefined,
        lines: [`Moves played: ${Math.ceil(S.plies / 2)}`], primary: { label: 'Play again', on: () => { g.hide(); UG.between(g, () => newGame(g)); } },
        secondary: { label: 'Change opponent', on: () => menu(g) }, cta: true });
      return;
    }
    let score = 0, nb = 0;
    if (mine) {
      score = L.base + left * 20 + Math.max(0, 60 - Math.ceil(S.plies / 2)) * 2;
      wins[L.id] = (wins[L.id] || 0) + 1; UG.store.set('ug-morris-wins', wins);
      nb = g.setBest(score); UG.sfx.fanfare(); UG.sfx.cheer(0.14);
    } else if (winner) { UG.sfx.fail(); } else UG.sfx.groan();
    UG.track('finish', { level: L.id, result: mine ? 'win' : winner ? 'loss' : 'draw' });
    const title = mine ? `You beat the ${L.name}!` : winner ? `The ${L.name} wins` : 'A draw';
    g.screen({ kicker: mine ? `${name(2)} is ${whyTxt}` : winner ? `You are ${whyTxt}` : `Drawn ${whyTxt}`, title, big: mine ? score : undefined, sub: mine ? 'points' : undefined,
      lines: [mine ? `Pieces left: ${left} · moves: ${Math.ceil(S.plies / 2)}` : `Moves played: ${Math.ceil(S.plies / 2)}`, `Wins against the ${L.name}: ${wins[L.id] || 0}`, mine ? g.bestLine(nb) : (L.id > 1 ? 'Tip: build two mills that share a point, then open and close one.' : 'Tip: block their two-in-a-row before it becomes a mill.')],
      primary: { label: mine && L.id < 3 ? `Face the ${LEVELS[L.id].name}` : 'Play again', on: () => { if (mine && L.id < 3) mode.level = LEVELS[L.id]; g.hide(); UG.between(g, () => newGame(g)); } },
      secondary: mine ? { label: 'Challenge a friend', on: () => g.share(`I beat the ${L.name} at Nine Men's Morris with ${left} pieces left. Can you?`) } : { label: 'Change opponent', on: () => menu(g) },
      cta: true });
  }, 700);
}
function menu(g) {
  g.state = 'menu';
  const w = l => wins[l.id] ? ` · won ${wins[l.id]}` : '';
  g.screen({ kicker: 'Medieval board game', title: "Nine Men's Morris",
    html: '<ol class="ug-howto"><li>Take turns placing nine pieces on the points.</li><li>Then slide one piece along a line to the next empty point.</li><li>Three in a row is a mill: take one of their pieces. Leave them two, or no move, to win.</li></ol>',
    choices: LEVELS.map(l => ({ label: `Play the ${l.name}`, sub: l.sub + w(l), on: () => { mode = { ai: true, level: l }; g.hide(); UG.between(g, () => newGame(g)); } }))
      .concat([{ label: 'Two players', sub: 'Pass and play on this device', on: () => { mode = { ai: false, level: LEVELS[1] }; g.hide(); UG.between(g, () => newGame(g)); } }]) });
}

/* ---------- input ---------- */
function nearest(x, y, max = 40) {
  let bi = -1, bd = max;
  PTS.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; bi = i; } });
  return bi;
}
function act(g, i) {
  if (g.state !== 'play' || S.over || S.anim || S.wait || !human(S.turn) || (mode.ai && S.turn === 2)) return;
  const p = S.turn, o = 3 - p;
  if (i < 0) { S.sel = -1; return; }
  if (S.removing) {
    if (S.b[i] === o && removable(S.b, o).includes(i)) return take(g, i);
    if (S.b[i] === o) { S.msg = 'That piece is in a mill. Take another'; S.msgT = 99; UG.sfx.click(); g.shake(3, 0.12); }
    return;
  }
  if (S.h[p] > 0) {
    if (!S.b[i]) return play(g, { f: -1, t: i }, false);
    UG.sfx.click(); return;
  }
  if (S.b[i] === p) {
    if (!targets(i).length) { S.sel = -1; S.msg = 'That piece is blocked'; S.msgT = 1.4; UG.sfx.click(); return; }
    S.sel = i; UG.sfx.click(); return;
  }
  if (S.sel >= 0 && !S.b[i] && targets(S.sel).includes(i)) return play(g, { f: S.sel, t: i }, false);
  S.sel = -1;
}

/* ---------- drawing ---------- */
function piece(ctx, x, y, c, r = 25, a = 1, glow = 0) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 5, r, r * 0.9, 0, 0, 6.283); ctx.fill();
  if (glow) { ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 18 * glow; }
  const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, shade(c.f, 0.35)); gr.addColorStop(0.7, c.f); gr.addColorStop(1, shade(c.f, -0.35));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, r * 0.16); ctx.strokeStyle = c.d; ctx.beginPath(); ctx.arc(x, y, r * 0.66, 0, 6.283); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke();
  ctx.fillStyle = c.d; ctx.beginPath(); ctx.arc(x, y, r * 0.16, 0, 6.283); ctx.fill();
  ctx.restore();
}
function shade(hex, k) {
  const n = parseInt(String(hex).replace('#', ''), 16); let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  const f = v => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k));
  return `rgb(${f(r)},${f(gg)},${f(b)})`;
}
let grain = null;
function board(ctx, g) {
  const bg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 520); bg.addColorStop(0, '#3a2a1c'); bg.addColorStop(1, '#120d09');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const bx = 14, by = Y0 - 22, bw = W - 28, bh = 6 * U + 44;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx + 4, by + 8, bw, bh);
  const wd = ctx.createLinearGradient(bx, by, bx + bw, by + bh); wd.addColorStop(0, '#a8763f'); wd.addColorStop(0.5, '#93622f'); wd.addColorStop(1, '#7a4f25');
  ctx.fillStyle = wd; ctx.fillRect(bx, by, bw, bh);
  if (!grain) { const r = UG.seeded(9); grain = Array.from({ length: 26 }, () => [r() * bh, r() * 8 - 4, 0.05 + r() * 0.08]); }
  ctx.lineWidth = 1.2;
  for (const [y, w, a] of grain) { ctx.strokeStyle = `rgba(60,34,14,${a})`; ctx.beginPath(); ctx.moveTo(bx, by + y); ctx.bezierCurveTo(bx + bw * 0.3, by + y + w * 3, bx + bw * 0.7, by + y - w * 3, bx + bw, by + y + w); ctx.stroke(); }
  ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 3; ctx.strokeRect(bx + 1.5, by + 1.5, bw - 3, bh - 3);
  // the lines, carved: a dark groove with a light lower edge
  const path = () => {
    ctx.beginPath();
    for (let r = 0; r < 3; r++) { const [ax, ay] = PTS[r * 8], [cx, cy] = PTS[r * 8 + 4]; ctx.rect(ax, ay, cx - ax, cy - ay); }
    for (const k of [1, 3, 5, 7]) { const [ax, ay] = PTS[k], [cx, cy] = PTS[16 + k]; ctx.moveTo(ax, ay); ctx.lineTo(cx, cy); }
  };
  ctx.save(); ctx.translate(0, 1.5); path(); ctx.strokeStyle = 'rgba(255,225,170,.35)'; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
  path(); ctx.strokeStyle = '#2a1708'; ctx.lineWidth = 5; ctx.stroke();
  for (const [x, y] of PTS) { ctx.fillStyle = '#2a1708'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, 6.283); ctx.fill(); ctx.fillStyle = '#4a2c12'; ctx.beginPath(); ctx.arc(x, y + 1, 5, 0, 6.283); ctx.fill(); }
}
function hand(ctx, p) {
  for (let i = 0; i < S.h[p]; i++) {
    if (S.anim && S.anim.f < 0 && S.anim.p === p && i === S.h[p] - 1) continue;
    const [x, y] = handPos(p, i); piece(ctx, x, y, S.col[p], 13);
  }
}
function hud(ctx, g) {
  ctx.fillStyle = 'rgba(12,10,8,.72)'; ctx.fillRect(0, 0, W, 56); ctx.fillStyle = 'rgba(212,175,90,.6)'; ctx.fillRect(0, 56, W, 1.5);
  UG.drawShield(ctx, myShield, 24, 28, 38); UG.drawShield(ctx, oppShield, W - 24, 28, 38);
  ctx.textBaseline = 'middle'; ctx.font = UG.font(13, 700);
  const t1 = S.turn === 1 && !S.over, t2 = S.turn === 2 && !S.over;
  ctx.textAlign = 'left'; ctx.fillStyle = t1 ? '#ffd76a' : '#a8997c'; ctx.fillText(name(1).slice(0, 16), 48, 19);
  ctx.textAlign = 'right'; ctx.fillStyle = t2 ? '#ffd76a' : '#a8997c'; ctx.fillText(name(2).slice(0, 16), W - 48, 19);
  ctx.font = UG.font(11, 500); ctx.fillStyle = '#e8dcc2';
  ctx.textAlign = 'left'; ctx.fillText(`${count(S.b, 1)} on board · ${S.h[1]} in hand`, 48, 38);
  ctx.textAlign = 'right'; ctx.fillText(`${count(S.b, 2)} on board · ${S.h[2]} in hand`, W - 48, 38);
  // whose turn: a small piece in the middle that slides to the side to move
  const k = S.turn === 1 ? 0 : 1;
  S.tx = lerp(S.tx === undefined ? k : S.tx, k, 0.2);
  piece(ctx, W / 2 - 18 + S.tx * 36, 28, S.col[S.turn], 11);
  if (mode.ai && !S.over) { ctx.textAlign = 'center'; ctx.font = UG.font(9, 700); ctx.fillStyle = '#a8997c'; ctx.fillText(mode.level.name.toUpperCase(), W / 2, 47); }
}
function status(ctx, g) {
  let t = '';
  const p = S.turn, ph = phaseOf(p);
  if (S.over) t = '';
  else if (S.removing) t = S.msgT > 0 && S.msg ? S.msg : 'Mill! Take one of their pieces';
  else if (mode.ai && p === 2) t = `${name(2)} is thinking…`;
  else if (ph === 'place') t = (mode.ai ? '' : `Player ${p}: `) + 'tap a point to place a piece';
  else if (ph === 'fly') t = (mode.ai ? '' : `Player ${p}: `) + (S.sel >= 0 ? 'fly it to any empty point' : 'three left: pick a piece to fly anywhere');
  else t = (mode.ai ? '' : `Player ${p}: `) + (S.sel >= 0 ? 'tap a glowing point to move there' : 'pick a piece to slide along a line');
  if (S.msgT > 0 && S.msg && !S.removing) t = S.msg;
  if (!t) return;
  ctx.font = UG.font(16, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = Math.min(W - 20, ctx.measureText(t).width + 32);
  ctx.fillStyle = S.removing ? 'rgba(122,16,32,.92)' : 'rgba(12,10,8,.72)'; ctx.fillRect(W / 2 - w / 2, 678, w, 32);
  ctx.fillStyle = '#fff3cf'; ctx.fillText(t, W / 2, 695);
}

UG.start({
  id: 'morris', title: "Nine Men's Morris", label: "Nine Men's Morris board game", W, H,
  init(g) {
    me = UG.player(); myShield = UG.shield(me.design);
    opp = UG.randomKnight(); oppShield = UG.shield(opp.design);
    S = { b: new Int8Array(24), h: [0, 9, 9], turn: 1, sel: -1, fades: [], col: colours(), over: false, plies: 0, msgT: 0 };
    [0, 3, 9, 13, 17, 20].forEach((i, n) => { S.b[i] = n % 2 ? 2 : 1; });
    S.h = [0, 6, 6];
    menu(g);
  },
  update(g, dt) {
    if (S.msgT > 0 && S.msgT < 90) S.msgT -= dt;
    if (S.mill) { S.mill.t += dt; if (S.mill.t > 1.1) S.mill = null; }
    for (const f of S.fades) f.k += dt / 0.45; S.fades = S.fades.filter(f => f.k < 1);
    if (S.anim) { S.anim.k += dt / S.anim.dur; if (S.anim.k >= 1) S.anim.done(); return; }
    if (S.wait) { S.wait.t -= dt; if (S.wait.t <= 0) { const f = S.wait.fn; S.wait = null; f(); } return; }
    if (g.state !== 'play' || S.over) return;
    if (mode.ai && S.turn === 2 && S.thinking > 0) {
      S.thinking -= dt;
      if (S.thinking <= 0) {
        S.thinking = 0;
        const m = think(S.b, S.h, 2, mode.level);
        if (!m) return finish(g, 1, 'blocked');
        play(g, m, true);
      }
    }
  },
  draw(g, ctx) {
    board(ctx, g);
    const pulse = 0.5 + 0.5 * Math.sin(g.t * 6);
    // last move: a faint trail and ring
    if (S.last && !S.anim) {
      const [x1, y1] = PTS[S.last.t];
      if (S.last.f >= 0) { const [x0, y0] = PTS[S.last.f]; ctx.strokeStyle = 'rgba(255,215,106,.35)'; ctx.lineWidth = 4; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]); }
    }
    // mills just made glow along their line
    if (S.mill) {                                   // a mill's three points always lie on one straight line
      const k = 1 - S.mill.t / 1.1, pa = PTS[S.mill.pts[0]], pc = PTS[S.mill.pts[2]];
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pc[0], pc[1]); ctx.stroke(); ctx.restore();
    }
    const removing = S.removing ? removable(S.b, 3 - S.turn) : [];
    const tg = S.sel >= 0 ? targets(S.sel) : [];
    if (g.state === 'play' && !S.over && human(S.turn) && !(mode.ai && S.turn === 2) && !S.anim) {
      const place = !S.removing && S.h[S.turn] > 0 && S.hint;
      for (let i = 0; i < 24; i++) if ((place && !S.b[i]) || tg.includes(i)) {
        const [x, y] = PTS[i]; ctx.strokeStyle = `rgba(255,215,106,${place ? 0.25 + 0.2 * pulse : 0.55 + 0.4 * pulse})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, place ? 16 : 18 + pulse * 3, 0, 6.283); ctx.stroke();
      }
    }
    for (let i = 0; i < 24; i++) {
      const p = S.b[i]; if (!p) continue;
      if (S.anim && S.anim.f === i) continue;
      const [x, y] = PTS[i];
      const sel = i === S.sel, lift = sel ? 4 : 0;
      piece(ctx, x, y - lift, S.col[p], sel ? 27 : 25, 1, sel ? 0.8 + 0.2 * pulse : 0);
      if (removing.includes(i)) { ctx.strokeStyle = `rgba(255,90,70,${0.6 + 0.4 * pulse})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 30 + pulse * 2, 0, 6.283); ctx.stroke(); }
    }
    if (S.last && !S.anim && S.b[S.last.t]) { const [x, y] = PTS[S.last.t]; ctx.strokeStyle = 'rgba(255,243,207,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 29, 0, 6.283); ctx.stroke(); }
    for (const f of S.fades) { const [x, y] = PTS[f.i], k = ease.inCubic(f.k); piece(ctx, x, y - k * 30, S.col[f.p], 25 * (1 - k * 0.6), 1 - k); }
    if (S.anim) {
      const A = S.anim, k = ease.outCubic(clamp(A.k, 0, 1)), hop = Math.sin(Math.PI * k) * (A.f < 0 ? 60 : 26);
      piece(ctx, lerp(A.x0, A.x1, k), lerp(A.y0, A.y1, k) - hop, S.col[A.p], lerp(A.f < 0 ? 13 : 25, 25, k) + hop * 0.06);
    }
    if (S.kb && g.state === 'play' && !S.over) { const [x, y] = PTS[S.cur]; ctx.strokeStyle = '#7ec8ff'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x, y, 33, 0, 6.283); ctx.stroke(); ctx.setLineDash([]); }
    hand(ctx, 2); hand(ctx, 1);
    if (g.state !== 'menu') { hud(ctx, g); status(ctx, g); }
  },
  down(g, x, y) {
    if (g.state !== 'play') return;
    S.kb = false;
    const i = nearest(x, y);
    S.dragFrom = (i >= 0 && S.b[i] === S.turn && S.h[S.turn] === 0 && !S.removing) ? i : -1;
    act(g, i);
  },
  up(g, x, y) {
    if (g.state !== 'play' || S.dragFrom === undefined || S.dragFrom < 0) return;
    const i = nearest(x, y), f = S.dragFrom; S.dragFrom = -1;
    if (i >= 0 && i !== f && S.sel === f && !S.b[i] && targets(f).includes(i)) play(g, { f, t: i }, false);
  },
  key(g, key, down) {
    if (!down || g.state !== 'play') return;
    const dirs = { ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0], ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1] };
    if (dirs[key]) {
      if (!S.kb) { S.kb = true; return; }
      const [dx, dy] = dirs[key], [cx, cy] = PTS[S.cur];
      let bi = -1, bd = Infinity;
      PTS.forEach(([x, y], i) => {
        const vx = x - cx, vy = y - cy, along = vx * dx + vy * dy, side = Math.abs(vx * dy - vy * dx);
        if (along <= 1 || side > along * 1.2) return;
        const d = along + side * 2; if (d < bd) { bd = d; bi = i; }
      });
      if (bi >= 0) S.cur = bi;
      return;
    }
    if (key === ' ' || key === 'Spacebar' || key === 'Enter') { S.kb = true; act(g, S.cur); }
  },
});
// test hook, only on a local server
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__ug = { st: () => S, think, gen, LEVELS, mode: () => mode };
})();
