const { U, scl, fringe, mirror, circle, ellipse, capsule, limb, feather, lock, claw, rot, move, S, O, Ln, D, K } = require('./kit.js');
const both = (arr) => arr.flatMap(e => [e, { ...e, d: mirror(e.d) }]);
const out = {};

/* eagle's dexter-side wing (viewer's right), shoulder near (113, 90) */
function eagleWing() {
  const w = [];
  [[110, 100, 30, 40], [112, 94, 14, 50], [114, 88, -2, 58], [117, 82, -19, 63], [120, 77, -36, 64], [122, 73, -53, 62], [124, 70, -70, 54]].forEach(([x, y, a, L]) => w.push(O(feather(x, y, a, L, 15, 0, 0.55))));
  [[-60, 34], [-40, 38], [-20, 38], [0, 34], [20, 28]].forEach(([a, L]) => w.push(O(feather(113, 90, a, L, 19, 0, 0.7))));
  return w;
}
/* ---------- eagle displayed ---------- */
{
  const els = [];
  const wing = eagleWing();
  const tail = [[62, 32], [76, 38], [90, 41], [104, 38], [118, 32]].map(([a, L]) => O(feather(100, 118, a, L, 13, 0, 0.55)));
  els.push(...tail);
  els.push(...both(wing));
  els.push(...both([Ln('M91 122C89 129 85 134 79 140', 7.5)]));
  els.push(...both([S(claw(79, 140, 172, 13, 4.2)), S(claw(79, 140, 132, 13, 4.2)), S(claw(79, 140, 95, 12, 4.2)), S(claw(82, 136, 28, 9, 3.6))]));
  els.push(...both([O(ellipse(91, 118, 8, 10, 20))]));
  els.push(U(['M100 74C116 74 121 90 120 104C119 118 111 128 100 131C89 128 81 118 80 104C79 90 84 74 100 74Z',
    'M85 88C85 78 86 70 87 63L109 63C111 70 114 78 115 88Z', circle(98, 57, 11.5),
    'M91 49C85 46 76 48 72 54C69 58 70 64 73 67C75 63 78 62 81 62C84 62 87 63 90 64Z', 'M80 63C83 63 87 64 91 65L91 70C86 70 82 68 80 66Z']));
  els.push(K(circle(95.5, 54.5, 2.4)));
  els.push(D('M73 64C77 61 83 61 89 63', 0.9));
  for (const [y, w] of [[92, 7], [100, 10], [108, 10], [116, 8]]) els.push(D(`M${100 - w} ${y - 3}Q100 ${y + 2} ${100 + w} ${y - 3}`, 0.8));
  out.eagle = { els, o: { w: 62, h: 64, cy: 61 } };
}
/* ---------- shared rampant rig: body and limbs of a beast rearing to dexter (the viewer's left) ---------- */
function rig(o = {}) {
  const k = o.limb || 1, cl = o.claw || 7, cw = o.clawW || 2.8;
  const paw = (x, y, a, n = 3) => { const r = []; for (let i = 0; i < n; i++) r.push(claw(x, y, a - 28 + i * 28, cl, cw)); return r.map(S); };
  const claws = [...(o.foreClaws || [...paw(51, 64, -152), ...paw(57, 90, -172)]), ...paw(74, 145, 172), ...paw(97, 156, 178)];
  const far = [limb([[116, 122, 11 * k], [122, 138, 7 * k], [114, 151, 4.6 * k], [103, 155, 4.2 * k]]), ellipse(100, 155, 6.5 * k, 4.2 * k, -3),
    ...(o.foreFar || [limb([[94, 90, 7 * k], [78, 97, 5.2 * k], [65, 93, 4 * k]]), ellipse(60, 91, 5.6 * k, 4.4 * k, -20)])];
  const body = [ellipse(93, 80, 15 * k, 19, -25), limb([[98, 94, 11 * k], [110, 110, 10 * k]]), ellipse(114, 117, 13 * k, 14 * k, -20)];
  const near = [limb([[108, 118, 10 * k], [92, 126, 6.6 * k], [90, 140, 4.6 * k], [80, 144, 4.2 * k]]), ellipse(77, 144, 6.5 * k, 4 * k, 8),
    ...(o.foreNear || [limb([[90, 75, 8 * k], [75, 72, 5.5 * k], [60, 66.5, 4.2 * k]]), ellipse(55.5, 65, 5.6 * k, 4.4 * k, -20)])];
  return { claws, parts: [...far, ...body, ...near], thigh: D('M101 111C96 114 94 121 96 127', 0.8) };
}

