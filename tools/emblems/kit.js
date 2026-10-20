// Vector toolkit for drawing emblems in a 200x200 box (centre 100,100). Absolute path commands only.
const R = n => { const v = Math.round(n * 10) / 10; return Object.is(v, -0) ? 0 : v; };
const f = n => String(R(n));
const deg = a => a * Math.PI / 180;
// --- path parsing / transforming (absolute M L H V C S Q T A Z) ---
function parse(d) {
  const out = []; const re = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi; let m;
  while ((m = re.exec(d))) {
    const c = m[1]; if (c !== c.toUpperCase()) throw new Error('relative command in ' + d.slice(0, 40));
    const nums = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
    out.push([c, nums]);
  }
  return out;
}
function xform(d, fn, flip = false) {
  return parse(d).map(([c, n]) => {
    if (c === 'Z') return 'Z';
    if (c === 'H' || c === 'V') throw new Error('H/V not supported in xform');
    if (c === 'A') {
      const o = []; for (let i = 0; i < n.length; i += 7) { const [x, y] = fn(n[i + 5], n[i + 6]); o.push(f(n[i]), f(n[i + 1]), f(n[i + 2]), n[i + 3], flip ? 1 - n[i + 4] : n[i + 4], f(x), f(y)); }
      return 'A' + o.join(' ');
    }
    const o = []; for (let i = 0; i < n.length; i += 2) { const [x, y] = fn(n[i], n[i + 1]); o.push(f(x) + ' ' + f(y)); }
    return c + o.join(' ');
  }).join('');
}
const mirror = (d, cx = 100) => xform(d, (x, y) => [2 * cx - x, y], true);
const move = (d, dx, dy) => xform(d, (x, y) => [x + dx, y + dy]);
const rot = (d, a, cx, cy) => { const c = Math.cos(deg(a)), s = Math.sin(deg(a)); return xform(d, (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); };
const scl = (d, k, cx, cy, ky = k) => xform(d, (x, y) => [cx + (x - cx) * k, cy + (y - cy) * ky]);
// --- primitives ---
const circle = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
function ellipse(cx, cy, rx, ry, a = 0) {
  const k = 0.5523, p = [[rx, 0], [rx, ry * k], [rx * k, ry], [0, ry], [-rx * k, ry], [-rx, ry * k], [-rx, 0], [-rx, -ry * k], [-rx * k, -ry], [0, -ry], [rx * k, -ry], [rx, -ry * k], [rx, 0]];
  const c = Math.cos(deg(a)), s = Math.sin(deg(a)); const T = ([x, y]) => f(cx + x * c - y * s) + ' ' + f(cy + x * s + y * c);
  let d = 'M' + T(p[0]); for (let i = 1; i < 13; i += 3) d += 'C' + T(p[i]) + ' ' + T(p[i + 1]) + ' ' + T(p[i + 2]); return d + 'Z';
}
// hull of two circles (a tapered limb segment)
function capsule(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), a = Math.atan2(dy, dx), b = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / L)));
  const p = (x, y, r, t) => [x + r * Math.cos(t), y + r * Math.sin(t)];
  const A1 = p(x1, y1, r1, a + b), A2 = p(x2, y2, r2, a + b), B2 = p(x2, y2, r2, a - b), B1 = p(x1, y1, r1, a - b);
  return `M${f(A1[0])} ${f(A1[1])}L${f(A2[0])} ${f(A2[1])}A${f(r2)} ${f(r2)} 0 0 0 ${f(B2[0])} ${f(B2[1])}L${f(B1[0])} ${f(B1[1])}A${f(r1)} ${f(r1)} 0 1 0 ${f(A1[0])} ${f(A1[1])}Z`;
}
// chain of capsules through joints [[x,y,r],...]
const limb = js => js.slice(1).map((j, i) => capsule(js[i][0], js[i][1], js[i][2], j[0], j[1], j[2])).join('');
// feather / leaf / flame-lock: base (bx,by), direction a (deg, 0 = right, clockwise), length L, width w; bend curls the tip sideways
function feather(bx, by, a, L, w, bend = 0, tip = 0.42) {
  const pts = [[0, -w / 2], [L * 0.55, -w / 2 - bend * 0.2], [L - w * tip, -w * 0.32 + bend], [L, bend], [L - w * tip, w * 0.32 + bend], [L * 0.55, w / 2 - bend * 0.2], [0, w / 2]];
  const c = Math.cos(deg(a)), s = Math.sin(deg(a)); const T = ([x, y]) => f(bx + x * c - y * s) + ' ' + f(by + x * s + y * c);
  return `M${T(pts[0])}C${T(pts[1])} ${T(pts[2])} ${T(pts[3])}C${T(pts[4])} ${T(pts[5])} ${T(pts[6])}Z`;
}
// pointed lock (flame / mane tuft): base width w, length L, tip curl c (positive curls clockwise)
function lock(bx, by, a, L, w, c = 0) {
  const pts = [[0, -w / 2], [L * 0.45, -w * 0.45], [L * 0.8, -w * 0.1 + c * 0.6], [L, c], [L * 0.62, w * 0.18 + c * 0.5], [L * 0.3, w * 0.5], [0, w / 2]];
  const cs = Math.cos(deg(a)), s = Math.sin(deg(a)); const T = ([x, y]) => f(bx + x * cs - y * s) + ' ' + f(by + x * s + y * cs);
  return `M${T(pts[0])}C${T(pts[1])} ${T(pts[2])} ${T(pts[3])}C${T(pts[4])} ${T(pts[5])} ${T(pts[6])}Z`;
}
// claw: small hooked triangle from (x,y) pointing a, length L
function claw(x, y, a, L, w = 2.4) {
  const c = Math.cos(deg(a)), s = Math.sin(deg(a)); const T = (u, v) => f(x + u * c - v * s) + ' ' + f(y + u * s + v * c);
  return `M${T(0, -w / 2)}Q${T(L * 0.7, -w * 0.6)} ${T(L, w * 0.6)}Q${T(L * 0.45, w * 0.15)} ${T(0, w / 2)}Z`;
}
// --- element constructors: S silhouette, O outlined silhouette (thin line in fill layer), L line (width), D detail line, K dark fill
const U = (ds) => ({ t: 'U', ds }), S = d => ({ t: 'S', d }), O = d => ({ t: 'O', d }), Ln = (d, w) => ({ t: 'L', d, w }), D = (d, w) => ({ t: 'D', d, w }), K = d => ({ t: 'K', d });
module.exports = { U, R, f, parse, xform, mirror, move, rot, scl, circle, ellipse, capsule, limb, feather, lock, claw, S, O, Ln, D, K };
// Flame-lock fringe (manes, tufts, flames): base ring radius R around (cx,cy) from angle a0 to a1 (deg, clockwise),
// n locks of height h; curl shifts each tip toward a1 (fraction of a step). Closed through the centre.
function fringe(cx, cy, R, a0, a1, n, h, curl = 0.35, ry = R) {
  const P = (a, r, rr = r * ry / R) => [cx + r * Math.cos(deg(a)), cy + rr * Math.sin(deg(a))];
  const st = (a1 - a0) / n; let d = `M${f(cx)} ${f(cy)}L${P(a0, R).map(f).join(' ')}`;
  for (let i = 0; i < n; i++) {
    const a = a0 + i * st, b = a + st, ta = a + st * (0.5 + curl), tip = P(ta, R + h, ry + h);
    const c1 = P(a - st * 0.15, R + h * 0.75, ry + h * 0.75), c2 = P(ta - st * 0.45, R + h * 1.02, ry + h * 1.02);
    const c3 = P(ta + st * 0.05, R + h * 0.55, ry + h * 0.55), end = P(b, R, ry);
    d += `C${c1.map(f).join(' ')} ${c2.map(f).join(' ')} ${tip.map(f).join(' ')}Q${c3.map(f).join(' ')} ${end.map(f).join(' ')}`;
  }
  return d + 'Z';
}
module.exports.fringe = fringe;
