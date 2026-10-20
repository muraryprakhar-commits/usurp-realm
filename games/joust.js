/* The Joust: a tournament seen from the saddle. Spur on the gold, lock the lance on the shield, strike as the ring
   closes. Three passes a bout, five challengers, each riding under their own arms. */
(function () {
'use strict';
const { clamp, lerp, ease } = UG;
const W = 540, H = 720, VPX = 270, VPY = 236, F = 360, CAMH = 2.4, IMPACT = 2.8, OPPX = -1.45, BARX = -0.7, SH_R = 0.33;
const LEVELS = [
  { skill: 0.3, sweep: 2.9, spd: 0 }, { skill: 0.44, sweep: 3.5, spd: 1.5 }, { skill: 0.55, sweep: 4.2, spd: 3 },
  { skill: 0.65, sweep: 4.9, spd: 4.5 }, { skill: 0.75, sweep: 5.7, spd: 6 },
];
const TITLES = ['Hedge Knight', 'Knight Errant', 'Knight of the Lists', 'Knight Banneret', 'Grand Champion', 'Champion of the Realm'];
const proj = (X, Y, z) => [VPX + F * X / z, VPY + F * (CAMH - Y) / z];
let S = null, me = null, myShield = null, opp = null, oppShield = null, g0 = null;

function newRun(g) {
  S = { level: 0, score: 0, wins: 0, unhorses: 0, travel: 0, bob: 0, flash: 0, hitFlash: 0, msgs: [] };
  g.state = 'play'; UG.track('play'); newBout(g);
}
function newBout(g) {
  opp = UG.randomKnight();
  if (S.level >= 4) opp.name = opp.name.replace(/^(Sir|Dame) /, '$1 ') + ", the King's Champion";
  opp.horse = UG.pick(['#6b4426', '#3b2a1f', '#cfc6b6', '#8a5a2b', '#4a3a30']);
  oppShield = UG.shield(opp.design);
  Object.assign(S, { pass: 0, me: 0, them: 0 });
  startPass(g, true);
  if (S.level > 0) UG.track('round', { bout: S.level + 1 });
}
function startPass(g, intro) {
  S.pass++;
  Object.assign(S, { phase: intro ? 'intro' : 'spur', phaseT: 0, z: 60, meterT: 0, speed: 0.4, v: 0, sweepT: Math.random() * 6, locked: false, aimOff: 0,
    aim: 0, timing: 0, tapped: false, broken: false, fall: 0, myRes: null, theirRes: null, slow: 1, stride: 0, gotHit: 0, swayOff: 0 });
  if (!intro) S.msgs.push({ t: `Pass ${S.pass}`, life: 1.1 });
}
function meterPos() { const p = (S.meterT * 1.15) % 2; return p < 1 ? p * 2 - 1 : 3 - p * 2; }
function spur(g) {
  const m = Math.abs(meterPos()); S.speed = clamp(1 - m, 0, 1);
  const L = LEVELS[Math.min(S.level, 4)];
  S.v = 13 + 8 * S.speed + L.spd; S.phase = 'charge'; S.phaseT = 0;
  const label = S.speed > 0.88 ? 'Perfect spur!' : S.speed > 0.62 ? 'Good spur' : 'Slow start';
  S.msgs = [{ t: label, life: 1.0, c: S.speed > 0.88 ? '#ffd76a' : '#f4f1e8' }];
  UG.sfx.whoosh(); UG.buzz(10);
}
function sweep() { return 0.62 * Math.sin(S.sweepT * LEVELS[Math.min(S.level, 4)].sweep); }
function lock(g, auto) {
  S.locked = true; S.aimOff = sweep();
  S.aim = clamp(1 - Math.abs(S.aimOff) / 0.45, 0, 1);
  if (!auto) UG.sfx.click();
  S.msgs = [{ t: auto ? 'Lance lowered late' : S.aim > 0.9 ? 'Dead centre!' : S.aim > 0.55 ? 'On the shield' : 'Off the mark', life: 0.9, c: S.aim > 0.9 ? '#ffd76a' : '#f4f1e8' }];
}
function strike(g) {
  if (S.tapped) return;
  S.tapped = true; const e = Math.abs(S.z - IMPACT);
  S.timing = clamp(1 - (e - 0.15) / 1.6, 0, 1);
  UG.sfx.click();
}
const RES = [[0.86, 'unhorse', 'Unhorsed!', 3], [0.62, 'shatter', 'Lance shattered!', 2], [0.35, 'hit', 'A clean hit', 1], [-1, 'miss', 'A miss', 0]];
function impact(g) {
  S.phase = 'impact'; S.phaseT = 0;
  if (!S.tapped) S.timing = 0;
  const q = 0.45 * S.aim + 0.35 * S.timing + 0.2 * S.speed;
  const mine = RES.find(r => q >= r[0]);
  const L = LEVELS[Math.min(S.level, 4)];
  const q2 = L.skill * 0.65 + Math.random() * 0.45 - S.timing * 0.2;
  let theirs = q2 >= 0.62 ? RES[1] : q2 >= 0.38 ? RES[2] : RES[3];
  if (q2 >= 0.95 && S.timing < 0.5 && mine[1] !== 'unhorse') theirs = RES[0];
  S.myRes = mine; S.theirRes = theirs;
  const [sx, sy] = proj(OPPX + 0.32 + S.aimOff, 1.95, IMPACT);
  if (mine[1] !== 'miss') {
    S.broken = mine[1] === 'shatter' || mine[1] === 'unhorse';
    UG.sfx.crack(); g.shake(mine[1] === 'hit' ? 6 : 12, 0.35); UG.buzz(mine[1] === 'hit' ? 20 : 45);
    g.burst(sx, sy, S.broken ? 34 : 12, { c: ['#c8a46a', '#8a6237', '#f0dcae', opp.design.d], shape: 'splinter', v0: 120, v1: 520, g: 700, s0: 3, s1: 9, l0: 0.5, l1: 1.2 });
    S.flash = 0.18;
  } else UG.sfx.whoosh();
  if (theirs[1] !== 'miss') { S.gotHit = 0.5; S.hitFlash = 0.35; setTimeout(() => { UG.sfx.hit(); }, 90); }
  if (mine[1] === 'unhorse') { S.unhorses++; UG.sfx.cheer(0.2); } else if (mine[3] >= 2) UG.sfx.cheer(0.12);
  S.me += mine[3]; S.them += theirs[3]; S.score += mine[3];
  S.msgs = [{ t: mine[2] + (mine[3] ? ` +${mine[3]}` : ''), life: 2.2, c: mine[3] ? '#ffd76a' : '#e9a7a0', big: true },
    { t: theirs[1] === 'unhorse' ? 'You are unhorsed!' : theirs[1] === 'miss' ? `${first(opp.name)} misses you` : `${first(opp.name)} strikes your shield +${theirs[3]}`, life: 2.2, c: theirs[1] === 'miss' ? '#cfe3c0' : '#e9a7a0', delay: 0.5 }];
  g.say(`${mine[2]}. ${S.msgs[1].t}.`);
}
const first = n => n.split(' of ')[0];
function afterPass(g) {
  const iWon = S.myRes[1] === 'unhorse', iLost = S.theirRes[1] === 'unhorse';
  if (iWon || iLost) return boutOver(g, iWon && !iLost);
  if (S.pass >= 3 && S.me !== S.them) return boutOver(g, S.me > S.them);
  if (S.pass >= 5) return boutOver(g, true);                         // the judges favour the challenger after two tied extra passes
  if (S.pass >= 3) S.msgs = [{ t: 'Tied! Another pass', life: 1.4, c: '#ffd76a' }];
  startPass(g, false);
}
function boutOver(g, won) {
  S.phase = 'done';
  if (won) {
    S.wins++; S.level++; S.score += 10 + (S.myRes[1] === 'unhorse' ? 5 : 0);
    UG.sfx.fanfare(); UG.sfx.cheer(0.16);
    if (S.wins >= 5) return gameOver(g, true);
    const next = 'Next challenger awaits';
    g.state = 'between';
    g.screen({ kicker: `Bout ${S.wins} of 5 won`, title: 'Victory!', big: `${S.me} – ${S.them}`, sub: `against ${opp.name}`,
      lines: [`Tournament score: ${S.score}`, `Title so far: ${TITLES[S.wins]}`, next],
      primary: { label: 'Ride the next bout', on: () => { g.hide(); UG.between(g, () => { g.state = 'play'; newBout(g); }); } } });
    return;
  }
  UG.sfx.fail(); UG.sfx.groan();
  gameOver(g, false);
}
function gameOver(g, champion) {
  g.state = 'over';
  const tot = S.score, newBest = g.setBest(tot), title = TITLES[S.wins];
  UG.track('finish', { score: tot, wins: S.wins });
  g.screen({ kicker: champion ? 'The tournament is yours' : `Defeated by ${opp.name}`, title, big: tot, sub: 'tournament points',
    lines: [`Bouts won: ${S.wins} of 5`, `Knights unhorsed: ${S.unhorses}`, newBest ? 'A new personal best!' : `Your best: ${g.best}`],
    primary: { label: 'Enter the lists again', on: () => { g.hide(); UG.between(g, () => newRun(g)); } },
    secondary: { label: 'Challenge a friend', on: () => g.share(`I won ${S.wins} of 5 bouts and ${tot} points in the Joust (${title}). Can you unhorse more knights?`) },
    cta: true });
}

/* ---------- drawing ---------- */
function backdrop(ctx, g) {
  const s = ctx.createLinearGradient(0, 0, 0, VPY); s.addColorStop(0, '#6e9cc7'); s.addColorStop(1, '#efdcb5');
  ctx.fillStyle = s; ctx.fillRect(0, 0, W, VPY + 1);
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  for (const [x, y, r] of [[80, 60, 18], [104, 54, 22], [128, 62, 16], [380, 90, 16], [404, 82, 22], [430, 92, 15]]) { ctx.beginPath(); ctx.ellipse((x + g.t * 4) % (W + 100) - 50, y, r * 1.6, r, 0, 0, 6.283); ctx.fill(); }
  // castle and stands at the end of the lists
  ctx.fillStyle = '#7b8b96';
  ctx.fillRect(196, VPY - 64, 22, 56); ctx.fillRect(322, VPY - 64, 22, 56); ctx.fillRect(218, VPY - 44, 104, 36);
  for (let x = 196; x < 344; x += 8) ctx.fillRect(x, VPY - (x < 218 || x >= 322 ? 70 : 50), 5, 7);
  ctx.fillStyle = '#5c6e5a'; ctx.beginPath(); ctx.moveTo(0, VPY - 8); ctx.bezierCurveTo(140, VPY - 30, 380, VPY - 2, W, VPY - 22); ctx.lineTo(W, VPY + 2); ctx.lineTo(0, VPY + 2); ctx.fill();
  const cols = ['#b3242f', '#1f4e8a', '#d4af5a', '#1f5f3d', '#efe6d0', '#5a2a6e'];
  for (let i = 0; i < 9; i++) {                                          // the grandstand across the far end
    const x = 120 + i * 34; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(x, VPY - 26, 30, 22);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let j = 0; j < 4; j++) ctx.fillRect(x + 3 + j * 7, VPY - 20 + (i + j) % 2 * 4, 4, 4);
    ctx.fillStyle = cols[(i + 3) % cols.length]; ctx.beginPath(); ctx.moveTo(x + 15, VPY - 40); ctx.lineTo(x + 15, VPY - 26); ctx.lineTo(x + 25, VPY - 33); ctx.fill();
  }
}
function ground(ctx) {
  ctx.fillStyle = '#6f8f3c'; ctx.fillRect(0, VPY, W, H - VPY);
  const [a1, a2] = [proj(-6, 0, 1.4), proj(3.2, 0, 1.4)], [b1, b2] = [proj(-6, 0, 120), proj(3.2, 0, 120)];
  const gr = ctx.createLinearGradient(0, VPY, 0, H); gr.addColorStop(0, '#cbb07c'); gr.addColorStop(1, '#a5824e');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(a2[0], a2[1]); ctx.lineTo(a1[0], a1[1]); ctx.fill();
  ctx.strokeStyle = 'rgba(90,60,30,.25)'; ctx.lineWidth = 2;                                   // hoof-churned marks streaming past
  for (let i = 0; i < 18; i++) {
    const z = 1.6 + ((i * 3.1 - S.travel) % 56 + 56) % 56; const X = ((i * 37) % 9) - 5.5;
    const [x, y] = proj(X, 0, z), L = 60 / z; ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.stroke();
  }
  // right-hand stand, with posts that rush past as you ride
  const [r1, r2, r3, r4] = [proj(5, 0, 1.6), proj(5, 3.6, 1.6), proj(5, 3.6, 90), proj(5, 0, 90)];
  ctx.fillStyle = '#5a3c22'; ctx.beginPath(); ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]); ctx.lineTo(r3[0], r3[1]); ctx.lineTo(r4[0], r4[1]); ctx.fill();
  const cr = ['#b3242f', '#efe6d0', '#1f4e8a', '#d4af5a', '#2a1a0e', '#1f5f3d'];
  for (let i = 0; i < 40; i++) {
    const z = 2 + ((i * 2.2 - S.travel) % 88 + 88) % 88, [x, y] = proj(5, 2.2 + (i % 3) * 0.45, z), rr = Math.max(0.6, 22 / z);
    ctx.fillStyle = cr[i % cr.length]; ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.283); ctx.fill();
  }
  ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 1;
  for (let i = 0; i < 16; i++) { const z = 2 + ((i * 6 - S.travel) % 96 + 96) % 96, [x, y0] = proj(5, 0, z), [, y1] = proj(5, 3.6, z); ctx.lineWidth = Math.max(1, 12 / z); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
}
function barrier(ctx, zNear, zFar) {
  if (zFar <= zNear) return;
  const zs = Math.max(zNear, 1.25);
  const c1 = '#b3242f', c2 = '#efe6d0';
  const off = ((S.travel % 4) + 4) % 4;
  for (let z0 = zs - ((zs + off) % 2); z0 < zFar; z0 += 2) {
    const za = Math.max(zs, z0), zb = Math.min(zFar, z0 + 2); if (zb <= za) continue;
    const idx = Math.floor((z0 + off) / 2 + 1000) % 2;
    const [p1, p2, p3, p4] = [proj(BARX, 1.15, za), proj(BARX, 1.15, zb), proj(BARX, 0.05, zb), proj(BARX, 0.05, za)];
    ctx.fillStyle = idx ? c1 : c2; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.fill();
  }
  const [t1, t2] = [proj(BARX, 1.3, zs), proj(BARX, 1.3, zFar)], [u1, u2] = [proj(BARX, 1.15, zs), proj(BARX, 1.15, zFar)];
  ctx.fillStyle = '#6b4426'; ctx.beginPath(); ctx.moveTo(t1[0], t1[1]); ctx.lineTo(t2[0], t2[1]); ctx.lineTo(u2[0], u2[1]); ctx.lineTo(u1[0], u1[1]); ctx.fill();
}
function knight(ctx, g) {
  if (S.z < 0.9) return;
  const z = S.z, s = F / z, [gx, gy] = proj(OPPX, 0, z), d = opp.design;
  const gal = Math.sin(S.stride * 2) * 0.05;
  ctx.save(); ctx.translate(gx, gy); ctx.scale(s, s);
  // horse legs (behind the cloth)
  const step = Math.sin(S.stride * 2), lift = Math.max(0, step) * 0.35, lift2 = Math.max(0, -step) * 0.35;
  ctx.fillStyle = opp.horse;
  ctx.fillRect(-0.24, -1.0, 0.12, 1.0 - lift); ctx.fillRect(0.12, -1.0, 0.12, 1.0 - lift2);
  ctx.fillStyle = '#2a1a0e'; ctx.fillRect(-0.25, -0.1 - lift, 0.14, 0.1); ctx.fillRect(0.11, -0.1 - lift2, 0.14, 0.1);
  ctx.translate(0, gal);
  // caparison
  ctx.fillStyle = d.f; ctx.beginPath(); ctx.moveTo(-0.52, -1.62); ctx.lineTo(0.52, -1.62); ctx.lineTo(0.56, -0.6);
  for (let i = 0; i <= 8; i++) ctx.lineTo(0.56 - i * 0.14, -0.6 + (i % 2 ? 0.07 : 0)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = d.d; ctx.fillRect(-0.53, -0.72, 1.08, 0.07); ctx.fillRect(-0.06, -1.62, 0.12, 0.92);
  // the knight (falls back when unhorsed)
  ctx.save();
  if (S.fall > 0) { const k = ease.inCubic(Math.min(1, S.fall)); ctx.translate(0, -1.75 + k * 1.2); ctx.rotate(-k * 1.4); ctx.translate(0, 1.75); ctx.globalAlpha = 1 - Math.max(0, S.fall - 0.7) * 2; }
  ctx.fillStyle = '#9aa3ab'; ctx.fillRect(-0.3, -2.15, 0.6, 0.5);                       // armoured torso
  ctx.fillStyle = d.f; ctx.beginPath(); ctx.moveTo(-0.27, -2.2); ctx.lineTo(0.27, -2.2); ctx.lineTo(0.31, -1.66); ctx.lineTo(-0.31, -1.66); ctx.fill();   // surcoat
  ctx.fillStyle = d.d; ctx.fillRect(-0.04, -2.2, 0.08, 0.54);
  ctx.fillStyle = '#b8bec5'; ctx.beginPath(); ctx.ellipse(0, -2.42, 0.16, 0.2, 0, 0, 6.283); ctx.fill();   // great helm
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-0.12, -2.46, 0.24, 0.035);
  ctx.strokeStyle = '#6c737a'; ctx.lineWidth = 0.02; ctx.beginPath(); ctx.moveTo(0, -2.62); ctx.lineTo(0, -2.24); ctx.stroke();
  ctx.fillStyle = d.d; ctx.beginPath(); ctx.moveTo(-0.03, -2.6); ctx.quadraticCurveTo(0.05 + Math.sin(g.t * 9) * 0.04, -2.95, 0.18, -2.72); ctx.quadraticCurveTo(0.06, -2.7, 0.03, -2.6); ctx.fill();   // plume
  UG.drawShield(ctx, oppShield, 0.32, -2.0, 0.68);
  ctx.restore();
  // horse head and neck in front, with a steel chanfron
  ctx.fillStyle = opp.horse; ctx.beginPath(); ctx.moveTo(-0.15, -1.62); ctx.lineTo(0.15, -1.62); ctx.lineTo(0.12, -2.12); ctx.lineTo(-0.12, -2.12); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-0.12, -2.12); ctx.lineTo(-0.16, -2.3); ctx.lineTo(-0.06, -2.16); ctx.moveTo(0.12, -2.12); ctx.lineTo(0.16, -2.3); ctx.lineTo(0.06, -2.16); ctx.fill();
  ctx.fillStyle = '#c4cad0'; ctx.beginPath(); ctx.moveTo(-0.1, -2.1); ctx.lineTo(0.1, -2.1); ctx.lineTo(0.07, -1.7); ctx.lineTo(-0.07, -1.7); ctx.fill();
  ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.ellipse(0, -1.63, 0.1, 0.05, 0, 0, 6.283); ctx.fill();
  ctx.restore();
}
function oppLance(ctx) {
  if (S.z < 0.9 || S.fall > 0.25) return;
  const z = S.z, [hx, hy] = proj(OPPX - 0.28, 1.95, z), zt = Math.max(0.85, z - 3.4), [tx, ty] = proj(OPPX + 1.15, 2.0, zt);
  lance(ctx, hx, hy, tx, ty, 0.12 * F / z, 0.035 * F / zt, opp.design.f, opp.design.d, S.phase === 'impact' && S.theirRes && S.theirRes[3] >= 2);
}
function lance(ctx, x0, y0, x1, y1, w0, w1, c1, c2, broken) {
  const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0), len = broken ? L * 0.55 : L;
  ctx.save(); ctx.translate(x0, y0); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(0, -w0 / 2); ctx.lineTo(len, -lerp(w0, w1, len / L) / 2); ctx.lineTo(len, lerp(w0, w1, len / L) / 2); ctx.lineTo(0, w0 / 2); ctx.closePath();
  ctx.fillStyle = c1; ctx.fill(); ctx.save(); ctx.clip();
  ctx.fillStyle = c2; for (let i = 0; i < 14; i++) { const x = i * L / 14; ctx.beginPath(); ctx.moveTo(x, -w0); ctx.lineTo(x + L / 28, -w0); ctx.lineTo(x + L / 28 + w0, w0); ctx.lineTo(x + w0, w0); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(20,14,8,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
  if (broken) { ctx.fillStyle = '#d9b77a'; ctx.beginPath(); ctx.moveTo(len, -w1); for (let i = 0; i < 5; i++) ctx.lineTo(len + (i % 2 ? 6 : 16), -w1 + i * w1 / 2); ctx.lineTo(len, w1); ctx.fill(); }
  ctx.restore();
}
function myView(ctx, g) {
  const bob = Math.sin(S.stride * 2) * (S.phase === 'charge' || S.phase === 'strike' ? 7 : 2) + (S.gotHit > 0 ? Math.sin(g.t * 60) * 6 * S.gotHit : 0);
  // our horse's neck and head at the bottom, in our colours
  const d = me.design;
  ctx.save(); ctx.translate(318, 720 + bob * 0.6);
  ctx.fillStyle = '#5a3a20'; ctx.beginPath(); ctx.moveTo(-80, 10); ctx.quadraticCurveTo(-60, -110, -14, -150); ctx.lineTo(30, -150); ctx.quadraticCurveTo(70, -100, 86, 10); ctx.fill();
  ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.moveTo(-14, -150); ctx.quadraticCurveTo(-46, -100, -58, 10); ctx.lineTo(-40, 10); ctx.quadraticCurveTo(-30, -90, 0, -146); ctx.fill();   // mane
  ctx.fillStyle = '#5a3a20'; ctx.beginPath(); ctx.moveTo(-8, -148); ctx.lineTo(-20, -186); ctx.lineTo(4, -152); ctx.moveTo(26, -148); ctx.lineTo(40, -186); ctx.lineTo(18, -152); ctx.fill();   // ears
  ctx.fillStyle = d.f; ctx.beginPath(); ctx.moveTo(-80, 10); ctx.quadraticCurveTo(-70, -60, -52, -76); ctx.lineTo(70, -76); ctx.quadraticCurveTo(80, -40, 86, 10); ctx.fill();
  ctx.fillStyle = d.d; ctx.fillRect(-60, -82, 132, 9);
  ctx.restore();
  // our shield on the left arm, showing the player's own arms
  UG.drawShield(ctx, myShield, 42, 610 + bob * 0.8, 250);
  // our lance from the right hand to the tip
  let tip;
  if (S.phase === 'spur' || S.phase === 'intro') tip = [VPX - 40, VPY + 40 + bob * 0.3];
  else {
    const z = Math.max(S.z, IMPACT), off = S.locked ? S.aimOff + Math.sin(g.t * 7) * 0.02 : sweep();
    const [sx, sy] = proj(OPPX + 0.32 + off, 1.95 + Math.sin(S.stride * 2) * 0.04, z); tip = [sx, sy];
  }
  if (S.phase === 'impact' && S.phaseT > 0.25) tip = [lerp(tip[0], 120, Math.min(1, (S.phaseT - 0.25) * 2)), tip[1] + 30];
  lance(ctx, 520, 760 + bob, tip[0], tip[1], 34, 7, d.f, d.d, S.broken);
  ctx.fillStyle = '#aeb5bc'; ctx.save(); ctx.translate(500, 700 + bob); ctx.rotate(Math.atan2(tip[1] - 760, tip[0] - 520)); ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(42, -14); ctx.lineTo(42, 14); ctx.lineTo(0, 38); ctx.fill(); ctx.strokeStyle = '#4a4f55'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();   // vamplate
  return tip;
}
function ui(ctx, g, tip) {
  // HUD
  ctx.fillStyle = 'rgba(12,10,8,.66)'; ctx.fillRect(0, 0, W, 50); ctx.fillStyle = 'rgba(212,175,90,.6)'; ctx.fillRect(0, 50, W, 1.5);
  UG.drawShield(ctx, myShield, 22, 25, 34); UG.drawShield(ctx, oppShield, W - 22, 25, 34);
  ctx.textBaseline = 'middle'; ctx.font = UG.font(12, 700); ctx.fillStyle = '#f3dc92';
  ctx.textAlign = 'left'; ctx.fillText(me.mine ? me.name.slice(0, 18) : 'You', 42, 17);
  ctx.textAlign = 'right'; ctx.fillText(first(opp.name).slice(0, 20), W - 42, 17);
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff3cf'; ctx.font = UG.font(26, 900, 'Cinzel Decorative'); ctx.fillText(`${S.me} – ${S.them}`, W / 2, 24);
  ctx.font = UG.font(11, 700); ctx.fillStyle = '#a8997c'; ctx.fillText(`BOUT ${S.wins + 1} OF 5 · PASS ${S.pass}`, W / 2, 43);
  ctx.textAlign = 'left'; ctx.fillStyle = '#e8dcc2'; ctx.font = UG.font(11, 500); ctx.fillText(`Score ${S.score}`, 42, 36);
  // phase prompts
  const prompt = t => { ctx.font = UG.font(15, 700); const w = ctx.measureText(t).width + 30; ctx.fillStyle = 'rgba(12,10,8,.7)'; ctx.fillRect(W / 2 - w / 2, H - 56, w, 32); ctx.fillStyle = '#fff3cf'; ctx.textAlign = 'center'; ctx.fillText(t, W / 2, H - 40); };
  if (S.phase === 'spur') {
    const bx = 120, bw = 300, by = 470;
    ctx.fillStyle = 'rgba(12,10,8,.72)'; ctx.fillRect(bx - 10, by - 14, bw + 20, 44);
    const gr = ctx.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#7a1020'); gr.addColorStop(0.38, '#c8312f'); gr.addColorStop(0.5, '#ffd76a'); gr.addColorStop(0.62, '#c8312f'); gr.addColorStop(1, '#7a1020');
    ctx.fillStyle = gr; ctx.fillRect(bx, by, bw, 16);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(bx + bw / 2 - bw * 0.06, by - 3, bw * 0.12, 2); ctx.fillRect(bx + bw / 2 - bw * 0.06, by + 17, bw * 0.12, 2);
    const nx = bx + (meterPos() + 1) / 2 * bw; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(nx, by - 8); ctx.lineTo(nx - 7, by - 16); ctx.lineTo(nx + 7, by - 16); ctx.fill(); ctx.fillRect(nx - 1.5, by - 8, 3, 30);
    prompt('Tap on the gold to spur your horse');
  }
  if (S.phase === 'charge' || S.phase === 'strike') {
    const [sx, sy] = proj(OPPX + 0.32, 1.95, Math.max(S.z, IMPACT)), sr = SH_R * F / Math.max(S.z, IMPACT);
    if (S.phase === 'strike' && !S.tapped) {
      const k = clamp((12 - S.z) / (12 - IMPACT), 0, 1), rr = sr * (1 + 2.6 * (1 - k));
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, 6.283); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = Math.abs(rr - sr) < sr * 0.25 ? '#ffd76a' : '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, 6.283); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,215,106,.85)'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
      prompt('Tap as the ring meets the shield!');
    } else if (S.phase === 'charge' && !S.locked) prompt('Tap when your lance points at the shield');
    // the lance tip marker
    ctx.fillStyle = S.locked ? '#ffd76a' : '#ffffff'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tip[0], tip[1] - 7); ctx.lineTo(tip[0] + 6, tip[1]); ctx.lineTo(tip[0], tip[1] + 7); ctx.lineTo(tip[0] - 6, tip[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // messages
  let y = 140;
  for (const m of S.msgs) {
    if (m.delay > 0) continue;
    const a = Math.min(1, m.life * 2.5); ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.font = UG.font(m.big ? 30 : 22, 900, 'Cinzel Decorative'); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,14,8,.85)'; ctx.lineJoin = 'round';
    ctx.strokeText(m.t, W / 2, y); ctx.fillStyle = m.c || '#fff3cf'; ctx.fillText(m.t, W / 2, y); y += m.big ? 42 : 34;
  }
  ctx.globalAlpha = 1;
  if (S.phase === 'intro') {
    ctx.fillStyle = 'rgba(12,10,8,.72)'; ctx.fillRect(40, 300, W - 80, 150); ctx.strokeStyle = '#8a6a24'; ctx.strokeRect(40, 300, W - 80, 150);
    UG.drawShield(ctx, oppShield, 104, 375, 110);
    ctx.textAlign = 'left'; ctx.fillStyle = '#d4af5a'; ctx.font = UG.font(12, 700); ctx.fillText(`BOUT ${S.wins + 1} OF 5`, 160, 336);
    ctx.fillStyle = '#fff3cf'; ctx.font = UG.font(19, 900, 'Cinzel Decorative');
    const words = opp.name.split(' '); let line = '', ly = 368;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > W - 220) { ctx.fillText(line, 160, ly); ly += 26; line = w; } else line = t; }
    ctx.fillText(line, 160, ly);
    ctx.fillStyle = '#a8997c'; ctx.font = UG.font(12, 500); ctx.fillText('rides against you', 160, ly + 26);
  }
  if (S.hitFlash > 0) { ctx.fillStyle = `rgba(160,20,20,${S.hitFlash * 0.8})`; ctx.fillRect(0, 0, W, H); }
  if (S.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${S.flash * 2})`; ctx.fillRect(0, 0, W, H); }
}

UG.start({
  id: 'joust', title: 'The Joust', label: 'Jousting game: a knight charges at you down the lists', W, H,
  init(g) {
    g0 = g; me = UG.player(); myShield = UG.shield(me.design);
    S = { level: 0, score: 0, wins: 0, unhorses: 0, travel: 0, msgs: [], me: 0, them: 0, pass: 1, phase: 'menu', z: 40, stride: 0, flash: 0, hitFlash: 0, gotHit: 0, fall: 0, sweepT: 0, locked: false, aimOff: 0 };
    opp = UG.randomKnight(); opp.horse = '#6b4426'; oppShield = UG.shield(opp.design);
    g.screen({ kicker: 'Jousting', title: 'The Joust',
      html: '<ol class="ug-howto"><li>Tap on the gold to spur your horse.</li><li>Tap when your lance points at the shield.</li><li>Tap again as the ring meets the shield.</li></ol>',
      sub: g.best ? `Your best: ${g.best} points` : 'Five challengers. Unhorse them all.',
      primary: { label: 'Enter the lists', on: () => { g.hide(); UG.between(g, () => newRun(g)); } } });
  },
  update(g, dt) {
    for (const m of S.msgs) { if (m.delay > 0) m.delay -= dt; else m.life -= dt; }
    S.msgs = S.msgs.filter(m => m.life > 0);
    if (S.flash > 0) S.flash -= dt; if (S.hitFlash > 0) S.hitFlash -= dt; if (S.gotHit > 0) S.gotHit -= dt;
    if (g.state !== 'play') { S.stride += dt * 3; S.z = 30 + Math.sin(g.t * 0.4) * 10; return; }
    S.phaseT += dt;
    const ride = S.phase === 'charge' || S.phase === 'strike' || S.phase === 'impact';
    if (ride) {
      const k = S.phase === 'strike' ? S.slow : 1, before = Math.floor(S.stride / Math.PI);
      S.stride += dt * k * (6 + S.v * 0.25); S.travel += S.v * 0.5 * dt * k;
      if (Math.floor(S.stride / Math.PI) !== before) UG.sfx.gallop();
    }
    switch (S.phase) {
      case 'intro': if (S.phaseT > 2.1) { S.phase = 'spur'; S.phaseT = 0; } break;
      case 'spur': S.meterT += dt; if (S.meterT > 3.6) spur(g); break;
      case 'charge':
        S.z -= S.v * dt; if (!S.locked) S.sweepT += dt;
        if (S.z <= 12) { if (!S.locked) lock(g, true); S.phase = 'strike'; S.phaseT = 0; S.slow = 0.3; }
        break;
      case 'strike': S.z -= S.v * dt * S.slow; if (S.z <= IMPACT) impact(g); break;
      case 'impact':
        S.z -= S.v * dt * 0.55;
        if (S.myRes && S.myRes[1] === 'unhorse') S.fall += dt * 1.4;
        if (S.phaseT > 2.4) afterPass(g);
        break;
    }
  },
  draw(g, ctx) {
    backdrop(ctx, g); ground(ctx);
    barrier(ctx, Math.max(S.z, 1.25), 95);
    knight(ctx, g);
    barrier(ctx, 1.25, Math.max(S.z, 1.25));
    oppLance(ctx);
    const tip = myView(ctx, g);
    if (g.state === 'play') ui(ctx, g, tip);
  },
  down(g) {
    if (g.state !== 'play') return;
    if (S.phase === 'spur') spur(g);
    else if (S.phase === 'charge' && !S.locked) lock(g, false);
    else if (S.phase === 'strike') strike(g);
  },
  key(g, key, down) { if (down && (key === ' ' || key === 'Spacebar' || key === 'Enter')) this.down(g); },
  pause() {},
});
// test hook, only on a local server
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__ug = { st: () => S };
})();
