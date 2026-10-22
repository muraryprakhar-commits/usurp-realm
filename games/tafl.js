/* Viking Chess (Hnefatafl): the king and his guard try to reach a corner; the raiders try to trap the king.
   Two boards: Brandubh (7x7, quick) and Tablut (9x9, the larger classic). Play either side against the computer,
   or a friend on one device. */
(function () {
'use strict';
const { clamp, lerp, ease } = UG;
const W = 540, H = 720, BX = 18, BY = 112, BS = 504;
const VARIANTS = {
  7: { n: 7, name: 'Brandubh', sub: '7 by 7: a quick game',
       att: ['3,0', '3,1', '3,5', '3,6', '0,3', '1,3', '5,3', '6,3'], def: ['3,2', '3,4', '2,3', '4,3'] },
  9: { n: 9, name: 'Tablut', sub: '9 by 9: the larger classic',
       att: ['3,0', '4,0', '5,0', '4,1', '3,8', '4,8', '5,8', '4,7', '0,3', '0,4', '0,5', '1,4', '8,3', '8,4', '8,5', '7,4'],
       def: ['4,2', '4,3', '4,5', '4,6', '2,4', '3,4', '5,4', '6,4'] },
};
const LEVELS = [
  { id: 1, name: 'Easy', sub: 'Learning the game', depth: 1, ms: 80, slip: 0.3, base: 100 },
  { id: 2, name: 'Normal', sub: 'Looks a couple of moves ahead', depth: 3, ms: 350, slip: 0, base: 250 },
  { id: 3, name: 'Hard', sub: 'Thinks deeper, punishes mistakes', depth: 8, ms: 900, slip: 0, base: 500 },
];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// 0 empty, 1 raider (attacker), 2 guard (defender), 3 king. Side 1 = raiders, side 2 = defenders.
let N = 7, NN = 49, THRONE = 24, CORNER = null, CS = 72;
function setSize(n) {
  N = n; NN = n * n; THRONE = (NN - 1) / 2; CS = BS / n;
  CORNER = new Uint8Array(NN); for (const i of [0, n - 1, NN - n, NN - 1]) CORNER[i] = 1;
}
const xy = i => [i % N, (i / N) | 0];
const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? -1 : y * N + x);
const own = (v, side) => (side === 1 ? v === 1 : v === 2 || v === 3);
function start(n) {
  setSize(n);
  const B = new Int8Array(NN), V = VARIANTS[n];
  for (const s of V.att) { const [x, y] = s.split(',').map(Number); B[at(x, y)] = 1; }
  for (const s of V.def) { const [x, y] = s.split(',').map(Number); B[at(x, y)] = 2; }
  B[THRONE] = 3;
  return B;
}

/* ---------- rules ---------- */
function gen(B, side) {
  const out = [];
  for (let i = 0; i < NN; i++) {
    const v = B[i]; if (!v || !own(v, side)) continue;
    const king = v === 3, [x, y] = xy(i);
    for (const [dx, dy] of DIRS) {
      let cx = x + dx, cy = y + dy;
      while (cx >= 0 && cy >= 0 && cx < N && cy < N) {
        const j = cy * N + cx;
        if (B[j]) break;
        if (!king && (j === THRONE || CORNER[j])) break;     // only the king may stand on the throne or a corner, or cross the throne
        out.push(i * 128 + j);
        cx += dx; cy += dy;
      }
    }
  }
  return out;
}
function kingTaken(B, k) {
  const [x, y] = xy(k), [tx, ty] = xy(THRONE), A = j => j >= 0 && B[j] === 1;
  const nb = DIRS.map(([dx, dy]) => at(x + dx, y + dy));
  if (k === THRONE) return nb.every(A);                                          // on the throne: four raiders
  if (Math.abs(x - tx) + Math.abs(y - ty) === 1) return nb.every(j => j === THRONE || A(j));   // beside it: three, and the throne
  return false;
}
// Captures caused by the piece that just moved to t. Returns the captured squares.
function captures(B, t) {
  const v = B[t], side = v === 1 ? 1 : 2, out = [];
  const [x, y] = xy(t);
  for (const [dx, dy] of DIRS) {
    const n = at(x + dx, y + dy); if (n < 0) continue;
    const nv = B[n]; if (!nv) continue;
    const far = at(x + 2 * dx, y + 2 * dy);
    if (nv === 3) {
      if (side !== 1) continue;
      const [kx, ky] = xy(n), [tx, ty] = xy(THRONE), nearThrone = Math.abs(kx - tx) + Math.abs(ky - ty) <= 1;
      if (nearThrone) { if (kingTaken(B, n)) out.push(n); }
      else if (far >= 0 && (B[far] === 1 || CORNER[far])) out.push(n);           // away from the throne the king falls to two raiders
      continue;
    }
    if (own(nv, side) || far < 0) continue;
    const fv = B[far];
    if (own(fv, side) || CORNER[far] || (far === THRONE && !fv)) out.push(n);      // corners and the empty throne side with the attacker
  }
  return out;
}
// Plays move m in place; returns an undo record. rec.win: 1 raiders won (king taken), 2 defenders won (king escaped).
function make(B, m) {
  const f = m >> 7, t = m & 127, v = B[f];
  B[f] = 0; B[t] = v;
  const caps = captures(B, t), rec = { f, t, v, caps: caps.map(c => [c, B[c]]), win: 0 };
  for (const c of caps) { if (B[c] === 3) rec.win = 1; B[c] = 0; }
  if (v === 3 && CORNER[t]) rec.win = 2;
  return rec;
}
function unmake(B, rec) { for (const [c, cv] of rec.caps) B[c] = cv; B[rec.t] = 0; B[rec.f] = rec.v; }

/* ---------- the computer ---------- */
const WIN = 100000;
function kingSquare(B) { for (let i = 0; i < NN; i++) if (B[i] === 3) return i; return -1; }
function cornersInOne(B, k) {
  let n = 0;
  const [x, y] = xy(k);
  for (const [dx, dy] of DIRS) {
    let cx = x + dx, cy = y + dy, j = -1;
    while (cx >= 0 && cy >= 0 && cx < N && cy < N) { j = cy * N + cx; if (B[j]) { j = -1; break; } cx += dx; cy += dy; }
    if (j >= 0 && CORNER[j]) n++;
  }
  return n;
}
// From the defenders' side: material, the king's routes to the corners, and how boxed in he is.
function evalDef(B) {
  let att = 0, def = 0;
  for (let i = 0; i < NN; i++) { if (B[i] === 1) att++; else if (B[i] === 2) def++; }
  const k = kingSquare(B); if (k < 0) return -WIN;
  const [x, y] = xy(k);
  let adj = 0, mob = 0, two = 0;
  for (const [dx, dy] of DIRS) { const j = at(x + dx, y + dy); if (j >= 0 && B[j] === 1) adj++; }
  const one = cornersInOne(B, k);
  // squares the king can reach in one move, and from how many of them a corner is open
  for (const [dx, dy] of DIRS) {
    let cx = x + dx, cy = y + dy;
    while (cx >= 0 && cy >= 0 && cx < N && cy < N) {
      const j = cy * N + cx; if (B[j]) break;
      mob++;
      if (!CORNER[j]) { B[j] = 3; B[k] = 0; if (cornersInOne(B, j)) two++; B[k] = 3; B[j] = 0; }
      cx += dx; cy += dy;
    }
  }
  const scale = 9 / N;
  return 34 * def - 20 * att * (N === 9 ? 0.75 : 1) + 260 * one + 30 * Math.min(two, 4) + 2 * mob - 16 * adj * scale;
}
let deadline = 0, nodes = 0;
const TIMEOUT = {};
function order(B, ms, side) {
  const k = kingSquare(B), [kx, ky] = k >= 0 ? xy(k) : [0, 0];
  const score = m => {
    const f = m >> 7, t = m & 127, [x, y] = xy(t); let s = 0;
    if (side === 2 && B[f] === 3) s += 30 + (CORNER[t] ? 1000 : 0);
    s -= Math.abs(x - kx) + Math.abs(y - ky);                    // near the king is where the game is decided
    return s;
  };
  return ms.map(m => [score(m), m]).sort((a, b) => b[0] - a[0]).map(a => a[1]);
}
function negamax(B, side, depth, alpha, beta, ply) {
  if ((++nodes & 511) === 0 && performance.now() > deadline) throw TIMEOUT;
  const ms = gen(B, side);
  if (!ms.length) return -WIN + ply;
  if (depth === 0) { const e = evalDef(B); return side === 2 ? e : -e; }
  let best = -Infinity;
  for (const m of order(B, ms, side)) {
    const r = make(B, m);
    let v;
    if (r.win) v = (r.win === side ? WIN - ply : -WIN + ply);
    else v = -negamax(B, 3 - side, depth - 1, -beta, -alpha, ply + 1);
    unmake(B, r);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}
function think(B0, side, L) {
  const B = Int8Array.from(B0);
  let ms = gen(B, side);
  if (!ms.length) return -1;
  for (let i = ms.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ms[i], ms[j]] = [ms[j], ms[i]]; }
  // never miss an immediate win
  for (const m of ms) { const r = make(B, m); unmake(B, r); if (r.win === side) return m; }
  if (L.slip && Math.random() < L.slip) return ms[0];
  ms = order(B, ms, side);
  deadline = performance.now() + L.ms; nodes = 0;
  let pick = ms[0];
  for (let d = 1; d <= L.depth; d++) {
    try {
      let best = -Infinity, bm = ms[0], alpha = -Infinity;
      const scored = [];
      for (const m of ms) {
        const r = make(B, m);
        const v = r.win ? (r.win === side ? WIN : -WIN) : -negamax(B, 3 - side, d - 1, -Infinity, -alpha, 1);
        unmake(B, r);
        scored.push([v, m]);
        if (v > best) { best = v; bm = m; }
        if (v > alpha) alpha = v;
      }
      pick = bm;
      scored.sort((a, b) => b[0] - a[0]); ms = scored.map(s => s[1]);
      if (best >= WIN - 50 || best <= -WIN + 50) break;
    } catch (e) { if (e !== TIMEOUT) throw e; break; }
  }
  return pick;
}

/* ---------- lessons: five small puzzles that teach the rules on a 7 by 7 board ---------- */
// p: pieces as [x, y, kind] with kind 1 raider, 2 guard, 3 king. side: who the learner plays. ok(rec, f, t): success test.
const LESSONS = [
  { title: 'Moving', side: 2, text: 'Every piece slides any number of empty squares in a straight line, like a rook in chess. Tap the guard, then the gold square.',
    p: [[3, 5, 2], [3, 3, 3], [0, 3, 1], [3, 0, 1]], target: [6, 5], ok: (r, f, t) => t === at(6, 5), hint: 'Straight lines only: tap the guard, then the gold square.' },
  { title: 'Taking a piece', side: 2, text: 'Trap a raider between two of your pieces, in a straight line, to take it. Slide your guard up to the gold square.',
    p: [[2, 1, 2], [3, 1, 1], [4, 5, 2], [3, 3, 3], [0, 3, 1]], target: [4, 1], ok: r => r.caps.length > 0, hint: 'Close the trap: the raider must end up between two guards.' },
  { title: 'Corners help', side: 2, text: 'Corners count as one of your pieces. Trap the raider against the corner.',
    p: [[1, 0, 1], [2, 4, 2], [3, 3, 3], [6, 3, 1]], target: [2, 0], ok: r => r.caps.length > 0, hint: 'Put your guard on the other side of the raider from the corner.' },
  { title: 'The king escapes', side: 2, text: 'The defenders win when the king reaches any corner. Tap the king (the crown), then a corner.',
    p: [[6, 3, 3], [0, 3, 1], [3, 0, 1], [3, 6, 1], [4, 3, 2]], target: [6, 0], ok: r => r.win === 2, hint: 'The king slides like the others: straight up to the corner.' },
  { title: 'Trapping the king', side: 1, text: 'Now you lead the raiders. Away from the throne, two raiders on opposite sides take the king. Close the trap.',
    p: [[5, 1, 3], [4, 1, 1], [6, 4, 1], [1, 5, 2], [0, 3, 1]], target: [6, 1], ok: r => r.win === 1, hint: 'Slide the lower raider up so the king is between two raiders.' },
];
function lessonBoard(L) {
  setSize(7);
  const B = new Int8Array(NN);
  for (const [x, y, k] of L.p) B[at(x, y)] = k;
  return B;
}

/* ---------- game state ---------- */
let S = null, me = null, myShield = null, opp = null, oppShield = null, games = 0;
let mode = { ai: true, me: 2, n: 7, level: LEVELS[1], lesson: false };
const wins = UG.store.get('ug-tafl-wins', {});
function lum(hex) {
  const v = parseInt(String(hex).replace('#', ''), 16), c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(a => { a /= 255; return a <= 0.03928 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function colours() {
  const p = me.design, mine = { f: p.f || '#1f4e8a', d: p.d && p.d !== p.f ? p.d : '#d4af5a' };
  let other = { f: opp.design.f, d: opp.design.d && opp.design.d !== opp.design.f ? opp.design.d : '#d4af5a' };
  if (!mode.ai) { mine.f = '#efe6d0'; mine.d = '#7a1020'; other = { f: '#1d1915', d: '#c9a84f' }; }
  else if (Math.abs(lum(mine.f) - lum(other.f)) < 0.3) other = lum(mine.f) > 0.4 ? { f: '#1d1915', d: '#c9a84f' } : { f: '#efe6d0', d: '#7a1020' };
  // side 2 is the defenders; in two-player mode the defenders are light
  return mode.ai ? (mode.me === 2 ? { 1: other, 2: mine } : { 1: mine, 2: other }) : { 1: other, 2: mine };
}
const SIDE = { 1: 'Raiders', 2: 'Defenders' };
function who(side) { return mode.ai ? (side === mode.me ? 'You' : opp.name.split(' of ')[0]) : SIDE[side]; }
function newLesson(g, i) {
  const L = LESSONS[i];
  mode = { ai: true, me: L.side, n: 7, level: mode.level || LEVELS[1], lesson: true };
  opp = { name: 'Lesson', design: { name: 'Raiders', motto: '', f: '#1d1915', d: '#c9a84f', c: '#c9a84f', div: 'plain', ch: 'raven', bg: 'clear' } };
  oppShield = UG.shield(opp.design);
  S = { B: lessonBoard(L), turn: L.side, sel: -1, anim: null, fades: [], last: null, think: 0, over: false, plies: 0, quiet: 0, seen: new Map(), col: colours(),
        msg: '', msgT: 0, cur: THRONE, kb: false, wait: null, taken: { 1: 0, 2: 0 }, lesson: { i, L, done: false } };
  g.state = 'play';
  if (i === 0) UG.track('lesson');
  g.say(`Lesson ${i + 1}: ${L.title}. ${L.text}`);
}
function lessonCheck(g, r, f, t) {
  const Ls = S.lesson, ok = Ls.L.ok(r, f, t);
  Ls.done = true;
  if (ok) {
    UG.sfx.coin(); g.pop('Well done!', W / 2, 330, { c: '#9fe08a', size: 30, max: 1.2 });
    S.msg = Ls.i + 1 < LESSONS.length ? 'Well done! Next lesson…' : 'You know the rules!'; S.msgT = 1.4;
    S.wait = { t: 1.5, fn: () => { if (Ls.i + 1 < LESSONS.length) newLesson(g, Ls.i + 1); else lessonsDone(g); } };
  } else {
    UG.sfx.groan(); S.msg = 'Not quite. ' + Ls.L.hint; S.msgT = 2.4;
    S.wait = { t: 2.2, fn: () => newLesson(g, Ls.i) };
  }
}
function lessonsDone(g) {
  UG.store.set('ug-tafl-learned', 1); UG.track('learned');
  mode.lesson = false; g.state = 'menu';
  g.screen({ kicker: 'Lessons complete', title: 'You know the rules',
    html: '<ul class="ug-rules"><li>On the throne the king needs <b>four raiders</b> around him; beside it, <b>three</b> and the throne.</li>'
      + '<li>You may move <b>between two enemies</b> safely: only the move that closes a trap takes.</li>'
      + '<li>In a game, <b>red rings</b> mark your pieces in danger and <b>red dots</b> mark moves that take a piece.</li></ul>',
    choices: [
      { label: 'Defend the king · Brandubh', sub: 'Easy computer: a good first game', on: () => { mode = { ai: true, me: 2, n: 7, level: LEVELS[0], lesson: false }; g.hide(); UG.between(g, () => newGame(g)); } },
      { label: 'Lead the raiders · Brandubh', sub: 'Easy computer', on: () => { mode = { ai: true, me: 1, n: 7, level: LEVELS[0], lesson: false }; g.hide(); UG.between(g, () => newGame(g)); } },
      { label: 'All games', sub: 'Boards, sides and levels', on: () => menu(g) },
    ] });
}
function newGame(g) {
  games++;
  opp = mode.ai ? UG.randomKnight() : { name: 'Raiders', design: { name: 'Raiders', motto: '', f: '#1d1915', d: '#c9a84f', c: '#c9a84f', div: 'plain', ch: 'raven', bg: 'clear' } };
  oppShield = UG.shield(opp.design);
  S = { B: start(mode.n), turn: 1, sel: -1, anim: null, fades: [], last: null, think: 0, over: false, plies: 0, quiet: 0, seen: new Map(), col: colours(),
        msg: '', msgT: 0, cur: THRONE, kb: false, wait: null, taken: { 1: 0, 2: 0 } };
  g.state = 'play';
  S.msg = mode.ai ? (mode.me === 2 ? 'Raiders move first. Get the king to a corner' : 'You move first. Trap the king') : 'Raiders (dark) move first'; S.msgT = 2.6;
  if (mode.ai && mode.me !== 1) S.think = 0.7;
  UG.track('play', { n: mode.n, level: mode.ai ? mode.level.id : 0, side: mode.me });
  g.say(S.msg);
}
const isHuman = side => !mode.ai || side === mode.me;
function cellXY(i) { const [x, y] = xy(i); return [BX + (x + 0.5) * CS, BY + (y + 0.5) * CS]; }
function dests(f) { return gen(S.B, S.turn).filter(m => (m >> 7) === f).map(m => m & 127); }
function play(g, m, animate) {
  const f = m >> 7, t = m & 127, v = S.B[f];
  const [x0, y0] = cellXY(f), [x1, y1] = cellXY(t);
  S.sel = -1;
  const land = () => {
    S.anim = null;
    const r = make(S.B, m);
    S.last = { f, t };
    UG.sfx.thunk(); g.burst(x1, y1, 5, { c: ['#c8a46a', '#8a6237'], v0: 30, v1: 100, g: 300, l1: 0.35, s0: 1.5, s1: 3 });
    for (const [c, cv] of r.caps) {
      const [cx, cy] = cellXY(c);
      S.fades.push({ i: c, v: cv, k: 0 }); S.taken[cv === 1 ? 1 : 2]++;
      g.burst(cx, cy, 14, { c: [S.col[cv === 1 ? 1 : 2].f, S.col[cv === 1 ? 1 : 2].d, '#e8dcc2'], v0: 60, v1: 220, g: 420, l1: 0.7 });
      if (cv !== 3) g.pop('Taken', cx, cy - 30, { c: '#ffd76a', size: 22, max: 0.8 });
    }
    if (r.caps.length) { UG.sfx.hit(); UG.buzz(25); g.shake(4, 0.15); }
    if (S.lesson) return lessonCheck(g, r, f, t);
    if (r.caps.length && !S.capTold && isHuman(S.turn) && r.caps.some(([, cv]) => cv !== 3)) { S.capTold = 1; S.msg = 'Taken: trapped between two of your pieces'; S.msgT = 2; }
    if (r.win) return finish(g, r.win, r.win === 2 ? 'escape' : 'taken');
    endTurn(g, r.caps.length > 0);
  };
  if (animate) { S.anim = { f, v, x0, y0, x1, y1, k: 0, dur: 0.2 + Math.hypot(x1 - x0, y1 - y0) / 1400, done: land }; UG.sfx.whoosh(); }
  else land();
}
function endTurn(g, captured) {
  S.plies++; S.quiet = captured ? 0 : S.quiet + 1;
  S.turn = 3 - S.turn;
  if (!gen(S.B, S.turn).length) return finish(g, 3 - S.turn, 'stuck');
  const key = S.B.join('') + S.turn, n = (S.seen.get(key) || 0) + 1; S.seen.set(key, n);
  if (n >= 3) return finish(g, 0, 'repeat');
  if (S.quiet >= 100) return finish(g, 0, 'quiet');
  const k = kingSquare(S.B);
  if (S.turn === 2 && cornersInOne(S.B, k) && isHuman(2)) { S.msg = 'A corner is open for the king!'; S.msgT = 2; }
  if (S.turn === 1 && cornersInOne(S.B, k) && isHuman(1)) { S.msg = 'Block the king: a corner is open!'; S.msgT = 2.2; }
  if (mode.ai && S.turn !== mode.me) S.think = 0.35;
  else g.say(`${who(S.turn)} to move`);
}
function finish(g, winner, why) {
  S.over = true; g.state = 'over';
  const L = mode.level, mine = mode.ai && winner === mode.me, V = VARIANTS[mode.n];
  const whyTxt = { escape: 'The king reached a corner', taken: 'The king was captured', stuck: `${winner ? SIDE[3 - winner] : 'A side'} had no move left`, repeat: 'The same position came round three times', quiet: '50 moves each without a capture' }[why];
  if (why === 'escape') { const [x, y] = cellXY(kingSquare(S.B)); g.burst(x, y, 40, { c: ['#ffd76a', '#fff3cf', '#e9c13d'], shape: 'dot', v0: 80, v1: 320, g: 200, l0: 0.6, l1: 1.2 }); }
  setTimeout(() => {
    if (!mode.ai) {
      UG.track('finish', { two: 1 });
      if (winner) UG.sfx.fanfare();
      g.screen({ kicker: whyTxt, title: winner ? `The ${SIDE[winner]} win!` : 'A draw', lines: [`${V.name} · moves: ${Math.ceil(S.plies / 2)}`],
        primary: { label: 'Play again', on: () => { g.hide(); UG.between(g, () => newGame(g)); } }, secondary: { label: 'Change game', on: () => menu(g) }, cta: true });
      return;
    }
    let score = 0, nb = 0;
    const key = `${mode.n}-${mode.me}-${L.id}`;
    if (mine) {
      const kept = mode.me === 2 ? countSide(2) : countSide(1);
      score = Math.round(L.base * (mode.n === 9 ? 1.5 : 1) + kept * 15 + Math.max(0, 50 - Math.ceil(S.plies / 2)) * 3);
      wins[key] = (wins[key] || 0) + 1; UG.store.set('ug-tafl-wins', wins);
      nb = g.setBest(score); UG.sfx.fanfare(); UG.sfx.cheer(0.14);
    } else if (winner) UG.sfx.fail(); else UG.sfx.groan();
    UG.track('finish', { n: mode.n, level: L.id, side: mode.me, result: mine ? 'win' : winner ? 'loss' : 'draw' });
    const role = mode.me === 2 ? 'defending the king' : 'leading the raiders';
    const next = L.id < 3 ? LEVELS[L.id] : null;
    g.screen({ kicker: whyTxt, title: mine ? 'Victory!' : winner ? 'Defeat' : 'A draw', big: mine ? score : undefined, sub: mine ? 'points' : undefined,
      lines: [`${V.name}, ${role}, ${L.name.toLowerCase()} · ${Math.ceil(S.plies / 2)} moves`, `Your wins here: ${wins[key] || 0}`,
        mine ? g.bestLine(nb) : (mode.me === 2 ? 'Tip: open two routes at once. The raiders can only block one.' : 'Tip: guard the squares next to the corners first.')],
      primary: { label: mine && next ? `Try ${next.name.toLowerCase()}` : 'Play again', on: () => { if (mine && next) mode.level = next; g.hide(); UG.between(g, () => newGame(g)); } },
      secondary: mine ? { label: 'Challenge a friend', on: () => g.share(`I won a game of Viking chess (${V.name}, ${L.name.toLowerCase()}) ${role}. Can you?`) } : { label: 'Change game', on: () => menu(g) },
      cta: true });
  }, why === 'escape' ? 1100 : 700);
}
function countSide(side) { let n = 0; for (const v of S.B) if (own(v, side)) n++; return n; }
function menu(g) {
  g.state = 'menu'; mode.lesson = false;
  const learned = UG.store.get('ug-tafl-learned', 0);
  const learn = { label: learned ? 'Lessons: the rules in 2 minutes' : 'New to Viking chess? Start here', sub: 'Five quick lessons on a real board', on: () => { g.hide(); newLesson(g, 0); } };
  const pickLevel = () => g.screen({ kicker: VARIANTS[mode.n].name, title: mode.me === 2 ? 'Defend the king' : 'Lead the raiders', sub: 'How strong should the computer play?',
    choices: LEVELS.map(l => ({ label: l.name, sub: l.sub, on: () => { mode.level = l; g.hide(); UG.between(g, () => newGame(g)); } })) });
  g.screen({ kicker: 'Hnefatafl, the Viking board game', title: 'Viking Chess',
    html: '<ol class="ug-howto"><li><b>Defenders</b> (with the crowned king) win if the king reaches any corner.</li><li><b>Raiders</b> win by trapping the king.</li><li>Pieces slide like rooks; trap an enemy between two of yours to take it.</li></ol>',
    choices: [
      ...(learned ? [] : [learn]),
      { label: 'Defend the king · Brandubh', sub: '7 by 7, about ten minutes', on: () => { mode = { ai: true, me: 2, n: 7, level: mode.level }; pickLevel(); } },
      { label: 'Defend the king · Tablut', sub: '9 by 9, the larger board', on: () => { mode = { ai: true, me: 2, n: 9, level: mode.level }; pickLevel(); } },
      { label: 'Lead the raiders · Brandubh', sub: 'Trap the king before he escapes', on: () => { mode = { ai: true, me: 1, n: 7, level: mode.level }; pickLevel(); } },
      { label: 'Two players · Brandubh', sub: 'Pass and play on this device', on: () => { mode = { ai: false, me: 2, n: 7, level: LEVELS[1], lesson: false }; g.hide(); UG.between(g, () => newGame(g)); } },
      ...(learned ? [learn] : []),
    ] });
}

/* ---------- input ---------- */
function cellAt(x, y) { const cx = Math.floor((x - BX) / CS), cy = Math.floor((y - BY) / CS); return at(cx, cy); }
function act(g, i) {
  if (g.state !== 'play' || S.over || S.anim || S.wait || !isHuman(S.turn) || S.think > 0 || (S.lesson && S.lesson.done)) return;
  if (i < 0) { S.sel = -1; return; }
  const v = S.B[i];
  if (v && own(v, S.turn)) {
    if (!dests(i).length) { S.sel = -1; S.msg = 'That piece is boxed in'; S.msgT = 1.3; UG.sfx.click(); return; }
    S.sel = i; UG.sfx.click(); return;
  }
  if (S.sel >= 0 && dests(S.sel).includes(i)) return play(g, S.sel * 128 + i, false);
  if (S.sel >= 0 && !v) { S.msg = 'Straight lines only, and no jumping'; S.msgT = 1.3; }
  S.sel = -1;
}

/* ---------- drawing ---------- */
function shade(hex, k) {
  const n = parseInt(String(hex).replace('#', ''), 16), f = v => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function piece(ctx, x, y, c, v, r, a = 1, glow = 0) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 4, r, r * 0.9, 0, 0, 6.283); ctx.fill();
  if (glow) { ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 16 * glow; }
  const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, shade(c.f, 0.35)); gr.addColorStop(0.7, c.f); gr.addColorStop(1, shade(c.f, -0.35));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, r * 0.14); ctx.strokeStyle = c.d; ctx.beginPath(); ctx.arc(x, y, r * 0.68, 0, 6.283); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke();
  if (v === 3) {                                              // the king wears a crown
    const s = r / 26; ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#ffd76a'; ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(-16, -8); ctx.lineTo(-8, -1); ctx.lineTo(0, -13); ctx.lineTo(8, -1); ctx.lineTo(16, -8); ctx.lineTo(14, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b3242f'; for (const px of [-8, 0, 8]) { ctx.beginPath(); ctx.arc(px, 3, 2.2, 0, 6.283); ctx.fill(); }
  } else { ctx.fillStyle = c.d; ctx.beginPath(); ctx.arc(x, y, r * 0.15, 0, 6.283); ctx.fill(); }
  ctx.restore();
}
function knot(ctx, x, y, s, col) {                          // the marks on the throne and corners
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.lineWidth = 2;
  ctx.strokeRect(-s, -s, 2 * s, 2 * s); ctx.strokeRect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.1);
  ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(s, s); ctx.moveTo(s, -s); ctx.lineTo(-s, s); ctx.stroke(); ctx.restore();
}
function board(ctx) {
  const bg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 520); bg.addColorStop(0, '#2c2a26'); bg.addColorStop(1, '#0e0d0b');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(BX - 6, BY - 2, BS + 12, BS + 12);
  ctx.fillStyle = '#5c3a1c'; ctx.fillRect(BX - 8, BY - 8, BS + 16, BS + 16);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, px = BX + x * CS, py = BY + y * CS;
    ctx.fillStyle = (x + y) % 2 ? '#b98a52' : '#c69a60';
    if (CORNER[i] || i === THRONE) ctx.fillStyle = '#8f5f2e';
    ctx.fillRect(px, py, CS, CS);
  }
  ctx.strokeStyle = 'rgba(60,34,14,.55)'; ctx.lineWidth = 1.2;
  for (let k = 0; k <= N; k++) { ctx.beginPath(); ctx.moveTo(BX + k * CS, BY); ctx.lineTo(BX + k * CS, BY + BS); ctx.moveTo(BX, BY + k * CS); ctx.lineTo(BX + BS, BY + k * CS); ctx.stroke(); }
  for (const i of [0, N - 1, NN - N, NN - 1, THRONE]) { const [x, y] = cellXY(i); knot(ctx, x, y, CS * 0.3, 'rgba(255,225,170,.55)'); }
}
function hud(ctx) {
  ctx.fillStyle = 'rgba(12,10,8,.72)'; ctx.fillRect(0, 0, W, 56); ctx.fillStyle = 'rgba(212,175,90,.6)'; ctx.fillRect(0, 56, W, 1.5);
  const left = mode.ai ? mode.me : 2, right = 3 - left;
  UG.drawShield(ctx, mode.ai ? myShield : oppShield, 24, 28, 38);
  UG.drawShield(ctx, mode.ai ? oppShield : UG.shield({ name: 'Raiders', motto: '', f: '#1d1915', d: '#c9a84f', c: '#c9a84f', div: 'plain', ch: 'raven', bg: 'clear' }), W - 24, 28, 38);
  ctx.textBaseline = 'middle'; ctx.font = UG.font(13, 700);
  ctx.textAlign = 'left'; ctx.fillStyle = S.turn === left && !S.over ? '#ffd76a' : '#a8997c'; ctx.fillText(`${mode.ai ? 'You' : 'Defenders'} · ${SIDE[left]}`.slice(0, 24), 48, 19);
  ctx.textAlign = 'right'; ctx.fillStyle = S.turn === right && !S.over ? '#ffd76a' : '#a8997c'; ctx.fillText(mode.ai ? `${SIDE[right]}` : 'Raiders', W - 48, 19);
  ctx.font = UG.font(11, 500); ctx.fillStyle = '#e8dcc2';
  ctx.textAlign = 'left'; ctx.fillText(`${countSide(left)} pieces · took ${S.taken[right]}`, 48, 38);
  ctx.textAlign = 'right'; ctx.fillText(`${countSide(right)} pieces · took ${S.taken[left]}`, W - 48, 38);
  ctx.textAlign = 'center'; ctx.font = UG.font(9, 700); ctx.fillStyle = '#a8997c';
  ctx.fillText(S.lesson ? `LESSON ${S.lesson.i + 1} OF ${LESSONS.length} · ${S.lesson.L.title.toUpperCase()}` : `${VARIANTS[mode.n].name.toUpperCase()}${mode.ai ? ' · ' + mode.level.name.toUpperCase() : ''}`, W / 2, 47);
  const c = S.col[S.turn]; piece(ctx, W / 2, 24, c, S.turn === 2 ? 2 : 1, 10);
}
function wrap(ctx, text, maxW) {
  const out = []; let line = '';
  for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line);
  return out;
}
function lessonBox(ctx) {
  const Ls = S.lesson, t = S.msgT > 0 && S.msg ? S.msg : Ls.L.text;
  ctx.font = UG.font(15, 700); const lines = wrap(ctx, t, W - 60);
  const h = 16 + lines.length * 20, y0 = 716 - h;
  ctx.fillStyle = 'rgba(12,10,8,.86)'; ctx.fillRect(14, y0, W - 28, h); ctx.strokeStyle = '#8a6a24'; ctx.lineWidth = 1.5; ctx.strokeRect(14, y0, W - 28, h);
  ctx.fillStyle = S.msgT > 0 && S.msg ? (S.msg.startsWith('Not') ? '#ffb39a' : '#9fe08a') : '#fff3cf'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + 18 + i * 20));
}
// The pieces of the side to move that the opponent could take with their next move.
function dangerFor(side) {
  const key = S.plies + ':' + side + ':' + S.B.join('');
  if (S.dKey === key) return S.danger;
  const out = new Set(), B = Int8Array.from(S.B);
  for (const m of gen(B, 3 - side)) { const r = make(B, m); for (const [c, cv] of r.caps) if (own(cv, side)) out.add(c); unmake(B, r); }
  S.dKey = key; S.danger = out;
  return out;
}
function kingRoutes(k) {
  const out = [], [x, y] = xy(k);
  for (const [dx, dy] of DIRS) {
    let cx = x + dx, cy = y + dy, j = -1;
    while (cx >= 0 && cy >= 0 && cx < N && cy < N) { j = cy * N + cx; if (S.B[j]) { j = -1; break; } cx += dx; cy += dy; }
    if (j >= 0 && CORNER[j]) out.push(j);
  }
  return out;
}
function rules(g, resume) {
  g.screen({ kicker: 'How to play', title: 'Viking Chess',
    html: '<ul class="ug-rules">'
      + '<li><b>Goal.</b> Defenders win if the king (the crown) reaches any corner. Raiders win by trapping the king.</li>'
      + '<li><b>Moving.</b> Every piece slides any number of empty squares in a straight line, like a rook. No diagonals, no jumping. Only the king may stop on the throne (centre) or a corner.</li>'
      + '<li><b>Taking.</b> Trap an enemy between two of your pieces in a straight line. Corners, and the empty throne, count as your piece.</li>'
      + '<li><b>Safe squares.</b> You may move between two enemies: only the move that closes a trap takes.</li>'
      + '<li><b>The king</b> fights too. On the throne he needs four raiders around him; beside it, three plus the throne; anywhere else, two on opposite sides.</li>'
      + '<li><b>On the board:</b> red dots are moves that take a piece, red rings are your pieces in danger, gold lines are the king\'s open roads to a corner.</li></ul>',
    primary: resume ? { label: 'Back to the game', on: resume } : { label: 'Got it', on: () => menu(g) },
    secondary: resume ? undefined : { label: 'Try the lessons', on: () => { g.hide(); newLesson(g, 0); } } });
}
function status(ctx) {
  if (S.over) return;
  if (S.lesson) return lessonBox(ctx);
  let t = S.msgT > 0 && S.msg ? S.msg : '';
  if (!t) {
    if (mode.ai && S.turn !== mode.me) t = `${who(S.turn)} is thinking…`;
    else if (S.sel >= 0) t = 'Tap a marked square to move there';
    else t = (mode.ai ? '' : `${SIDE[S.turn]}: `) + 'pick a piece to move';
  }
  ctx.font = UG.font(16, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = Math.min(W - 20, ctx.measureText(t).width + 32);
  ctx.fillStyle = 'rgba(12,10,8,.72)'; ctx.fillRect(W / 2 - w / 2, 650, w, 34);
  ctx.fillStyle = '#fff3cf'; ctx.fillText(t, W / 2, 668);
}

UG.start({
  id: 'tafl', title: 'Viking Chess', label: 'Viking chess (hnefatafl) board game', W, H,
  help(g, resume) { rules(g, resume); },
  init(g) {
    me = UG.player(); myShield = UG.shield(me.design);
    opp = UG.randomKnight(); oppShield = UG.shield(opp.design);
    S = { B: start(7), turn: 1, sel: -1, fades: [], col: colours(), over: false, plies: 0, msgT: 0, taken: { 1: 0, 2: 0 } };
    menu(g);
  },
  update(g, dt) {
    if (S.msgT > 0) S.msgT -= dt;
    for (const f of S.fades) f.k += dt / 0.45; S.fades = S.fades.filter(f => f.k < 1);
    if (S.anim) { S.anim.k += dt / S.anim.dur; if (S.anim.k >= 1) S.anim.done(); return; }
    if (g.state !== 'play' || S.over) return;
    if (S.wait) { S.wait.t -= dt; if (S.wait.t <= 0) { const f = S.wait.fn; S.wait = null; f(); } return; }
    if (mode.ai && S.turn !== mode.me && S.think > 0) {
      S.think -= dt;
      if (S.think <= 0) {
        S.think = 0;
        const m = think(S.B, S.turn, mode.level);
        if (m < 0) return finish(g, 3 - S.turn, 'stuck');
        play(g, m, true);
      }
    }
  },
  draw(g, ctx) {
    board(ctx);
    const pulse = 0.5 + 0.5 * Math.sin(g.t * 6);
    if (S.last && !S.anim) {
      const [x0, y0] = cellXY(S.last.f), [x1, y1] = cellXY(S.last.t);
      ctx.strokeStyle = 'rgba(255,215,106,.4)'; ctx.lineWidth = 3; ctx.setLineDash([6, 7]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
    }
    const helping = (g.state === 'play' || g.state === 'help') && !S.over && !S.anim;
    // the king's open roads to a corner: gold for the defenders, a warning for the raiders
    const k = kingSquare(S.B);
    if (helping && k >= 0) for (const c of kingRoutes(k)) {
      const [x0, y0] = cellXY(k), [x1, y1] = cellXY(c), good = !mode.ai || mode.me === 2;
      ctx.strokeStyle = good ? `rgba(255,215,106,${0.5 + 0.3 * pulse})` : `rgba(255,90,70,${0.5 + 0.3 * pulse})`; ctx.lineWidth = 5; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
    }
    if (S.lesson && S.lesson.L.target && !S.lesson.done) {
      const [tx, ty] = S.lesson.L.target, [x, y] = cellXY(at(tx, ty));
      ctx.strokeStyle = `rgba(255,215,106,${0.6 + 0.4 * pulse})`; ctx.lineWidth = 4; ctx.strokeRect(x - CS / 2 + 4, y - CS / 2 + 4, CS - 8, CS - 8);
    }
    // where the selected piece can go: a red ring marks a move that takes a piece, a green star a winning move
    if (S.sel >= 0 && g.state === 'play') for (const t of dests(S.sel)) {
      const [x, y] = cellXY(t), r = make(S.B, S.sel * 128 + t), caps = r.caps.length, win = r.win; unmake(S.B, r);
      if (win) { ctx.fillStyle = `rgba(120,220,110,${0.6 + 0.3 * pulse})`; ctx.beginPath(); ctx.arc(x, y, CS * 0.22, 0, 6.283); ctx.fill(); }
      else if (caps) { ctx.strokeStyle = `rgba(230,60,50,${0.7 + 0.3 * pulse})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, CS * 0.2, 0, 6.283); ctx.stroke(); ctx.fillStyle = '#e63c32'; ctx.beginPath(); ctx.arc(x, y, CS * 0.09, 0, 6.283); ctx.fill(); }
      else { ctx.fillStyle = `rgba(255,215,106,${0.45 + 0.35 * pulse})`; ctx.beginPath(); ctx.arc(x, y, CS * 0.13, 0, 6.283); ctx.fill(); }
    }
    const r = CS * 0.36;
    for (let i = 0; i < NN; i++) {
      const v = S.B[i]; if (!v || (S.anim && S.anim.f === i)) continue;
      const [x, y] = cellXY(i), sel = i === S.sel;
      piece(ctx, x, y - (sel ? 3 : 0), S.col[v === 1 ? 1 : 2], v, v === 3 ? r * 1.12 : r, 1, sel ? 0.8 + 0.2 * pulse : 0);
    }
    // your pieces the opponent could take next move
    if (helping && isHuman(S.turn) && !S.lesson && !(mode.ai && S.think > 0)) for (const i of dangerFor(S.turn)) {
      if (i < 0) continue; const [x, y] = cellXY(i);
      ctx.strokeStyle = `rgba(230,60,50,${0.55 + 0.35 * pulse})`; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x, y, r + 7, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
    }
    if (S.last && !S.anim && S.B[S.last.t]) { const [x, y] = cellXY(S.last.t); ctx.strokeStyle = 'rgba(255,243,207,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, 6.283); ctx.stroke(); }
    for (const f of S.fades) { const [x, y] = cellXY(f.i), k = ease.inCubic(f.k); piece(ctx, x, y - k * 26, S.col[f.v === 1 ? 1 : 2], f.v, r * (1 - k * 0.6), 1 - k); }
    if (S.anim) { const A = S.anim, k = ease.outCubic(clamp(A.k, 0, 1)); piece(ctx, lerp(A.x0, A.x1, k), lerp(A.y0, A.y1, k) - Math.sin(Math.PI * k) * 10, S.col[A.v === 1 ? 1 : 2], A.v, A.v === 3 ? r * 1.12 : r); }
    if (S.kb && g.state === 'play' && !S.over) { const [x, y] = cellXY(S.cur); ctx.strokeStyle = '#7ec8ff'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.strokeRect(x - CS / 2 + 3, y - CS / 2 + 3, CS - 6, CS - 6); ctx.setLineDash([]); }
    if (g.state !== 'menu') { hud(ctx); status(ctx); }
    if (S.dangerTold === undefined && helping && isHuman(S.turn) && !S.lesson && S.B && dangerFor(S.turn).size) { S.dangerTold = 1; S.msg = 'Red ring: that piece can be taken next move'; S.msgT = 2.6; }
  },
  down(g, x, y) { if (g.state !== 'play') return; S.kb = false; const i = cellAt(x, y); S.dragFrom = i >= 0 && S.B[i] && own(S.B[i], S.turn) ? i : -1; act(g, i); },
  up(g, x, y) {
    if (g.state !== 'play' || !(S.dragFrom >= 0)) return;
    const f = S.dragFrom, i = cellAt(x, y); S.dragFrom = -1;
    if (i >= 0 && i !== f && S.sel === f && dests(f).includes(i)) play(g, f * 128 + i, false);
  },
  key(g, key, down) {
    if (!down || g.state !== 'play') return;
    const d = { ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0], ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1] }[key];
    if (d) { if (!S.kb) { S.kb = true; return; } const [x, y] = xy(S.cur), j = at(x + d[0], y + d[1]); if (j >= 0) S.cur = j; return; }
    if (key === ' ' || key === 'Spacebar' || key === 'Enter') { S.kb = true; act(g, S.cur); }
  },
});
// test hook, only on a local server
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__ug = { st: () => S, think, gen, make, unmake, start, LEVELS, LESSONS, setMode: m => { mode = Object.assign(mode, m); }, mode: () => mode };
})();
