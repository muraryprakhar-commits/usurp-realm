const { U, scl, fringe, mirror, circle, ellipse, capsule, limb, feather, lock, claw, rot, move, S, O, Ln, D, K } = require('./kit.js');
const both = arr => arr.flatMap(e => [e, { ...e, d: mirror(e.d) }]);
const out = {};
const ring = (cx, cy, R, r) => `M${cx - R} ${cy}A${R} ${R} 0 1 1 ${cx + R} ${cy}A${R} ${R} 0 1 1 ${cx - R} ${cy}ZM${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
const heart = (cx, cy, s, a) => rot(`M${cx} ${cy}C${cx - 2 * s} ${cy - 1.6 * s} ${cx - 2.3 * s} ${cy - 3.4 * s} ${cx - 1.1 * s} ${cy - 4 * s}C${cx - 0.4 * s} ${cy - 4.3 * s} ${cx} ${cy - 3.8 * s} ${cx} ${cy - 3.2 * s}C${cx} ${cy - 3.8 * s} ${cx + 0.4 * s} ${cy - 4.3 * s} ${cx + 1.1 * s} ${cy - 4 * s}C${cx + 2.3 * s} ${cy - 3.4 * s} ${cx + 2 * s} ${cy - 1.6 * s} ${cx} ${cy}Z`, a, cx, cy);

/* oak tree eradicated (roots showing) */
{
  const els = [];
  els.push(Ln('M96 146C88 150 80 152 70 152M104 146C112 150 120 152 130 152M100 148C99 153 97 157 94 160M98 147C92 153 86 158 80 160M102 147C108 153 114 158 120 160', 4.5));
  els.push(U([circle(100, 56, 24), circle(76, 68, 20), circle(124, 68, 20), circle(84, 86, 20), circle(116, 86, 20), circle(100, 78, 22), circle(64, 86, 14), circle(136, 86, 14), circle(100, 96, 14),
    'M91 150C94 132 95 114 94 98L106 98C105 114 106 132 109 150Z']));
  els.push(D('M100 112L86 96M100 106L116 92M100 100L100 86', 1.4));
  for (const [x, y] of [[72, 60], [96, 46], [124, 58], [84, 78], [112, 72], [66, 92], [132, 92], [100, 66]]) els.push(D(`M${x - 6} ${y + 3}Q${x} ${y - 3} ${x + 6} ${y + 3}`, 0.7));
  els.push(D('M97 120L97 140M103 112L103 132', 0.6));
  out.tree = { els, o: { w: 56, h: 62, cy: 60 } };
}
/* open book */
{
  const els = [];
  els.push(O('M100 80C88 72 68 70 44 74L44 136C68 132 88 134 100 142C112 134 132 132 156 136L156 74C132 70 112 72 100 80Z'));
  els.push(...both([O('M100 76C88 68 70 66 52 70L52 128C70 124 88 126 100 134Z')]));
  for (const y of [82, 92, 102, 112]) els.push(...both([D(`M60 ${y - 4}C72 ${y - 6} 84 ${y - 4} 94 ${y}`, 0.6)]));
  out.book = { els, o: { w: 58, h: 42, cy: 60 } };
}
/* crossed swords */
{
  const els = [];
  const sword = 'M97 122L97 50L100 40L103 50L103 122ZM84 120L116 120L116 126L84 126ZM97.5 126L102.5 126L102.5 140L97.5 140Z';
  for (const a of [-40, 40]) {
    els.push(U([rot(sword, a, 100, 88), rot(circle(100, 144, 4.6), a, 100, 88)]));
    els.push(D(rot('M100 52L100 116', a, 100, 88), 0.6));
  }
  out.swords = { els, o: { w: 58, h: 58, cy: 60 } };
}
/* battle axe */
{
  const els = [];
  els.push(Ln('M100 46L100 158', 6.5));
  els.push(O('M97 50C86 48 72 44 62 36C57 56 57 80 62 100C74 90 86 84 97 82Z'), O('M103 56L118 62L103 70Z'), S(circle(100, 44, 4)));
  els.push(D('M66 46C63 62 63 80 66 92', 0.7), D('M100 120L100 150', 0.5));
  out.axe = { els, o: { w: 44, h: 62, cy: 60 } };
}
/* hammer */
{
  const els = [];
  els.push(Ln('M100 74L100 156', 7.5));
  els.push(O('M66 52L116 52L134 58L134 70L116 76L66 76Z'), O('M94 76L106 76L106 84L94 84Z'));
  els.push(D('M72 52L72 76M116 53L116 75', 0.7));
  out.hammer = { els, o: { w: 52, h: 56, cy: 60 } };
}
/* shamrock */
{
  const els = [];
  els.push(Ln('M100 104C102 118 106 132 114 146', 5));
  els.push(U([heart(100, 98, 8.5, 0), heart(100, 98, 8.5, 120), heart(100, 98, 8.5, 240)]));
  for (const a of [0, 120, 240]) els.push(D(rot('M100 96L100 72', a, 100, 98), 0.8));
  out.shamrock = { els, o: { w: 56, h: 60, cy: 60 } };
}
/* flame */
{
  const els = [];
  els.push(U(['M100 152C76 152 61 136 63 116C65 101 75 93 78 80C84 90 84 99 82 107C90 96 94 82 92 66C90 56 86 48 88 36C101 49 111 62 115 78C117 88 115 96 113 102C119 96 123 88 122 79C133 92 139 107 137 122C135 140 121 152 100 152Z']));
  els.push(O('M100 146C88 146 80 138 81 126C82 116 90 110 92 100C98 108 99 116 98 122C103 117 106 110 106 104C114 112 118 122 117 130C116 140 110 146 100 146Z'));
  out.flame = { els, o: { w: 50, h: 62, cy: 60 } };
}
/* ship (lymphad) */
{
  const els = [];
  els.push(Ln('M100 120L100 44', 4.5), Ln('M74 56L126 56M76 106L124 106', 3.2));
  els.push(O('M74 58C88 54 112 54 126 58C123 74 123 90 126 104C112 100 88 100 74 104C77 90 77 74 74 58Z'));
  els.push(O('M100 44L100 30L118 36L100 42Z'));
  els.push(U(['M46 116L154 116C150 130 136 142 116 144L84 144C64 142 50 130 46 116Z', 'M46 116C42 108 40 100 44 92C48 98 50 106 52 116Z', 'M154 116C158 108 160 100 156 92C152 98 150 106 148 116Z']));
  els.push(D('M54 124L146 124', 0.8), D('M88 60C90 74 90 90 88 102M112 60C110 74 110 90 112 102', 0.6));
  for (let x = 60; x <= 140; x += 16) els.push(K(circle(x, 131, 2.2)));
  out.ship = { els, o: { w: 60, h: 58, cy: 60 } };
}
/* mountain (three peaks) */
{
  const els = [];
  els.push(U(['M36 150L74 82L90 108L114 54L164 150Z']));
  els.push(O('M105 72L114 54L124 74L118 70L113 78L109 70Z'), O('M68 94L74 82L80 92L76 90L73 96Z'));
  els.push(D('M114 54L104 88L110 110M74 82L70 104', 0.7));
  out.mountain = { els, o: { w: 60, h: 44, cy: 62 } };
}
/* lightning bolt */
{
  out.lightning = { els: [U(['M114 34L74 104L98 104L84 166L130 86L105 86L124 34Z'])], o: { w: 40, h: 64, cy: 60 } };
}
/* wheat sheaf (garb) */
{
  const els = [];
  const stalks = 'M98 112L84 158M100 112L96 160M102 112L108 160M104 112L118 156M96 112L76 152M106 112L126 150';
  els.push(Ln(stalks, 3.2));
  for (const a of [-130, -110, -90, -70, -50]) {
    const t = a * Math.PI / 180, x = 100 + 26 * Math.cos(t), y = 104 + 26 * Math.sin(t);
    els.push(Ln(`M100 104L${x.toFixed(1)} ${y.toFixed(1)}`, 3));
    const g = []; for (let i = 0; i < 3; i++) { const r = 32 + i * 8; for (const sgn of [-1, 1]) g.push(feather(100 + r * Math.cos(t), 104 + r * Math.sin(t), a + sgn * 28, 9, 5.5, 0, 0.6)); }
    g.push(feather(100 + 54 * Math.cos(t), 104 + 54 * Math.sin(t), a, 10, 5.5, 0, 0.5));
    els.push(...g.map(O));
  }
  els.push(O('M88 106L112 106L113 116L87 116Z'));
  els.push(D('M88 111L112 111', 0.6));
  out.wheat = { els, o: { w: 56, h: 64, cy: 60 } };
}
/* acorn */
{
  const els = [];
  els.push(Ln('M101 74C102 68 104 62 108 58', 4.5));
  els.push(U(['M100 154C86 152 78 138 78 120C78 108 82 100 88 96L112 96C118 100 122 108 122 120C122 138 114 152 100 154Z']));
  els.push(O('M74 96C74 80 88 72 100 72C112 72 126 80 126 96C126 102 116 104 100 104C84 104 74 102 74 96Z'));
  els.push(D('M80 86L120 86M76 94L124 94M88 76L84 102M100 72L100 104M112 76L116 102', 0.6));
  els.push(D('M92 112C90 122 90 134 94 144', 0.6));
  els.push(O('M108 60C118 50 132 48 144 52C140 60 134 66 126 68C120 70 114 66 108 60Z'), D('M110 60C120 58 130 56 140 54', 0.6));
  out.acorn = { els, o: { w: 50, h: 62, cy: 60 } };
}
/* thistle */
{
  const els = [];
  els.push(Ln('M100 108L100 158', 4.5));
  els.push(...both([O('M98 128C88 120 76 120 64 126L70 130L62 134L72 136L66 142C78 144 90 140 98 134Z')]));
  els.push(U([fringe(100, 70, 12, -170, -10, 7, 22, 0.15, 10)]));
  els.push(O('M80 84C80 74 90 68 100 68C110 68 120 74 120 84L118 100C112 108 88 108 82 100Z'));
  els.push(D('M84 78L116 102M84 102L116 78M80 88L120 88M82 96L118 96', 0.6));
  out.thistle = { els, o: { w: 54, h: 64, cy: 60 } };
}
/* Irish high cross (cross with a ring and a long shaft) */
{
  out.highcross = { els: [U(['M94 36L106 36L106 70L138 70L138 82L106 82L106 162L94 162L94 82L62 82L62 70L94 70Z', ring(100, 76, 27, 20)]), D(circle(100, 76, 5), 0.8)], o: { w: 48, h: 64, cy: 61 } };
}
module.exports = out;