/* ---------- lion rampant ---------- */
{
  const els = [];
  const H = d => move(scl(d, 1.14, 84, 52), 4, -6);
  const R = rig();
  els.push(Ln('M122 118C142 114 148 98 140 84C134 74 136 66 141 60', 4.2));
  els.push(S(fringe(141, 60, 3, -200, 20, 4, 10, 0.3)));
  els.push(...R.claws);
  const mane = H(fringe(89, 55, 12, -150, 150, 9, 11, 0.35, 14));
  const head = H('M88 37C82 35.5 76 37 72.5 39.5C68 40.5 64 42 61.5 44C59.5 45.8 59.2 48.6 60.2 50.6C61 52 62.5 52.6 64 52.8L70.5 55L64.5 57.8C63.5 58.8 63.8 61.2 65.5 62.2C70 64 76 63.5 81 61C87 58 91.5 52 91.5 45C91.5 40.5 90 37.5 88 37Z');
  const ear = H('M84 40C84 35 88 31.5 93 33.5C93.5 37.5 91.5 41 88.5 43Z');
  els.push(U([...R.parts, mane, ear, head]));
  els.push(K(H('M64 52.9L70.5 55L64.6 57.7C63.8 56 63.6 54.2 64 52.9Z')));
  els.push(S(H('M67 56.2C62.5 56.3 58.8 57.4 57 60C56.2 61.5 57.3 62.6 58.8 61.8C60.8 60.5 63.2 59.6 66 59Z')));
  els.push(K(H('M72.5 44.2C74.8 42.3 78 42.4 79.5 44.4C77.5 46 74.8 46.1 72.5 44.2Z')));
  els.push(D(H('M71.5 41.2C74.5 39.4 78.5 39.2 81.5 40.6'), 0.8));
  els.push(K(H(ellipse(61.4, 46.6, 1.5, 1.1, -20))));
  els.push(D(H('M66.5 47.8C68.5 49.8 71 51 74 51.5'), 0.6));
  for (let i = 0; i < 9; i++) { const a = (-150 + 33.3 * (i + 0.85)) * Math.PI / 180, cx = 89, cy = 55; els.push(D(H(`M${(cx + 12 * Math.cos(a)).toFixed(1)} ${(cy + 14 * Math.sin(a)).toFixed(1)}Q${(cx + 17 * Math.cos(a - 0.12)).toFixed(1)} ${(cy + 19 * Math.sin(a - 0.12)).toFixed(1)} ${(cx + 20 * Math.cos(a + 0.05)).toFixed(1)} ${(cy + 22 * Math.sin(a + 0.05)).toFixed(1)}`), 0.7)); }
  els.push(R.thigh);
  out.lion = { els, o: { w: 56, h: 66, cy: 61 } };
}

