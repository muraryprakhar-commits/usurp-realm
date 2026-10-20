/* Duel: read the blade, parry left, high or right before it lands. A perfect parry opens a riposte.
   Feints punish guessing, combos punish slow hands. How many knights can you beat, and how fast is your parry? */
(function () {
'use strict';
const { clamp, lerp, rand, ease } = UG;
const W = 540, H = 720;
const DIRS = ['L', 'H', 'R'];
// the opponent's sword: hand position and blade angle for each pose
const POSE = {
  idle: { x: 200, y: 486, a: -1.32, len: 250 },
  L: { x: 112, y: 318, a: -2.35, len: 250 }, H: { x: 262, y: 196, a: -1.68, len: 250 }, R: { x: 392, y: 300, a: -0.72, len: 250 },
  sL: { x: 318, y: 520, a: 0.32, len: 190 }, sH: { x: 270, y: 560, a: 1.52, len: 170 }, sR: { x: 206, y: 524, a: 2.82, len: 190 },
};
// the player's sword, first person: hilt and tip for the guard and each parry
const MY = { guard: [[452, 770], [318, 432]], L: [[318, 700], [40, 470]], H: [[470, 392], [86, 330]], R: [[476, 690], [432, 318]], thrust: [[392, 640], [270, 400]] };
const SPARK = { L: [150, 478], H: [262, 344], R: [438, 452] };
const BTN = { L: [96, 652], H: [270, 652], R: [444, 652] };
let S = null, me = null, myShield = null, opp = null, oppShield = null;

function newRun(g) {
  S = { level: 0, hearts: 3, score: 0, beaten: 0, parries: 0, perfects: 0, misses: 0, bestRx: 0, streak: 0, bestStreak: 0, msgs: [], my: 'guard', myT: 0, pressed: null, pressT: 0 };
  g.state = 'play'; UG.track('play'); newFoe(g);
}
function newFoe(g) {
  opp = UG.randomKnight(); oppShield = UG.shield(opp.design);
  const L = S.level;
  Object.assign(S, { hp: 4 + Math.min(4, L), maxHp: 4 + Math.min(4, L), phase: 'intro', phaseT: 0, sinkT: 0, atk: null, idleT: 1.2, rip: null, combo: 0, hurt: 0, flash: 0, slow: 0 });
  S.windup = Math.max(0.36, 0.95 - L * 0.085); S.feint = Math.min(0.45, L * 0.08); S.combos = L >= 2 ? Math.min(0.5, 0.15 + L * 0.06) : 0;
  if (S.level > 0) UG.track('round', { foe: S.level + 1 });
}
function startAttack(chain) {
  const dir = DIRS[Math.floor(Math.random() * 3)], feint = !chain && Math.random() < S.feint;
  let fake = null; if (feint) { fake = DIRS.filter(d => d !== dir)[Math.floor(Math.random() * 2)]; }
  const T = S.windup * rand(0.9, 1.25) * (chain ? 0.8 : 1) + (feint ? 0.25 : 0);
  S.atk = { dir, fake, T, t: 0, switchAt: feint ? T * 0.5 : 0, input: null, inputT: 0, shownAt: 0, done: false, strikeT: 0 };
  S.phase = 'attack';
}
function shown() { const A = S.atk; return A.fake && A.t < A.switchAt ? A.fake : A.dir; }
function parry(g, d) {
  if (S.phase === 'riposte') return;
  S.my = d; S.myT = 0.32; S.pressed = d; S.pressT = 0.18;
  if (S.phase !== 'attack' || S.atk.input) { UG.sfx.whoosh(); return; }
  const A = S.atk;
  A.input = d; A.inputT = A.t; A.rx = A.t - (A.fake && A.t >= A.switchAt ? A.switchAt : 0);
  UG.sfx.whoosh();
}
function resolve(g) {
  const A = S.atk; A.done = true; S.phase = 'recover'; S.phaseT = 0;
  const ok = A.input === A.dir && A.inputT <= A.T + 0.06;
  const [sx, sy] = SPARK[A.dir];
  if (ok) {
    const perfect = A.inputT >= A.T - 0.17;
    S.parries++; S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak);
    const rx = Math.round(A.rx * 1000); if (rx > 80 && (!S.bestRx || rx < S.bestRx)) S.bestRx = rx;
    S.score += perfect ? 25 : 10;
    UG.sfx.clash(); UG.buzz(perfect ? 30 : 15); g.shake(perfect ? 8 : 5, 0.2);
    g.burst(sx, sy, perfect ? 26 : 14, { c: perfect ? ['#ffd76a', '#fff3cf', '#ffb347'] : ['#fff3cf', '#ffd76a', '#cfd3d6'], shape: 'dot', v0: 120, v1: 460, g: 500, l0: 0.25, l1: 0.6, s0: 1.5, s1: 3.2 });
    g.pop(perfect ? 'Perfect!' : 'Parry', sx, sy - 34, { c: perfect ? '#ffd76a' : '#fff3cf', size: perfect ? 32 : 26, max: 0.8 });
    if (rx > 80) S.msgs.push({ t: `${rx} ms`, life: 0.9, y: 214 });
    if (perfect) { S.perfects++; S.slow = 0.25; }
    if (perfect || S.streak % 4 === 0) { S.rip = { t: 0, max: 0.85, x: 270 + rand(-50, 50), y: rand(380, 470) }; S.phase = 'riposte'; S.phaseT = 0; S.msgs.push({ t: 'Riposte! Strike now', life: 0.85, y: 170, c: '#ffd76a' }); }
    g.say(perfect ? 'Perfect parry' : 'Parried');
  } else {
    S.misses++; S.streak = 0; S.hearts--; S.hurt = 0.45; S.flash = 0.3;
    UG.sfx.hit(); UG.buzz(70); g.shake(14, 0.35);
    const why = !A.input ? 'Too slow!' : A.fake && A.input === A.fake ? 'Feint! You were fooled' : A.input !== A.dir ? 'Wrong side!' : 'Too late!';
    S.msgs.push({ t: why, life: 1.1, y: 214, c: '#ff8f7a' });
    g.say(`Hit. ${why}`);
    if (S.hearts <= 0) { S.phase = 'down'; S.phaseT = 0; }
  }
}
function riposte(g) {
  if (S.phase !== 'riposte' || !S.rip) return;
  S.my = 'thrust'; S.myT = 0.35;
  const R = S.rip; S.rip = null; S.phase = 'recover'; S.phaseT = 0;
  S.hp--; S.score += 50; S.flashFoe = 0.25;
  UG.sfx.hit(); UG.sfx.clash(); g.shake(10, 0.3); UG.buzz(35);
  g.burst(R.x, R.y, 18, { c: ['#fff3cf', '#cfd3d6', opp.design.d], v0: 80, v1: 320, g: 400, l1: 0.6 });
  g.pop('Hit!', R.x, R.y - 30, { c: '#ffd76a', size: 34 });
  if (S.hp <= 0) { S.phase = 'won'; S.phaseT = 0; S.beaten++; S.score += 100; S.hearts = Math.min(3, S.hearts + 1); UG.sfx.fanfare(); UG.sfx.cheer(0.14); }
}
function foeBeaten(g) {
  g.state = 'between';
  g.screen({ kicker: `Knight ${S.beaten} defeated`, title: 'Victory!', sub: `${opp.name} yields.`,
    lines: [`Score: ${S.score}`, S.bestRx ? `Fastest parry: ${S.bestRx} ms` : '', `A heart restored: ${'♥'.repeat(S.hearts)}`].filter(Boolean),
    primary: { label: 'Face the next knight', on: () => { g.hide(); S.level++; UG.between(g, () => { g.state = 'play'; newFoe(g); }); } } });
}
function gameOver(g) {
  g.state = 'over';
  const newBest = g.setBest(S.score), title = S.beaten >= 8 ? 'Master of Defence' : S.beaten >= 5 ? 'Swordmaster' : S.beaten >= 3 ? 'Duellist' : S.beaten >= 1 ? 'Man-at-Arms' : 'Squire';
  UG.track('finish', { score: S.score, beaten: S.beaten });
  const bestRx = UG.store.get('ug-duel-rx', 0); if (S.bestRx && (!bestRx || S.bestRx < bestRx)) UG.store.set('ug-duel-rx', S.bestRx);
  const acc = S.parries + S.misses ? Math.round(100 * S.parries / (S.parries + S.misses)) : 0;
  g.screen({ kicker: `Bested by ${opp.name}`, title, big: S.score, sub: S.score === 1 ? 'point' : 'points',
    lines: [`Knights defeated: ${S.beaten}`, `Parries: ${S.parries} (${acc}%), perfect: ${S.perfects}`, S.bestRx ? `Fastest parry: ${S.bestRx} ms` : '', g.bestLine(newBest)],
    primary: { label: 'Duel again', on: () => { g.hide(); UG.between(g, () => newRun(g)); } },
    secondary: { label: 'Challenge a friend', on: () => g.share(`I beat ${S.beaten} knight${S.beaten === 1 ? '' : 's'} in the Duel${S.bestRx ? ` with a ${S.bestRx} ms parry` : ''}. Are your reflexes faster?`) },
    cta: true });
}

/* ---------- drawing ---------- */
function courtyard(ctx, g) {
  const sky = ctx.createLinearGradient(0, 0, 0, 200); sky.addColorStop(0, '#30405a'); sky.addColorStop(1, '#8a7f74');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 200);
  ctx.fillStyle = '#6d6356'; ctx.fillRect(0, 120, W, 400);
  ctx.strokeStyle = 'rgba(30,24,18,.35)'; ctx.lineWidth = 1;
  for (let y = 120; y < 520; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = (y / 22 % 2) * 22; x < W; x += 44) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 22); ctx.stroke(); } }
  for (let x = 0, i = 0; x < W; x += 36, i++) { ctx.fillStyle = '#7b7163'; ctx.fillRect(x + 4, 104, 26, 18); }
  for (const ax of [70, 470]) {                                        // arches with torches
    ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.moveTo(ax - 44, 420); ctx.lineTo(ax - 44, 250); ctx.arc(ax, 250, 44, Math.PI, 0); ctx.lineTo(ax + 44, 420); ctx.fill();
    const fx = ax + (ax < 270 ? 64 : -64), fl = 1 + Math.sin(g.t * 13 + ax) * 0.15;
    ctx.fillStyle = '#4a3420'; ctx.fillRect(fx - 3, 236, 6, 30);
    const glow = ctx.createRadialGradient(fx, 226, 2, fx, 226, 70); glow.addColorStop(0, 'rgba(255,170,60,.45)'); glow.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = glow; ctx.fillRect(fx - 70, 156, 140, 140);
    ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.ellipse(fx, 226, 6 * fl, 13 * fl, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff1b8'; ctx.beginPath(); ctx.ellipse(fx, 229, 3, 6, 0, 0, 6.283); ctx.fill();
  }
  for (const bx of [170, 370]) {                                       // the opponent's banners on the wall
    ctx.fillStyle = opp.design.f; ctx.beginPath(); ctx.moveTo(bx - 22, 124); ctx.lineTo(bx + 22, 124); ctx.lineTo(bx + 22, 236); ctx.lineTo(bx, 224); ctx.lineTo(bx - 22, 236); ctx.fill();
    ctx.fillStyle = opp.design.d; ctx.fillRect(bx - 22, 124, 44, 5); ctx.fillRect(bx - 3, 129, 6, 98);
  }
  const fl = ctx.createLinearGradient(0, 520, 0, H); fl.addColorStop(0, '#5a5146'); fl.addColorStop(1, '#2e2924');
  ctx.fillStyle = fl; ctx.fillRect(0, 520, W, H - 520);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(270 + i * 40, 520); ctx.lineTo(270 + i * 140, H); ctx.stroke(); }
  for (const y of [548, 590, 646, 712]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}
