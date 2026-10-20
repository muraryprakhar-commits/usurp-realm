// Share image for a crest: GET /api/og?d=CODE returns a 1200x630 PNG of that design.
// Used as the link preview when someone shares usurp.games/c/CODE.
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const C = require('../crest-core.js');

const FONT_FILES = [path.join(__dirname, 'fonts', 'Cinzel-Bold.ttf'), path.join(__dirname, 'fonts', 'CinzelDecorative-Black.ttf')];
FONT_FILES.forEach(f => fs.accessSync(f));   // fail loudly if the fonts were not bundled
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]));
const fit = (s, base, room) => Math.max(26, Math.min(base, Math.floor(room / (0.72 * Math.max(1, s.length)))));

function shareSvg(d) {
  const L = C.layout({ ...d, bg:'clear' }, 'o', { noName:true });
  const texts = L.texts.map(C.textSvg).join('').replace(/'Cinzel Decorative', Georgia, serif/g, 'Cinzel Decorative Black').replace(/'Cinzel', Georgia, serif/g, 'Cinzel');
  const name = String(d.name || '').trim() || 'A noble house', motto = String(d.motto || '').trim();
  const ns = fit(name, 64, 560), ms = fit(motto, 30, 560);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><radialGradient id="glow" cx="0.27" cy="0.5" r="0.55"><stop offset="0" stop-color="${d.f}" stop-opacity=".55"/><stop offset="1" stop-color="#14110e" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="#14110e"/><rect width="1200" height="630" fill="url(#glow)"/>
<g transform="translate(70 10) scale(.488)">${L.art}${texts}</g>
<text x="600" y="215" font-family="Cinzel" font-weight="700" font-size="22" letter-spacing="6" fill="#d4af5a">THE ARMS OF</text>
<text x="600" y="${215 + ns + 12}" font-family="Cinzel Decorative Black" font-size="${ns}" fill="#f3dc92">${esc(name)}</text>
${motto ? `<text x="600" y="${215 + ns + 30 + ms + 14}" font-family="Cinzel" font-weight="700" font-size="${ms}" fill="#d9c9a6">${esc(motto)}</text>` : ''}
<rect x="600" y="500" width="430" height="2" fill="#8a6a24"/>
<text x="600" y="545" font-family="Cinzel" font-weight="700" font-size="24" letter-spacing="2" fill="#d4af5a">Design yours free at usurp.games</text>
</svg>`;
}

module.exports = (req, res) => {
  const d = C.dec(String((req.query && req.query.d) || '').slice(0, 800)) || C.DEFAULT;
  try {
    const png = new Resvg(shareSvg(d), { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Cinzel' } }).render().asPng();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(png);
  } catch (e) {
    res.writeHead(302, { Location: '/og-crest.png' }); res.end();
  }
};
module.exports.shareSvg = shareSvg;