/* ---------- dragon rampant ---------- */
{
  const els = [];
  const R = rig({ claw: 8.5, clawW: 3 });
  const wing = (sx, sy, wx, wy, tips) => {
    let d = `M${sx} ${sy}L${wx} ${wy}L${tips[0][0]} ${tips[0][1]}`;
    for (let i = 1; i < tips.length; i++) { const [ax, ay] = tips[i - 1], [bx, by] = tips[i]; const mx = (ax + bx) / 2, my = (ay + by) / 2; d += `Q${(mx + (wx - mx) * 0.42).toFixed(1)} ${(my + (wy - my) * 0.42).toFixed(1)} ${bx} ${by}`; }
    const [lx, ly] = tips[tips.length - 1]; d += `Q${((lx + sx) / 2 + 4).toFixed(1)} ${((ly + sy) / 2 - 6).toFixed(1)} ${sx + 8} ${sy + 12}Z`;
    return d;
  };
  const tips = [[154, 12], [166, 38], [161, 62], [144, 80]];
  const w1 = wing(104, 74, 126, 24, tips);
  const bones = 'M126 24L154 12M126 24L166 38M126 24L161 62M126 24L144 80';
  const T = d => rot(scl(d, 0.9, 104, 74), -16, 104, 74);
  els.push(O(T(w1)), D(T(bones), 1));
  els.push(O(w1), D(bones, 1.1));
  els.push(Ln('M104 74L126 24', 3.6), S(claw(126, 24, -95, 7, 3)));
  els.push(U([limb([[118, 118, 6.5], [134, 128, 5.2], [146, 142, 4.2], [144, 156, 3.4], [132, 160, 2.8], [124, 154, 2.4]]), 'M116.8 148.6L128.6 151.2L122.8 153.1L122.6 159.2Z']));
  els.push(...R.claws);
  const head = 'M96 33C90 31 84 32 79 34.5C73 35.5 66 37 60 38.5C56 39.5 53.5 42 54 45C54.4 46.5 55.5 47.3 57 47.6L78 52C84 54 90 54 95 50C99 46 100 38 96 33Z';
  const jaw = 'M78 52L59 56.5C57.5 57.5 58 60 59.8 60.4C67 61 76 61 84 59.5C88 58.8 90 57 90 55Z';
  const spines = [];
  for (const [x, y, a] of [[99, 44, -10], [103, 53, 0], [106, 62, 8], [110, 71, 15]]) spines.push(lock(x, y, a, 7, 6, -1));
  els.push(U([...R.parts, limb([[92, 50, 8], [95, 72, 12]]), ...spines,
    'M93 33C97 25 104 19 114 16C107 21 102 27 98 35Z', 'M90 36C94 31 99 29 105 29C101 32 98 36 94 39Z', head, jaw]));
  els.push(K('M57.2 47.7L78 52L59.2 56.5C57.6 53.6 57 50.6 57.2 47.7Z'));
  els.push(S('M74 52.6C66 52.4 58 51.9 51 50.6L46.5 48.4L49.6 51.8L45.5 54.2L50.6 53.6C58 54.4 66 54.8 74 54.4Z'));
  els.push(O('M60 47.9L61.8 51.3L63.6 48.3Z'), O('M61.3 56.1L63 52.7L64.6 55.8Z'));
  els.push(K('M77.5 38.6L86.5 37.4L83 41.2Z'), K(ellipse(57.4, 41.6, 1.4, 1, -20)));
  els.push(D('M74 36.5C78 35 83 34.8 88 35.5', 0.8));
  for (const y of [80, 88, 96, 104]) els.push(D(`M${86 - (y - 80) * 0.2} ${y - 4}Q${93 - (y - 80) * 0.1} ${y + 1} ${101 + (y - 80) * 0.2} ${y - 3}`, 0.7));
  els.push(R.thigh);
  out.dragon = { els, o: { w: 60, h: 66, cy: 61 } };
}

/* ---------- griffin segreant (eagle head and wings, lion body) ---------- */
{
  const els = [];
  const talon = (x, y, a) => [claw(x, y, a - 30, 9, 3), claw(x, y, a, 9.5, 3), claw(x, y, a + 30, 9, 3)].map(S);
  const R = rig({ foreNear: [limb([[90, 75, 7], [76, 70, 4.2], [62, 62, 3.2]])], foreFar: [limb([[94, 90, 6.5], [80, 96, 4], [66, 90, 3.1]])],
    foreClaws: [...talon(61, 62, -160), ...talon(65, 90, -175)] });
  const W = d => move(rot(scl(d, 0.92, 113, 90), -12, 113, 90), -9, -16);
  els.push(...eagleWing().map(e => ({ ...e, d: W(e.d) })));
  els.push(Ln('M122 120C140 122 152 132 150 146C149 154 153 159 159 158', 4.2));
  els.push(S(fringe(159, 157, 3, -110, 110, 4, 9, 0.3)));
  els.push(...R.claws);
  const neck = fringe(90, 52, 9, -150, 120, 8, 9, 0.35, 11);
  const head = 'M90 36C84 34 79 36 76 40C71 41 66 43 63 47C61 50 61 54 63 57C64 53 66 51 69 51C72 51 75 52 77 53C80 56 84 57 88 56C94 54 97 48 96 42C95 39 93 37 90 36Z';
  const ear = 'M88 37C88 31 92 27 98 27C97 31 95 35 92 39Z';
  els.push(U([...R.parts, neck, ear, head]));
  els.push(S('M76 53.5C73 55 69 56.5 66.5 59C66 60.5 67 61.5 68.5 60.8C71 59.5 74 58 77 56.5Z'));
  els.push(K(circle(83, 44, 2.1)), D('M64 50.5C67 49.5 71 49.6 76 51.5', 0.8), D('M78 41C81 39.8 85 39.6 88 40.4', 0.7));
  for (let i = 0; i < 8; i++) { const a = (-150 + 33.75 * (i + 0.85)) * Math.PI / 180; els.push(D(`M${(90 + 9 * Math.cos(a)).toFixed(1)} ${(52 + 11 * Math.sin(a)).toFixed(1)}L${(90 + 15 * Math.cos(a)).toFixed(1)} ${(52 + 17 * Math.sin(a)).toFixed(1)}`, 0.6)); }
  els.push(R.thigh);
  out.griffin = { els, o: { w: 58, h: 66, cy: 61 } };
}

