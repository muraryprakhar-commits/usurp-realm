/* Siege: aim the trebuchet, fling stones and fire pots, and topple the Usurper's castles until every guard yields.
   Ten castles of timber and stone, real physics (Matter.js, MIT licence, served from this site), no image files. */
(function () {
'use strict';
const M = window.Matter; if (!M) return;
const { Engine, Bodies, Composite, Body, Events, Sleeping } = M;
const { clamp, lerp, ease, rand } = UG;
const W = 540, H = 720, SC = 0.75, WW = W / SC, WH = H / SC, GY = 880;    // world is 720 x 960; the ground's top is at y 880
const XO = -180;                                                         // castles are laid out for x 480..880; shift them closer
const PIV = { x: 92, y: GY - 234 }, REL = { x: 148, y: GY - 354 }, VMAX = 16.5, STEP = 1000 / 60;
const GSTEP = 0.001 * STEP * STEP;                                         // gravity per step, as Matter integrates it
const MAT = {
  wood: { density: 0.0016, friction: 0.7, hp: 14, tough: 6.5, col: '#9a6a36', dark: '#6b4423', line: '#5a3a1c', pts: 50 },
  stone: { density: 0.004, friction: 0.85, hp: 30, tough: 10, col: '#9b958a', dark: '#6f6a60', line: '#55504a', pts: 100 },
};

/* ---------- castles: B(x, bottom above the ground, width, height, material), guards G(x, standing height), hills and roofs ---------- */
const B = (x, yb, w, h, m = 'wood') => ({ k: 'b', x, yb, w, h, m });
const G = (x, yb, boss) => ({ k: 'g', x, yb, boss: !!boss });
const HILL = (x, w, h) => ({ k: 'h', x, w, h });
const ROOF = (x, yb, w, h, m = 'wood') => ({ k: 'r', x, yb, w, h, m });
// two posts and a beam; returns the parts and the height of the beam's top
function frame(x, yb, span, colH, beamW, m = 'wood', mb = m) {
  return [B(x - span / 2, yb, 22, colH, m), B(x + span / 2, yb, 22, colH, m), B(x, yb + colH, beamW, 20, mb)];
}
const LEVELS = [
  { name: 'The Watch Post', stones: 3, fire: 0, wind: 0, parts: [...frame(640, 0, 100, 100, 150), G(640, 120), G(735, 0)] },
  { name: 'Two Floors', stones: 3, fire: 0, wind: 0.6, parts: [...frame(650, 0, 100, 100, 160), ...frame(650, 120, 100, 90, 150), G(650, 0), G(650, 230)] },
  { name: 'Stone Footing', stones: 4, fire: 0, wind: -0.8, parts: [...frame(640, 0, 120, 90, 170, 'stone'), ...frame(640, 110, 100, 90, 150), B(735, 0, 20, 70), G(640, 110), G(640, 220), G(775, 0)] },
  { name: 'The Curtain Wall', stones: 4, fire: 1, wind: 1, parts: [B(545, 0, 30, 170, 'stone'), ...frame(705, 0, 100, 100, 160), ...frame(705, 120, 100, 90, 150), G(705, 0), G(705, 120), G(705, 230)] },
  { name: 'Twin Towers', stones: 4, fire: 1, wind: -1.2, parts: [...frame(600, 0, 90, 100, 140), ...frame(600, 120, 90, 90, 130), ...frame(790, 0, 90, 100, 140), ...frame(790, 120, 90, 90, 130), B(695, 230, 300, 18), G(600, 0), G(790, 0), G(695, 248)] },
  { name: 'The Stepped Keep', stones: 5, fire: 1, wind: 1.4, parts: [...frame(620, 0, 100, 90, 140), ...frame(745, 0, 100, 90, 140), ...frame(682, 110, 100, 90, 150), ...frame(682, 220, 70, 70, 110), G(620, 0), G(745, 0), G(682, 110), G(682, 310)] },
  { name: 'Castle on the Crag', stones: 4, fire: 1, wind: -1.5, parts: [HILL(735, 300, 160), ...frame(680, 160, 90, 90, 130, 'stone'), ...frame(790, 160, 80, 90, 120), ...frame(680, 270, 80, 80, 120), G(680, 160), G(790, 160), G(680, 270), G(680, 370)] },
  { name: 'The Roofed Hall', stones: 5, fire: 1, wind: 1.6, parts: [...frame(665, 0, 140, 100, 190, 'stone'), ...frame(665, 120, 120, 90, 170), ROOF(665, 230, 180, 60), B(790, 0, 26, 80, 'stone'), G(665, 0), G(665, 120), G(835, 0)] },
  { name: 'Double Walls', stones: 5, fire: 2, wind: -1.8, parts: [B(530, 0, 30, 190, 'stone'), B(872, 0, 30, 190, 'stone'), ...frame(628, 0, 90, 100, 140), ...frame(628, 120, 90, 90, 130), ...frame(775, 0, 90, 100, 140), ...frame(775, 120, 90, 90, 130), G(628, 0), G(775, 0), G(628, 120), G(775, 120)] },
  { name: "The Usurper's Keep", stones: 6, fire: 2, wind: 2, parts: [...frame(560, 0, 90, 100, 130, 'stone'), ...frame(690, 0, 90, 100, 130, 'stone'), ...frame(820, 0, 90, 100, 130, 'stone'),
      ...frame(625, 120, 90, 90, 130), ...frame(755, 120, 90, 90, 130), ...frame(690, 230, 90, 80, 140, 'stone'),
      G(560, 0), G(690, 0), G(820, 0), G(625, 120), G(755, 120), G(690, 230), G(690, 330, true)] },
];

/* ---------- state ---------- */
let S = null, me = null, myShield = null, foeShield = null, engine = null, clouds = [];
const prog = UG.store.get('ug-siege', { unlocked: 1, stars: {}, best: {} });
function saveProg() { UG.store.set('ug-siege', prog); }
function totalBest() { return Object.values(prog.best).reduce((a, b) => a + b, 0); }

function buildLevel(i) {
  if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
  engine = Engine.create({ enableSleeping: true, positionIterations: 10, velocityIterations: 8 });
  engine.gravity.y = 1;
  const L = LEVELS[i], world = engine.world, blocks = [], guards = [];
  Composite.add(world, Bodies.rectangle(WW / 2, GY + 100, WW + 600, 200, { isStatic: true, friction: 0.9, label: 'ground' }));
  for (let p of L.parts) {
    p = Object.assign({}, p, { x: p.x + XO });
    if (p.k === 'h') { const b = Bodies.rectangle(p.x, GY - p.h / 2, p.w, p.h, { isStatic: true, friction: 0.9, label: 'hill' }); b.plot = p; Composite.add(world, b); S.hills.push(b); continue; }
    if (p.k === 'g') {
      const b = Bodies.rectangle(p.x, GY - p.yb - 22, 26, 44, { density: 0.0012, friction: 0.9, frictionStatic: 1, restitution: 0.05, chamfer: { radius: 4 }, label: 'guard' });
      b.boss = p.boss; guards.push(b); Composite.add(world, b); continue;
    }
    if (p.k === 'r') {
      const b = Bodies.trapezoid(p.x, GY - p.yb - p.h / 2, p.w, p.h, 0.7, { density: MAT[p.m].density, friction: MAT[p.m].friction, label: 'block' });
      // Matter centres a trapezoid on its centre of mass, not its box; lift it so its base sits on yb
      const minY = Math.max(...b.vertices.map(v => v.y)); Body.translate(b, { x: 0, y: (GY - p.yb) - minY });
      b.mat = p.m; b.hp = MAT[p.m].hp * 1.3; b.roof = true; blocks.push(b); Composite.add(world, b); continue;
    }
    const b = Bodies.rectangle(p.x, GY - p.yb - p.h / 2, p.w, p.h, { density: MAT[p.m].density, friction: MAT[p.m].friction, frictionStatic: 0.9, restitution: 0.02, label: 'block' });
    b.mat = p.m; b.hp = MAT[p.m].hp * (p.w * p.h > 4000 ? 1.4 : 1); blocks.push(b); Composite.add(world, b);
  }
  S.blocks = blocks; S.guards = guards;
  Events.on(engine, 'collisionStart', ev => { for (const pr of ev.pairs) impact(pr.bodyA.parent || pr.bodyA, pr.bodyB.parent || pr.bodyB); });
  // let the castle settle before anyone can touch it
  S.settling = true;
  for (let k = 0; k < 90; k++) Engine.update(engine, STEP);
  S.settling = false;
  for (const gd of guards) { gd.y0 = gd.position.y; gd.tip = 0; }
}
function impact(a, b) {
  if (S.settling || !S.live) return;
  const rel = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
  const heavy = x => x.label === 'shot' ? 2.2 : x.label === 'block' ? (x.mat === 'stone' ? 1.2 : 0.8) : x.label === 'ground' || x.label === 'hill' ? 1 : 0.4;
  for (const [x, o] of [[a, b], [b, a]]) {
    if (x.label === 'guard' && !x.out && rel * heavy(o) > 5.5 && o.label !== 'guard') knock(x, 'hit');
    if (x.label === 'block' && !x.gone) {
      const hit = rel * heavy(o);
      if (hit > MAT[x.mat].tough) { x.hp -= (hit - MAT[x.mat].tough) * 2.2; if (x.hp <= 0) S.kill.push(x); }
    }
    if (x.label === 'shot' && x.fire && !x.burst && (o.label === 'block' || o.label === 'guard' || o.label === 'ground' || o.label === 'hill')) { x.burst = true; S.blast.push(x); }
  }
}
function knock(gd, why) {
  if (gd.out) return;
  gd.out = true; S.down++;
  const pts = gd.boss ? 1500 : 500; S.score += pts;
  const [x, y] = [gd.position.x * SC, gd.position.y * SC];
  S.g.burst(x, y, 14, { c: ['#e8dcc2', '#b8a888', '#ffffff'], shape: 'dot', v0: 30, v1: 140, g: -60, l0: 0.4, l1: 0.9, s0: 2, s1: 5 });
  S.g.pop(gd.boss ? 'The Usurper yields!' : 'Yields!', x, y - 24, { c: '#ffd76a', size: gd.boss ? 24 : 20, max: 1.1 });
  S.flags.push({ x: gd.position.x, y: gd.position.y, t: 0 });
  UG.sfx.coin(); if (gd.boss) UG.sfx.cheer(0.16);
  S.g.say(gd.boss ? 'The Usurper yields' : 'A guard yields');
  Composite.remove(engine.world, gd); wakeAll();
  void why;
}
function wakeAll() { for (const b of Composite.allBodies(engine.world)) if (!b.isStatic) Sleeping.set(b, false); }
function breakBlock(b) {
  if (b.gone) return; b.gone = true; S.score += MAT[b.mat].pts; S.broke++;
  const [x, y] = [b.position.x * SC, b.position.y * SC], m = MAT[b.mat];
  S.g.burst(x, y, b.mat === 'wood' ? 18 : 14, { c: [m.col, m.dark, m.line], shape: b.mat === 'wood' ? 'splinter' : 'sq', v0: 60, v1: 260, g: 600, s0: 2, s1: 6, l1: 0.9 });
  (b.mat === 'wood' ? UG.sfx.crack : UG.sfx.boom)();
  Composite.remove(engine.world, b); wakeAll();
}
function explode(shot) {
  const { x, y } = shot.position, R = 170;
  S.g.burst(x * SC, y * SC, 40, { c: ['#ff9a3c', '#ffd76a', '#c8312f', '#5a3a1c'], shape: 'dot', v0: 80, v1: 360, g: 200, l0: 0.4, l1: 1, s0: 2, s1: 6 });
  S.g.shake(12, 0.4); UG.sfx.boom(); UG.buzz(60);
  S.booms.push({ x, y, t: 0 });
  for (const b of Composite.allBodies(engine.world)) {
    if (b.isStatic || b === shot) continue;
    const dx = b.position.x - x, dy = b.position.y - y, d = Math.hypot(dx, dy);
    if (d > R) continue;
    const k = 1 - d / R, f = 0.06 * k * b.mass;
    Sleeping.set(b, false);
    Body.applyForce(b, b.position, { x: (dx / (d || 1)) * f, y: (dy / (d || 1)) * f - 0.02 * k * b.mass });
    if (b.label === 'block' && b.mat === 'wood') { b.hp -= 26 * k; if (b.hp <= 0) S.kill.push(b); }
    if (b.label === 'guard' && k > 0.45) knock(b, 'blast');
  }
  Composite.remove(engine.world, shot); S.shot = null;
}

function startLevel(g, i) {
  S = { g, lvl: i, L: LEVELS[i], hills: [], blocks: [], guards: [], kill: [], blast: [], flags: [], booms: [], down: 0, broke: 0, score: 0,
        stones: LEVELS[i].stones, fire: LEVELS[i].fire, ammo: 'stone', aim: { a: 0.78, p: 0.68 }, dragging: false, drag0: null,
        phase: 'intro', phaseT: 0, shot: null, arm: 0, armT: 0, shotT: 0, live: false, acc: 0, wind: LEVELS[i].wind, msg: '', msgT: 0, shots: 0 };
  buildLevel(i);
  g.state = 'play';
  S.msg = `Castle ${i + 1}: ${S.L.name}`; S.msgT = 1.8;
  UG.track(i === 0 ? 'play' : 'round', { level: i + 1 });
  g.say(`${S.msg}. ${S.guards.length} guards.`);
}
function launch(g) {
  if (S.phase !== 'aim') return;
  const fire = S.ammo === 'fire';
  if (fire ? S.fire <= 0 : S.stones <= 0) return;
  if (fire) S.fire--; else S.stones--;
  S.shots++; S.phase = 'swing'; S.armT = 0; S.live = true;
  UG.sfx.whoosh(); UG.sfx.twang();
}
function release() {
  const fire = S.ammo === 'fire';
  const shot = Bodies.circle(REL.x, REL.y, fire ? 16 : 19, { density: fire ? 0.012 : 0.02, friction: 0.4, frictionAir: 0, restitution: 0.12, label: 'shot' });
  shot.fire = fire;
  Composite.add(engine.world, shot);
  const v = S.aim.p * VMAX;
  Body.setVelocity(shot, { x: Math.cos(S.aim.a) * v, y: -Math.sin(S.aim.a) * v });
  Body.setAngularVelocity(shot, 0.15);
  S.shot = shot; S.phase = 'fly'; S.shotT = 0; wakeAll();
  if (S.ammo === 'fire' && S.fire <= 0) S.ammo = 'stone';
}
function settled() {
  for (const b of Composite.allBodies(engine.world)) if (!b.isStatic && !b.isSleeping && b.speed > 0.25) return false;
  return true;
}
function endShot(g) {
  if (S.shot) { Composite.remove(engine.world, S.shot); S.shot = null; }
  const left = S.guards.filter(x => !x.out).length;
  if (!left) return win(g);
  if (S.stones + S.fire <= 0) return lose(g);
  if (S.ammo === 'stone' && S.stones <= 0) S.ammo = 'fire';
  S.phase = 'aim'; S.live = false;
}
function win(g) {
  S.phase = 'done'; g.state = 'over';
  const left = S.stones + S.fire, stars = 1 + (left >= 1 ? 1 : 0) + (left >= 2 ? 1 : 0);
  S.score += left * 1000;
  const i = S.lvl, prevBest = prog.best[i] || 0;
  prog.stars[i] = Math.max(prog.stars[i] || 0, stars); prog.best[i] = Math.max(prevBest, S.score);
  prog.unlocked = Math.max(prog.unlocked, Math.min(LEVELS.length, i + 2)); saveProg();
  const nb = g.setBest(totalBest());
  UG.track('finish', { level: i + 1, stars, score: S.score });
  UG.sfx.fanfare(); UG.sfx.cheer(0.15);
  const last = i === LEVELS.length - 1;
  setTimeout(() => g.screen({ kicker: last ? 'The Usurper is defeated' : `Castle ${i + 1} taken`, title: last ? 'Victory for the realm!' : S.L.name, big: '★'.repeat(stars) + '☆'.repeat(3 - stars),
    sub: `${S.score} points${left ? ` · ${left} shot${left === 1 ? '' : 's'} to spare` : ''}`,
    lines: [`Guards yielded: ${S.down} · blocks broken: ${S.broke}`, `Campaign total: ${totalBest()}`, nb === 1 ? 'A new best campaign total!' : ''],
    primary: last ? { label: 'Choose a castle', on: () => menu(g, true) } : { label: 'Next castle', on: () => { g.hide(); UG.between(g, () => startLevel(g, i + 1)); } },
    secondary: { label: 'Challenge a friend', on: () => g.share(`I took ${S.L.name} with ${stars} star${stars === 1 ? '' : 's'} in Siege, the trebuchet game. Can you topple the Usurper's Keep?`) },
    brk: true, cta: last }), 900);
}
function lose(g) {
  S.phase = 'done'; g.state = 'over';
  UG.track('finish', { level: S.lvl + 1, lost: 1 });
  UG.sfx.fail();
  const left = S.guards.filter(x => !x.out).length;
  setTimeout(() => g.screen({ kicker: 'Out of ammunition', title: 'The castle holds', sub: `${left} guard${left === 1 ? '' : 's'} still standing`,
    lines: ['Tip: hit the posts low and the whole floor comes down.', S.lvl >= 3 ? 'Fire pots burst on impact and shove everything nearby.' : 'Higher shots drop onto the guards from above.'],
    primary: { label: 'Try again', on: () => { g.hide(); UG.between(g, () => startLevel(g, S.lvl)); } },
    secondary: { label: 'Choose a castle', on: () => menu(g, true) }, brk: true }), 700);
}
function menu(g, pick) {
  g.state = 'menu';
  const next = Math.min(prog.unlocked, LEVELS.length) - 1;
  const lv = LEVELS.map((L, i) => ({ L, i })).filter(x => x.i < prog.unlocked);
  if (pick) {
    g.screen({ kicker: 'Siege', title: 'Choose a castle', choices: lv.map(({ L, i }) => ({ label: `${i + 1}. ${L.name}`, sub: prog.stars[i] ? '★'.repeat(prog.stars[i]) + '☆'.repeat(3 - prog.stars[i]) + `  ·  best ${prog.best[i]}` : 'Not taken yet', on: () => { g.hide(); UG.between(g, () => startLevel(g, i)); } })) });
    return;
  }
  g.screen({ kicker: 'Trebuchet game', title: 'Siege',
    html: '<ol class="ug-howto"><li>Drag back anywhere to aim. Further back throws harder.</li><li>Let go to fling a stone from your trebuchet.</li><li>Topple the castle until every one of the Usurper\'s guards yields.</li></ol>',
    sub: totalBest() ? `Campaign total: ${totalBest()} · ${Object.keys(prog.stars).length} of ${LEVELS.length} castles taken` : `${LEVELS.length} castles of timber and stone`,
    primary: { label: next > 0 ? `Play castle ${next + 1}` : 'Begin the siege', on: () => { g.hide(); UG.between(g, () => startLevel(g, next)); } },
    secondary: prog.unlocked > 1 ? { label: 'Choose a castle', on: () => menu(g, true) } : undefined });
}

/* ---------- drawing (in world units, scaled by SC) ---------- */
function sky(ctx, g) {
  const s = ctx.createLinearGradient(0, 0, 0, GY); s.addColorStop(0, '#5a86b8'); s.addColorStop(0.7, '#b4cfe0'); s.addColorStop(1, '#efdcb5');
  ctx.fillStyle = s; ctx.fillRect(0, 0, WW, GY);
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (const c of clouds) { c.x += (4 + (S ? S.wind : 0) * 6) * (g.dt || 0.016); if (c.x > WW + 140) c.x = -140; if (c.x < -140) c.x = WW + 140; for (const [dx, dy, r] of c.p) { ctx.beginPath(); ctx.ellipse(c.x + dx, c.y + dy, r * 1.6, r, 0, 0, 6.283); ctx.fill(); } }
  ctx.fillStyle = '#93a9b4'; ctx.beginPath(); ctx.moveTo(0, GY - 110); ctx.bezierCurveTo(160, GY - 210, 330, GY - 110, 500, GY - 160); ctx.bezierCurveTo(610, GY - 200, 680, GY - 130, WW, GY - 160); ctx.lineTo(WW, GY); ctx.lineTo(0, GY); ctx.fill();
  ctx.fillStyle = '#6f8c5a'; ctx.beginPath(); ctx.moveTo(0, GY - 40); ctx.bezierCurveTo(190, GY - 90, 400, GY - 30, WW, GY - 60); ctx.lineTo(WW, GY); ctx.lineTo(0, GY); ctx.fill();
  const gr = ctx.createLinearGradient(0, GY, 0, WH); gr.addColorStop(0, '#6a8b38'); gr.addColorStop(0.15, '#5b7a2f'); gr.addColorStop(1, '#3a2a18');
  ctx.fillStyle = gr; ctx.fillRect(0, GY, WW, WH - GY);
}
function poly(ctx, b) { const v = b.vertices; ctx.beginPath(); ctx.moveTo(v[0].x, v[0].y); for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y); ctx.closePath(); }
function drawBlock(ctx, b) {
  const m = MAT[b.mat], dmg = 1 - clamp(b.hp / (m.hp * 1.4), 0, 1);
  poly(ctx, b); ctx.fillStyle = m.col; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
  const w = (b.bounds.max.x - b.bounds.min.x) + 40, h = (b.bounds.max.y - b.bounds.min.y) + 40;
  ctx.strokeStyle = m.line; ctx.lineWidth = 2; ctx.globalAlpha = 0.55;
  if (b.mat === 'wood') { const long = (b.vertices[1].x - b.vertices[0].x) ** 2 + (b.vertices[1].y - b.vertices[0].y) ** 2 >= (b.vertices[2].x - b.vertices[1].x) ** 2 + (b.vertices[2].y - b.vertices[1].y) ** 2;
    for (let k = -h; k < h; k += 9) { ctx.beginPath(); if (long) { ctx.moveTo(-w, k); ctx.lineTo(w, k); } else { ctx.moveTo(k, -h); ctx.lineTo(k, h); } ctx.stroke(); } }
  else { for (let y = -h; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(w, y); ctx.stroke(); for (let x = -w + ((y / 20) & 1) * 16; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 20); ctx.stroke(); } } }
  if (dmg > 0.15) { ctx.globalAlpha = 0.75; ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(4, 2); ctx.lineTo(-2, 12); if (dmg > 0.5) { ctx.moveTo(10, -14); ctx.lineTo(2, -2); } ctx.stroke(); }
  ctx.restore();
  poly(ctx, b); ctx.lineWidth = 2.5; ctx.strokeStyle = m.dark; ctx.stroke();
}
function drawGuard(ctx, b, g) {
  ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
  ctx.fillStyle = '#2a2018'; ctx.fillRect(-9, 10, 7, 12); ctx.fillRect(2, 10, 7, 12);
  ctx.fillStyle = '#1d1915'; ctx.fillRect(-12, -10, 24, 24);
  ctx.fillStyle = '#b3242f'; ctx.fillRect(-3, -10, 6, 24);
  ctx.fillStyle = '#8f969c'; ctx.beginPath(); ctx.arc(0, -15, 9, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-6, -16, 12, 2.5);
  if (b.boss) { ctx.fillStyle = '#ffd76a'; ctx.beginPath(); ctx.moveTo(-9, -22); ctx.lineTo(-10, -32); ctx.lineTo(-4, -26); ctx.lineTo(0, -34); ctx.lineTo(4, -26); ctx.lineTo(10, -32); ctx.lineTo(9, -22); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(13, 14); ctx.lineTo(14, -30); ctx.stroke();
  ctx.fillStyle = '#c4cad0'; ctx.beginPath(); ctx.moveTo(14, -36); ctx.lineTo(11, -28); ctx.lineTo(17, -28); ctx.fill();
  UG.drawShield(ctx, foeShield, -12, 2, 20);
  ctx.restore();
  void g;
}
function trebuchet(ctx, g) {
  const { x, y } = PIV;
  // frame
  ctx.lineCap = 'round'; ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.moveTo(x - 70, GY - 6); ctx.lineTo(x, y); ctx.lineTo(x + 70, GY - 6); ctx.stroke();
  ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x - 92, GY - 8); ctx.lineTo(x + 92, GY - 8); ctx.moveTo(x - 40, GY - 100); ctx.lineTo(x + 40, GY - 100); ctx.stroke();
  ctx.fillStyle = '#3a2412'; for (const wx of [x - 78, x + 78]) { ctx.beginPath(); ctx.arc(wx, GY - 8, 15, 0, 6.283); ctx.fill(); ctx.fillStyle = '#6b4423'; ctx.beginPath(); ctx.arc(wx, GY - 8, 6, 0, 6.283); ctx.fill(); ctx.fillStyle = '#3a2412'; }
  // banner with the player's arms on a pole at the back of the frame
  ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 86, GY - 8); ctx.lineTo(x - 86, GY - 230); ctx.stroke();
  const wave = Math.sin(g.t * 3) * 4;
  ctx.fillStyle = me.design.f; ctx.beginPath(); ctx.moveTo(x - 84, GY - 228); ctx.lineTo(x - 30 + wave, GY - 222); ctx.lineTo(x - 30 - wave, GY - 150); ctx.lineTo(x - 57, GY - 162); ctx.lineTo(x - 84, GY - 150); ctx.closePath(); ctx.fill();
  UG.drawShield(ctx, myShield, x - 57, GY - 194, 44);
  // the arm: cocked back while aiming, swings over to throw
  const cock = -2.55, thrown = -0.62;
  let a;
  if (S && S.phase === 'swing') a = lerp(cock, thrown, ease.inCubic(clamp(S.armT / 0.32, 0, 1)));
  else if (S && (S.phase === 'fly' || S.phase === 'done') && S.armT < 1.2) a = lerp(thrown, cock + 0.4, ease.outCubic(clamp((S.armT - 0.32) / 0.8, 0, 1)));
  else a = cock + (S && S.phase === 'aim' ? -0.05 * S.aim.p : 0);
  const L1 = 175, L2 = 58;
  const tip = [x + Math.cos(a) * L1, y + Math.sin(a) * L1], tail = [x - Math.cos(a) * L2, y - Math.sin(a) * L2];
  ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(tail[0], tail[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
  ctx.fillStyle = '#4a4f55'; ctx.fillRect(tail[0] - 20, tail[1] + 2, 40, 34); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2; ctx.strokeRect(tail[0] - 20, tail[1] + 2, 40, 34);
  ctx.fillStyle = '#c9a84f'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.fill();
  if (S && (S.phase === 'aim' || S.phase === 'swing' || S.phase === 'intro')) {
    const fire = S.ammo === 'fire';
    ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.lineTo(tip[0] + 6, tip[1] + 34); ctx.stroke();
    ammoArt(ctx, tip[0] + 6, tip[1] + 42, fire, g);
  }
}
function ammoArt(ctx, x, y, fire, g) {
  if (fire) {
    ctx.fillStyle = '#8a4a24'; ctx.beginPath(); ctx.arc(x, y, 15, 0, 6.283); ctx.fill(); ctx.fillStyle = '#5a2f15'; ctx.fillRect(x - 7, y - 20, 14, 8);
    const fl = 1 + Math.sin(g.t * 20) * 0.2; ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); ctx.ellipse(x, y - 26, 6 * fl, 11 * fl, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fff1b8'; ctx.beginPath(); ctx.ellipse(x, y - 24, 3, 5, 0, 0, 6.283); ctx.fill();
  } else {
    const gr = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, 19); gr.addColorStop(0, '#b6b0a4'); gr.addColorStop(1, '#5f5a52');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 19, 0, 6.283); ctx.fill();
  }
}
function preview(ctx) {
  const v = S.aim.p * VMAX; let x = REL.x, y = REL.y, vx = Math.cos(S.aim.a) * v, vy = -Math.sin(S.aim.a) * v;
  const steps = Math.round(18 + 34 * (1 - S.lvl / LEVELS.length));    // later castles show less of the arc
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 1; i <= steps; i++) {
    vy += GSTEP; vx += S.wind * 0.004; x += vx; y += vy;
    if (i % 3 === 0) { ctx.globalAlpha = 1 - i / (steps + 6); ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
function hud(ctx, g) {
  ctx.fillStyle = 'rgba(12,10,8,.66)'; ctx.fillRect(0, 0, W, 50); ctx.fillStyle = 'rgba(212,175,90,.6)'; ctx.fillRect(0, 50, W, 1.5);
  UG.drawShield(ctx, myShield, 22, 25, 34);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#f3dc92'; ctx.font = UG.font(14, 900, 'Cinzel Decorative'); ctx.fillText(`Castle ${S.lvl + 1}`, 44, 17);
  ctx.font = UG.font(11, 500); ctx.fillStyle = '#e8dcc2'; ctx.fillText(S.L.name, 44, 36);
  const left = S.guards.filter(x => !x.out).length;
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff3cf'; ctx.font = UG.font(22, 900, 'Cinzel Decorative'); ctx.fillText(String(S.score), W / 2, 20);
  ctx.font = UG.font(10, 700); ctx.fillStyle = '#a8997c'; ctx.fillText(`${left} GUARD${left === 1 ? '' : 'S'} LEFT`, W / 2, 40);
  // wind
  ctx.textAlign = 'right'; ctx.fillStyle = '#a8997c'; ctx.font = UG.font(10, 700); ctx.fillText('WIND', W - 54, 16);
  ctx.fillStyle = '#e8dcc2'; ctx.font = UG.font(13, 700); ctx.fillText(S.wind ? `${Math.abs(S.wind).toFixed(1)}` : 'calm', W - 54, 35);
  if (S.wind) { const L = 8 + Math.min(1, Math.abs(S.wind) / 2) * 22, d = S.wind > 0 ? 1 : -1, ax = W - 28; ctx.strokeStyle = '#7ec8ff'; ctx.fillStyle = '#7ec8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax - d * L / 2, 25); ctx.lineTo(ax + d * L / 2, 25); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ax + d * (L / 2 + 6), 25); ctx.lineTo(ax + d * (L / 2 - 2), 19); ctx.lineTo(ax + d * (L / 2 - 2), 31); ctx.fill(); }
  // ammunition bar along the bottom: tap the fire pot to load it
  ctx.fillStyle = 'rgba(12,10,8,.62)'; ctx.fillRect(0, H - 52, W, 52);
  ctx.textAlign = 'left'; ctx.fillStyle = '#a8997c'; ctx.font = UG.font(10, 700); ctx.fillText('STONES', 14, H - 38);
  for (let i = 0; i < S.L.stones; i++) { ctx.globalAlpha = i < S.stones ? 1 : 0.22; ctx.fillStyle = '#9b958a'; ctx.beginPath(); ctx.arc(22 + i * 22, H - 17, 8, 0, 6.283); ctx.fill(); }
  ctx.globalAlpha = 1;
  if (S.L.fire) {
    const on = S.ammo === 'fire', bx = W - 128, by = H - 46, bw = 118, bh = 40;
    ctx.fillStyle = on ? 'rgba(122,16,32,.95)' : 'rgba(40,30,24,.9)'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = on ? '#ffd76a' : '#5a4523'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = S.fire ? '#fff3cf' : '#7d6f57'; ctx.textAlign = 'center'; ctx.font = UG.font(12, 700); ctx.fillText(`FIRE POT × ${S.fire}`, bx + bw / 2, by + bh / 2 + 1);
  }
  if (S.phase === 'aim') {
    ctx.textAlign = 'center'; ctx.fillStyle = '#e8dcc2'; ctx.font = UG.font(12, 700);
    ctx.fillText(`${Math.round(S.aim.a * 57.3)}° · power ${Math.round(S.aim.p * 100)}%`, W / 2 - (S.L.fire ? 40 : 0), H - 26);
  }
  if (S.msgT > 0) {
    ctx.globalAlpha = Math.min(1, S.msgT * 2); ctx.font = UG.font(28, 900, 'Cinzel Decorative'); ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,14,8,.85)';
    ctx.strokeText(S.msg, W / 2, 150); ctx.fillStyle = '#ffd76a'; ctx.fillText(S.msg, W / 2, 150);
    if (S.lvl === 0 && S.phase !== 'fly') { ctx.font = UG.font(15, 700); ctx.lineWidth = 4; const t = 'Drag back anywhere, then let go'; ctx.strokeText(t, W / 2, 186); ctx.fillStyle = '#fff3cf'; ctx.fillText(t, W / 2, 186); }
    ctx.globalAlpha = 1;
  }
}
function fireBtnHit(x, y) { return S.L.fire && x > W - 128 && y > H - 46; }

UG.start({
  id: 'siege', title: 'Siege', label: 'Trebuchet game: fling stones at a castle', W, H,
  init(g) {
    me = UG.player(); myShield = UG.shield(me.design);
    foeShield = UG.shield({ name: 'The Usurper', motto: '', f: '#1d1915', d: '#b3242f', c: '#b3242f', div: 'chevron', ch: 'wolf', bg: 'clear' });
    for (let i = 0; i < 4; i++) clouds.push({ x: Math.random() * WW, y: 110 + Math.random() * 260, p: Array.from({ length: 4 }, (_, j) => [j * 34 - 50, (Math.random() - 0.5) * 14, 22 + Math.random() * 18]) });
    S = { lvl: Math.min(prog.unlocked, LEVELS.length) - 1, hills: [], blocks: [], guards: [], kill: [], blast: [], flags: [], booms: [], score: 0, phase: 'intro', aim: { a: 0.78, p: 0.68 }, L: LEVELS[0], stones: 3, fire: 0, wind: 0 };
    S.g = g; S.L = LEVELS[S.lvl]; buildLevel(S.lvl);
    menu(g);
  },
  update(g, dt) {
    g.dt = dt;
    if (!engine) return;
    if (S.msgT > 0) S.msgT -= dt;
    for (const f of S.flags) f.t += dt; S.flags = S.flags.filter(f => f.t < 1.6);
    for (const b of S.booms) b.t += dt; S.booms = S.booms.filter(b => b.t < 0.5);
    if (g.state === 'menu') return;
    S.phaseT += dt;
    if (S.phase === 'intro' && S.msgT <= 0.6) S.phase = 'aim';
    if (S.phase === 'swing') { S.armT += dt; if (S.armT >= 0.32) release(); }
    else if (S.phase === 'fly' || S.phase === 'done') S.armT += dt;
    // fixed physics steps, at most a few per frame so a slow phone never spirals
    S.acc = Math.min(S.acc + dt * 1000, STEP * 4);
    while (S.acc >= STEP) {
      if (S.shot && S.wind) Body.setVelocity(S.shot, { x: S.shot.velocity.x + S.wind * 0.004, y: S.shot.velocity.y });
      Engine.update(engine, STEP); S.acc -= STEP;
      if (S.kill.length) { const k = S.kill; S.kill = []; k.forEach(breakBlock); }
      if (S.blast.length) { const k = S.blast; S.blast = []; k.forEach(s => { if (s === S.shot) explode(s); }); }
    }
    if (S.live) for (const gd of S.guards) {
      if (gd.out) continue;
      const p = gd.position;
      if (p.y > gd.y0 + 70 || p.x < -60 || p.x > WW + 60 || p.y > WH) { knock(gd, 'fell'); continue; }
      gd.tip = Math.abs(Math.sin(gd.angle)) > 0.8 ? gd.tip + dt : 0;
      if (gd.tip > 0.25) knock(gd, 'over');
    }
    if (S.phase === 'fly') {
      S.shotT += dt;
      const s = S.shot;
      if (s && (s.position.x > WW + 80 || s.position.x < -80 || s.position.y > WH)) { Composite.remove(engine.world, s); S.shot = null; }
      if (S.shotT > 1 && (settled() || S.shotT > 7)) endShot(g);
      else if (!S.guards.some(x => !x.out) && S.shotT > 0.6) endShot(g);
    }
  },
  draw(g, ctx) {
    ctx.save(); ctx.scale(SC, SC);
    sky(ctx, g);
    for (const h of S.hills) { poly(ctx, h); ctx.fillStyle = '#6b7f45'; ctx.fill(); ctx.fillStyle = '#857558'; ctx.fillRect(h.bounds.min.x, h.bounds.min.y + 14, h.bounds.max.x - h.bounds.min.x, h.bounds.max.y - h.bounds.min.y); ctx.fillStyle = '#6b8b38'; ctx.fillRect(h.bounds.min.x - 4, h.bounds.min.y, h.bounds.max.x - h.bounds.min.x + 8, 16); }
    trebuchet(ctx, g);
    if (engine) {
      for (const b of S.blocks) if (!b.gone) drawBlock(ctx, b);
      for (const gd of S.guards) if (!gd.out) drawGuard(ctx, gd, g);
      if (S.shot) { ctx.save(); ctx.translate(S.shot.position.x, S.shot.position.y); ctx.rotate(S.shot.angle); ammoArt(ctx, 0, 0, S.shot.fire, g); ctx.restore(); }
      if (S.shot && S.shot.position.y < 70 / SC) {                 // above the top of the screen: show where it will come down
        const x = S.shot.position.x, h = Math.round((70 / SC - S.shot.position.y) * SC);
        ctx.fillStyle = 'rgba(255,243,207,.9)'; ctx.beginPath(); ctx.moveTo(x, 72 / SC); ctx.lineTo(x - 12, 92 / SC); ctx.lineTo(x + 12, 92 / SC); ctx.closePath(); ctx.fill();
        void h;
      }
    }
    for (const f of S.flags) {                       // a white flag rises where a guard yielded
      const k = f.t / 1.6; ctx.save(); ctx.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4; ctx.translate(f.x, f.y - k * 60);
      ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, -30); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(14, -34 + Math.sin(g.t * 9) * 3, 26, -28); ctx.lineTo(26, -12); ctx.quadraticCurveTo(14, -18, 0, -14); ctx.fill(); ctx.restore();
    }
    for (const b of S.booms) { ctx.globalAlpha = 1 - b.t / 0.5; ctx.fillStyle = '#ffd76a'; ctx.beginPath(); ctx.arc(b.x, b.y, 40 + b.t * 260, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
    if (g.state === 'play' && S.phase === 'aim') preview(ctx);
    ctx.restore();
    if (g.state === 'play' || g.state === 'over') hud(ctx, g);
  },
  down(g, x, y) {
    if (g.state !== 'play' || S.phase !== 'aim') return;
    if (fireBtnHit(x, y)) { if (S.fire > 0) { S.ammo = S.ammo === 'fire' ? 'stone' : 'fire'; if (S.ammo === 'stone' && S.stones <= 0) S.ammo = 'fire'; UG.sfx.click(); } return; }
    S.dragging = true; S.drag0 = { x, y, a: S.aim.a, p: S.aim.p }; UG.sfx.draw();
  },
  move(g, x, y) {
    if (!S.dragging) return;
    // pull back from where you first touched: the shot goes the opposite way
    const dx = S.drag0.x - x, dy = S.drag0.y - y, d = Math.hypot(dx, dy);
    if (d < 12) return;
    S.aim.a = clamp(Math.atan2(-dy, dx), 0.12, 1.45);
    S.aim.p = clamp(d / 210, 0.2, 1);
  },
  up(g, x, y) {
    if (!S.dragging) return;
    S.dragging = false;
    const d = Math.hypot(S.drag0.x - x, S.drag0.y - y);
    if (d < 12) { S.aim.a = S.drag0.a; S.aim.p = S.drag0.p; return; }   // a tap is not a shot
    launch(g);
  },
  key(g, key, down) {
    if (!down || g.state !== 'play' || S.phase !== 'aim') return;
    if (key === 'ArrowUp' || key === 'w' || key === 'W') S.aim.a = clamp(S.aim.a + 0.03, 0.12, 1.45);
    if (key === 'ArrowDown' || key === 's' || key === 'S') S.aim.a = clamp(S.aim.a - 0.03, 0.12, 1.45);
    if (key === 'ArrowRight' || key === 'd' || key === 'D') S.aim.p = clamp(S.aim.p + 0.02, 0.2, 1);
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') S.aim.p = clamp(S.aim.p - 0.02, 0.2, 1);
    if (key === 'Enter' && S.fire > 0) { S.ammo = S.ammo === 'fire' ? 'stone' : 'fire'; if (S.ammo === 'stone' && S.stones <= 0) S.ammo = 'fire'; }
    if (key === ' ' || key === 'Spacebar') launch(g);
  },
});
// test hook, only on a local server
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__ug = { st: () => S, eng: () => engine, LEVELS, prog, start: i => startLevel(S.g, i) };
})();
