/* Crest Studio shared renderer for the free tools and guide pages.
   Geometry and design codes match crest-studio.js exactly, so any crest shown here
   opens identically in the Studio. If you change the art in crest-studio.js, change it here too.
   Works in the browser (window.CrestCore) and in Node (module.exports) for build-time previews. */
(function (root) {
const TINCTURES = [
  ['Gules', '#b3242f'], ['Murrey', '#7a1020'], ['Azure', '#1f4e8a'], ['Vert', '#1f5f3d'],
  ['Purpure', '#5a2a6e'], ['Sable', '#1d1915'], ['Or', '#d4af5a'], ['Argent', '#e8e4d8'],
];
const DIVISIONS = [['plain', 'Plain'], ['perpale', 'Per pale'], ['fess', 'Fess'], ['bend', 'Bend'], ['chevron', 'Chevron'], ['quarterly', 'Quarterly'], ['saltire', 'Saltire'], ['pale', 'Pale']];
const CHARGES = [['initial', 'Your initial'], ['tower', 'Tower'], ['sword', 'Sword'], ['crown', 'Crown'], ['key', 'Key'], ['crescent', 'Crescent'], ['rose', 'Rose'], ['mullet', 'Star'], ['none', 'None']];
const DEFAULT = { name:'House Ashford', motto:'Fortune Favours the Bold', f:'#7a1020', d:'#d4af5a', c:'#f3dc92', div:'chevron', ch:'initial', bg:'parch' };
const STROKE = '#1a0e05';
function charge(kind, col) {
  const s = `fill="${col}" stroke="${STROKE}" stroke-width="1.2"`;
  switch (kind) {
    case 'tower': return `<g ${s}><path d="M36 82V46h-4v-8h6v5h5v-5h6v5h6v-5h6v5h5v-5h6v8h-4v36z"/><path d="M45 82V68a5 5 0 0110 0v14z" fill="${STROKE}"/><rect x="47" y="52" width="6" height="8" fill="${STROKE}"/></g>`;
    case 'sword': return `<g ${s}><path d="M48 28h4v52h-4z"/><path d="M50 22l3 6h-6z"/><path d="M36 78h28v5H36z"/><path d="M48 83h4v10h-4z"/><circle cx="50" cy="96" r="4"/></g>`;
    case 'crescent': return `<path ${s} d="M62 36a24 24 0 100 40a19 19 0 110-40z"/>`;
    case 'key': return `<g ${s}><circle cx="50" cy="40" r="11"/><circle cx="50" cy="40" r="5" fill="${STROKE}"/><path d="M47 50h6v36h-6z"/><path d="M53 70h9v5h-9zM53 79h7v5h-7z"/></g>`;
    case 'rose': return `<g ${s}>${[0, 72, 144, 216, 288].map(a => `<circle cx="${(50 + 13 * Math.sin(a * Math.PI / 180)).toFixed(2)}" cy="${(58 - 13 * Math.cos(a * Math.PI / 180)).toFixed(2)}" r="10"/>`).join('')}<circle cx="50" cy="58" r="7" fill="#e7c55a"/></g>`;
    case 'mullet': { const p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, a = (i * 36 - 90) * Math.PI / 180; p.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(58 + r * Math.sin(a)).toFixed(1)}`); } return `<polygon ${s} points="${p.join(' ')}"/>`; }
    case 'crown': return `<g ${s}><path d="M28 74l-4-30 14 14 12-22 12 22 14-14-4 30z"/><rect x="28" y="74" width="44" height="9"/><circle cx="24" cy="42" r="3.5"/><circle cx="50" cy="34" r="3.5"/><circle cx="76" cy="42" r="3.5"/><circle cx="50" cy="78.5" r="2.6" fill="#b3242f"/><circle cx="38" cy="78.5" r="2" fill="#1f5f8a"/><circle cx="62" cy="78.5" r="2" fill="#1f5f8a"/></g>`;
  }
  return '';
}
function division(kind, c) {
  switch (kind) {
    case 'perpale': return `<rect x="50" y="0" width="50" height="122" fill="${c}"/>`;
    case 'fess': return `<rect x="0" y="40" width="100" height="30" fill="${c}"/>`;
    case 'bend': return `<path d="M0 10L10 0L100 90V112z" fill="${c}"/>`;
    case 'chevron': return `<path d="M0 100L50 50L100 100V80L50 30L0 80z" fill="${c}"/>`;
    case 'quarterly': return `<rect x="50" y="0" width="50" height="58" fill="${c}"/><rect x="0" y="58" width="50" height="64" fill="${c}"/>`;
    case 'saltire': return `<path d="M0 0h14l86 100v22h-14L0 14zM100 0H86L0 100v22h14L100 14z" fill="${c}"/>`;
    case 'pale': return `<rect x="36" y="0" width="28" height="122" fill="${c}"/>`;
  }
  return '';
}
const SHIELD = 'M6 6H94V56C94 88 72 106 50 116C28 106 6 88 6 56Z';
const initialOf = name => {
  const w = String(name || '').replace(/^(house|clan|family|the)\s+/i, '').trim();
  return (w.match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase();
};
const W = 1000, HT = 1250, SX = 200, SY = 175, SC = 6;
const FONT_D = "'Cinzel Decorative', Georgia, serif", FONT = "'Cinzel', Georgia, serif";
function fitSize(s, base, maxChars) { return s.length <= maxChars ? base : Math.max(22, Math.round(base * maxChars / s.length)); }
function layout(d, uid, opts) {
  uid = uid || 'a'; opts = opts || {};
  const art = [];
  if (d.bg === 'parch') {
    art.push(`<rect width="${W}" height="${HT}" fill="#efe1bd"/>`,
      `<rect x="22" y="22" width="${W - 44}" height="${HT - 44}" fill="none" stroke="#9c7a45" stroke-width="4"/>`,
      `<rect x="36" y="36" width="${W - 72}" height="${HT - 72}" fill="none" stroke="#9c7a45" stroke-width="1.5"/>`);
  }
  art.push(`<g fill="${d.f}" stroke="#5c4417" stroke-width="3" opacity=".95">
    <path d="M200 260C120 300 90 420 130 520C150 470 175 450 205 452C170 520 175 610 225 680L250 600C220 540 225 470 255 420Z"/>
    <path d="M800 260C880 300 910 420 870 520C850 470 825 450 795 452C830 520 825 610 775 680L750 600C780 540 775 470 745 420Z"/></g>`);
  const g = `g${uid}`, cp = `c${uid}`;
  const inner = d.ch === 'none' || d.ch === 'initial' ? '' : charge(d.ch, d.c);
  art.push(`<defs><clipPath id="${cp}"><path d="${SHIELD}"/></clipPath>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient></defs>
    <g transform="translate(${SX} ${SY}) scale(${SC})">
      <g clip-path="url(#${cp})"><rect width="100" height="122" fill="${d.f}"/>${division(d.div, d.d)}${inner}<rect width="100" height="122" fill="url(#${g})"/></g>
      <path d="${SHIELD}" fill="none" stroke="#d4af5a" stroke-width="4"/>
      <path d="${SHIELD}" fill="none" stroke="#5c4417" stroke-width="1" transform="translate(5 5) scale(.9)"/>
    </g>`);
  if (!opts.noRibbon) art.push(`<g stroke="#5c4417" stroke-width="3">
    <path d="M120 1010L190 985L190 1085L120 1110L150 1060Z" fill="#c9b07a"/>
    <path d="M880 1010L810 985L810 1085L880 1110L850 1060Z" fill="#c9b07a"/>
    <path d="M180 975Q500 935 820 975V1075Q500 1035 180 1075Z" fill="#efe1bd"/></g>`);
  const ink = '#2a1a0e';
  const texts = [];
  const nm = String(d.name || '').trim();
  if (nm && !opts.noName) texts.push({ s:nm, x:W / 2, y:130, size:fitSize(nm, 64, 18), font:FONT_D, weight:900, fill:ink, stroke:null });
  const mt = String(d.motto || '').trim();
  if (mt && !opts.noRibbon) texts.push({ s:mt, x:W / 2, y:1030, size:fitSize(mt, 40, 26), font:FONT, weight:700, fill:'#7a1020', stroke:null });
  if (d.ch === 'initial') texts.push({ s:initialOf(nm), x:SX + 50 * SC, y:SY + 80 * SC, size:46 * SC, font:FONT_D, weight:900, fill:d.c, stroke:{ c:STROKE, w:6 } });
  return { art:art.join(''), texts };
}
const xesc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]));
function textSvg(t) {
  const st = t.stroke ? ` stroke="${t.stroke.c}" stroke-width="${t.stroke.w}" paint-order="stroke"` : '';
  return `<text x="${t.x}" y="${t.y}" text-anchor="middle" dominant-baseline="alphabetic" font-family="${t.font.replace(/"/g, '')}" font-weight="${t.weight}" font-size="${t.size}" fill="${t.fill}"${st}>${xesc(t.s)}</text>`;
}
// Inline SVG for a page. label is used for the accessible name.
function svg(d, uid, label) {
  const L = layout(sanitize(d), uid);
  return `<svg viewBox="0 0 ${W} ${HT}" role="img" aria-label="${xesc(label || ('Coat of arms of ' + (d.name || 'a house')))}">${L.art}${L.texts.map(textSvg).join('')}</svg>`;
}
// Design code, identical to crest-studio.js, so /crest.html?d=CODE opens the same design.
function b64(str) {
  if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(str)));
  return Buffer.from(str, 'utf8').toString('base64');
}
const enc = d => b64(JSON.stringify([d.name, d.motto, d.f, d.d, d.c, d.div, d.ch, d.bg])).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const studioUrl = d => '/crest.html?d=' + enc(sanitize(d));
const HEX = /^#[0-9a-f]{6}$/i;
function sanitize(d) {
  return {
    name: String(d.name || '').slice(0, 40), motto: String(d.motto || '').slice(0, 48),
    f: HEX.test(d.f) ? d.f : DEFAULT.f, d: HEX.test(d.d) ? d.d : DEFAULT.d, c: HEX.test(d.c) ? d.c : DEFAULT.c,
    div: DIVISIONS.some(x => x[0] === d.div) ? d.div : 'plain', ch: CHARGES.some(x => x[0] === d.ch) ? d.ch : 'initial',
    bg: d.bg === 'clear' ? 'clear' : 'parch',
  };
}
/* ---------- blazon and meaning (traditional attributions from later heraldic writers, offered as inspiration) ---------- */
const TNAME = { '#b3242f':'Gules', '#7a1020':'Murrey', '#1f4e8a':'Azure', '#1f5f3d':'Vert', '#5a2a6e':'Purpure', '#1d1915':'Sable', '#d4af5a':'Or', '#e8e4d8':'Argent', '#f3dc92':'Or' };
const PLAIN = { Gules:'red', Murrey:'mulberry', Azure:'blue', Vert:'green', Purpure:'purple', Sable:'black', Or:'gold', Argent:'silver' };
const METALS = ['Or', 'Argent'];
const TMEAN = { Or:'generosity', Argent:'peace and sincerity', Gules:'courage and strength', Azure:'truth and loyalty', Vert:'hope and joy', Purpure:'majesty and justice', Sable:'constancy', Murrey:'patience in battle' };
const DMEAN = {
  chevron:'The chevron is often read as protection, or the roof of a home.',
  fess:'The fess recalls a military belt: readiness to serve.',
  pale:'The pale is often read as a palisade: strength and defense.',
  bend:"The bend recalls a knight's sash.",
  saltire:'The saltire is the cross of Saint Andrew, often said to stand for resolution.',
  perpale:'Per pale sets two halves side by side, the old way of uniting two families.',
  quarterly:'Quarterly divides the shield into four parts of one story.',
  plain:'A single field is the simplest kind of arms, and among the oldest.',
};
const CMEAN = {
  tower:'The tower stands for defense and the safety of a home.', sword:'The sword stands for justice and honor.',
  crown:'The crown stands for authority and victory.', key:'The key stands for guardianship and trust.',
  crescent:'The crescent stands for hope of greater glory.', rose:'The rose stands for hope and joy.',
  mullet:'The star marks one who shines.', initial:'The initial makes the arms unmistakably yours.',
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const tn = hex => TNAME[String(hex).toLowerCase()] || 'Proper';
function blazon(d0) {
  const d = sanitize(d0), F = tn(d.f), D = tn(d.d), C = tn(d.c);
  const ORD = { fess:'fess', bend:'bend', chevron:'chevron', saltire:'saltire', pale:'pale' };
  let field = F;
  if (d.div === 'perpale') field = `Per pale ${F} and ${D}`;
  else if (d.div === 'quarterly') field = `Quarterly ${F} and ${D}`;
  else if (ORD[d.div]) field = `${F}, a ${ORD[d.div]} ${D}`;
  const ini = (String(d.name || '').replace(/^(house|clan|family|the)\s+/i, '').trim().match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase();
  const CH = { tower:`a tower ${C}`, sword:`a sword erect ${C}`, crown:`a crown ${C}`, key:`a key ${C}`, crescent:`a decrescent ${C}`, rose:`a rose ${C} seeded Or`, mullet:`a mullet ${C}`, initial:`the letter ${ini} ${C}` };
  if (!CH[d.ch]) return field + '.';
  return `${field}, ${ORD[d.div] ? 'overall ' : ''}${CH[d.ch]}.`;
}
function meaning(d0) {
  const d = sanitize(d0), F = tn(d.f), D = tn(d.d);
  const parts = [];
  if (d.div === 'plain' || F === D) parts.push(`${PLAIN[F] ? F + ' (' + PLAIN[F] + ')' : F} stands for ${TMEAN[F] || 'whatever you choose'}.`);
  else parts.push(`${F} (${PLAIN[F] || F}) stands for ${TMEAN[F] || 'whatever you choose'}, and ${D} (${PLAIN[D] || D}) for ${TMEAN[D] || 'whatever you choose'}.`);
  parts.push(DMEAN[d.div] || '');
  if (CMEAN[d.ch]) parts.push(CMEAN[d.ch]);
  return parts.filter(Boolean).join(' ');
}
// One line, only when the design breaks the rule of tincture (metal on metal, color on color).
function tinctureNote(d0) {
  const d = sanitize(d0), F = tn(d.f), D = tn(d.d), C = tn(d.c);
  const isM = t => METALS.includes(t);
  if (d.div !== 'plain' && F !== D && isM(F) === isM(D)) return `Heralds' rule: a metal (gold, silver) should sit against a color. ${cap(PLAIN[F] || F)} with ${PLAIN[D] || D} pairs two ${isM(F) ? 'metals' : 'colors'}, so it reads less clearly from a distance.`;
  if (d.div === 'plain' && d.ch !== 'none' && isM(F) === isM(C)) return `Heralds' rule: a metal (gold, silver) should sit against a color. This emblem and field are both ${isM(F) ? 'metals' : 'colors'}, so it reads less clearly from a distance.`;
  return '';
}
const api = { TINCTURES, DIVISIONS, CHARGES, DEFAULT, layout, textSvg, svg, enc, studioUrl, sanitize, xesc, blazon, meaning, tinctureNote };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.CrestCore = api;
})(typeof window !== 'undefined' ? window : this);
