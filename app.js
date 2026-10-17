/* Usurp: The Kingdom. All names, houses, rulers and events are illustrative. */
const WAITLIST = 'https://usurp-alpha.vercel.app/';

const HOUSES = [
  { id:'vire',   name:'House Vire',   motto:'The Blood Remembers', seat:'Blackmere Keep', region:'The Ashen March',  c:['#7a1020','#d4af5a'], div:'perpale',  ch:'tower',    rank:'Duke',     lord:'Isolde Vire' },
  { id:'calder', name:'House Calder', motto:'Iron Before Silk',    seat:'Calder Hold',    region:'The Northreach',   c:['#1f3b2d','#d9d9d9'], div:'fess',     ch:'sword',    rank:'Duke',     lord:'Aurel Calder' },
  { id:'morrow', name:'House Morrow', motto:'We Rise at Dusk',     seat:'Duskwater',      region:'The Sunken Vale',  c:['#1b2548','#e4d190'], div:'bend',     ch:'crescent', rank:'Marquess', lord:'Sera Morrow' },
  { id:'aldane', name:'House Aldane', motto:'Gold Buys the Gate',  seat:'Aldane Spire',   region:'The Gilded Coast', c:['#2a1a0e','#d4af5a'], div:'chevron',  ch:'key',      rank:'Marquess', lord:'Corvin Aldane' },
  { id:'raske',  name:'House Raske',  motto:'No Mercy Owed',       seat:'Raske Tower',    region:'The Thornwood',    c:['#3d1238','#c7a86a'], div:'quarterly',ch:'rose',     rank:'Earl',     lord:'Mael Raske' },
  { id:'hollen', name:'House Hollen', motto:'Patience Is a Blade', seat:'Hollenford',     region:'The Riverlands',   c:['#26221e','#b3242f'], div:'saltire',  ch:'mullet',   rank:'Earl',     lord:'Wren Hollen' },
  { id:'crown',  name:'The Crown',    motto:'Held, Never Owned',   seat:'The Iron Throne of Usurp', region:'The Crown Lands', c:['#5a0b16','#f3dc92'], div:'plain', ch:'crown', rank:'King / Queen', lord:'Whoever spends most', royal:true },
  { id:'vacant', name:'House Unclaimed', motto:'Your Banner Here',  seat:'Unbuilt',        region:'The Free Marches', c:['#3a342c','#8f7f63'], div:'plain',    ch:'q',        rank:'Patron House', lord:'Awaiting a patron', vacant:true },
];
const H = Object.fromEntries(HOUSES.map(h => [h.id, h]));

let _uid = 0;
const uid = p => `${p}${++_uid}`;