function swordPose() {
  if (!S.atk || S.phase === 'intro' || S.phase === 'won') return POSE.idle;
  const A = S.atk, show = shown();
  if (A.done) {                                              // the strike, then back to guard
    const k = clamp(S.phaseT / 0.14, 0, 1), back = clamp((S.phaseT - 0.3) / 0.35, 0, 1), sp = POSE['s' + A.dir];
    const p = { x: lerp(POSE[A.dir].x, sp.x, ease.outCubic(k)), y: lerp(POSE[A.dir].y, sp.y, ease.outCubic(k)), a: lerp(POSE[A.dir].a, sp.a, ease.outCubic(k)), len: lerp(250, sp.len, k) };
    if (A.input === A.dir) { p.x = lerp(p.x, POSE[A.dir].x, 0.55); p.y = lerp(p.y, POSE[A.dir].y, 0.55); p.a = lerp(p.a, POSE[A.dir].a, 0.55); }   // blocked
    return { x: lerp(p.x, POSE.idle.x, back), y: lerp(p.y, POSE.idle.y, back), a: lerp(p.a, POSE.idle.a, back), len: lerp(p.len, 250, back) };
  }
  const from = A.fake && A.t >= A.switchAt ? POSE[A.fake] : POSE.idle, start = A.fake && A.t >= A.switchAt ? A.switchAt : 0;
  const k = ease.outCubic(clamp((A.t - start) / Math.max(0.12, (A.T - start) * 0.45), 0, 1)), to = POSE[show];
  const shake = A.t > A.T - 0.12 ? Math.sin(A.t * 90) * 2.5 : 0;
  return { x: lerp(from.x, to.x, k) + shake, y: lerp(from.y, to.y, k), a: lerp(from.a, to.a, k), len: 250 };
}
function foe(ctx, g) {
  const d = opp.design, breathe = Math.sin(g.t * 2.2) * 3, sink = S.phase === 'won' ? ease.inCubic(clamp(S.phaseT / 1.2, 0, 1)) * 200 : 0;
  ctx.save(); ctx.translate(0, breathe + sink); ctx.globalAlpha = 1 - clamp(sink / 260, 0, 1);
  if (S.flashFoe > 0) ctx.filter = 'brightness(1.8)';
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(270, 640, 170, 26, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#7d858c'; ctx.beginPath(); ctx.moveTo(148, 312); ctx.lineTo(392, 312); ctx.lineTo(372, 640); ctx.lineTo(168, 640); ctx.fill();   // mail
  ctx.fillStyle = d.f; ctx.beginPath(); ctx.moveTo(170, 318); ctx.lineTo(370, 318); ctx.lineTo(384, 650); ctx.lineTo(156, 650); ctx.fill();       // surcoat
  ctx.fillStyle = d.d; ctx.fillRect(258, 318, 24, 332); ctx.fillRect(156, 500, 228, 16);
  ctx.fillStyle = '#5a3a1c'; ctx.fillRect(170, 492, 200, 10);
  ctx.fillStyle = '#9aa3ab';                                                                             // pauldrons
  ctx.beginPath(); ctx.ellipse(160, 320, 46, 32, -0.3, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.ellipse(380, 320, 46, 32, 0.3, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#b8bec5'; ctx.beginPath(); ctx.moveTo(214, 300); ctx.quadraticCurveTo(212, 170, 270, 160); ctx.quadraticCurveTo(328, 170, 326, 300); ctx.closePath(); ctx.fill();   // helm
  ctx.fillStyle = '#d6dbe0'; ctx.beginPath(); ctx.moveTo(232, 200); ctx.quadraticCurveTo(270, 172, 306, 200); ctx.lineTo(300, 210); ctx.quadraticCurveTo(270, 190, 240, 210); ctx.fill();
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(228, 226, 84, 9);
  ctx.fillStyle = 'rgba(255,190,90,.6)'; if (S.atk && !S.atk.done && S.atk.t > S.atk.T - 0.35) { ctx.fillRect(236, 228, 10, 4); ctx.fillRect(294, 228, 10, 4); }   // eyes flash before the strike
  ctx.strokeStyle = '#6c737a'; ctx.lineWidth = 2; for (let x = 238; x < 304; x += 8) { ctx.beginPath(); ctx.moveTo(x, 246); ctx.lineTo(x, 262); ctx.stroke(); }
  ctx.fillStyle = d.d; ctx.beginPath(); ctx.moveTo(262, 164); ctx.quadraticCurveTo(250 + Math.sin(g.t * 3) * 6, 90, 300, 70); ctx.quadraticCurveTo(286, 120, 280, 164); ctx.fill();   // crest plume
  UG.drawShield(ctx, oppShield, 404, 452, 236);                                                         // shield on the left arm
  // sword arm and blade
  const p = swordPose();
  ctx.strokeStyle = '#8f969c'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(168, 330); ctx.quadraticCurveTo((168 + p.x) / 2 - 30, (330 + p.y) / 2 + 30, p.x, p.y); ctx.stroke();
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
  if (S.atk && S.atk.done && S.phaseT < 0.16) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, p.len, -0.8, 0); ctx.fill(); }
  ctx.fillStyle = '#d9dee3'; ctx.beginPath(); ctx.moveTo(22, -7); ctx.lineTo(p.len - 20, -5); ctx.lineTo(p.len, 0); ctx.lineTo(p.len - 20, 5); ctx.lineTo(22, 7); ctx.fill();
  ctx.strokeStyle = '#8f969c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(p.len - 26, 0); ctx.stroke();
  if (S.atk && !S.atk.done && S.atk.t > S.atk.T - 0.2) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(p.len * 0.7, -3, 4 + Math.random() * 3, 0, 6.283); ctx.fill(); }
  ctx.fillStyle = '#d4af5a'; ctx.fillRect(14, -26, 9, 52); ctx.fillStyle = '#4a3420'; ctx.fillRect(-26, -6, 40, 12); ctx.fillStyle = '#d4af5a'; ctx.beginPath(); ctx.arc(-30, 0, 9, 0, 6.283); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#6c737a'; ctx.beginPath(); ctx.arc(p.x, p.y, 17, 0, 6.283); ctx.fill();               // gauntlet
  ctx.filter = 'none'; ctx.restore();
}
function mySword(ctx, g) {
  const target = S.phase === 'riposte' ? 'guard' : S.my;
  const [h1, t1] = MY[S.myT > 0 ? target : 'guard'];
  if (!S.cur) S.cur = { h: [...MY.guard[0]], t: [...MY.guard[1]] };
  const k = 1 - Math.pow(0.0005, g.dt || 0.016);
  S.cur.h[0] = lerp(S.cur.h[0], h1[0], k); S.cur.h[1] = lerp(S.cur.h[1], h1[1], k); S.cur.t[0] = lerp(S.cur.t[0], t1[0], k); S.cur.t[1] = lerp(S.cur.t[1], t1[1], k);
  if (S.my === 'thrust' && S.myT > 0 && S.ripAt) { S.cur.t[0] = lerp(S.cur.t[0], S.ripAt[0], 0.5); S.cur.t[1] = lerp(S.cur.t[1], S.ripAt[1], 0.5); }
  const [hx, hy] = S.cur.h, [tx, ty] = S.cur.t, a = Math.atan2(ty - hy, tx - hx), L = Math.hypot(tx - hx, ty - hy);
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(a);
  ctx.fillStyle = '#e6eaee'; ctx.beginPath(); ctx.moveTo(40, -13); ctx.lineTo(L - 30, -9); ctx.lineTo(L, 0); ctx.lineTo(L - 30, 9); ctx.lineTo(40, 13); ctx.fill();
  ctx.strokeStyle = '#9aa3ab'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(44, 0); ctx.lineTo(L - 36, 0); ctx.stroke();
  ctx.fillStyle = '#d4af5a'; ctx.fillRect(26, -46, 16, 92); ctx.fillStyle = me.design.f; ctx.fillRect(-40, -11, 66, 22);
  ctx.restore();
}
function hud(ctx, g) {
  ctx.fillStyle = 'rgba(12,10,8,.66)'; ctx.fillRect(0, 0, W, 50); ctx.fillStyle = 'rgba(212,175,90,.6)'; ctx.fillRect(0, 50, W, 1.5);
  UG.drawShield(ctx, myShield, 22, 25, 34);
  for (let i = 0; i < 3; i++) heart(ctx, 52 + i * 26, 25, i < S.hearts);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff3cf'; ctx.font = UG.font(22, 900, 'Cinzel Decorative'); ctx.fillText(String(S.score), W / 2, 22);
  ctx.font = UG.font(10, 700); ctx.fillStyle = '#a8997c'; ctx.fillText(`KNIGHT ${S.level + 1}${S.streak > 1 ? ` · STREAK ${S.streak}` : ''}`, W / 2, 41);
  UG.drawShield(ctx, oppShield, W - 22, 25, 34);
  const bw = 120, bx = W - 50 - bw; ctx.fillStyle = '#2a2018'; ctx.fillRect(bx, 30, bw, 10); ctx.fillStyle = '#c8312f'; ctx.fillRect(bx, 30, bw * S.hp / S.maxHp, 10);
  ctx.strokeStyle = '#8a6a24'; ctx.lineWidth = 1; ctx.strokeRect(bx, 30, bw, 10);
  ctx.textAlign = 'right'; ctx.fillStyle = '#f3dc92'; ctx.font = UG.font(11, 700); ctx.fillText(opp.name.split(' of ')[0].slice(0, 18), W - 50, 17);
}
function heart(ctx, x, y, full) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = full ? '#c8312f' : 'rgba(200,49,47,.2)'; ctx.strokeStyle = full ? '#ffd0c8' : 'rgba(255,208,200,.25)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -8, -12, 0, -5); ctx.bezierCurveTo(8, -12, 14, -2, 0, 8); ctx.fill(); ctx.stroke(); ctx.restore();
}
function buttons(ctx) {
  for (const d of DIRS) {
    const [x, y] = BTN[d], on = S.pressed === d && S.pressT > 0;
    ctx.fillStyle = on ? 'rgba(212,175,90,.9)' : 'rgba(12,10,8,.62)'; ctx.beginPath(); ctx.arc(x, y, 50, 0, 6.283); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = on ? '#fff3cf' : '#8a6a24'; ctx.stroke();
    ctx.fillStyle = on ? '#14110e' : '#f3dc92'; ctx.save(); ctx.translate(x, y); ctx.rotate(d === 'L' ? Math.PI : d === 'H' ? -Math.PI / 2 : 0);
    ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-10, -16); ctx.lineTo(-4, 0); ctx.lineTo(-10, 16); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.textAlign = 'center'; ctx.font = UG.font(11, 700); ctx.lineJoin = 'round';
  for (const [t, x] of [['PARRY LEFT', BTN.L[0]], ['HIGH', BTN.H[0]], ['RIGHT', BTN.R[0]]]) {
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(12,10,8,.9)'; ctx.strokeText(t, x, 712); ctx.fillStyle = '#e8dcc2'; ctx.fillText(t, x, 712);
  }
}