/* ---------- bear rampant ---------- */
{
  const els = [];
  const R = rig({ limb: 1.18, claw: 6.5, clawW: 2.8 });
  els.push(...R.claws);
  const head = 'M90 34C84 31 77 33 73 37C68 38.5 63 40.5 60 43C57.5 45 57.5 49 59.5 51C61 52.4 63 52.8 65 52.8L71 54L65.5 57C64.5 58.5 65.5 60.8 67.5 61.3C73 62.5 80 61.5 86 58C93 54 97 47 96 41C95.5 37.5 93 35 90 34Z';
  els.push(U([...R.parts, ellipse(122, 116, 5, 6, 20), limb([[90, 50, 11], [93, 70, 15]]), circle(87, 39, 6.5), circle(94, 38, 5.5), head]));
  els.push(D('M88 36C87 38 88 41 90 42', 0.7));
  els.push(K('M65.2 52.9L71 54L65.6 56.9C65 55.7 64.9 54.2 65.2 52.9Z'));
  els.push(K(ellipse(60.2, 45, 2.2, 1.6, -25)), K(ellipse(75, 43, 1.9, 1.5, 0)));
  els.push(D('M70 40C73 38.5 77 38.3 80 39.2', 0.7), D('M63 48.6C66 50.3 69 51.2 73 51.3', 0.6));
  els.push(D('M101 111C96 114 94 121 96 127', 0.8), D('M93 70C90 74 89 79 91 83', 0.8));
  out.bear = { els, o: { w: 56, h: 66, cy: 61 } };
}
/* ---------- unicorn rampant (supporters only; not in the emblem picker) ---------- */
{
  const els = [];
  const R = rig({ claw: 0.01, clawW: 0.01 });
  const T = d => move(scl(d, 0.5, 0, 0), 40, -5);
  const horseHead = 'M48 100C52 88 60 76 70 64C76 56 80 50 86 44C89 36 92 30 96 22C100 30 102 36 102 44C110 50 118 60 126 74C134 90 140 108 142 132L98 132C98 122 96 114 92 108C86 104 80 106 72 110C66 115 59 121 52 121C46 121 42 116 42 110C42 106 44 102 48 100Z';
  const mane = [];
  [[104, 48, -24], [111, 57, -12], [118, 67, -2], [124, 79, 8], [129, 92, 16], [133, 106, 24], [136, 119, 30]].forEach(([x, y, a]) => mane.push(T(lock(x, y, a, 15, 12, 5))));
  els.push(Ln('M122 118C142 114 148 98 140 84C134 74 136 66 141 60', 3.6));
  els.push(S(fringe(141, 60, 3, -200, 20, 4, 9, 0.3)));
  els.push(O(T('M84 43.5L66 6L92.5 39Z')));
  els.push(U([...R.parts, limb([[88, 44, 9], [95, 74, 12.5]]), ...mane, T(horseHead), T(lock(53, 115, 100, 13, 7, 3))]));
  els.push(D(T('M71 17L80 15.5M74 25L84 22.5M77.5 32.5L87.5 29.5'), 0.8));
  els.push(K(T('M80 61.5C82.5 59.8 86 59.6 88 60.8C86 63 82.5 63.2 80 61.5Z')), K(T(ellipse(51.5, 104, 2.2, 3, 30))), D(T('M78 57.5C81 56 86 55.6 89 56.8'), 0.7));
  els.push(R.thigh);
  out.unicornr = { els, o: { w: 56, h: 66, cy: 61 } };
}
module.exports = out;