function charge(kind, col) {
  const s = `fill="${col}" stroke="#1a0e05" stroke-width="1.2"`;
  switch (kind) {
    case 'tower': return `<g ${s}><path d="M36 82V46h-4v-8h6v5h5v-5h6v5h6v-5h6v5h5v-5h6v8h-4v36z"/><path d="M45 82V68a5 5 0 0110 0v14z" fill="#1a0e05"/><rect x="47" y="52" width="6" height="8" fill="#1a0e05"/></g>`;
    case 'sword': return `<g ${s}><path d="M48 28h4v52h-4z"/><path d="M50 22l3 6h-6z"/><path d="M36 78h28v5H36z"/><path d="M48 83h4v10h-4z"/><circle cx="50" cy="96" r="4"/></g>`;
    case 'crescent': return `<path ${s} d="M62 36a24 24 0 100 40a19 19 0 110-40z"/>`;
    case 'key': return `<g ${s}><circle cx="50" cy="40" r="11"/><circle cx="50" cy="40" r="5" fill="#1a0e05"/><path d="M47 50h6v36h-6z"/><path d="M53 70h9v5h-9zM53 79h7v5h-7z"/></g>`;
    case 'rose': return `<g ${s}>${[0,72,144,216,288].map(a=>`<circle cx="${50+13*Math.sin(a*Math.PI/180)}" cy="${58-13*Math.cos(a*Math.PI/180)}" r="10"/>`).join('')}<circle cx="50" cy="58" r="7" fill="#e7c55a"/></g>`;
    case 'mullet': { const p=[];for(let i=0;i<10;i++){const r=i%2?9:22,a=(i*36-90)*Math.PI/180;p.push(`${(50+r*Math.cos(a)).toFixed(1)},${(58+r*Math.sin(a)).toFixed(1)}`)}return `<polygon ${s} points="${p.join(' ')}"/>`; }
    case 'crown': return `<g ${s}><path d="M28 74l-4-30 14 14 12-22 12 22 14-14-4 30z"/><rect x="28" y="74" width="44" height="9"/><circle cx="24" cy="42" r="3.5"/><circle cx="50" cy="34" r="3.5"/><circle cx="76" cy="42" r="3.5"/><circle cx="50" cy="78.5" r="2.6" fill="#b3242f"/><circle cx="38" cy="78.5" r="2" fill="#1f5f8a"/><circle cx="62" cy="78.5" r="2" fill="#1f5f8a"/></g>`;
    case 'q': return `<text x="50" y="76" text-anchor="middle" font-family="Cinzel Decorative,serif" font-weight="900" font-size="44" fill="${col}" stroke="#1a0e05" stroke-width="1">?</text>`;
  }
  return '';
}
function division(kind, c2) {
  switch (kind) {
    case 'perpale': return `<rect x="50" y="0" width="50" height="120" fill="${c2}"/>`;
    case 'fess': return `<rect x="0" y="40" width="100" height="30" fill="${c2}"/>`;
    case 'bend': return `<path d="M0 10L10 0L100 90V112z" fill="${c2}"/>`;
    case 'chevron': return `<path d="M0 100L50 50L100 100V80L50 30L0 80z" fill="${c2}"/>`;
    case 'quarterly': return `<rect x="50" y="0" width="50" height="58" fill="${c2}"/><rect x="0" y="58" width="50" height="62" fill="${c2}"/>`;
    case 'saltire': return `<path d="M0 0h14l86 100v20h-14L0 14zM100 0H86L0 100v20h14L100 14z" fill="${c2}" opacity=".9"/>`;
  }
  return '';
}
const SHIELD = 'M6 6H94V56C94 88 72 106 50 116C28 106 6 88 6 56Z';
function crest(h, cls = 'crest') {
  const id = uid('sh'), g = uid('gl');
  const [c1, c2] = h.c;
  const needsContrast = ['perpale','quarterly','chevron','fess'].includes(h.div);
  const chCol = needsContrast ? '#f3dc92' : c2;
  const chargeSvg = needsContrast ? `<g>${charge(h.ch, chCol)}</g>` : charge(h.ch, chCol);
  return `<svg class="${cls}" viewBox="0 0 100 122" role="img" aria-label="Crest of ${h.name}">
  <defs><clipPath id="${id}"><path d="${SHIELD}"/></clipPath>
  <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>
  <g clip-path="url(#${id})"><rect width="100" height="122" fill="${c1}"/>${division(h.div, c2)}${chargeSvg}<rect width="100" height="122" fill="url(#${g})"/></g>
  <path d="${SHIELD}" fill="none" stroke="#d4af5a" stroke-width="4"/><path d="${SHIELD}" fill="none" stroke="#5c4417" stroke-width="1" transform="translate(5 5) scale(.9)"/>
  </svg>`;
}
function banner(h) {
  const id = uid('bn'), g = uid('bg');
  const [c1, c2] = h.c;
  return `<svg viewBox="0 0 80 200" aria-hidden="true"><defs><clipPath id="${id}"><path d="M8 14H72V170L40 150L8 170Z"/></clipPath>
  <linearGradient id="${g}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs>
  <rect x="2" y="6" width="76" height="8" rx="3" fill="#8a6a24"/><circle cx="3" cy="10" r="5" fill="#d4af5a"/><circle cx="77" cy="10" r="5" fill="#d4af5a"/>
  <g class="banner-wave"><g clip-path="url(#${id})"><rect x="0" y="0" width="80" height="180" fill="${c1}"/><g transform="translate(-10 12) scale(1)">${division(h.div, c2)}</g><g transform="translate(-10 22)">${charge(h.ch, h.div==='plain'||h.div==='bend'||h.div==='saltire'?c2:'#f3dc92')}</g><rect width="80" height="180" fill="url(#${g})"/></g>
  <path d="M8 14H72V170L40 150L8 170Z" fill="none" stroke="#d4af5a" stroke-width="2"/></g></svg>`;
}