UG.start({
  id: 'duel', title: 'Duel', label: 'Sword fighting game: a knight attacks you, parry the blow', W, H,
  init(g) {
    me = UG.player(); myShield = UG.shield(me.design);
    opp = UG.randomKnight(); oppShield = UG.shield(opp.design);
    S = { level: 0, hearts: 3, score: 0, hp: 5, maxHp: 5, phase: 'menu', phaseT: 0, msgs: [], my: 'guard', myT: 0, streak: 0, atk: null, idleT: 1 };
    g.screen({ kicker: 'Sword fighting', title: 'Duel',
      html: '<ol class="ug-howto"><li>Watch where the blade goes: left, high or right.</li><li>Parry that way before it lands. Wait for the feint!</li><li>Parry just as it falls for a perfect parry, then tap to strike back.</li></ol>',
      sub: g.best ? `Your best: ${g.best} points${UG.store.get('ug-duel-rx', 0) ? ` · fastest parry ${UG.store.get('ug-duel-rx', 0)} ms` : ''}` : 'How fast are your hands?',
      primary: { label: 'Draw your sword', on: () => { g.hide(); UG.between(g, () => newRun(g)); } } });
  },
  update(g, dt0) {
    let dt = dt0; g.dt = dt0;
    if (S.slow > 0) { S.slow -= dt0; dt = dt0 * 0.35; }
    for (const m of S.msgs) m.life -= dt0; S.msgs = S.msgs.filter(m => m.life > 0);
    if (S.myT > 0) S.myT -= dt0; else S.my = 'guard';
    if (S.pressT > 0) S.pressT -= dt0;
    if (S.hurt > 0) S.hurt -= dt0; if (S.flash > 0) S.flash -= dt0; if (S.flashFoe > 0) S.flashFoe -= dt0;
    if (g.state !== 'play') return;
    S.phaseT += dt;
    switch (S.phase) {
      case 'intro': if (S.phaseT > 1.8) { S.phase = 'idle'; S.phaseT = 0; S.idleT = 0.6; } break;
      case 'idle': S.idleT -= dt; if (S.idleT <= 0) startAttack(false); break;
      case 'attack': S.atk.t += dt; if (S.atk.t >= S.atk.T) resolve(g); break;
      case 'riposte': if (S.rip) { S.rip.t += dt0; if (S.rip.t > S.rip.max) { S.rip = null; S.phase = 'recover'; S.phaseT = 0; S.msgs.push({ t: 'Too slow to strike', life: 0.8, y: 170 }); } } break;
      case 'recover':
        if (S.phaseT > 0.55) {
          if (S.combo === 0 && Math.random() < S.combos) { S.combo = 1 + (Math.random() < 0.4 ? 1 : 0); }
          if (S.combo > 0) { S.combo--; startAttack(true); } else { S.phase = 'idle'; S.phaseT = 0; S.idleT = rand(0.35, 1.0) * Math.max(0.5, 1 - S.level * 0.06); }
        }
        break;
      case 'won': if (S.phaseT > 1.4) { S.phase = 'wait'; foeBeaten(g); } break;
      case 'down': if (S.phaseT > 0.9) { S.phase = 'wait'; UG.sfx.fail(); gameOver(g); } break;
    }
  },
  draw(g, ctx) {
    courtyard(ctx, g); foe(ctx, g);
    if (S.rip) {
      const R = S.rip, k = R.t / R.max, pulse = 1 + Math.sin(g.t * 20) * 0.12;
      ctx.lineWidth = 4; ctx.strokeStyle = `rgba(255,215,106,${1 - k * 0.5})`; ctx.beginPath(); ctx.arc(R.x, R.y, 34 * pulse, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.arc(R.x, R.y, 34 * (1 - k) + 6, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(255,215,106,.35)'; ctx.beginPath(); ctx.arc(R.x, R.y, 12, 0, 6.283); ctx.fill();
    }
    mySword(ctx, g);
    if (g.state === 'play' || g.state === 'between') { hud(ctx, g); buttons(ctx); }
    for (const m of S.msgs) {
      ctx.globalAlpha = clamp(m.life * 3, 0, 1); ctx.textAlign = 'center'; ctx.font = UG.font(24, 900, 'Cinzel Decorative'); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,14,8,.85)';
      ctx.strokeText(m.t, W / 2, m.y || 200); ctx.fillStyle = m.c || '#fff3cf'; ctx.fillText(m.t, W / 2, m.y || 200);
    }
    ctx.globalAlpha = 1;
    if (S.phase === 'intro' && g.state === 'play') {
      ctx.fillStyle = 'rgba(12,10,8,.75)'; ctx.fillRect(40, 140, W - 80, 64); ctx.textAlign = 'center';
      ctx.fillStyle = '#d4af5a'; ctx.font = UG.font(12, 700); ctx.fillText(`KNIGHT ${S.level + 1}`, W / 2, 160);
      ctx.fillStyle = '#fff3cf'; ctx.font = UG.font(18, 900, 'Cinzel Decorative'); ctx.fillText(opp.name, W / 2, 186);
    }
    if (S.flash > 0) { ctx.fillStyle = `rgba(170,20,20,${S.flash})`; ctx.fillRect(0, 0, W, H); }
  },
  down(g, x, y) {
    if (g.state !== 'play') return;
    S.ptrStart = [x, y, performance.now()];
    for (const d of DIRS) if (Math.hypot(x - BTN[d][0], y - BTN[d][1]) < 58) { S.ptrStart = null; return parry(g, d); }
    if (S.phase === 'riposte' && y < 600) { S.ripAt = [S.rip.x, S.rip.y]; S.ptrStart = null; return riposte(g); }
  },
  up(g, x, y) {
    if (g.state !== 'play' || !S.ptrStart) return;
    const [sx, sy, t0] = S.ptrStart; S.ptrStart = null;
    const dx = x - sx, dy = y - sy;
    if (performance.now() - t0 < 450 && Math.hypot(dx, dy) > 36) parry(g, Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'L' : 'R') : 'H');   // swipes work too
  },
  key(g, key, down) {
    if (!down || g.state !== 'play') return;
    const d = { ArrowLeft: 'L', a: 'L', A: 'L', ArrowUp: 'H', w: 'H', W: 'H', ArrowRight: 'R', d: 'R', D: 'R' }[key];
    if (d) return parry(g, d);
    if ((key === ' ' || key === 'Spacebar' || key === 'Enter') && S.phase === 'riposte') { S.ripAt = [S.rip.x, S.rip.y]; riposte(g); }
  },
});
// test hook, only on a local server
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__ug = { st: () => S };
})();
