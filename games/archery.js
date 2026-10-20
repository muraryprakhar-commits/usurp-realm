/* The King's Archery Contest: hold to draw, drag to aim, let go to loose. Nine arrows at 20, 40 and 60 metres. */
(function () {
'use strict';
const { clamp, lerp, ease } = UG;
const W = 540, H = 720, HZ = 236;
// Targets sit where perspective puts them: the base of each stand on the ground at its distance.
const ENDS = [
  { m: 20, cx: 270, cy: 425, r: 105, w: [0.4, 2.2], sway: 1.0 },
  { m: 40, cx: 270, cy: 286, r: 74, w: [1.2, 4], sway: 1.12 },
  { m: 60, cx: 270, cy: 264, r: 52, w: [2, 5.5], sway: 1.25 },
];
const RANKS = [[82, 'Royal Champion'], [72, 'Master Archer'], [60, 'Marksman'], [45, 'Bowman'], [25, 'Yeoman'], [0, 'Squire']];
const RING = ['#f4f1e8', '#f4f1e8', '#23201d', '#23201d', '#2f6db3', '#2f6db3', '#c8312f', '#c8312f', '#e9c13d', '#e9c13d'];
const dayNo = () => Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 86400000) + 1;
let S = null, me = null, myShield = null, clouds = [];

function begin(g, daily) {
  const seed = daily ? 7919 * dayNo() : (Math.random() * 1e9) | 0;
  S = { daily, r: UG.seeded(seed), end: 0, arrow: 0, ends: [[], [], []], xs: 0, phase: 'aim', wind: 0, aim: { x: 0, y: 0 }, draw: 0, holdT: 0,
    holding: false, keys: {}, fly: null, hits: [], msg: '', msgT: 0, trans: 0, wait: 0, then: null, swayT: Math.random() * 50 };
  g.state = 'play'; startEnd(0);
  UG.track('play', { daily: !!daily });
}
function startEnd(i) {
  const E = ENDS[i], [a, b] = E.w;
  S.end = i; S.arrow = 0; S.hits = [];
  S.wind = Math.round((S.r() < 0.5 ? -1 : 1) * (a + S.r() * (b - a)) * 10) / 10;
  S.msg = `End ${i + 1} of 3 · ${E.m} metres`; S.msgT = 2.4; S.trans = 1;
  nextArrow();
}
function nextArrow() {
  const E = ENDS[S.end], a = S.r() * Math.PI;
  S.phase = 'aim'; S.draw = 0; S.holdT = 0; S.holding = false;
  S.aim = { x: Math.cos(a) * E.r * (0.6 + S.r() * 0.6), y: E.r * (0.7 + S.r() * 0.7) };   // the bow starts lowered, off the gold
}
function swayAmp() {
  const base = 13 * ENDS[S.end].sway;
  if (!S.holding) return base * 1.35;
  let a = lerp(base * 1.3, base * 0.38, ease.outCubic(S.draw));
  const tired = S.holdT - 2.3;                      // after a couple of seconds at full draw the arm starts to shake
  if (tired > 0) a += tired * tired * 18 + tired * 12;
  return a;
}
function reticle(g) {
  const E = ENDS[S.end], A = swayAmp(), t = S.swayT;
  const sx = A * (0.65 * Math.sin(1.1 * t) + 0.35 * Math.sin(2.3 * t + 1.3));
  const sy = A * (0.6 * Math.sin(1.6 * t + 0.7) + 0.4 * Math.sin(2.9 * t));
  const tired = Math.max(0, S.holdT - 2.3), jit = tired > 0 ? tired * 2.2 : 0;
  return { x: E.cx + S.aim.x + sx + (Math.random() - 0.5) * jit, y: E.cy + S.aim.y + sy + (Math.random() - 0.5) * jit };
}
function loose(g) {
  const E = ENDS[S.end], R = reticle(g);
  const drift = S.wind * (E.m / 20) * 3.3;                             // wind pushes the arrow sideways, more at range
  const drop = (1 - clamp(S.draw / 0.96, 0, 1)) * E.r * 1.5;           // a half-drawn bow falls short
  const P = { x: R.x + drift, y: R.y + drop };
  const dist = Math.hypot(P.x - E.cx, P.y - E.cy) / E.r;
  const score = dist <= 1 ? Math.max(1, 10 - Math.floor(dist * 10)) : 0;
  S.fly = { P, t: 0, dur: 0.3 + E.m * 0.0055, score, x: dist <= 0.05, boss: dist <= 1.16 };
  S.phase = 'fly'; S.holding = false;
  UG.sfx.twang(); UG.sfx.whoosh(); UG.buzz(12);
}
function land(g) {
  const E = ENDS[S.end], F = S.fly, P = F.P;
  S.ends[S.end].push(F.score); if (F.x) S.xs++;
  if (F.boss) {
    S.hits.push({ x: P.x, y: P.y, tilt: (Math.random() - 0.5) * 0.5 });
    UG.sfx.thunk(); g.shake(F.score >= 9 ? 5 : 3, 0.18);
    g.burst(P.x, P.y, 7, { c: ['#e2c27a', '#b8914a', '#f3dc92'], shape: 'splinter', v0: 40, v1: 150, g: 500, s0: 2, s1: 4, l1: 0.6 });
  }
  if (F.score === 10) {
    g.pop(F.x ? 'X' : '10', P.x, P.y - 26, { c: '#ffd76a', size: 46 }); UG.sfx.cheer(0.12); UG.sfx.coin();
    g.burst(P.x, P.y, 22, { c: ['#ffd76a', '#fff3cf', '#e9c13d'], shape: 'dot', v0: 60, v1: 240, g: 260, l0: 0.5, l1: 1, s0: 1.5, s1: 3.5 });
  } else if (F.score > 0) g.pop(String(F.score), P.x, P.y - 24, { c: F.score >= 7 ? '#ffd76a' : '#f4f1e8', size: 36 });
  else { g.pop('Miss', P.x, Math.min(P.y, E.cy + E.r * 1.6) - 10, { c: '#e9a7a0', size: 30 }); UG.sfx.groan(); }
  g.say(F.score ? `${F.score} points` : 'Missed the target');
  S.fly = null; S.arrow++;
  S.phase = 'wait'; S.wait = 0.95;
  S.then = () => {
    if (S.arrow < 3) return nextArrow();
    const e = S.ends[S.end], sum = e.reduce((a, b) => a + b, 0);
    S.msg = `End ${S.end + 1}: ${e.join(' + ')} = ${sum}`; S.msgT = 2.1;
    S.phase = 'wait'; S.wait = 1.9;
    S.then = () => (S.end < 2 ? startEnd(S.end + 1) : finish(g));
  };
}
function total() { return S.ends.flat().reduce((a, b) => a + b, 0); }
function finish(g) {
  const tot = total(), rank = RANKS.find(([v]) => tot >= v)[1], newBest = g.setBest(tot);
  g.state = 'over'; S.phase = 'over';
  UG.track('finish', { score: tot }); UG.sfx.fanfare(); if (tot >= 60) UG.sfx.cheer(0.15);
  const ends = S.ends.map(e => e.reduce((a, b) => a + b, 0)).join(' · ');
  g.screen({ kicker: S.daily ? `Daily contest #${dayNo()}` : 'Contest over', title: rank, big: tot, sub: `${tot === 1 ? 'point' : 'points'} out of 90`,
    lines: [`Ends: ${ends}`, `${S.xs} bullseye${S.xs === 1 ? '' : 's'} in the X ring`, g.bestLine(newBest)],
    primary: { label: 'Shoot again', on: () => { g.hide(); UG.between(g, () => begin(g, S.daily)); } },
    secondary: { label: 'Challenge a friend', on: () => g.share(`I scored ${tot}/90 (${rank}) in the King's Archery Contest${S.daily ? `, daily #${dayNo()}` : ''}. Can you beat it?`) },
    cta: true });
}

/* ---------- drawing ---------- */
function sky(ctx, g, wind) {
  const s = ctx.createLinearGradient(0, 0, 0, HZ);
  s.addColorStop(0, '#5f93c4'); s.addColorStop(0.62, '#a9cbe0'); s.addColorStop(1, '#f2e2bc');
  ctx.fillStyle = s; ctx.fillRect(0, 0, W, HZ + 4);
  const sun = ctx.createRadialGradient(410, 90, 6, 410, 90, 120);
  sun.addColorStop(0, 'rgba(255,248,220,.95)'); sun.addColorStop(0.18, 'rgba(255,240,200,.55)'); sun.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = sun; ctx.fillRect(280, 0, 260, 240);
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  for (const c of clouds) {
    c.x += (6 + wind * 5) * g.dt; if (c.x > W + 120) c.x = -120; if (c.x < -120) c.x = W + 120;
    ctx.globalAlpha = c.a;
    for (const [dx, dy, r] of c.p) { ctx.beginPath(); ctx.ellipse(c.x + dx, c.y + dy, r * 1.5, r, 0, 0, 6.283); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
function ground(ctx) {
  ctx.fillStyle = '#86a5b0';                                   // far hills
  ctx.beginPath(); ctx.moveTo(0, HZ - 30); ctx.bezierCurveTo(90, HZ - 70, 170, HZ - 40, 260, HZ - 52); ctx.bezierCurveTo(350, HZ - 66, 450, HZ - 26, W, HZ - 48); ctx.lineTo(W, HZ); ctx.lineTo(0, HZ); ctx.fill();
  // castle on the far hill
  ctx.fillStyle = '#6f8592';
  ctx.fillRect(70, HZ - 110, 26, 80); ctx.fillRect(100, HZ - 86, 70, 56); ctx.fillRect(172, HZ - 122, 24, 92);
  for (const [x, w] of [[70, 26], [100, 70], [172, 24]]) for (let i = 0; i < w; i += 8) ctx.fillRect(x + i, (x === 100 ? HZ - 93 : x === 70 ? HZ - 117 : HZ - 129), 5, 8);
  ctx.beginPath(); ctx.moveTo(184, HZ - 129); ctx.lineTo(184, HZ - 152); ctx.strokeStyle = '#6f8592'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#b3242f'; ctx.beginPath(); ctx.moveTo(185, HZ - 152); ctx.lineTo(204, HZ - 147); ctx.lineTo(185, HZ - 142); ctx.fill();
  ctx.fillStyle = '#5d7a52';                                   // near hills
  ctx.beginPath(); ctx.moveTo(0, HZ - 8); ctx.bezierCurveTo(120, HZ - 34, 230, HZ - 4, 330, HZ - 18); ctx.bezierCurveTo(420, HZ - 30, 490, HZ - 12, W, HZ - 20); ctx.lineTo(W, HZ + 2); ctx.lineTo(0, HZ + 2); ctx.fill();
  // pavilions on the right, in heraldic stripes
  const tents = [[352, '#b3242f', '#efe6d0'], [404, '#1f4e8a', '#d4af5a'], [458, '#1f5f3d', '#efe6d0']];
  for (const [x, a, b] of tents) {
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? a : b; ctx.beginPath(); ctx.moveTo(x, HZ - 40); ctx.lineTo(x - 20 + i * 10, HZ); ctx.lineTo(x - 10 + i * 10, HZ); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = '#3b2a18'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, HZ - 40); ctx.lineTo(x, HZ - 52); ctx.stroke();
    ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(x, HZ - 52); ctx.lineTo(x + 10, HZ - 49); ctx.lineTo(x, HZ - 46); ctx.fill();
  }
  const gr = ctx.createLinearGradient(0, HZ, 0, H);
  gr.addColorStop(0, '#8aa653'); gr.addColorStop(0.45, '#6a8b38'); gr.addColorStop(1, '#3f5d22');
  ctx.fillStyle = gr; ctx.fillRect(0, HZ, W, H - HZ);
  ctx.fillStyle = 'rgba(255,255,240,.07)';                     // mowing stripes in perspective
  for (let i = 0; i < 12; i += 2) { const y0 = HZ + Math.pow(i / 12, 2.2) * (H - HZ), y1 = HZ + Math.pow((i + 1) / 12, 2.2) * (H - HZ); ctx.fillRect(0, y0, W, y1 - y0); }
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 668); ctx.lineTo(W, 668); ctx.stroke();   // shooting line
}
function pennant(ctx, g, x, base, h, wind) {
  ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - h); ctx.stroke();
  ctx.fillStyle = '#d4af5a'; ctx.beginPath(); ctx.arc(x, base - h, 3, 0, 6.283); ctx.fill();
  const len = 26 + Math.min(1, Math.abs(wind) / 5) * 22, dir = wind >= 0 ? 1 : -1, droop = 1 - Math.min(1, Math.abs(wind) / 2.5);
  ctx.fillStyle = '#b3242f'; ctx.beginPath(); ctx.moveTo(x, base - h + 2);
  const N = 8;
  for (let i = 1; i <= N; i++) { const k = i / N; ctx.lineTo(x + dir * len * k * (1 - droop * 0.6), base - h + 2 + droop * len * k * 0.9 + Math.sin(g.t * (6 + Math.abs(wind)) - k * 5) * 3 * k); }
  for (let i = N; i >= 0; i--) { const k = i / N; ctx.lineTo(x + dir * len * k * (1 - droop * 0.6), base - h + 13 * (1 - k * 0.85) + droop * len * k * 0.9 + Math.sin(g.t * (6 + Math.abs(wind)) - k * 5) * 3 * k); }
  ctx.fill();
}
function target(ctx, E, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  const { cx, cy, r } = E, legY = cy + r * 2.05;
  ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = Math.max(3, r * 0.07); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - r * 0.55, cy + r * 0.8); ctx.lineTo(cx - r * 0.85, legY); ctx.moveTo(cx + r * 0.55, cy + r * 0.8); ctx.lineTo(cx + r * 0.85, legY); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, legY + 2, r * 1.2, r * 0.12, 0, 0, 6.283); ctx.fill();
  const boss = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r * 1.18);
  boss.addColorStop(0, '#e9cd8a'); boss.addColorStop(1, '#b38a45');
  ctx.fillStyle = boss; ctx.beginPath(); ctx.arc(cx, cy, r * 1.16, 0, 6.283); ctx.fill();
  ctx.strokeStyle = 'rgba(90,58,28,.35)'; ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 1.02, cy + Math.sin(a) * r * 1.02); ctx.lineTo(cx + Math.cos(a + 0.12) * r * 1.15, cy + Math.sin(a + 0.12) * r * 1.15); ctx.stroke(); }
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = RING[i]; ctx.beginPath(); ctx.arc(cx, cy, r * (1 - i / 10), 0, 6.283); ctx.fill();
    ctx.strokeStyle = i === 2 || i === 3 ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.35)'; ctx.lineWidth = Math.max(0.6, r / 110); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.05, 0, 6.283); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(cx - 0.6, cy - r * 0.03, 1.2, r * 0.06); ctx.fillRect(cx - r * 0.03, cy - 0.6, r * 0.06, 1.2);
  ctx.restore();
}
function stuck(ctx, h, r) {
  const s = r / 116;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.tilt);
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.arc(0, 0, 2.6 * s + 0.6, 0, 6.283); ctx.fill();
  ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 3.2 * s + 0.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16 * s, 26 * s); ctx.stroke();
  ctx.fillStyle = '#b3242f'; ctx.beginPath(); ctx.moveTo(12 * s, 21 * s); ctx.lineTo(24 * s, 30 * s); ctx.lineTo(15 * s, 34 * s); ctx.fill();
  ctx.fillStyle = '#efe6d0'; ctx.beginPath(); ctx.moveTo(12 * s, 21 * s); ctx.lineTo(6 * s, 36 * s); ctx.lineTo(16 * s, 32 * s); ctx.fill();
  ctx.restore();
}
function flightPos(F, t) {
  const k = ease.outCubic(t), arcH = 30 + ENDS[S.end].m * 0.9;
  return [lerp(300, F.P.x, k), lerp(760, F.P.y, k) - Math.sin(Math.PI * t) * arcH];
}
function arrowInFlight(ctx, F) {
  const k = ease.outCubic(F.t), [x, y] = flightPos(F, F.t);
  const [x1, y1] = F.t < 0.97 ? flightPos(F, F.t + 0.03) : [2 * x - flightPos(F, F.t - 0.03)[0], 2 * y - flightPos(F, F.t - 0.03)[1]];
  const len = lerp(150, 16, k), ang = Math.atan2(y1 - y, x1 - x);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = lerp(5, 1.4, k); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-len, 0); ctx.stroke();
  ctx.fillStyle = '#cfd3d6'; ctx.beginPath(); ctx.moveTo(lerp(9, 2, k), 0); ctx.lineTo(-2, -lerp(4, 1.2, k)); ctx.lineTo(-2, lerp(4, 1.2, k)); ctx.fill();
  ctx.fillStyle = '#b3242f'; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + lerp(26, 4, k), -lerp(7, 2, k)); ctx.lineTo(-len + lerp(30, 5, k), 0); ctx.fill();
  ctx.fillStyle = '#efe6d0'; ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + lerp(26, 4, k), lerp(7, 2, k)); ctx.lineTo(-len + lerp(30, 5, k), 0); ctx.fill();
  ctx.restore();
}
function nocked(ctx, R) {
  const sx = 300, sy = 760 + S.draw * 26, ang = Math.atan2(R.y - sy, R.x - sx), len = 190 - S.draw * 34;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang);
  ctx.strokeStyle = 'rgba(40,26,14,.9)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
  ctx.fillStyle = '#cfd3d6'; ctx.beginPath(); ctx.moveTo(len + 14, 0); ctx.lineTo(len - 2, -6); ctx.lineTo(len - 2, 6); ctx.fill();
  ctx.fillStyle = '#b3242f'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(40, -11); ctx.lineTo(46, 0); ctx.fill();
  ctx.fillStyle = '#efe6d0'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(40, 11); ctx.lineTo(46, 0); ctx.fill();
  ctx.restore();
}
function sight(ctx, R) {
  const full = S.draw >= 0.96, tired = S.holdT > 2.3;
  const col = tired ? '#ff6b5a' : full ? '#ffd76a' : '#ffffff';
  ctx.save(); ctx.translate(R.x, R.y);
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 6.283); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 6.283); ctx.stroke();
  ctx.beginPath(); for (const [a, b, c, d] of [[-24, 0, -8, 0], [8, 0, 24, 0], [0, -24, 0, -8], [0, 8, 0, 24]]) { ctx.moveTo(a, b); ctx.lineTo(c, d); } ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 2, 0, 6.283); ctx.fill();
  if (S.holding) {
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(0, 0, 25, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, 0, 25, -Math.PI / 2, -Math.PI / 2 + S.draw * 6.283); ctx.stroke();
  }
  ctx.restore();
}
function hud(ctx, g) {
  ctx.fillStyle = 'rgba(12,10,8,.62)'; ctx.fillRect(0, 0, W, 54);
  ctx.fillStyle = 'rgba(212,175,90,.6)'; ctx.fillRect(0, 54, W, 1.5);
  UG.drawShield(ctx, myShield, 24, 27, 38);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = '#f3dc92'; ctx.font = UG.font(13, 700);
  ctx.fillText(me.mine ? me.name.slice(0, 22) : 'Your house', 46, 18);
  const E = ENDS[S.end];
  ctx.fillStyle = '#e8dcc2'; ctx.font = UG.font(12, 500);
  ctx.fillText(`End ${S.end + 1}/3 · ${E.m} m`, 46, 37);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i < S.arrow ? 'rgba(232,220,194,.25)' : '#e8dcc2'; ctx.fillRect(160 + i * 9, 32, 4, 12); }
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff3cf'; ctx.font = UG.font(28, 900, 'Cinzel Decorative'); ctx.fillText(String(total()), W / 2 + 10, 27);
  // wind
  ctx.textAlign = 'right'; ctx.fillStyle = '#a8997c'; ctx.font = UG.font(10, 700); ctx.fillText('WIND', W - 58, 17);
  ctx.fillStyle = '#e8dcc2'; ctx.font = UG.font(14, 700); ctx.fillText(`${Math.abs(S.wind).toFixed(1)} m/s`, W - 58, 37);
  const L = 10 + Math.min(1, Math.abs(S.wind) / 5.5) * 26, dir = S.wind >= 0 ? 1 : -1, ax = W - 30;
  ctx.strokeStyle = '#7ec8ff'; ctx.fillStyle = '#7ec8ff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ax - dir * L / 2, 27); ctx.lineTo(ax + dir * L / 2, 27); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax + dir * (L / 2 + 7), 27); ctx.lineTo(ax + dir * (L / 2 - 2), 21); ctx.lineTo(ax + dir * (L / 2 - 2), 33); ctx.fill();
}
function banner(ctx, text, a) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = UG.font(19, 700); const w = Math.min(W - 40, ctx.measureText(text).width + 70), y = 92;
  ctx.fillStyle = '#7a1020'; ctx.beginPath(); ctx.moveTo(W / 2 - w / 2 - 14, y - 18); ctx.lineTo(W / 2 + w / 2 + 14, y - 18); ctx.lineTo(W / 2 + w / 2, y); ctx.lineTo(W / 2 + w / 2 + 14, y + 18); ctx.lineTo(W / 2 - w / 2 - 14, y + 18); ctx.lineTo(W / 2 - w / 2, y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d4af5a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff3cf'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W / 2, y + 1);
  ctx.restore();
}

