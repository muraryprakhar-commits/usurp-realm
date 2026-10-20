/* Turns an element list (see kit.js) into emblem markup fitted into the shield's charge area.
   Element types: S silhouette, O silhouette with a thin outline, U union group (one outlined shape made of several paths),
   L line drawn as a filled band of width w, D detail line, K dark fill (eyes, nostrils, mouths). */
const { Resvg } = require('@resvg/resvg-js');
const ST = '#1a0e05';
function flat(els) { return els.flatMap(e => e.t === 'U' ? e.ds.map(d => ({ t: 'S', d })) : [e]); }
function bboxOf(els) {
  const inner = flat(els).filter(e => e.t !== 'D' && e.t !== 'K')
    .map(e => e.t === 'L' ? `<path d="${e.d}" fill="none" stroke="#000" stroke-width="${e.w}" stroke-linecap="round"/>` : `<path d="${e.d}"/>`).join('');
  return new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><g fill="#000">${inner}</g></svg>`).getBBox();
}
// o: w x h box (shield units) centred on (cx, cy); ow outline and dw detail-line widths in shield units
function make(els, o = {}) {
  const b = bboxOf(els), W = o.w || 54, H = o.h || 62, cx = o.cx || 50, cy = o.cy || 60;
  const s = Math.min(W / b.width, H / b.height), tx = cx - s * (b.x + b.width / 2), ty = cy - s * (b.y + b.height / 2);
  const ow = (o.ow || 1.0) / s, dw = (o.dw || 0.5) / s, n = v => +v.toFixed(2), p = d => `<path d="${d}"/>`;
  let back = '', art = '';
  for (const e of els) {
    if (e.t === 'S' || e.t === 'O') back += p(e.d);
    if (e.t === 'U') back += e.ds.map(p).join('');
    if (e.t === 'L') back += `<path d="${e.d}" fill="none" stroke-width="${n(e.w + 2 * ow)}"/>`;
  }
  for (const e of els) {
    if (e.t === 'S') art += p(e.d);
    if (e.t === 'O') art += `<path d="${e.d}" stroke="${ST}" stroke-width="${n(dw)}"/>`;
    if (e.t === 'U') art += `<g fill="${ST}" stroke="${ST}" stroke-width="${n(2 * dw)}">${e.ds.map(p).join('')}</g>${e.ds.map(p).join('')}`;
    if (e.t === 'L') art += `<path d="${e.d}" fill="none" stroke="currentColor" stroke-width="${n(e.w)}"/>`;
    if (e.t === 'D') art += `<path d="${e.d}" fill="none" stroke="${ST}" stroke-width="${n((e.w || 1) * dw)}"/>`;
    if (e.t === 'K') art += `<path d="${e.d}" fill="${ST}"/>`;
  }
  return { m: [n(s), n(tx), n(ty)], ow: n(2 * ow), back, art };
}
module.exports = { make };
