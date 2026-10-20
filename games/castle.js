/* Hold the Castle: the Usurper's host marches on your walls. Tap to loose arrows (lead the moving ones), choose a reward
   after every wave, and keep the wall standing. */
(function () {
'use strict';
const { clamp, lerp, rand, pick } = UG;
const W = 540, H = 720, WALL = 600, GATE = 270;
const TOWERS = [[92, 622], [270, 622], [448, 622]];
const TYPES = {
  foot:     { hp: 1, spd: 34, r: 14, dmg: 4, val: 10 },
  runner:   { hp: 1, spd: 66, r: 12, dmg: 3, val: 15 },
  shield:   { hp: 3, spd: 24, r: 16, dmg: 5, val: 25 },
  ladder:   { hp: 4, spd: 27, r: 20, dmg: 11, val: 30 },
  ram:      { hp: 12, spd: 13, r: 26, dmg: 16, val: 80 },
  catapult: { hp: 6, spd: 20, r: 24, dmg: 0, val: 60 },
  knight:   { hp: 16, spd: 18, r: 20, dmg: 9, val: 120 },
};
const UPGRADES = [
  { id: 'reload', label: 'Swifter hands', sub: 'Arrows reload 25% faster.', ok: () => S.reload > 0.2, on: () => { S.reload *= 0.75; } },
  { id: 'quiver', label: 'A bigger quiver', sub: 'Carry two more arrows.', ok: () => S.maxQ < 13, on: () => { S.maxQ += 2; S.quiver = S.maxQ; } },
  { id: 'dmg', label: 'Bodkin points', sub: 'Every arrow hits harder.', ok: () => S.dmg < 4, on: () => { S.dmg += 1; } },
  { id: 'fire', label: 'Fire arrows', sub: 'Arrows burst into flame and burn nearby foes.', ok: () => S.splash < 60, on: () => { S.splash += 26; } },
  { id: 'archer', label: 'Hire an archer', sub: 'A bowman on the wall shoots at the nearest foe.', ok: () => S.archers < 3, on: () => { S.archers++; } },
  { id: 'repair', label: "Mason's repair", sub: 'Restore 40 strength to the wall.', ok: () => S.hp < S.maxHp - 15, on: () => { S.hp = Math.min(S.maxHp, S.hp + 40); } },
  { id: 'stone', label: 'Stone on stone', sub: 'The wall gains 30 strength, and is mended by 30.', ok: () => true, on: () => { S.maxHp += 30; S.hp = Math.min(S.maxHp, S.hp + 30); } },
  { id: 'oil', label: 'Boiling oil', sub: 'Pour oil on everyone at the wall. Recharges.', ok: () => !S.oil, on: () => { S.oil = { cd: 22, t: 0 }; } },
  { id: 'volley', label: 'Volley', sub: 'Loose seven arrows across the field at once. Recharges.', ok: () => !S.volley, on: () => { S.volley = { cd: 18, t: 0 }; } },
  { id: 'long', label: 'Longbows', sub: 'Arrows fly a third faster: easier to lead.', ok: () => S.aspd < 1.6, on: () => { S.aspd *= 1.33; } },
];
let S = null, me = null, myShield = null, deco = null, enemyArms = null;

function newRun(g) {
  S = { wave: 0, hp: 100, maxHp: 100, quiver: 6, maxQ: 6, reloadT: 0, reload: 0.5, dmg: 1, splash: 0, aspd: 1, archers: 0, archT: 0, oil: null, volley: null,
    enemies: [], arrows: [], stones: [], stuck: [], queue: [], spawnT: 0, score: 0, kills: 0, phase: 'wave', banner: '', bannerT: 0, aim: [GATE, 300], dmgT: 0 };
  g.state = 'play'; UG.track('play'); startWave(g);
}
function waveList(n) {
  const L = [], add = (t, c) => { for (let i = 0; i < c; i++) L.push(t); };
  add('foot', 4 + n * 2);
  if (n >= 2) add('runner', Math.floor(n * 1.3));
  if (n >= 3) add('shield', n - 1);
  if (n >= 4) add('ladder', Math.floor((n - 2) / 2));
  for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; }
  if (n >= 4 && n % 2 === 0) add('catapult', 1 + Math.floor((n - 4) / 4));
  if (n >= 5) add('ram', Math.floor((n - 3) / 2));
  if (n % 5 === 0) add('knight', n / 5);
  return L;
}
function startWave(g) {
  S.wave++; S.queue = waveList(S.wave); S.total = S.queue.length; S.spawnT = 1.2; S.phase = 'wave';
  S.banner = `Wave ${S.wave}`; S.bannerT = 2;
  if (S.wave > 1) UG.track('round', { wave: S.wave });
  UG.sfx.fanfare();
}
function spawn(type) {
  const T = TYPES[type], n = S.wave, hp = Math.max(1, Math.round(T.hp * (1 + (n - 1) * 0.07)));
  const tx = type === 'ram' ? GATE + rand(-16, 16) : rand(40, W - 40);
  S.enemies.push({ type, x: type === 'catapult' ? rand(80, W - 80) : rand(30, W - 30), y: -30, tx, hp, max: hp, spd: T.spd * (1 + n * 0.025) * rand(0.9, 1.1),
    r: T.r, dmg: T.dmg, state: 'march', t: rand(0, 6), flash: 0, wob: rand(0, 6), climb: 0, fireT: rand(2, 4), stopY: rand(70, 110), burn: 0 });
}
function fire(g, x, y, from, dmg) {
  const [tx, ty] = from || TOWERS.reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a));
  const d = Math.hypot(x - tx, y - ty), dur = d / (820 * S.aspd);
  S.arrows.push({ x0: tx, y0: ty - 20, x1: x, y1: y, t: 0, dur, dmg: dmg || S.dmg, auto: !!from });
  if (!from) { UG.sfx.twang(); S.aim = [x, y]; }
}
function hitAt(g, a) {
  let hit = false;
  for (const e of S.enemies) {
    if (e.hp <= 0) continue;
    const d = Math.hypot(e.x - a.x1, e.y - a.y1);
    if (d < e.r + 12) { damage(g, e, a.dmg); hit = true; }
    else if (S.splash && !a.auto && d < e.r + S.splash) { damage(g, e, 1); e.burn = 1.2; hit = true; }
  }
  if (S.splash && !a.auto) { g.burst(a.x1, a.y1, 12, { c: ['#ff9a3c', '#ffd76a', '#c8312f'], shape: 'dot', v0: 30, v1: 140, g: -80, l0: 0.3, l1: 0.7, s0: 2, s1: 4 }); }
  if (hit) UG.sfx.hit();
  else { S.stuck.push({ x: a.x1, y: a.y1, t: 0, ang: Math.atan2(a.y1 - a.y0, a.x1 - a.x0) }); if (S.stuck.length > 40) S.stuck.shift(); }
}
function damage(g, e, n) {
  e.hp -= n; e.flash = 0.12;
  g.burst(e.x, e.y - 6, 5, { c: ['#e8dcc2', '#a8997c'], v0: 30, v1: 120, g: 300, l1: 0.5, s0: 1.5, s1: 3 });
  if (e.hp <= 0) {
    const T = TYPES[e.type]; S.kills++; S.score += T.val;
    g.pop(`+${T.val}`, e.x, e.y - 14, { c: '#ffd76a', size: e.r > 18 ? 28 : 20, rise: 40, max: 0.8 });
    g.burst(e.x, e.y, e.r > 18 ? 18 : 8, { c: ['#b8a888', '#6b5a40', '#e8dcc2'], v0: 30, v1: 160, g: 200, l1: 0.7 });
    if (e.r > 18) { UG.sfx.boom(); g.shake(6, 0.25); } else UG.sfx.thunk();
  }
}
function wallHit(g, n, x) {
  S.hp -= n; S.dmgT = 0.25;
  if (x !== undefined) g.burst(x, WALL - 6, 10, { c: ['#9b8f7c', '#c9bda8', '#5a5040'], v0: 40, v1: 180, g: 500, l1: 0.8 });
  if (S.hp <= 0 && S.phase !== 'over') gameOver(g);
}
function oil(g) {
  if (!S.oil || S.oil.t > 0) return;
  S.oil.t = S.oil.cd; UG.sfx.boom(); g.shake(8, 0.3);
  for (const e of S.enemies) if (e.y > WALL - 90 && e.hp > 0) { damage(g, e, 5); e.burn = 2; }
  for (let x = 30; x < W; x += 40) g.burst(x, WALL - 30, 6, { c: ['#ff9a3c', '#ffd76a', '#5a3a1c'], shape: 'dot', v0: 20, v1: 120, g: 200, l0: 0.4, l1: 0.9 });
}
function volley(g) {
  if (!S.volley || S.volley.t > 0) return;
  S.volley.t = S.volley.cd;
  const alive = S.enemies.filter(e => e.hp > 0).sort((a, b) => b.y - a.y).slice(0, 7);
  for (let i = 0; i < 7; i++) {
    const e = alive[i % Math.max(1, alive.length)], from = TOWERS[i % 3];
    if (e) { const d = Math.hypot(e.x - from[0], e.y - from[1]) / (820 * S.aspd); fire(g, e.x, e.y + (e.state === 'march' ? e.spd * d : 0), from, S.dmg); }
    else fire(g, 40 + i * 75, 200 + (i % 2) * 120, from, S.dmg);
  }
  UG.sfx.whoosh(); UG.sfx.twang();
}
function waveCleared(g) {
  S.phase = 'reward'; S.score += 50 * S.wave; g.state = 'between';
  UG.sfx.cheer(0.12);
  const pool = UPGRADES.filter(u => u.ok()), picks = [];
  while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  g.screen({ kicker: `Wave ${S.wave} held`, title: 'Choose a reward', sub: `Score ${S.score} · Wall ${Math.max(0, Math.round(S.hp))} of ${S.maxHp}`,
    choices: picks.map(u => ({ label: u.label, sub: u.sub, on: () => { u.on(); g.hide(); UG.between(g, () => { g.state = 'play'; S.quiver = S.maxQ; startWave(g); }); } })) });
}
function gameOver(g) {
  S.phase = 'over'; g.state = 'over';
  const newBest = g.setBest(S.score);
  UG.track('finish', { score: S.score, wave: S.wave });
  UG.sfx.boom(); UG.sfx.fail(); g.shake(14, 0.6);
  const rank = S.wave >= 12 ? 'Lord Protector' : S.wave >= 9 ? 'Castellan' : S.wave >= 6 ? 'Captain of the Guard' : S.wave >= 3 ? 'Sergeant-at-Arms' : 'Militia';
  setTimeout(() => g.screen({ kicker: 'The wall is breached', title: rank, big: S.score, sub: `${S.score === 1 ? 'point' : 'points'} · held ${S.wave - 1} wave${S.wave - 1 === 1 ? '' : 's'}`,
    lines: [`Foes defeated: ${S.kills}`, g.bestLine(newBest)],
    primary: { label: 'Defend again', on: () => { g.hide(); UG.between(g, () => newRun(g)); } },
    secondary: { label: 'Challenge a friend', on: () => g.share(`I held the castle for ${S.wave - 1} waves and scored ${S.score} in Hold the Castle. How long can you last?`) },
    cta: true }), 900);
}