UG.start({
  id: 'archery', title: "The King's Archery Contest", label: 'Archery game: a target on a tournament field', W, H,
  init(g) {
    me = UG.player(); myShield = UG.shield(me.design);
    for (let i = 0; i < 5; i++) clouds.push({ x: Math.random() * W, y: 30 + Math.random() * 150, a: 0.35 + Math.random() * 0.4, p: Array.from({ length: 4 }, (_, j) => [j * 22 - 30, (Math.random() - 0.5) * 10, 14 + Math.random() * 12]) });
    S = { daily: false, r: Math.random, end: 0, arrow: 0, ends: [[], [], []], xs: 0, phase: 'menu', wind: 1.4, aim: { x: 30, y: 40 }, draw: 0, holdT: 0, holding: false, keys: {}, fly: null, hits: [], msg: '', msgT: 0, trans: 0, swayT: 0 };
    const best = g.best;
    g.screen({ kicker: 'Archery', title: "The King's Archery Contest",
      html: '<ol class="ug-howto"><li>Press and hold to draw the bow.</li><li>Drag to aim while you hold.</li><li>Let go to loose. Aim into the wind.</li></ol>',
      sub: best ? `Your best: ${best} of 90` : 'Nine arrows. Three distances. One champion.',
      primary: { label: 'Start the contest', on: () => { g.hide(); UG.between(g, () => begin(g, false)); } },
      secondary: { label: `Daily contest #${dayNo()}`, on: () => { g.hide(); UG.between(g, () => begin(g, true)); } } });
  },
  update(g, dt) {
    g.dt = dt; S.swayT += dt;
    if (S.msgT > 0) S.msgT -= dt;
    if (S.trans > 0) S.trans = Math.max(0, S.trans - dt * 1.6);
    if (g.state !== 'play') return;
    const k = S.keys, sp = 170 * dt;
    if (k.l) S.aim.x -= sp; if (k.r) S.aim.x += sp; if (k.u) S.aim.y -= sp; if (k.d) S.aim.y += sp;
    S.aim.x = clamp(S.aim.x, -W / 2 + 20, W / 2 - 20); S.aim.y = clamp(S.aim.y, -260, 300);
    if (S.phase === 'aim' && S.holding) { S.holdT += dt; S.draw = Math.min(1, S.draw + dt / 0.75); }
    if (S.phase === 'fly') { S.fly.t += dt / S.fly.dur; if (S.fly.t >= 1) land(g); }
    if (S.phase === 'wait') {
      S.wait -= dt;
      if (S.wait <= 0 && S.then) {
        const f = S.then; S.then = null; f();
        // a finger already down (pressed during the pause) starts drawing as soon as the next arrow is ready
        if (S.phase === 'aim' && g.ptr.down && !S.holding) { S.holding = true; S.holdT = 0; UG.sfx.draw(); }
      }
    }
  },
  draw(g, ctx) {
    const E = ENDS[S.end];
    sky(ctx, g, S.wind); ground(ctx);
    const base = E.cy + E.r * 2.05, ph = 150 * (E.r / 116) + 40;
    pennant(ctx, g, 58, base, ph, S.wind); pennant(ctx, g, W - 58, base, ph, S.wind);
    target(ctx, E, 1 - S.trans * 0.9);
    for (const h of S.hits) stuck(ctx, h, E.r);
    if (g.state === 'play') {
      if (S.phase === 'fly') arrowInFlight(ctx, S.fly);
      if (S.phase === 'aim') { const R = reticle(g); nocked(ctx, R); sight(ctx, R); }
      hud(ctx, g);
      if (S.msgT > 0) banner(ctx, S.msg, Math.min(1, S.msgT * 2));
      if (S.phase === 'aim' && S.arrow === 0 && S.end === 0 && !S.holding && S.draw === 0) {
        ctx.fillStyle = 'rgba(12,10,8,.55)'; ctx.fillRect(W / 2 - 150, H - 62, 300, 34);
        ctx.fillStyle = '#fff3cf'; ctx.font = UG.font(14, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Hold to draw · drag to aim · release', W / 2, H - 45);
      }
    } else { const R = { x: E.cx + 40 * Math.sin(g.t * 0.7), y: E.cy + 30 * Math.sin(g.t * 1.1) }; sight(ctx, R); }
  },
  down(g) { if (g.state === 'play' && S.phase === 'aim') { S.holding = true; S.holdT = 0; UG.sfx.draw(); } },
  move(g, x, y, dx, dy) { if (g.state === 'play' && S.phase === 'aim' && S.holding) { S.aim.x += dx * 0.95; S.aim.y += dy * 0.95; } },
  up(g) { if (g.state === 'play' && S.phase === 'aim' && S.holding) loose(g); },
  key(g, key, down) {
    if (g.state !== 'play') return;
    const m = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' }[key];
    if (m) { S.keys[m] = down; return; }
    if (key === ' ' || key === 'Spacebar' || key === 'Enter') {
      if (down && S.phase === 'aim' && !S.holding) { S.holding = true; S.holdT = 0; UG.sfx.draw(); }
      else if (!down && S.phase === 'aim' && S.holding) loose(g);
    }
  },
  pause() { if (S && S.holding) { S.holding = false; S.draw = 0; S.holdT = 0; } },
});
// test hook, only on a local server
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__ug = { st: () => S };
})();
