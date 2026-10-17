/* Usurp: the living map homepage and the Court cutaway. Uses helpers from app.js. All people shown are illustrative. */
(() => {
const MW = 1600, MH = 1000, CASTLE = [800, 500];
const R = rng(21);
const pick = a => a[Math.floor(R() * a.length)];
const f1 = n => n.toFixed(1);

function smooth(pts, closed = true) {
  const n = pts.length, P = i => pts[(i + n) % n];
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = closed ? P(i - 1) : pts[Math.max(i - 1, 0)], p1 = P(i), p2 = P(i + 1), p3 = closed ? P(i + 2) : pts[Math.min(i + 2, n - 1)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
const COAST = [[180,210],[300,120],[470,95],[640,125],[780,85],[960,100],[1130,72],[1300,120],[1420,210],[1470,340],[1440,470],[1490,590],[1430,720],[1330,830],[1180,900],[1000,930],[820,905],[650,935],[480,900],[330,830],[220,730],[150,600],[170,470],[120,350]];
const LAND = smooth(COAST);
const ISLES = [smooth([[1500,780],[1560,800],[1575,860],[1520,890],[1480,840]]), smooth([[60,840],[120,820],[150,880],[100,930],[50,900]])];
const PLACES = {
  crown: [800, 500], calder: [430, 235], vire: [1170, 235], raske: [300, 490],
  aldane: [1335, 520], hollen: [830, 770], morrow: [420, 760], vacant: [1170, 790],
};
const TINT = { crown: '#d4af5a' };

function mountain(x, y, s) {
  return `<g><path d="M${x - 26 * s} ${y}L${x} ${y - 38 * s}L${x + 26 * s} ${y}Z" fill="#7d6d58"/><path d="M${x} ${y - 38 * s}L${x + 26 * s} ${y}L${x + 4 * s} ${y}Z" fill="#5b4e3e"/><path d="M${x - 9 * s} ${y - 25 * s}L${x} ${y - 38 * s}L${x + 9 * s} ${y - 25 * s}L${x + 4 * s} ${y - 28 * s}L${x} ${y - 24 * s}L${x - 4 * s} ${y - 28 * s}Z" fill="#ece3cf"/></g>`;
}
function tree(x, y, s, dark) {
  const c = dark ? pick(['#2f3a22', '#344226', '#2a331f']) : pick(['#4a5a2e', '#556536', '#3f4e28']);
  return `<g><rect x="${f1(x - .8 * s)}" y="${f1(y - 3 * s)}" width="${f1(1.6 * s)}" height="${f1(3 * s)}" fill="#4a3520"/><path d="M${f1(x - 5 * s)} ${f1(y - 2 * s)}L${f1(x)} ${f1(y - 14 * s)}L${f1(x + 5 * s)} ${f1(y - 2 * s)}Z" fill="${c}"/></g>`;
}
function hut(x, y, s = 1) {
  const roof = pick(['#8a3b22', '#6e4a2a', '#9a5a2c', '#5a3a26']);
  return `<g><rect x="${x - 6 * s}" y="${y - 7 * s}" width="${12 * s}" height="${7 * s}" fill="#d8c49a" stroke="#4a3520" stroke-width=".6"/><path d="M${x - 8 * s} ${y - 7 * s}L${x} ${y - 14 * s}L${x + 8 * s} ${y - 7 * s}Z" fill="${roof}" stroke="#3b2a18" stroke-width=".6"/><rect x="${x - 1.5 * s}" y="${y - 4 * s}" width="${3 * s}" height="${4 * s}" fill="#3b2a18"/></g>`;
}
function village(x, y, n, smoke = true) {
  let g = '';
  for (let i = 0; i < n; i++) g += hut(x + (R() - .5) * 60, y + (R() - .5) * 34, .9 + R() * .4);
  if (smoke) g += `<g class="smoke">${[0, 1, 2].map(i => `<circle cx="${x + 4}" cy="${y - 14}" r="3" fill="#e8e0d0" style="animation-delay:${i * 1.3}s"/>`).join('')}</g>`;
  return g;
}
function flag(x, y, h, s = 1) {
  const [c1, c2] = h.c;
  return `<g><path d="M${x} ${y}V${y - 34 * s}" stroke="#3b2a18" stroke-width="${1.6 * s}"/><g class="flag"><path d="M${x} ${y - 34 * s}h${20 * s}l-5 ${6 * s} 5 ${6 * s}h-${20 * s}z" fill="${c1}" stroke="#1a0e05" stroke-width=".6"/><path d="M${x} ${y - 28.5 * s}h${16 * s}" stroke="${c2}" stroke-width="${2.2 * s}"/></g></g>`;
}
function keep(id) {
  const h = H[id], [x, y] = PLACES[id];
  if (h.vacant) {
    return `<g class="place" data-id="${id}" tabindex="0" role="button" aria-label="The Free Marches, unclaimed land held for a patron House"><circle cx="${x}" cy="${y - 12}" r="44" fill="transparent"/><path d="M${x - 22} ${y}v-18h8v-6h6v6h16v-6h6v6h8v18z" fill="none" stroke="#5a4127" stroke-width="2" stroke-dasharray="4 3"/><text x="${x}" y="${y - 30}" text-anchor="middle" font-family="Cinzel Decorative,serif" font-size="22" fill="#5a4127">?</text><text class="lbl" x="${x}" y="${y + 22}">Unclaimed</text></g>`;
  }
  const roof = h.c[0];
  return `<g class="place" data-id="${id}" tabindex="0" role="button" aria-label="${h.seat}, seat of ${h.name}">
  <circle cx="${x}" cy="${y - 14}" r="46" fill="transparent"/>
  <ellipse cx="${x}" cy="${y + 2}" rx="34" ry="7" fill="#000" opacity=".18"/>
  <g fill="#5e5145" stroke="#2c241c" stroke-width="1"><rect x="${x - 22}" y="${y - 22}" width="44" height="22"/><rect x="${x - 30}" y="${y - 34}" width="12" height="34"/><rect x="${x + 18}" y="${y - 34}" width="12" height="34"/><rect x="${x - 9}" y="${y - 46}" width="18" height="46"/></g>
  <g fill="${roof}" stroke="#1a0e05" stroke-width=".8"><path d="M${x - 33} ${y - 34}L${x - 24} ${y - 50}L${x - 15} ${y - 34}Z"/><path d="M${x + 15} ${y - 34}L${x + 24} ${y - 50}L${x + 33} ${y - 34}Z"/><path d="M${x - 12} ${y - 46}L${x} ${y - 66}L${x + 12} ${y - 46}Z"/></g>
  <path d="M${x - 5} ${y}v-9a5 5 0 0110 0v9z" fill="#1d1712"/>
  <rect class="win" x="${x - 2}" y="${y - 40}" width="4" height="7" rx="2" fill="#ffc46b"/>
  ${flag(x, y - 66, h, .9)}
  <text class="lbl" x="${x}" y="${y + 22}">${h.seat}</text></g>`;
}
function royalCastle() {
  const [x, y] = CASTLE, v = H.vire, c = H.crown;
  const tw = (tx, ty, w, hgt, roofH, col = '#6b5d4e') => `<rect x="${tx - w / 2}" y="${ty - hgt}" width="${w}" height="${hgt}" fill="${col}" stroke="#2c241c" stroke-width="1.2"/><path d="M${tx - w / 2 - 4} ${ty - hgt}L${tx} ${ty - hgt - roofH}L${tx + w / 2 + 4} ${ty - hgt}Z" fill="#5a0b16" stroke="#1a0e05" stroke-width="1"/><circle cx="${tx}" cy="${ty - hgt - roofH}" r="2.4" fill="#f3dc92"/>`;
  const cren = (x0, y0, w, n) => Array.from({ length: n }, (_, i) => `<rect x="${x0 + i * w / n}" y="${y0 - 6}" width="${w / n * .55}" height="6" fill="#6b5d4e" stroke="#2c241c" stroke-width=".6"/>`).join('');
  return `<g class="place royal" data-id="crown" tabindex="0" role="button" aria-label="The royal castle. Enter the Court">
  <circle class="royal-ring" cx="${x}" cy="${y - 30}" r="120" fill="none" stroke="#f3dc92" stroke-width="2"/>
  <circle cx="${x}" cy="${y - 30}" r="118" fill="url(#royalGlow)"/>
  <ellipse cx="${x}" cy="${y + 26}" rx="118" ry="30" fill="#2f5a62" stroke="#1d3a40" stroke-width="2"/>
  <ellipse cx="${x}" cy="${y + 22}" rx="104" ry="24" fill="#8a7a55"/>
  <path d="M${x - 92} ${y + 20}V${y - 20}H${x + 92}V${y + 20}Z" fill="#6b5d4e" stroke="#2c241c" stroke-width="1.4"/>${cren(x - 92, y - 20, 184, 18)}
  ${tw(x - 92, y + 20, 26, 62, 26)}${tw(x + 92, y + 20, 26, 62, 26)}
  <g fill="#7a6b5a" stroke="#2c241c" stroke-width="1.2"><rect x="${x - 58}" y="${y - 70}" width="116" height="52"/></g>${cren(x - 58, y - 70, 116, 12)}
  ${tw(x - 46, y - 18, 22, 92, 30, '#7a6b5a')}${tw(x + 46, y - 18, 22, 92, 30, '#7a6b5a')}
  ${tw(x, y - 18, 40, 128, 48, '#84735f')}
  <path d="M${x - 16} ${y + 20}v-22a16 16 0 0132 0v22z" fill="#1d1712"/><path d="M${x - 16} ${y + 20}v-22a16 16 0 0132 0v22" fill="none" stroke="#2c241c" stroke-width="1.5"/>
  <path d="M${x - 14} ${y + 4}h28M${x - 14} ${y + 10}h28M${x - 7} ${y - 12}v32M${x} ${y - 16}v36M${x + 7} ${y - 12}v32" stroke="#6b5d4e" stroke-width="1.6"/>
  ${[[x - 6, y - 118], [x + 6, y - 118], [x - 6, y - 92], [x + 6, y - 92], [x - 50, y - 90], [x + 50, y - 90], [x - 92, y - 22], [x + 92, y - 22], [x - 30, y - 50], [x + 30, y - 50]].map(([wx, wy], i) => `<rect class="win" x="${wx - 2.5}" y="${wy}" width="5" height="10" rx="2.5" fill="#ffc46b" style="animation-delay:${i * .37}s"/>`).join('')}
  ${flag(x, y - 194, c, 1.4)}${flag(x - 46, y - 140, v, 1)}${flag(x + 46, y - 140, H.calder, 1)}
  <g class="enter-tag"><rect x="${x - 96}" y="${y + 58}" width="192" height="30" rx="15" fill="#1b1410" stroke="#d4af5a" stroke-width="1.5"/><text x="${x}" y="${y + 78}" text-anchor="middle" font-family="Cinzel,serif" font-weight="700" font-size="13" letter-spacing="2" fill="#f3dc92">ENTER THE COURT ▸</text></g>
  </g>`;
}
const roadD = (a, b, bend) => { const mx = (a[0] + b[0]) / 2 + bend[0], my = (a[1] + b[1]) / 2 + bend[1]; return `M${a[0]} ${a[1]}Q${mx} ${my} ${b[0]} ${b[1]}`; };
function peasantSprite(col) {
  return `<g><circle cx="0" cy="-8" r="2.2" fill="#e0b894"/><path d="M-2.6 0L-2 -6H2L2.6 0Z" fill="${col}"/><path d="M3 -7V1" stroke="#5a3d1c" stroke-width=".8"/></g>`;
}
function cartSprite() {
  return `<g><rect x="-7" y="-8" width="12" height="6" fill="#8a5a2c" stroke="#3b2a18" stroke-width=".6"/><path d="M-6 -8Q-1 -13 4 -8" fill="#d8c49a"/><circle cx="-4" cy="-1.5" r="2" fill="#3b2a18"/><circle cx="2" cy="-1.5" r="2" fill="#3b2a18"/><path d="M5 -5h4" stroke="#3b2a18"/><ellipse cx="11" cy="-5" rx="3" ry="2" fill="#6e4a2a"/></g>`;
}
function ship(h) {
  return `<g><path d="M-16 0H16L10 7H-10Z" fill="#5a3a20" stroke="#2a1a0e" stroke-width=".8"/><path d="M0 0V-26" stroke="#2a1a0e" stroke-width="1.2"/><path d="M1 -24Q12 -14 1 -4Z" fill="#efe3c6" stroke="#6e5a3a" stroke-width=".6"/><path d="M-1 -22Q-10 -14 -1 -6Z" fill="#efe3c6" stroke="#6e5a3a" stroke-width=".6"/><path d="M0 -26h8l-2 2 2 2H0" fill="${h.c[0]}"/></g>`;
}
function realmSVG() {
  let trees = '', mts = '', fields = '', villages = '';
  const forest = (cx, cy, r, n, dark) => { for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r; const x = cx + Math.cos(a) * d * 1.3, y = cy + Math.sin(a) * d * .8; if (Object.values(PLACES).some(([px, py]) => Math.hypot(px - x, py - y) < 58)) continue; trees += tree(x, y, 1.1 + R() * .6, dark); } };
  forest(300, 470, 130, 170, true); forest(590, 330, 60, 40); forest(1040, 640, 70, 50); forest(1250, 380, 55, 36); forest(560, 860, 50, 30); forest(1080, 420, 40, 20);
  const peaks = [];
  for (let i = 0; i < 26; i++) peaks.push([230 + R() * 420, 150 + R() * 90, .8 + R() * .7]);
  for (let i = 0; i < 22; i++) peaks.push([760 + R() * 300, 140 + R() * 80, .7 + R() * .8]);
  for (let i = 0; i < 12; i++) peaks.push([1300 + R() * 130, 280 + R() * 120, .6 + R() * .6]);
  peaks.filter(([x, y]) => !Object.values(PLACES).some(([px, py]) => Math.hypot(px - x, py - y) < 60)).sort((a, b) => a[1] - b[1]).forEach(([x, y, s]) => mts += mountain(x, y, s));
  const patch = (cx, cy, n) => { for (let i = 0; i < n; i++) { const x = cx + (R() - .5) * 170, y = cy + (R() - .5) * 90; fields += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(26 + R() * 30)}" height="${f1(14 + R() * 16)}" transform="rotate(${f1((R() - .5) * 30)} ${f1(x)} ${f1(y)})" fill="${pick(['#b8a55e', '#9aa05a', '#c9b56a', '#8f9a52', '#a89a4e'])}" opacity=".7" stroke="#7a6a3a" stroke-width=".5"/>`; } };
  patch(700, 640, 16); patch(930, 620, 12); patch(640, 420, 8); patch(950, 400, 8); patch(1180, 640, 10); patch(560, 620, 8);
  villages = village(680, 610, 6) + village(960, 600, 5) + village(620, 400, 4, false) + village(990, 380, 5) + village(1160, 660, 5) + village(540, 650, 4, false) + village(360, 640, 4) + village(1050, 800, 3, false);
  const bends = { calder: [-30, 40], vire: [40, 30], raske: [10, -40], aldane: [0, -50], hollen: [-40, 0], morrow: [30, 40], vacant: [20, -40] };
  const roads = Object.keys(bends).map(id => ({ id, d: roadD(CASTLE, PLACES[id], bends[id]) }));
  const walkers = roads.map(r => [0, 1, 2].map(k => {
    const sprite = k === 2 ? cartSprite() : peasantSprite(pick(['#6e4a2a', '#5a5a3a', '#7a5a3a', '#4a4a4a']));
    const dur = 50 + R() * 40;
    return `<g>${sprite}<animateMotion dur="${f1(dur)}s" repeatCount="indefinite" begin="-${f1(R() * dur)}s" keyPoints="${k % 2 ? '1;0' : '0;1'}" keyTimes="0;1" calcMode="linear"><mpath href="#road-${r.id}"/></animateMotion></g>`;
  }).join('')).join('');
  const river = smooth([[880, 150], [860, 260], [835, 350], [760, 430], [700, 480], [720, 560], [790, 620], [800, 700], [870, 830], [900, 935]], false);
  const river2 = smooth([[1280, 180], [1230, 300], [1160, 420], [1060, 520], [930, 540], [880, 520]], false);
  const tints = Object.entries(PLACES).map(([id, [x, y]]) => `<circle cx="${x}" cy="${y}" r="${id === 'crown' ? 200 : 240}" fill="url(#tint-${id})"/>`).join('');
  const tintDefs = Object.entries(PLACES).map(([id]) => { const col = TINT[id] || H[id].c[0]; return `<radialGradient id="tint-${id}"><stop offset="0" stop-color="${col}" stop-opacity="${id === 'vacant' ? .12 : .32}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`; }).join('');
  const regionLbl = Object.entries(PLACES).map(([id, [x, y]]) => { const off = { crown: [0, 150], calder: [0, -95], vire: [0, -95], raske: [0, 140], aldane: [-10, 110], hollen: [0, 70], morrow: [0, 80], vacant: [0, 70] }[id]; return `<text class="region-lbl" x="${x + off[0]}" y="${y + off[1]}">${H[id].region.toUpperCase()}</text>`; }).join('');
  const waves = Array.from({ length: 60 }, () => { const x = R() * MW, y = R() * MH; return `<path d="M${f1(x)} ${f1(y)}q7 -5 14 0t14 0" fill="none" stroke="#9fc2c4" stroke-width="1.2" opacity=".35"/>`; }).join('');
  const clouds = [[200, 300, 60], [900, 150, 80], [1300, 700, 70], [500, 880, 55], [1100, 520, 50]].map(([x, y, s], i) => `<g class="cloud" style="animation-duration:${90 + i * 20}s;animation-delay:-${i * 17}s"><ellipse cx="${x}" cy="${y}" rx="${s * 1.6}" ry="${s * .5}" fill="#fff"/><ellipse cx="${x + s * .5}" cy="${y - s * .25}" rx="${s}" ry="${s * .45}" fill="#fff"/></g>`).join('');
  const shipPaths = [smooth([[60, 500], [100, 250], [300, 60], [700, 40], [1000, 40]], false), smooth([[1580, 300], [1560, 600], [1450, 900], [1100, 975], [700, 980]], false)];
  return `<svg class="realm-svg" viewBox="0 0 ${MW} ${MH}" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Map of the Kingdom of Usurp. Drag to explore, select a castle for details.">
  <defs>
  <radialGradient id="sea" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#2f5d66"/><stop offset=".7" stop-color="#1c3b44"/><stop offset="1" stop-color="#0f2429"/></radialGradient>
  <radialGradient id="landG" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#c9b985"/><stop offset=".7" stop-color="#b4a36d"/><stop offset="1" stop-color="#9c8a58"/></radialGradient>
  <radialGradient id="royalGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx=".5" cy=".5" r=".72"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  <clipPath id="landClip"><path d="${LAND}"/></clipPath>${tintDefs}
  </defs>
  <rect width="${MW}" height="${MH}" fill="url(#sea)"/>${waves}
  <path d="${LAND}" fill="none" stroke="#6fa3a3" stroke-width="44" opacity=".25" stroke-linejoin="round"/>
  <path d="${LAND}" fill="none" stroke="#8fbcb8" stroke-width="18" opacity=".3" stroke-linejoin="round"/>
  ${ISLES.map(d => `<path d="${d}" fill="#b4a36d" stroke="#3b2a18" stroke-width="2"/>`).join('')}
  <path d="${LAND}" fill="url(#landG)" stroke="#3b2a18" stroke-width="3"/>
  <g clip-path="url(#landClip)">${tints}${fields}
  <ellipse cx="360" cy="700" rx="46" ry="24" fill="#3f6f74" stroke="#2a4a4e" stroke-width="2"/><ellipse cx="480" cy="830" rx="36" ry="18" fill="#3f6f74" stroke="#2a4a4e" stroke-width="2"/><ellipse cx="300" cy="790" rx="22" ry="12" fill="#3f6f74"/>
  <path d="${river}" fill="none" stroke="#2f5d66" stroke-width="7" stroke-linecap="round"/><path d="${river}" fill="none" stroke="#6fa3a3" stroke-width="2.4" stroke-linecap="round"/>
  <path d="${river2}" fill="none" stroke="#2f5d66" stroke-width="5" stroke-linecap="round"/><path d="${river2}" fill="none" stroke="#6fa3a3" stroke-width="1.8" stroke-linecap="round"/>
  ${roads.map(r => `<path id="road-${r.id}" d="${r.d}" fill="none" stroke="#7a5a32" stroke-width="3.4" stroke-dasharray="7 5" opacity=".85"/>`).join('')}
  </g>
  <g>${mts}</g><g>${trees}</g><g>${villages}</g>
  <g class="walkers">${walkers}</g>
  ${shipPaths.map((d, i) => `<path id="sea-${i}" d="${d}" fill="none"/><g>${ship(i ? H.aldane : H.morrow)}<animateMotion dur="${120 + i * 40}s" repeatCount="indefinite" begin="-${i * 30}s"><mpath href="#sea-${i}"/></animateMotion></g>`).join('')}
  <g class="serpent" transform="translate(1440 930)"><path d="M-60 0q15 -30 30 0t30 0t30 0" fill="none" stroke="#2a4a3e" stroke-width="9" stroke-linecap="round"/><path d="M28 -2q10 -26 22 -18q6 4 0 12" fill="#2a4a3e"/><circle cx="46" cy="-15" r="1.6" fill="#ffcf5a"/><text x="-20" y="34" text-anchor="middle" font-family="IM Fell English,serif" font-style="italic" font-size="17" fill="#cfe0dc" opacity=".8">Here be Usurpers</text></g>
  ${regionLbl}
  ${['calder', 'vire', 'raske', 'aldane', 'hollen', 'morrow', 'vacant'].map(keep).join('')}
  ${royalCastle()}
  <g class="clouds" pointer-events="none">${clouds}</g>
  <g pointer-events="none">
  <g transform="translate(40 26)"><path d="M0 8Q0 0 10 0H330Q340 0 340 8V70Q340 78 330 78H10Q0 78 0 70Z" fill="#e9d9b4" stroke="#6e4f25" stroke-width="2"/><rect x="-8" y="-4" width="12" height="86" rx="6" fill="#8a6a3a"/><rect x="336" y="-4" width="12" height="86" rx="6" fill="#8a6a3a"/><text x="170" y="30" text-anchor="middle" font-family="Cinzel,serif" font-size="13" letter-spacing="4" fill="#7a1020">THE KINGDOM OF</text><text x="170" y="64" text-anchor="middle" font-family="Cinzel Decorative,serif" font-weight="900" font-size="34" letter-spacing="3" fill="#2a1a0e">USURP</text></g>
  <g transform="translate(1500 110)"><circle r="46" fill="#e9d9b4" opacity=".15" stroke="#e9d9b4" stroke-width="1.5"/><circle r="36" fill="none" stroke="#e9d9b4" stroke-width=".8" opacity=".6"/><path d="M0 -52L7 0L0 52L-7 0Z" fill="#a3182c"/><path d="M-52 0L0 7L52 0L0 -7Z" fill="#e9d9b4"/><text y="-58" text-anchor="middle" font-family="Cinzel,serif" font-size="14" fill="#e9d9b4">N</text></g>
  <rect x="6" y="6" width="${MW - 12}" height="${MH - 12}" fill="none" stroke="#d4af5a" stroke-width="3"/><rect x="14" y="14" width="${MW - 28}" height="${MH - 28}" fill="none" stroke="#8a6a24" stroke-width="1"/>
  <rect width="${MW}" height="${MH}" fill="url(#vig)"/>
  </g></svg>`;
}

const SKIN = ['#f1d3b3', '#e8c4a0', '#c99a72', '#a8734f', '#8d5a3b', '#5e3a24'];
function person(x, y, s, o) {
  const skin = o.skin || pick(SKIN), hair = o.hair || pick(['#2a1a0e', '#5a3a1a', '#8a6a3a', '#c9a060', '#6e6e6e', '#1a1a1a']);
  const k = o.kneel ? .72 : 1, bh = 38 * s * k, top = y - bh, hy = top - 7 * s;
  let g = `<ellipse cx="${x}" cy="${y + 1}" rx="${14 * s}" ry="${3 * s}" fill="#000" opacity=".3"/>`;
  if (o.spear) g += `<path d="M${x + 15 * s} ${y}V${y - 78 * s}" stroke="#5a3d1c" stroke-width="${2 * s}"/><path d="M${x + 15 * s} ${y - 86 * s}l${3 * s} ${8 * s}h-${6 * s}z" fill="#c8c8c8"/>`;
  if (o.cape) g += `<path d="M${x - 13 * s} ${top + 2 * s}Q${x - 19 * s} ${y - 8 * s} ${x - 16 * s} ${y}H${x + 16 * s}Q${x + 19 * s} ${y - 8 * s} ${x + 13 * s} ${top + 2 * s}Z" fill="${o.cape}"/>`;
  g += `<path d="M${x - 12 * s} ${y}Q${x - 14 * s} ${y - bh * .5} ${x - 8 * s} ${top}H${x + 8 * s}Q${x + 14 * s} ${y - bh * .5} ${x + 12 * s} ${y}Z" fill="${o.robe}"/>`;
  if (o.trim) g += `<path d="M${x - 12 * s} ${y - 3 * s}H${x + 12 * s}" stroke="${o.trim}" stroke-width="${3 * s}"/><path d="M${x} ${top}V${y}" stroke="${o.trim}" stroke-width="${1.6 * s}"/>`;
  if (o.ermine) g += `<path d="M${x - 9 * s} ${top + 1}Q${x} ${top + 9 * s} ${x + 9 * s} ${top + 1}" stroke="#f5f0e6" stroke-width="${4 * s}" fill="none"/>` + [-5, 0, 5].map(dx => `<circle cx="${x + dx * s}" cy="${top + 4 * s}" r="${.7 * s}" fill="#111"/>`).join('');
  if (o.belt) g += `<rect x="${x - 9 * s}" y="${y - bh * .55}" width="${18 * s}" height="${2.2 * s}" fill="${o.belt}"/>`;
  g += `<circle cx="${x - 10 * s}" cy="${y - bh * .45}" r="${2.4 * s}" fill="${skin}"/><circle cx="${x + 10 * s}" cy="${y - bh * .45}" r="${2.4 * s}" fill="${skin}"/>`;
  if (o.shield) g += `<g transform="translate(${x - 18 * s} ${y - bh * .7}) scale(${.16 * s})">${crest(o.shield).replace(/<svg[^>]*>/, '<g>').replace('</svg>', '</g>')}</g>`;
  g += `<circle cx="${x}" cy="${hy}" r="${7 * s}" fill="${skin}"/>`;
  switch (o.head) {
    case 'hood': g += `<path d="M${x - 8.5 * s} ${hy + 5 * s}Q${x - 9 * s} ${hy - 10 * s} ${x} ${hy - 9 * s}Q${x + 9 * s} ${hy - 10 * s} ${x + 8.5 * s} ${hy + 5 * s}Q${x + 6 * s} ${hy - 4 * s} ${x} ${hy - 4 * s}Q${x - 6 * s} ${hy - 4 * s} ${x - 8.5 * s} ${hy + 5 * s}Z" fill="${o.hood || '#6e4a2a'}"/>`; break;
    case 'helm': g += `<path d="M${x - 7.5 * s} ${hy + 1 * s}Q${x - 8 * s} ${hy - 9 * s} ${x} ${hy - 9 * s}Q${x + 8 * s} ${hy - 9 * s} ${x + 7.5 * s} ${hy + 1 * s}Z" fill="#9aa0a6" stroke="#4a4f55" stroke-width=".6"/><rect x="${x - .8 * s}" y="${hy - 1 * s}" width="${1.6 * s}" height="${6 * s}" fill="#6a7076"/>`; break;
    case 'crown': g += `<path d="M${x - 7 * s} ${hy - 5 * s}l${-1 * s} ${-9 * s}l${4 * s} ${4 * s}l${4 * s} ${-7 * s}l${4 * s} ${7 * s}l${4 * s} ${-4 * s}l${-1 * s} ${9 * s}z" fill="#e2bf62" stroke="#6e521b" stroke-width=".7"/><circle cx="${x}" cy="${hy - 8 * s}" r="${1.3 * s}" fill="#b3242f"/>`; g = g.replace(`r="${7 * s}" fill="${skin}"/>`, `r="${7 * s}" fill="${skin}"/><path d="M${x - 7.5 * s} ${hy}Q${x - 8 * s} ${hy + 10 * s} ${x - 5 * s} ${hy + 12 * s}M${x + 7.5 * s} ${hy}Q${x + 8 * s} ${hy + 10 * s} ${x + 5 * s} ${hy + 12 * s}" stroke="${hair}" stroke-width="${3 * s}" fill="none"/>`); break;
    case 'coronet': g += `<path d="M${x - 7 * s} ${hy - 4 * s}h${14 * s}v${-2.5 * s}h${-14 * s}z" fill="#d4af5a"/>` + [-5, 0, 5].map(dx => `<circle cx="${x + dx * s}" cy="${hy - 8 * s}" r="${1.4 * s}" fill="${o.pearl ? '#f5efe0' : '#d4af5a'}"/>`).join(''); g += `<path d="M${x - 7 * s} ${hy - 2 * s}Q${x} ${hy - 11 * s} ${x + 7 * s} ${hy - 2 * s}" fill="${hair}"/>`; break;
    default: g += `<path d="M${x - 7 * s} ${hy - 1 * s}Q${x} ${hy - 12 * s} ${x + 7 * s} ${hy - 1 * s}" fill="${hair}"/>`;
  }
  if (o.pitchfork) g += `<path d="M${x + 13 * s} ${y}V${y - 56 * s}" stroke="#7a5a32" stroke-width="${1.6 * s}"/><path d="M${x + 9 * s} ${y - 56 * s}v-${6 * s}M${x + 13 * s} ${y - 56 * s}v-${7 * s}M${x + 17 * s} ${y - 56 * s}v-${6 * s}M${x + 9 * s} ${y - 56 * s}h${8 * s}" stroke="#8a8a8a" stroke-width="${1 * s}"/>`;
  if (o.coin) g += `<circle cx="${x + 10 * s}" cy="${y - bh * .45 - 4 * s}" r="${2.6 * s}" fill="#f3dc92" stroke="#8a6a24" stroke-width=".6"/>`;
  if (o.scepter) g += `<path d="M${x + 11 * s} ${y - bh * .45}V${y - bh - 20 * s}" stroke="#d4af5a" stroke-width="${1.8 * s}"/><circle cx="${x + 11 * s}" cy="${y - bh - 22 * s}" r="${3 * s}" fill="#f3dc92" stroke="#8a6a24"/>`;
  const idle = o.idle ? ` style="animation-delay:-${f1(R() * 4)}s"` : '';
  return `<g class="fig${o.idle ? ' idle' : ''}" tabindex="0" data-n="${o.name}" data-r="${o.role}"${idle}><title>${o.name}. ${o.role}</title>${g}</g>`;
}
function noble(h, rankHead, name, title, x, y, s) {
  return person(x, y, s, { robe: h.c[0], trim: h.c[1] === '#d9d9d9' ? '#e8e8e8' : h.c[1], cape: '#2a1a0e', head: rankHead, pearl: true, belt: '#d4af5a', name, role: `${title}, ${h.name}`, idle: true });
}
const unwrap = s => s.replace(/<svg[^>]*>/, '<g>').replace(/<\/svg>$/, '</g>');
function courtSVG() {
  const W = 900, Hh = 1120, cx = 450;
  const tier = (y, w, label) => `<path d="M${cx - w / 2} ${y}L${cx - w / 2 + 14} ${y - 16}H${cx + w / 2 - 14}L${cx + w / 2} ${y}Z" fill="#6e6255"/><rect x="${cx - w / 2}" y="${y}" width="${w}" height="26" fill="#4a4036" stroke="#2a221a"/><text x="${cx - w / 2 + 16}" y="${y + 18}" font-family="Cinzel,serif" font-weight="700" font-size="12" letter-spacing="3" fill="#d4af5a">${label}</text>`;
  const T = [
    { y: 450, w: 380, label: 'DUKES' }, { y: 560, w: 520, label: 'MARQUESSES' }, { y: 670, w: 660, label: 'EARLS' },
    { y: 780, w: 800, label: 'VISCOUNTS &amp; BARONS' }, { y: 890, w: 880, label: 'KNIGHTS' },
  ];
  let g = `<rect width="${W}" height="${Hh}" fill="url(#hallWall)"/>`;
  for (let r = 0; r < 28; r++) for (let c = 0; c < 10; c++) g += `<rect x="${c * 100 - (r % 2) * 50}" y="${r * 40}" width="98" height="38" fill="none" stroke="#000" stroke-opacity=".18"/>`;
  [[190, 50], [710, 50]].forEach(([x, y]) => { g += `<path d="M${x - 40} ${y + 230}V${y + 50}Q${x - 40} ${y} ${x} ${y}Q${x + 40} ${y} ${x + 40} ${y + 50}V${y + 230}Z" fill="#1b2340" stroke="#6b5d4e" stroke-width="6"/><path d="M${x} ${y}V${y + 230}M${x - 40} ${y + 120}H${x + 40}" stroke="#6b5d4e" stroke-width="3"/><path d="M${x - 40} ${y + 230}L${x - 140 + (x > 450 ? 180 : 0)} ${y + 760}H${x + 60 + (x > 450 ? 180 : 0) - 100}L${x + 40} ${y + 230}Z" fill="url(#beam)" opacity=".5"/>`; });
  g += `<path d="M280 0H620V300Q450 340 280 300Z" fill="url(#drape)"/><path d="M280 300Q450 340 620 300" stroke="#d4af5a" stroke-width="4" fill="none"/>`;
  g += `<g transform="translate(410 70) scale(.8)">${charge('crown', '#d4af5a')}</g>`;
  [['vire', 120], ['calder', 790], ['morrow', 40], ['aldane', 860]].forEach(([id, x]) => g += `<g transform="translate(${x - 28} 20) scale(.7)">${unwrap(banner(H[id]))}</g>`);
  [['raske', 300], ['hollen', 600]].forEach(([id, x]) => g += `<g transform="translate(${x - 22} 330) scale(.55)">${unwrap(banner(H[id]))}</g>`);
  [300, 600].forEach(x => { g += `<path d="M${x} 0V60" stroke="#3b2a18" stroke-width="2"/><path d="M${x - 50} 70Q${x} 95 ${x + 50} 70" stroke="#8a6a24" stroke-width="4" fill="none"/>` + [-50, -25, 0, 25, 50].map(dx => `<rect x="${x + dx - 2}" y="${dx % 50 ? 72 : 60}" width="4" height="10" fill="#efe3c6"/><ellipse class="flame" cx="${x + dx}" cy="${dx % 50 ? 68 : 56}" rx="3" ry="6" fill="#ffc14a"/>`).join('') + `<circle cx="${x}" cy="80" r="70" fill="url(#candle)"/>`; });
  g += `<path d="M0 360H${W}V${Hh}H0Z" fill="url(#floor)"/>`;
  g += `<path d="M${cx - 60} 360L${cx - 170} ${Hh}H${cx + 170}L${cx + 60} 360Z" fill="#7a1020"/><path d="M${cx - 60} 360L${cx - 170} ${Hh}M${cx + 60} 360L${cx + 170} ${Hh}" stroke="#d4af5a" stroke-width="4"/>`;
  g += `<path d="M${cx - 170} 360L${cx - 150} 340H${cx + 150}L${cx + 170} 360Z" fill="#7a6b5a"/><rect x="${cx - 170}" y="360" width="340" height="24" fill="#554a3e"/>`;
  g += `<path d="M${cx - 55} 345V200Q${cx - 55} 150 ${cx} 130Q${cx + 55} 150 ${cx + 55} 200V345Z" fill="url(#gold)" stroke="#3b2a0c" stroke-width="3"/><path d="M${cx - 42} 300V206Q${cx - 42} 170 ${cx} 156Q${cx + 42} 170 ${cx + 42} 206V300Z" fill="#8f1426"/>`;
  g += `<circle cx="${cx}" cy="140" r="8" fill="#b3242f" stroke="#d4af5a" stroke-width="2"/><path d="M${cx - 70} 345V260a12 12 0 0124 0V345ZM${cx + 46} 345V260a12 12 0 0124 0V345Z" fill="url(#gold)" stroke="#3b2a0c" stroke-width="2"/>`;
  [60, 840].forEach(x => g += `<rect x="${x - 4}" y="420" width="8" height="40" fill="#3a2a18"/><ellipse class="flame" cx="${x}" cy="412" rx="8" ry="14" fill="#ffb14a"/><circle cx="${x}" cy="420" r="60" fill="url(#candle)"/>`);
  g += `<path d="M${cx - 110} ${Hh}V${Hh - 60}Q${cx - 110} ${Hh - 110} ${cx} ${Hh - 118}Q${cx + 110} ${Hh - 110} ${cx + 110} ${Hh - 60}V${Hh}Z" fill="#1a130d" stroke="#6b5d4e" stroke-width="8"/><path d="M${cx - 100} ${Hh}V${Hh - 60}Q${cx - 100} ${Hh - 100} ${cx} ${Hh - 108}Q${cx + 100} ${Hh - 100} ${cx + 100} ${Hh - 60}V${Hh}Z" fill="url(#outside)"/>`;
  T.forEach(t => g += tier(t.y, t.w, t.label));
  const P = [];
  P.push(person(cx - 130, 350, 1.25, { robe: '#3a3f46', cape: '#7a1020', head: 'helm', spear: true, shield: H.crown, name: 'Ser Brandt', role: 'Queen’s Guard' }));
  P.push(person(cx + 130, 350, 1.25, { robe: '#3a3f46', cape: '#7a1020', head: 'helm', spear: true, shield: H.crown, name: 'Ser Hale', role: 'Queen’s Guard' }));
  P.push(person(cx, 300, 1.7, { robe: '#8f1426', cape: '#5a0b16', trim: '#d4af5a', ermine: true, head: 'crown', scepter: true, skin: '#e8c4a0', hair: '#3a1a0e', name: 'Queen Isolde', role: 'Queen of Usurp, House Vire. Holds the throne until someone outspends her' }));
  const dukes = [['calder', 'Aurel Calder', 'Duke of the Northreach'], ['vire', 'Brannoc Vire', 'Duke of the Ashen March']];
  const marq = [['morrow', 'Sera Morrow', 'Marquess of the Sunken Vale'], ['aldane', 'Corvin Aldane', 'Marquess of the Gilded Coast'], ['calder', 'Idris Calder', 'Marquess of the High Passes']];
  const earls = [['raske', 'Mael Raske', 'Earl of the Thornwood'], ['hollen', 'Wren Hollen', 'Earl of the Riverlands'], ['aldane', 'Odo Aldane', 'Earl of Saltmere'], ['raske', 'Nessa Raske', 'Earl of Briarholt']];
  const lesser = [['vire', 'Tamsin Vire', 'Viscount'], ['hollen', 'Pell Hollen', 'Viscount'], ['morrow', 'Ash Morrow', 'Baron'], ['calder', 'Ilse Calder', 'Baroness'], ['aldane', 'Rook Aldane', 'Baron']];
  const row = (list, t, s, head) => { const gap = (t.w - 120) / list.length; list.forEach(([id, n, r], i) => { const x = cx - (t.w - 120) / 2 + gap * (i + .5); P.push(noble(H[id], head, n, r, x + (Math.abs(x - cx) < 40 ? (x < cx ? -38 : 38) : 0), t.y - 6, s)); }); };
  row(dukes, T[0], 1.15, 'coronet'); row(marq, T[1], 1.08, 'coronet'); row(earls, T[2], 1.02, 'coronet'); row(lesser, T[3], .96, 'coronet');
  ['vire', 'calder', 'morrow', 'aldane', 'raske', 'hollen'].forEach((id, i) => { const side = i < 3 ? -1 : 1, j = i % 3; P.push(person(cx + side * (230 + j * 80), T[4].y - 6, .98, { robe: '#5e646b', cape: H[id].c[0], head: 'helm', spear: true, shield: H[id], name: `Knight of ${H[id].name}`, role: 'Knight. Left the mud, but not by far', idle: true })); });
  const pnames = ['Wat the Miller', 'Old Maud', 'Hob', 'Tilly', 'Agnes the Weaver', 'Piers', 'Cobb the Smith', 'Ellie', 'Rafe', 'Nan', 'Gil', 'Dunstan', 'Bess', 'Osric'];
  const cols = ['#6e4a2a', '#5a5a3a', '#7a5a3a', '#4a4a4a', '#6a5a4a', '#5a4632', '#7a6a4a'];
  const spots = [[70, 985], [170, 985], [262, 985], [638, 985], [730, 985], [830, 985], [40, 1088], [128, 1088], [214, 1088], [296, 1088], [604, 1088], [686, 1088], [772, 1088], [860, 1088]];
  pnames.forEach((n, i) => { const [xx, yy] = spots[i]; P.push(person(xx, yy, .92, { robe: pick(cols), head: R() < .6 ? 'hood' : 'none', hood: pick(['#5a3d1c', '#6e5a3a', '#4a3a2a']), kneel: R() < .35, pitchfork: R() < .3, belt: '#3b2a18', name: n, role: 'Peasant. No title, no crest, no protection', idle: true })); });
  P.push(person(cx, 1010, 1, { robe: '#6e4a2a', head: 'hood', hood: '#4a3a2a', coin: true, belt: '#3b2a18', name: 'Joss', role: 'Peasant, one purchase away from rising. Could it be you?', idle: true }));
  g += P.join('');
  return `<svg class="court-svg" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="The Court of Usurp: the Queen on her throne, nobles ranked on the steps below, knights, and peasants at the doors">
  <defs>
  <linearGradient id="hallWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a241e"/><stop offset="1" stop-color="#15110d"/></linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3128"/><stop offset="1" stop-color="#211b15"/></linearGradient>
  <linearGradient id="drape" x1="0" x2="1"><stop offset="0" stop-color="#3a0710"/><stop offset=".5" stop-color="#8f1426"/><stop offset="1" stop-color="#3a0710"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".45" stop-color="#d4af5a"/><stop offset="1" stop-color="#6e521b"/></linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb4ff" stop-opacity=".35"/><stop offset="1" stop-color="#9fb4ff" stop-opacity="0"/></linearGradient>
  <radialGradient id="candle"><stop offset="0" stop-color="#ffb14a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb14a" stop-opacity="0"/></radialGradient>
  <linearGradient id="outside" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2340"/><stop offset="1" stop-color="#3a2a18"/></linearGradient>
  </defs>${g}</svg>`;
}

function init() {
  const wrap = document.querySelector('[data-realm]'); if (!wrap) return;
  const head = document.querySelector('.site-head');
  const setHH = () => document.documentElement.style.setProperty('--hh', (head ? head.offsetHeight : 60) + 'px');
  setHH(); addEventListener('resize', setHH);
  wrap.querySelector('[data-realm-map]').innerHTML = realmSVG();
  const svg = wrap.querySelector('.realm-svg');
  const info = wrap.querySelector('[data-realm-info]');
  const court = document.querySelector('[data-court-view]');
  document.body.appendChild(court);
  let v = { x: 0, y: 0, w: MW }, anim = null;
  const aspect = () => wrap.clientWidth / Math.max(1, wrap.clientHeight);
  const maxW = () => Math.min(MW, MH * aspect());
  const clamp = () => { const a = aspect(); v.w = Math.max(240, Math.min(maxW(), v.w)); const h = v.w / a; v.x = Math.max(0, Math.min(MW - v.w, v.x)); v.y = Math.max(0, Math.min(MH - h, v.y)); };
  const apply = () => { clamp(); svg.setAttribute('viewBox', `${f1(v.x)} ${f1(v.y)} ${f1(v.w)} ${f1(v.w / aspect())}`); };
  const centerOn = (px, py, w) => { const a = aspect(); v.w = w; v.x = px - w / 2; v.y = py - (w / a) / 2; apply(); };
  const home = () => centerOn(CASTLE[0], CASTLE[1] - 20, maxW());
  home();
  new ResizeObserver(() => { const cxp = v.x + v.w / 2, cyp = v.y + v.w / aspect() / 2; centerOn(cxp, cyp, Math.min(v.w, maxW())); }).observe(wrap);
  function animateTo(px, py, w, ms, done) {
    cancelAnimationFrame(anim);
    const a = aspect(), s = { ...v }, t0 = performance.now();
    const e = { w: Math.max(240, Math.min(maxW(), w)) }; e.x = px - e.w / 2; e.y = py - e.w / a / 2;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = now => {
      const k = reduce ? 1 : Math.min(1, (now - t0) / ms), q = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      v = { x: s.x + (e.x - s.x) * q, y: s.y + (e.y - s.y) * q, w: s.w + (e.w - s.w) * q }; apply();
      if (k < 1) anim = requestAnimationFrame(step); else done && done();
    };
    anim = requestAnimationFrame(step);
  }
  const zoomBy = (f, px, py) => {
    const a = aspect(), h = v.w / a; px ??= v.x + v.w / 2; py ??= v.y + h / 2;
    const nw = Math.max(240, Math.min(maxW(), v.w * f)), r = nw / v.w;
    v.x = px - (px - v.x) * r; v.y = py - (py - v.y) * r; v.w = nw; apply();
  };
  const toMap = (clientX, clientY) => { const b = svg.getBoundingClientRect(); return [v.x + (clientX - b.left) / b.width * v.w, v.y + (clientY - b.top) / b.height * (v.w / aspect())]; };
  const pts = new Map(); let moved = 0, pinch0 = null;
  svg.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (pts.size === 2) { const [p, q] = [...pts.values()]; pinch0 = { d: Math.hypot(p[0] - q[0], p[1] - q[1]), w: v.w }; } });
  svg.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch0) { const [p, q] = [...pts.values()]; const d = Math.hypot(p[0] - q[0], p[1] - q[1]); const [mx, my] = toMap((p[0] + q[0]) / 2, (p[1] + q[1]) / 2); zoomBy((pinch0.w * pinch0.d / d) / v.w, mx, my); moved = 99; return; }
    const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6) { svg.setPointerCapture?.(e.pointerId); svg.classList.add('dragging'); const k = v.w / svg.getBoundingClientRect().width; v.x -= dx * k; v.y -= dy * k; apply(); }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null; if (!pts.size) setTimeout(() => svg.classList.remove('dragging'), 0); };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', e => { e.preventDefault(); const [mx, my] = toMap(e.clientX, e.clientY); zoomBy(e.deltaY > 0 ? 1.15 : 1 / 1.15, mx, my); }, { passive: false });
  wrap.querySelector('[data-zoom-in]').onclick = () => zoomBy(1 / 1.35);
  wrap.querySelector('[data-zoom-out]').onclick = () => zoomBy(1.35);
  wrap.querySelector('[data-zoom-home]').onclick = () => { closeInfo(); const p = { ...v }; home(); const t = { ...v }; v = p; apply(); animateTo(t.x + t.w / 2, t.y + t.w / aspect() / 2, t.w, 700); };
  const regionDesc = id => (REGIONS.find(r => r.h === id) || {}).desc || '';
  function closeInfo() { info.hidden = true; svg.querySelectorAll('.place.sel').forEach(p => p.classList.remove('sel')); }
  function openInfo(id) {
    const h = H[id];
    svg.querySelectorAll('.place').forEach(p => p.classList.toggle('sel', p.dataset.id === id));
    info.innerHTML = `<button class="x" aria-label="Close" data-close>&times;</button><div class="ri-top">${crest(h).replace('class="crest"', 'class="crest ri-crest"')}<div><p class="eyebrow">${h.region}</p><h3>${h.vacant ? 'Unclaimed Land' : h.name}</h3><p class="ri-motto">“${h.motto}”</p></div></div><p>${regionDesc(id)}</p><p class="ri-meta">${h.vacant ? 'Held open for a patron House.' : `<b>Seat:</b> ${h.seat} &nbsp;·&nbsp; <b>Head:</b> ${h.lord}, ${h.rank}`}</p><div class="ri-act">${h.vacant ? '<a class="btn ghost" href="/houses">About Patron Houses</a>' : `<a class="btn" href="/join?house=${id}">Swear to ${h.name.replace('House ', '')}</a><a class="btn ghost" href="/houses">All Houses</a>`}</div>`;
    info.hidden = false;
    info.querySelector('[data-close]').onclick = closeInfo;
    const [px, py] = PLACES[id]; if (aspect() < 1) animateTo(px, py + 60, Math.min(v.w, 520), 600); else animateTo(px + v.w * .12, py, Math.min(v.w, 1100), 600);
  }
  svg.querySelectorAll('.place').forEach(p => {
    const act = () => { if (moved > 6) return; p.dataset.id === 'crown' ? enterCourt(true, true) : openInfo(p.dataset.id); };
    p.addEventListener('click', act);
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); moved = 0; act(); } });
  });
  let built = false, saved = null, courtOpen = false;
  const cap = court.querySelector('[data-court-cap]');
  function buildCourt() {
    court.querySelector('[data-court-stage]').innerHTML = courtSVG();
    const show = el => { court.querySelectorAll('.fig.sel').forEach(f => f.classList.remove('sel')); el.classList.add('sel'); cap.innerHTML = `<b>${el.dataset.n}</b><span>${el.dataset.r}</span>`; };
    court.querySelectorAll('.fig').forEach(el => { el.addEventListener('pointerenter', () => show(el)); el.addEventListener('click', () => show(el)); el.addEventListener('focus', () => show(el)); });
    built = true;
  }
  function enterCourt(push = true, animate = true) {
    if (courtOpen) return; courtOpen = true;
    closeInfo(); if (!built) buildCourt(); saved = { ...v };
    const open = () => { court.hidden = false; requestAnimationFrame(() => { court.classList.add('open'); const st = court.querySelector('[data-court-stage]'); st.scrollLeft = (st.scrollWidth - st.clientWidth) / 2; st.scrollTop = 0; }); document.body.classList.add('court-open'); if (push && location.hash !== '#court') history.pushState(null, '', '#court'); court.querySelector('[data-court-back]').focus({ preventScroll: true }); };
    if (animate) animateTo(CASTLE[0], CASTLE[1] - 40, 260, 900, open); else open();
  }
  function leaveCourt(fromNav) {
    if (!courtOpen) return; courtOpen = false;
    court.classList.remove('open'); document.body.classList.remove('court-open');
    setTimeout(() => { if (!courtOpen) court.hidden = true; }, 400);
    if (!fromNav && location.hash === '#court') history.replaceState(null, '', location.pathname + location.search);
    if (saved) animateTo(CASTLE[0], CASTLE[1] - 20, maxW(), 800);
  }
  court.querySelector('[data-court-back]').onclick = () => leaveCourt(false);
  const onNav = () => { if (location.hash === '#court') enterCourt(false, true); else leaveCourt(true); };
  addEventListener('popstate', onNav); addEventListener('hashchange', onNav);
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (courtOpen) leaveCourt(false); else closeInfo(); } });
  if (location.hash === '#court') enterCourt(false, false);
}
document.addEventListener('DOMContentLoaded', init);
})();