/* ---------- drawing ---------- */
function makeDeco() {
  const r = UG.seeded(42), trees = [], tufts = [], rocks = [];
  for (let i = 0; i < 26; i++) { const left = i % 2 === 0; trees.push([left ? r() * 70 : W - r() * 70, 40 + r() * 470, 18 + r() * 16]); }
  for (let i = 0; i < 90; i++) tufts.push([r() * W, 40 + r() * 540]);
  for (let i = 0; i < 10; i++) rocks.push([60 + r() * (W - 120), 120 + r() * 420, 4 + r() * 6]);
  return { trees, tufts, rocks };
}
function field(ctx) {
  const gr = ctx.createLinearGradient(0, 0, 0, WALL); gr.addColorStop(0, '#34502a'); gr.addColorStop(1, '#6e9142');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, WALL + 10);
  ctx.fillStyle = '#b09564'; ctx.beginPath(); ctx.moveTo(246, 0); ctx.bezierCurveTo(230, 200, 300, 360, 222, WALL); ctx.lineTo(318, WALL); ctx.bezierCurveTo(352, 380, 286, 210, 294, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(40,60,20,.5)'; ctx.lineWidth = 1.5;
  for (const [x, y] of deco.tufts) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y - 5); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 6); ctx.stroke(); }
  ctx.fillStyle = '#8b8574'; for (const [x, y, s] of deco.rocks) { ctx.beginPath(); ctx.ellipse(x, y, s * 1.3, s, 0, 0, 6.283); ctx.fill(); }
  for (const [x, y, s] of deco.trees) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + 6, y + s * 0.6, s, s * 0.45, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#2c4a22'; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#3d6330'; ctx.beginPath(); ctx.arc(x - s * 0.25, y - s * 0.25, s * 0.62, 0, 6.283); ctx.fill();
  }
  const fog = ctx.createLinearGradient(0, 0, 0, 90); fog.addColorStop(0, 'rgba(14,20,12,.9)'); fog.addColorStop(1, 'rgba(14,20,12,0)');
  ctx.fillStyle = fog; ctx.fillRect(0, 0, W, 90);
}
function soldier(ctx, e, g) {
  const step = Math.sin(e.t * (e.spd / 6)), s = e.r / 12;
  ctx.save(); ctx.translate(e.x, e.y);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 10 * s, 10 * s, 4 * s, 0, 0, 6.283); ctx.fill();
  if (e.state === 'march') { ctx.fillStyle = '#2a2018'; ctx.fillRect(-5 * s, 4 * s + step * 2, 3.5 * s, 7 * s); ctx.fillRect(1.5 * s, 4 * s - step * 2, 3.5 * s, 7 * s); }
  const tab = e.type === 'runner' ? '#6b4a2a' : '#1d1915';
  ctx.fillStyle = tab; ctx.beginPath(); ctx.moveTo(-7 * s, -4 * s); ctx.lineTo(7 * s, -4 * s); ctx.lineTo(8 * s, 6 * s); ctx.lineTo(-8 * s, 6 * s); ctx.fill();
  if (e.type !== 'runner') { ctx.fillStyle = '#b3242f'; ctx.fillRect(-1.5 * s, -4 * s, 3 * s, 10 * s); }
  ctx.fillStyle = '#8f969c'; ctx.beginPath(); ctx.arc(0, -8 * s, 4.6 * s, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-3 * s, -8 * s, 6 * s, 1.4 * s);
  ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(8 * s, 6 * s); ctx.lineTo(10 * s, -18 * s); ctx.stroke();
  ctx.fillStyle = '#c4cad0'; ctx.beginPath(); ctx.moveTo(10 * s, -22 * s); ctx.lineTo(8.6 * s, -17 * s); ctx.lineTo(11.4 * s, -17 * s); ctx.fill();
  if (e.type === 'shield' || e.type === 'knight') {
    const sh = enemyArms; UG.drawShield(ctx, sh, -1 * s, 1 * s, 15 * s);
  }
  if (e.type === 'runner') { ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); ctx.arc(-9 * s, -10 * s + Math.sin(g.t * 20) * s, 2.6 * s, 0, 6.283); ctx.fill(); }
  if (e.type === 'knight') { ctx.fillStyle = '#b3242f'; ctx.beginPath(); ctx.ellipse(0, -14 * s, 2 * s, 5 * s, Math.sin(g.t * 6) * 0.3, 0, 6.283); ctx.fill(); }
  ctx.restore();
}
function ladderTeam(ctx, e, g) {
  const step = Math.sin(e.t * 5);
  ctx.save(); ctx.translate(e.x, e.y);
  if (e.state === 'march') {
    ctx.strokeStyle = '#8a6237'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, -6); ctx.lineTo(22, -6); ctx.moveTo(-22, 2); ctx.lineTo(22, 2); ctx.stroke();
    ctx.lineWidth = 2; for (let x = -18; x <= 18; x += 6) { ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x, 2); ctx.stroke(); }
    ctx.restore();
    soldier(ctx, { ...e, x: e.x - 16, y: e.y + 6 + step, r: 11, type: 'foot' }, g); soldier(ctx, { ...e, x: e.x + 16, y: e.y + 6 - step, r: 11, type: 'foot' }, g);
    return;
  }
  ctx.strokeStyle = '#8a6237'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-7, 6); ctx.lineTo(-7, 6 + 30 * Math.min(1, e.climb)); ctx.moveTo(7, 6); ctx.lineTo(7, 6 + 30 * Math.min(1, e.climb)); ctx.stroke();
  ctx.restore();
  soldier(ctx, { ...e, r: 11, type: 'foot', y: e.y + Math.min(1, e.climb) * 14 }, g);
}
function ram(ctx, e, g) {
  ctx.save(); ctx.translate(e.x, e.y);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-26, -16, 56, 44);
  const step = Math.sin(e.t * 4);
  ctx.fillStyle = '#2a2018'; for (let i = -2; i <= 2; i++) { ctx.fillRect(-24, i * 6 + step * (i % 2 ? 1 : -1), 4, 4); ctx.fillRect(20, i * 6 - step * (i % 2 ? 1 : -1), 4, 4); }
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-20, -22, 40, 46);
  ctx.fillStyle = '#8a6237'; for (let y = -22; y < 24; y += 8) ctx.fillRect(-20, y, 40, 4);
  ctx.fillStyle = '#4a3420'; ctx.fillRect(-5, 20, 10, 12);
  ctx.fillStyle = '#7d848a'; ctx.beginPath(); ctx.arc(0, 33 + (e.state === 'attack' ? Math.max(0, Math.sin(e.t * 3)) * 6 : 0), 6, 0, 6.283); ctx.fill();
  ctx.restore();
}
function catapult(ctx, e, g) {
  ctx.save(); ctx.translate(e.x, e.y);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(2, 16, 26, 8, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#5a3a1c'; ctx.fillRect(-20, -10, 6, 28); ctx.fillRect(14, -10, 6, 28); ctx.fillRect(-20, 4, 40, 6);
  const k = e.state === 'fire' ? Math.min(1, e.anim * 4) : 0, ang = -1.2 + k * 2.2;
  ctx.save(); ctx.rotate(ang); ctx.fillStyle = '#8a6237'; ctx.fillRect(-3, -26, 6, 30); ctx.fillStyle = '#4a3420'; ctx.beginPath(); ctx.arc(0, -26, 5, 0, 6.283); ctx.fill(); ctx.restore();
  ctx.restore();
  soldier(ctx, { ...e, x: e.x + 24, y: e.y + 8, r: 10, type: 'foot', state: 'attack' }, g);
}
function wall(ctx, g) {
  // walkway, merlons on the outer edge, the inner face below, three towers and two banners with the player's arms
  ctx.fillStyle = '#8d8273'; ctx.fillRect(0, WALL, W, 46);
  ctx.strokeStyle = 'rgba(40,32,24,.35)'; ctx.lineWidth = 1;
  for (let y = WALL + 10; y < WALL + 46; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let x = 0; x < W; x += 24) for (let y = WALL; y < WALL + 46; y += 12) { ctx.beginPath(); ctx.moveTo(x + ((y / 12) % 2) * 12, y); ctx.lineTo(x + ((y / 12) % 2) * 12, y + 12); ctx.stroke(); }
  const broke = S ? 1 - S.hp / S.maxHp : 0;
  for (let x = 0, i = 0; x < W; x += 30, i++) {
    if (broke > 0.55 && (i * 7) % 5 === 0) continue;                         // merlons knocked away as the wall weakens
    ctx.fillStyle = '#a2978a'; ctx.fillRect(x + 2, WALL - 14, 18, 16); ctx.fillStyle = '#6f6557'; ctx.fillRect(x + 2, WALL - 2, 18, 4);
  }
  if (broke > 0.3) { ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 2; for (const cx of [130, 330, 410]) { ctx.beginPath(); ctx.moveTo(cx, WALL - 12); ctx.lineTo(cx + 8, WALL + 8); ctx.lineTo(cx + 2, WALL + 22); ctx.lineTo(cx + 10, WALL + 38); ctx.stroke(); } }
  ctx.fillStyle = '#5d5448'; ctx.fillRect(0, WALL + 46, W, H - WALL - 46);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, WALL + 46, W, 6);
  for (const bx of [180, 360]) {
    ctx.fillStyle = me.design.f; ctx.beginPath(); ctx.moveTo(bx - 26, WALL + 50); ctx.lineTo(bx + 26, WALL + 50); ctx.lineTo(bx + 26, H - 10); ctx.lineTo(bx, H - 22); ctx.lineTo(bx - 26, H - 10); ctx.fill();
    ctx.fillStyle = me.design.d; ctx.fillRect(bx - 26, WALL + 50, 52, 4);
    UG.drawShield(ctx, myShield, bx, WALL + 82, 40);
  }
  for (const [tx, ty] of TOWERS) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(tx + 4, ty + 6, 46, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#9a8f80'; ctx.beginPath(); ctx.arc(tx, ty, 46, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#7b7163'; ctx.beginPath(); ctx.arc(tx, ty, 34, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#b1a698'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; ctx.save(); ctx.translate(tx + Math.cos(a) * 40, ty + Math.sin(a) * 40); ctx.rotate(a); ctx.fillRect(-5, -6, 10, 12); ctx.restore(); }
    // the bowman, turned to the last spot you shot at
    const a = Math.atan2(S.aim[1] - ty, S.aim[0] - tx);
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = me.design.f; ctx.beginPath(); ctx.ellipse(0, 4, 10, 7, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#e0c39a'; ctx.beginPath(); ctx.arc(0, 2, 5, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, -4, 12, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.restore();
  }
  if (S && S.hp / S.maxHp < 0.3) for (const [x, y] of [[150, WALL + 8], [390, WALL + 14]]) if (Math.random() < 0.3) g.burst(x, y, 1, { c: ['#ff9a3c', '#ffd76a', '#555'], shape: 'dot', v0: 10, v1: 40, g: -60, l0: 0.5, l1: 1.2, s0: 2, s1: 5 });
}
function hud(ctx, g) {
  ctx.fillStyle = 'rgba(12,10,8,.66)'; ctx.fillRect(0, 0, W, 46); ctx.fillStyle = 'rgba(212,175,90,.6)'; ctx.fillRect(0, 46, W, 1.5);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#f3dc92'; ctx.font = UG.font(17, 900, 'Cinzel Decorative'); ctx.fillText(`Wave ${S.wave}`, 12, 16);
  const left = S.queue.length + S.enemies.filter(e => e.hp > 0).length;
  ctx.fillStyle = '#a8997c'; ctx.font = UG.font(11, 700); ctx.fillText(`${left} FOES LEFT`, 12, 35);
  ctx.textAlign = 'right'; ctx.fillStyle = '#fff3cf'; ctx.font = UG.font(20, 900, 'Cinzel Decorative'); ctx.fillText(String(S.score), W - 12, 23);
  const bw = 190, bx = W / 2 - bw / 2 + 10, k = clamp(S.hp / S.maxHp, 0, 1);
  ctx.textAlign = 'center'; ctx.fillStyle = '#a8997c'; ctx.font = UG.font(10, 700); ctx.fillText('THE WALL', bx + bw / 2, 12);
  ctx.fillStyle = '#2a2018'; ctx.fillRect(bx, 20, bw, 14);
  ctx.fillStyle = k > 0.5 ? '#6fa04a' : k > 0.25 ? '#e9c13d' : '#c8312f'; ctx.fillRect(bx, 20, bw * k, 14);
  if (S.dmgT > 0) { ctx.fillStyle = `rgba(255,255,255,${S.dmgT * 2})`; ctx.fillRect(bx, 20, bw * k, 14); }
  ctx.strokeStyle = '#8a6a24'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, 20, bw, 14);
  // quiver
  ctx.fillStyle = 'rgba(12,10,8,.6)'; ctx.fillRect(8, H - 44, 22 + S.maxQ * 11, 34);
  for (let i = 0; i < S.maxQ; i++) {
    const full = i < S.quiver, x = 20 + i * 11;
    ctx.strokeStyle = full ? '#e8dcc2' : 'rgba(232,220,194,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, H - 16); ctx.lineTo(x, H - 38); ctx.stroke();
    ctx.fillStyle = full ? '#b3242f' : 'rgba(179,36,47,.2)'; ctx.fillRect(x - 2.5, H - 20, 5, 5);
  }
  if (S.quiver < S.maxQ) { ctx.fillStyle = '#ffd76a'; ctx.fillRect(14, H - 12, (22 + S.maxQ * 11 - 12) * (S.reloadT / S.reload), 2); }
  // abilities
  abilityBtns().forEach(b => {
    const ready = b.ab.t <= 0;
    ctx.fillStyle = ready ? 'rgba(122,16,32,.92)' : 'rgba(40,30,24,.85)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = ready ? '#ffd76a' : '#5a4523'; ctx.stroke();
    if (!ready) { ctx.strokeStyle = '#d4af5a'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 4, -Math.PI / 2, -Math.PI / 2 + (1 - b.ab.t / b.ab.cd) * 6.283); ctx.stroke(); }
    ctx.fillStyle = ready ? '#fff3cf' : '#a8997c'; ctx.textAlign = 'center'; ctx.font = UG.font(11, 700); ctx.fillText(b.label, b.x, b.y + 1);
  });
  if (S.bannerT > 0) {
    ctx.globalAlpha = Math.min(1, S.bannerT * 2); ctx.textAlign = 'center'; ctx.font = UG.font(40, 900, 'Cinzel Decorative');
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,14,8,.85)'; ctx.strokeText(S.banner, W / 2, 250); ctx.fillStyle = '#ffd76a'; ctx.fillText(S.banner, W / 2, 250);
    if (S.wave === 1) { ctx.font = UG.font(16, 700); ctx.lineWidth = 4; const t = 'Tap where a foe will be: arrows take time to fly'; ctx.strokeText(t, W / 2, 290); ctx.fillStyle = '#fff3cf'; ctx.fillText(t, W / 2, 290); }
    ctx.globalAlpha = 1;
  }
}
function abilityBtns() {
  const out = [];
  if (S.oil) out.push({ ab: S.oil, label: 'OIL', x: W - 40, y: H - 40, r: 30, fn: oil });
  if (S.volley) out.push({ ab: S.volley, label: 'VOLLEY', x: S.oil ? W - 108 : W - 40, y: H - 40, r: 30, fn: volley });
  return out;
}