function goldDefs(g) {
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#e2bf62"/><stop offset=".7" stop-color="#9a7327"/><stop offset="1" stop-color="#f0d27e"/></linearGradient></defs>`;
}
const leaf = (x, y, f) => `<path fill="${f}" stroke="#4a3310" stroke-width=".8" d="M${x-7} ${y}Q${x-12} ${y-9} ${x-4} ${y-11}Q${x-3} ${y-19} ${x} ${y-21}Q${x+3} ${y-19} ${x+4} ${y-11}Q${x+12} ${y-9} ${x+7} ${y}Z"/>`;
const pearl = (x, y, r = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f5efe0" stroke="#8a7a60" stroke-width=".7"/>`;
function band(f) {
  return `<path d="M18 66Q50 58 82 66V80Q50 72 18 80Z" fill="${f}" stroke="#4a3310" stroke-width="1"/><circle cx="50" cy="71" r="3.4" fill="#b3242f"/><circle cx="34" cy="72.5" r="2.6" fill="#1f5f8a"/><circle cx="66" cy="72.5" r="2.6" fill="#1f5f8a"/><path d="M20 82Q50 74 80 82" stroke="#4a3310" stroke-width="1" fill="none"/>`;
}
function insignia(kind) {
  const g = uid('gd'), f = `url(#${g})`;
  let body = '';
  switch (kind) {
    case 'peasant':
      body = `<g stroke="#b08a4e" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M50 88V34M50 88L38 40M50 88L62 40M50 88L30 50M50 88L70 50"/></g>${[[50,30],[38,36],[62,36],[30,46],[70,46]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="4" ry="8" fill="#c9a060" stroke="#6e4f25"/>`).join('')}<path d="M36 74Q50 80 64 74" stroke="#7a5a2e" stroke-width="5" fill="none"/>`;
      break;
    case 'knight':
      body = `<g fill="${f}" stroke="#4a3310" stroke-width="1"><g transform="rotate(35 50 50)"><rect x="47.5" y="10" width="5" height="62"/><rect x="38" y="68" width="24" height="5"/><rect x="48" y="73" width="4" height="12"/><circle cx="50" cy="88" r="4"/></g><g transform="rotate(-35 50 50)"><rect x="47.5" y="10" width="5" height="62"/><rect x="38" y="68" width="24" height="5"/><rect x="48" y="73" width="4" height="12"/><circle cx="50" cy="88" r="4"/></g></g>`;
      break;
    case 'baron':
      body = band(f) + [26, 42, 58, 74].map(x => pearl(x, 60, 4)).join('');
      break;
    case 'viscount':
      body = band(f) + Array.from({ length: 11 }, (_, i) => pearl(22 + i * 5.6, 61 - Math.sin(i / 10 * Math.PI) * 2, 2.9)).join('');
      break;
    case 'earl':
      body = band(f) + [22, 36, 50, 64, 78].map(x => `<path d="M${x} 64L${x} 38" stroke="${f}" stroke-width="3"/>` + pearl(x, 35, 3.6)).join('') + [29, 43, 57, 71].map(x => leaf(x, 64, f)).join('');
      break;
    case 'marquess':
      body = band(f) + [22, 50, 78].map(x => leaf(x, 64, f)).join('') + [36, 64].map(x => `<path d="M${x} 64V52" stroke="${f}" stroke-width="3"/>` + pearl(x, 49, 3.6)).join('');
      break;
    case 'duke':
      body = band(f) + [22, 36, 50, 64, 78].map(x => leaf(x, 64, f)).join('');
      break;
    case 'king':
      body = band(f) + [22, 50, 78].map(x => leaf(x, 64, f)).join('') +
        `<path d="M20 64Q22 26 50 22Q78 26 80 64" fill="none" stroke="${f}" stroke-width="4"/><path d="M36 64Q38 34 50 24Q62 34 64 64" fill="none" stroke="${f}" stroke-width="3"/>` +
        `<circle cx="50" cy="16" r="6" fill="${f}" stroke="#4a3310"/><path d="M50 2v10M45 6h10" stroke="${f}" stroke-width="3"/>` +
        `<path d="M22 64Q50 30 78 64" fill="#5a0b16" opacity=".55"/>`;
      break;
  }
  return `<svg class="ins" viewBox="0 0 100 100" aria-hidden="true">${goldDefs(g)}${body}</svg>`;
}

function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const innerBanner = h => banner(h).replace('<svg viewBox="0 0 80 200" aria-hidden="true">', '<g>').replace(/<\/svg>$/, '</g>');
function castleScene() {
  const r = rng(7);
  const stars = Array.from({ length: 140 }, () => `<circle cx="${(r() * 1440).toFixed(0)}" cy="${(r() * 460).toFixed(0)}" r="${(r() * 1.3 + .2).toFixed(2)}" fill="#fff" opacity="${(r() * .7 + .15).toFixed(2)}"/>`).join('');
  const crenel = (x, y, w, n) => Array.from({ length: n }, (_, i) => `<rect x="${x + i * (w / n)}" y="${y - 12}" width="${w / n * .55}" height="12"/>`).join('');
  const tower = (x, w, top, roof) => `<rect x="${x}" y="${top}" width="${w}" height="${900 - top}"/>${roof ? `<path d="M${x - 8} ${top}L${x + w / 2} ${top - roof}L${x + w + 8} ${top}Z"/>` : crenel(x, top, w, 5)}`;
  const win = (x, y, w = 8, h = 16) => `<rect class="win" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="url(#winG)" style="animation-delay:${(r() * 3).toFixed(2)}s"/>`;
  return `<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060d"/><stop offset=".45" stop-color="#141026"/><stop offset=".75" stop-color="#3a0f18"/><stop offset="1" stop-color="#6b1d12"/></linearGradient>
    <radialGradient id="moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8e1"/><stop offset=".6" stop-color="#f1e2b8"/><stop offset="1" stop-color="#d9c38c"/></radialGradient>
    <radialGradient id="mglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f6e7b8" stop-opacity=".45"/><stop offset="1" stop-color="#f6e7b8" stop-opacity="0"/></radialGradient>
    <linearGradient id="winG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset="1" stop-color="#ff8a2a"/></linearGradient>
    <radialGradient id="fire" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="fogG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a7a8a" stop-opacity="0"/><stop offset=".5" stop-color="#8a7a8a" stop-opacity=".22"/><stop offset="1" stop-color="#8a7a8a" stop-opacity="0"/></linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#14110e" stop-opacity="0"/><stop offset="1" stop-color="#14110e"/></linearGradient>
  </defs>
  <rect width="1440" height="900" fill="url(#sky)"/>${stars}
  <circle class="moon-glow" cx="1080" cy="170" r="190" fill="url(#mglow)"/><circle cx="1080" cy="170" r="62" fill="url(#moon)"/><circle cx="1062" cy="158" r="9" fill="#d6c08a" opacity=".5"/><circle cx="1098" cy="190" r="6" fill="#d6c08a" opacity=".45"/>
  <path d="M0 560L120 470L230 520L360 420L470 500L560 440L700 520L820 430L930 500L1060 410L1180 490L1300 430L1440 500V900H0Z" fill="#1a1426"/>
  <path d="M0 640L160 560L300 610L420 560L560 620L700 580L880 630L1020 570L1180 620L1320 580L1440 610V900H0Z" fill="#120d18"/>
  <ellipse cx="720" cy="700" rx="520" ry="160" fill="url(#fire)"/>
  <g fill="#07060a">
    <path d="M300 900L420 680L560 640L720 620L880 640L1020 680L1140 900Z"/>
    ${tower(470, 60, 520, 0)}${tower(910, 60, 520, 0)}
    <rect x="530" y="560" width="380" height="340"/>${crenel(530, 560, 380, 16)}
    ${tower(600, 90, 380, 110)}${tower(750, 90, 360, 0)}${tower(660, 120, 300, 0)}
    <path d="M652 300L720 150L788 300Z"/><rect x="717" y="112" width="6" height="40"/>
    ${tower(840, 70, 420, 90)}${tower(410, 50, 600, 70)}${tower(980, 50, 590, 70)}
  </g>
  <path d="M690 900V760a30 30 0 0160 0V900Z" fill="#ff8a2a" opacity=".25"/><path d="M696 900V764a24 24 0 0148 0V900Z" fill="#0c0806"/>
  ${win(706, 340)}${win(726, 340)}${win(626, 440)}${win(660, 440)}${win(782, 420)}${win(808, 460)}${win(860, 480)}${win(496, 580)}${win(936, 580)}${win(572, 620, 10, 18)}${win(866, 620, 10, 18)}${win(700, 230, 10, 20)}${win(700, 640)}${win(740, 640)}${win(426, 650)}${win(996, 640)}
  <g transform="translate(716 60) scale(.42)">${innerBanner(H.crown)}</g>
  <g transform="translate(628 250) scale(.36)">${innerBanner(H.vire)}</g>
  <g transform="translate(854 318) scale(.34)">${innerBanner(H.calder)}</g>
  <g class="fog"><rect x="-100" y="640" width="1640" height="140" fill="url(#fogG)"/><rect x="-100" y="740" width="1640" height="120" fill="url(#fogG)"/></g>
  <path d="M0 900V780L140 760L260 800L300 900ZM1440 900V770L1300 750L1180 800L1140 900Z" fill="#050406"/>
  <rect width="1440" height="900" fill="url(#shade)"/>
  </svg>`;
}
function throneArt() {
  return `<svg class="throne-art" viewBox="0 0 400 460" role="img" aria-label="The throne of Usurp">
  <defs>
    <radialGradient id="tg" cx=".5" cy=".35" r=".65"><stop offset="0" stop-color="#ffb35a" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="tgold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".4" stop-color="#d4af5a"/><stop offset="1" stop-color="#6e521b"/></linearGradient>
    <linearGradient id="vel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a0710"/><stop offset=".5" stop-color="#8f1426"/><stop offset="1" stop-color="#3a0710"/></linearGradient>
  </defs>
  <rect width="400" height="460" fill="#0e0b09"/><rect width="400" height="460" fill="url(#tg)"/>
  <path d="M0 0H70Q60 200 90 460H0Z" fill="url(#vel)"/><path d="M400 0H330Q340 200 310 460H400Z" fill="url(#vel)"/>
  <path d="M0 0H400V40Q300 70 200 40Q100 70 0 40Z" fill="#5a0b16"/><path d="M0 40Q100 70 200 40Q300 70 400 40" stroke="#d4af5a" stroke-width="3" fill="none"/>
  <path d="M60 460L90 420H310L340 460Z" fill="#241c14"/><path d="M90 420L110 395H290L310 420Z" fill="#2e241a"/><path d="M110 395L128 372H272L290 395Z" fill="#3a2e20"/>
  <path d="M148 372V160Q148 110 200 92Q252 110 252 160V372Z" fill="url(#tgold)" stroke="#3b2a0c" stroke-width="3"/>
  <path d="M162 300V168Q162 128 200 114Q238 128 238 168V300Z" fill="url(#vel)"/>
  <path d="M130 372V270H270V372Z" fill="url(#tgold)" stroke="#3b2a0c" stroke-width="3"/>
  <rect x="120" y="258" width="160" height="22" rx="4" fill="url(#vel)" stroke="#d4af5a" stroke-width="2"/>
  <path d="M120 372V230a14 14 0 0128 0V372ZM252 372V230a14 14 0 0128 0V372Z" fill="url(#tgold)" stroke="#3b2a0c" stroke-width="2"/>
  <circle cx="200" cy="96" r="9" fill="#b3242f" stroke="#d4af5a" stroke-width="2"/>
  <g transform="translate(150 150)"><g class="banner-wave">${insignia('king').replace('class="ins"', 'x="0" y="0" width="100" height="100"')}</g></g>
  ${[50, 350].map(x => `<rect x="${x - 4}" y="300" width="8" height="120" fill="#3a2a18"/><ellipse cx="${x}" cy="296" rx="10" ry="16" fill="#ffb14a" class="win"/><circle cx="${x}" cy="300" r="46" fill="#ff9a3c" opacity=".12"/>`).join('')}
  </svg>`;
}

const REGIONS = [
  { h:'calder', pts:[[120,120],[260,70],[420,60],[470,150],[400,220],[250,230],[140,200]], desc:'Frozen passes and iron mines. Calder lords have never been moved by gold alone, only by more of it.' },
  { h:'vire',   pts:[[420,60],[560,80],[680,130],[700,230],[590,260],[470,150]], desc:'Scorched moors around Blackmere Keep. Every House that ever held the throne began here.' },
  { h:'crown',  pts:[[250,230],[400,220],[470,150],[590,260],[560,340],[420,370],[300,340]], desc:'The seat of the throne. Whoever sits it rules these lands, until someone outspends them.' },
  { h:'raske',  pts:[[140,200],[250,230],[300,340],[230,420],[110,380],[80,280]], desc:'Black thorn forest. Raske knights ride out at night to challenge Earls who grow careless.' },
  { h:'aldane', pts:[[590,260],[700,230],[730,340],[660,440],[560,420],[560,340]], desc:'Harbours of gilt and trade. It is said Aldane has bought the gate twice and lost it three times.' },
  { h:'hollen', pts:[[300,340],[420,370],[560,340],[560,420],[470,500],[340,480],[230,420]], desc:'Fertile river country. Hollen waits, watches the ledger, and strikes on the last day.' },
  { h:'morrow', pts:[[110,380],[230,420],[340,480],[300,560],[170,540],[90,460]], desc:'Drowned villages and misted lakes. Morrow banners are only ever seen at dusk.' },
  { h:'vacant', pts:[[470,500],[560,420],[660,440],[650,530],[520,570]], desc:'Unclaimed land held open for a patron House. A brand may one day raise its banner here.' },
];
const centroid = pts => { const n = pts.length; return [pts.reduce((a, p) => a + p[0], 0) / n, pts.reduce((a, p) => a + p[1], 0) / n]; };
function kingdomMap() {
  const r = rng(11);
  const polys = REGIONS.map((R, i) => {
    const h = H[R.h];
    return `<polygon class="region" tabindex="0" role="button" aria-label="${R.h === 'vacant' ? 'The Free Marches, unclaimed' : h.region + ', ruled by ' + h.name}" data-i="${i}" points="${R.pts.map(p => p.join(',')).join(' ')}" fill="${h.c[0]}" fill-opacity="${R.h === 'vacant' ? .18 : .42}" stroke="#3b250f" stroke-width="2" stroke-dasharray="${R.h === 'vacant' ? '6 5' : '0'}" stroke-linejoin="round"/>`;
  }).join('');
  const coast = REGIONS.map(R => `<polygon points="${R.pts.map(p => p.join(',')).join(' ')}" fill="#e3cf9f" stroke="#7a5a2e" stroke-width="14" stroke-linejoin="round"/>`).join('');
  const labels = REGIONS.map(R => { const [x, y] = centroid(R.pts); const h = H[R.h];
    return `<g pointer-events="none"><text class="map-label" x="${x}" y="${y + 6}" text-anchor="middle" font-size="15">${h.region.replace('The ', '').toUpperCase()}</text><text class="map-label sm" x="${x}" y="${y + 24}" text-anchor="middle" font-size="13">${R.h === 'vacant' ? 'unclaimed' : h.name}</text></g>`; }).join('');
  const keeps = REGIONS.map(R => { const [x, y] = centroid(R.pts); const cx = x, cy = y - 22;
    return R.h === 'vacant' ? '' : `<g transform="translate(${cx - 10} ${cy - 16})" fill="#3b250f" pointer-events="none"><rect x="3" y="6" width="14" height="12"/><rect x="0" y="2" width="6" height="16"/><rect x="14" y="2" width="6" height="16"/><rect x="1" y="0" width="2" height="3"/><rect x="4" y="0" width="2" height="3"/><rect x="15" y="0" width="2" height="3"/><rect x="18" y="0" width="2" height="3"/>${R.h === 'crown' ? '<path d="M6 -8l2 5 2-5 2 5 2-5v8H6z" fill="#b3242f"/>' : ''}</g>`; }).join('');
  const mountains = Array.from({ length: 14 }, (_, i) => { const x = 150 + (i % 7) * 40 + r() * 16, y = 110 + Math.floor(i / 7) * 34 + r() * 10; return `<path d="M${x} ${y}l12 -20l12 20" fill="none" stroke="#5a3d1c" stroke-width="1.6"/><path d="M${x + 12} ${y - 20}l4 8" stroke="#5a3d1c"/>`; }).join('');
  const trees = Array.from({ length: 22 }, () => { const x = 110 + r() * 150, y = 270 + r() * 110; return `<path d="M${x} ${y}l6 -14l6 14z" fill="#4a3a1c" opacity=".75"/>`; }).join('');
  const waves = Array.from({ length: 26 }, () => { const x = r() * 800, y = r() * 620; return `<path d="M${x} ${y}q6 -5 12 0t12 0" fill="none" stroke="#7a5a2e" stroke-width="1.2" opacity=".55"/>`; }).join('');
  return `<svg class="map-svg" viewBox="0 0 800 620" role="group" aria-label="Map of the Kingdom of Usurp">
  <rect width="800" height="620" fill="#cfb784" opacity=".35"/>${waves}
  ${coast}${polys}
  <path d="M470 150Q430 260 440 330T470 500" fill="none" stroke="#4a6a8a" stroke-width="3" opacity=".7" pointer-events="none"/>
  <path d="M300 340Q360 400 420 420T560 420" fill="none" stroke="#4a6a8a" stroke-width="2.4" opacity=".6" pointer-events="none"/>
  <g pointer-events="none">${mountains}${trees}</g>${keeps}${labels}
  <text x="40" y="585" font-family="IM Fell English,serif" font-style="italic" font-size="20" fill="#5a3d1c">The Weeping Sea</text>
  <text x="600" y="40" font-family="IM Fell English,serif" font-style="italic" font-size="20" fill="#5a3d1c">Sea of Crowns</text>
  <g transform="translate(720 560)" pointer-events="none"><circle r="34" fill="none" stroke="#5a3d1c" stroke-width="1.5"/><circle r="26" fill="none" stroke="#5a3d1c" stroke-width=".8"/><path d="M0 -40L6 0L0 40L-6 0Z" fill="#7a1020"/><path d="M-40 0L0 6L40 0L0 -6Z" fill="#5a3d1c"/><text y="-44" text-anchor="middle" font-family="Cinzel,serif" font-size="12" fill="#3b250f">N</text></g>
  <g transform="translate(40 40)" pointer-events="none"><path d="M0 0c20 -18 40 -18 60 0c-10 4 -20 18 -30 18S10 4 0 0z" fill="none" stroke="#5a3d1c"/><path d="M58 0c10 -10 22 -4 20 6" fill="none" stroke="#5a3d1c"/></g>
  </svg>`;
}

const COURT = [
  { n:'Aurel Calder', h:'calder', rk:'Duke', note:'Held the Northreach 23 days' },
  { n:'Sera Morrow', h:'morrow', rk:'Marquess', note:'Rose from Earl at dusk yesterday' },
  { n:'Corvin Aldane', h:'aldane', rk:'Marquess', note:'Bought the gate. Twice.' },
  { n:'Mael Raske', h:'raske', rk:'Earl', note:'Challenges any Earl who sleeps' },
  { n:'Wren Hollen', h:'hollen', rk:'Earl', note:'Silent. Watching the ledger.' },
  { n:'Tamsin Vire', h:'vire', rk:'Viscount', note:'Sister of the Queen. Ambitious.' },
];
const CHRONICLE = [
  ['Day 11', 'Queen Isolde of House Vire still holds the throne. Four challengers fell short.'],
  ['Day 9', 'Sera Morrow outspent an Earl of House Hollen and rose to Marquess.'],
  ['Day 7', 'House Aldane lost the Gilded Coast for a single night, then bought it back.'],
  ['Day 4', 'A Peasant of no House climbed to Knight in one afternoon. The court took note.'],
  ['Day 1', 'Isolde Vire usurped King Oren the Short, who had reigned nine days.'],
];

const RANKS = [
  { k:'king', t:'King / Queen', seats:'One seat', c:'#d4af5a', d:'Sits the throne and rules the Crown Lands. Every other soul in the realm is spending to take it from you.', p:['Your name and crest over the whole realm','Names the court and grants titles of favour','Your reign is written into the Chronicle forever'] },
  { k:'duke', t:'Duke', seats:'A rarefied few', c:'#b3242f', d:'Rules a great region of the map and sits at the right hand of the throne.', p:['Holds a region and raises its banner','First in line to challenge the crown','Seat on the High Council'] },
  { k:'marquess', t:'Marquess', seats:'Guarded ground', c:'#8f1426', d:'Keeper of the marches. Close enough to smell the throne.', p:['Command of a march on the map','May challenge any Duke','Crest shown in the Throne Room'] },
  { k:'earl', t:'Earl', seats:'Contested', c:'#6b3a8a', d:'Lords of the shires. The most fought over rank in the realm.', p:['Named in the Throne Room roll','May raise a House banner','Voice in the Lesser Council'] },
  { k:'viscount', t:'Viscount', seats:'Climbing', c:'#2f5a8a', d:'Deputy to an Earl, with eyes on their seat.', p:['Sworn to a House of your choosing','Title shown beside your name','Access to the court chronicle'] },
  { k:'baron', t:'Baron', seats:'The ambitious', c:'#2f6a4a', d:'The first rank of true nobility. Most who reach it want more.', p:['Coronet shown beside your name','May petition to join a Great House','Invited to Court Games when they open'] },
  { k:'knight', t:'Knight', seats:'The many', c:'#7a6a4a', d:'Sworn swords. You have left the mud, but not by far.', p:['Entered into the Rolls of the realm','Knight’s crossed-swords sigil','Can be raised or cast down at any hour'] },
  { k:'peasant', t:'Peasant', seats:'Everyone, at first', c:'#4a4036', d:'Where every soul begins. No title, no crest, no protection.', p:['A name, and nothing else','Watch the court from the mud','One purchase away from rising'] },
];

const PAGES = [['/', 'Gate'], ['/kingdom', 'Kingdom'], ['/throne', 'Throne Room'], ['/houses', 'Houses'], ['/ranks', 'Hall of Ranks']];
function chrome() {
  const here = document.body.dataset.page;
  const logo = crest(H.crown, 'logo').replace('class="logo"', 'width="30" height="36"');
  document.querySelector('[data-head]').innerHTML = `<div class="head-in"><span class="torch" aria-hidden="true"></span>
    <a class="brand" href="/">${logo}<span class="gilt">USURP</span></a>
    <nav class="nav" aria-label="Realm">${PAGES.map(([u, t]) => `<a href="${u}"${u === here ? ' aria-current="page"' : ''}>${t}</a>`).join('')}<a href="${WAITLIST}" style="color:var(--gold)">Join ⟶</a></nav>
    <span class="torch" aria-hidden="true"></span></div>`;
  document.querySelector('[data-foot]').innerHTML = `<a class="brand" href="/">${logo}<span class="gilt">USURP</span></a>
    <p>Early access only. No payment is taken and no title is granted yet.</p>
    <p>Every House, ruler, name and event shown is illustrative. The realm has not opened.</p>
    <p style="margin-top:10px"><a href="${WAITLIST}">Join the waitlist</a></p>`;
}
function embers() {
  const c = document.getElementById('embers'); if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const x = c.getContext('2d'); let W, Hh, ps = [];
  const size = () => { W = c.width = innerWidth; Hh = c.height = innerHeight; };
  size(); addEventListener('resize', size);
  const N = innerWidth < 700 ? 26 : 50;
  const mk = () => ({ x: Math.random() * W, y: Hh + Math.random() * Hh * .5, r: Math.random() * 1.8 + .5, v: Math.random() * .6 + .25, w: Math.random() * 2 * Math.PI, a: Math.random() * .6 + .3 });
  for (let i = 0; i < N; i++) { const p = mk(); p.y = Math.random() * Hh; ps.push(p); }
  (function tick() {
    x.clearRect(0, 0, W, Hh);
    for (const p of ps) {
      p.y -= p.v; p.w += .02; p.x += Math.sin(p.w) * .4;
      if (p.y < -10) Object.assign(p, mk());
      const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, `rgba(255,190,90,${p.a})`); g.addColorStop(1, 'rgba(255,90,20,0)');
      x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.r * 4, 0, 7); x.fill();
    }
    requestAnimationFrame(tick);
  })();
}
function reveals() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  els.forEach(e => io.observe(e));
}
const $ = s => document.querySelector(s);
const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

function renderGate() {
  fill('[data-scene]', castleScene());
  fill('[data-banners]', HOUSES.filter(h => !h.vacant).map(banner).join(''));
}
function houseCard(h) {
  return `<article class="house frame reveal${h.vacant ? ' vacant' : ''}">
    ${crest(h)}
    ${h.royal ? '<span class="tag blood">Royal</span>' : h.vacant ? '<span class="tag">For a patron</span>' : `<span class="tag">${h.rank}s</span>`}
    <h3>${h.name}</h3><p class="motto">“${h.motto}”</p>
    <dl><dt>Seat</dt><dd>${h.seat}</dd><dt>Lands</dt><dd>${h.region}</dd><dt>Head</dt><dd>${h.lord}</dd></dl>
  </article>`;
}
function renderHouses() {
  fill('[data-houses]', HOUSES.map(houseCard).join(''));
}
function renderKingdom() {
  fill('[data-map]', kingdomMap());
  const info = $('[data-info]');
  const show = i => {
    const R = REGIONS[i], h = H[R.h];
    document.querySelectorAll('.region').forEach(p => p.classList.toggle('active', +p.dataset.i === i));
    info.innerHTML = `<div style="display:flex;gap:16px;align-items:center">${crest(h).replace('class="crest"', 'class="crest" style="width:84px;height:100px;flex:none"')}
      <div><p class="eyebrow">${h.region}</p><h3>${R.h === 'vacant' ? 'Unclaimed' : h.name}</h3><p style="font-style:italic">“${h.motto}”</p></div></div>
      <div class="flourish" style="color:var(--blood)"><span>✠</span></div>
      <p>${R.desc}</p>
      <p style="margin-top:10px"><b>Ruled by:</b> ${h.lord}${h.vacant ? '' : ` (${h.rank})`}<br><b>Seat:</b> ${h.seat}</p>`;
  };
  document.querySelectorAll('.region').forEach(p => {
    p.addEventListener('click', () => show(+p.dataset.i));
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(+p.dataset.i); } });
  });
  show(2);
}
function renderThrone() {
  fill('[data-throne]', throneArt());
  fill('[data-court]', COURT.map(m => `<li>${crest(H[m.h], 'mini')}<div class="who"><b>${m.n}</b><span>${m.note}</span></div><span class="rk">${m.rk}</span></li>`).join(''));
  fill('[data-chron]', CHRONICLE.map(([d, t]) => `<li><time>${d}</time><span>${t}</span></li>`).join(''));
  fill('[data-seal]', crest(H.vire, 'x'));
}
function renderRanks() {
  fill('[data-ranks]', RANKS.map(r => `<article class="rank reveal${r.k === 'king' ? ' crown' : ''}" style="--c:${r.c}">
    ${insignia(r.k)}<div><h3>${r.t}<small>${r.seats}</small></h3><p>${r.d}</p><ul>${r.p.map(x => `<li>${x}</li>`).join('')}</ul></div></article>`).join(''));
}

document.addEventListener('DOMContentLoaded', () => {
  chrome();
  ({ '/': renderGate, '/kingdom': renderKingdom, '/throne': renderThrone, '/houses': renderHouses, '/ranks': renderRanks })[document.body.dataset.page]?.();
  document.querySelectorAll('[data-insignia]').forEach(el => el.innerHTML = insignia(el.dataset.insignia));
  document.querySelectorAll('[data-crest]').forEach(el => el.innerHTML = crest(H[el.dataset.crest]));
  embers(); reveals();
});