UG.start({
  id: 'castle', title: 'Hold the Castle', label: 'Castle defense game: enemies march on your walls', W, H,
  init(g) {
    me = UG.player(); myShield = UG.shield(me.design); deco = makeDeco();
    enemyArms = UG.shield({ name: 'The Usurper', motto: '', f: '#1d1915', d: '#b3242f', c: '#b3242f', div: 'chevron', ch: 'wolf', bg: 'clear' });
    S = { wave: 0, hp: 100, maxHp: 100, quiver: 6, maxQ: 6, reloadT: 0, reload: 0.5, enemies: [], arrows: [], stones: [], stuck: [], queue: [], score: 0, aim: [GATE, 300], bannerT: 0, dmgT: 0 };
    for (let i = 0; i < 7; i++) spawn(pick(['foot', 'foot', 'shield', 'runner'])), S.enemies[i].y = 120 + i * 50;
    g.screen({ kicker: 'Castle defense', title: 'Hold the Castle',
      html: '<ol class="ug-howto"><li>Tap the field to loose an arrow from the nearest tower.</li><li>Arrows take time to fly: aim where a foe will be.</li><li>After each wave, choose a reward.</li></ol>',
      sub: g.best ? `Your best: ${g.best} points` : 'The Usurper marches on your walls.',
      primary: { label: 'Man the walls', on: () => { g.hide(); UG.between(g, () => newRun(g)); } } });
  },
  update(g, dt) {
    if (S.bannerT > 0) S.bannerT -= dt; if (S.dmgT > 0) S.dmgT -= dt;
    const playing = g.state === 'play' && S.phase === 'wave';
    if (g.state === 'menu') { for (const e of S.enemies) { e.t += dt; e.y += e.spd * dt * 0.5; if (e.y > 560) e.y = -20; } return; }
    if (!playing) return;
    if (S.quiver < S.maxQ) { S.reloadT += dt; if (S.reloadT >= S.reload) { S.reloadT = 0; S.quiver++; } }
    if (S.oil && S.oil.t > 0) S.oil.t -= dt; if (S.volley && S.volley.t > 0) S.volley.t -= dt;
    if (S.queue.length) { S.spawnT -= dt; if (S.spawnT <= 0) { spawn(S.queue.shift()); S.spawnT = Math.max(0.35, 1.5 - S.wave * 0.09) * rand(0.6, 1.4); } }
    if (S.archers) {
      S.archT -= dt;
      if (S.archT <= 0) {
        S.archT = 1.6 / S.archers;
        const tgt = S.enemies.filter(e => e.hp > 0 && e.y > 40).sort((a, b) => b.y - a.y)[0];
        if (tgt) { const from = TOWERS[Math.floor(Math.random() * 3)], fl = Math.hypot(tgt.x - from[0], tgt.y - from[1]) / (820 * S.aspd); fire(g, tgt.x, tgt.y + (tgt.state === 'march' ? tgt.spd * fl : 0), from, 1); }
      }
    }
    for (const e of S.enemies) {
      if (e.hp <= 0) continue;
      e.t += dt; if (e.flash > 0) e.flash -= dt;
      if (e.burn > 0) { e.burn -= dt; if (Math.random() < dt * 2) { damage(g, e, 1); } }
      if (e.type === 'catapult') {
        if (e.y < e.stopY) e.y += e.spd * dt;
        else { e.state = e.state === 'fire' ? 'fire' : 'aim'; e.fireT -= dt; if (e.state === 'fire') { e.anim += dt; if (e.anim > 0.6) e.state = 'aim'; }
          if (e.fireT <= 0) { e.fireT = rand(4.5, 6); e.state = 'fire'; e.anim = 0; S.stones.push({ x0: e.x, y0: e.y, x1: rand(40, W - 40), y1: WALL + 4, t: 0, dur: 1.6 }); UG.sfx.whoosh(); } }
        continue;
      }
      if (e.state === 'march') {
        const goal = WALL - (e.type === 'ram' ? 34 : 8);
        e.x += clamp(e.tx - e.x, -1, 1) * dt * 12 + Math.sin(e.t * 2 + e.wob) * (e.type === 'runner' ? 40 : 6) * dt;
        e.y += e.spd * dt;
        if (e.y >= goal) { e.y = goal; e.state = e.type === 'ladder' ? 'climb' : 'attack'; e.climb = 0; }
      } else if (e.state === 'climb') { e.climb += dt / 2.4; if (e.climb >= 1) e.state = 'attack'; }
      else if (e.state === 'attack') { wallHit(g, e.dmg * dt); if (Math.random() < dt * 3) g.burst(e.x, WALL - 4, 2, { c: ['#9b8f7c', '#c9bda8'], v0: 20, v1: 90, g: 400, l1: 0.5 }); if (e.type === 'ram' && Math.random() < dt * 1.2) { UG.sfx.hit(); g.shake(4, 0.15); } }
    }
    for (const a of S.arrows) { a.t += dt / a.dur; if (a.t >= 1 && !a.done) { a.done = true; hitAt(g, a); } }
    S.arrows = S.arrows.filter(a => !a.done);
    for (const st of S.stones) { st.t += dt / st.dur; if (st.t >= 1 && !st.done) { st.done = true; wallHit(g, 7, st.x1); UG.sfx.boom(); g.shake(10, 0.3); } }
    S.stones = S.stones.filter(s => !s.done);
    for (const s of S.stuck) s.t += dt;
    S.enemies = S.enemies.filter(e => e.hp > 0);
    if (S.phase === 'wave' && !S.queue.length && !S.enemies.length && S.hp > 0) waveCleared(g);
  },
  draw(g, ctx) {
    field(ctx);
    for (const s of S.stuck) { ctx.globalAlpha = Math.max(0, 1 - s.t / 2.5); ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.ang); ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.fillStyle = '#efe6d0'; ctx.fillRect(-12, -2, 4, 4); ctx.restore(); }
    ctx.globalAlpha = 1;
    const list = S.enemies.slice().sort((a, b) => a.y - b.y);
    for (const e of list) {
      if (e.flash > 0) ctx.filter = 'brightness(2.2)';
      if (e.type === 'ram') ram(ctx, e, g); else if (e.type === 'ladder') ladderTeam(ctx, e, g); else if (e.type === 'catapult') catapult(ctx, e, g); else soldier(ctx, e, g);
      ctx.filter = 'none';
      if (e.burn > 0) g.burst(e.x, e.y - 8, 1, { c: ['#ff9a3c', '#ffd76a'], shape: 'dot', v0: 10, v1: 40, g: -120, l0: 0.2, l1: 0.5, s0: 2, s1: 3.5 });
      if (e.max > 1 && e.hp < e.max) { ctx.fillStyle = '#2a2018'; ctx.fillRect(e.x - 14, e.y - e.r - 14, 28, 4); ctx.fillStyle = '#c8312f'; ctx.fillRect(e.x - 14, e.y - e.r - 14, 28 * e.hp / e.max, 4); }
    }
    wall(ctx, g);
    for (const st of S.stones) {
      const k = st.t, x = lerp(st.x0, st.x1, k), y = lerp(st.y0, st.y1, k), hgt = Math.sin(Math.PI * k) * 160;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, y, 7, 3, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#6f6557'; ctx.beginPath(); ctx.arc(x, y - hgt, 8 + Math.sin(Math.PI * k) * 4, 0, 6.283); ctx.fill();
    }
    for (const a of S.arrows) {
      const k = a.t, x = lerp(a.x0, a.x1, k), y = lerp(a.y0, a.y1, k), hgt = Math.sin(Math.PI * k) * Math.min(80, Math.hypot(a.x1 - a.x0, a.y1 - a.y0) * 0.18), ang = Math.atan2(a.y1 - a.y0, a.x1 - a.x0);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 1, y - 1, 3, 3);
      ctx.save(); ctx.translate(x, y - hgt); ctx.rotate(ang); ctx.strokeStyle = S.splash && !a.auto ? '#ff9a3c' : '#3a2412'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(4, 0); ctx.stroke();
      ctx.fillStyle = '#c4cad0'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(3, -3); ctx.lineTo(3, 3); ctx.fill(); ctx.restore();
    }
    if (g.state === 'play') hud(ctx, g);
  },
  down(g, x, y) {
    if (g.state !== 'play' || S.phase !== 'wave') return;
    for (const b of abilityBtns()) if (Math.hypot(x - b.x, y - b.y) < b.r + 6) { b.fn(g); return; }
    if (y > WALL - 6) return;
    if (S.quiver <= 0) { UG.sfx.click(); return; }
    S.quiver--; fire(g, x, y);
  },
  key(g, key, down) { if (!down || g.state !== 'play') return; if (key === 'a' || key === 'A') oil(g); if (key === 'd' || key === 'D') volley(g); },
});
// test hook, only on a local server
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__ug = { st: () => S };
})();
