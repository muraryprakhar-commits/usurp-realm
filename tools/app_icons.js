// App icons for the installable web app and the Play Store build: node tools/app_icons.js
// Draws the Usurp shield (icon.svg) on the site's dark background. Maskable icons keep the art inside the
// central safe circle (80% of the canvas) so Android can crop them to any shape.
const fs = require('fs'), path = require('path'), { Resvg } = require('@resvg/resvg-js');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'img', 'app');
const inner = fs.readFileSync(path.join(ROOT, 'icon.svg'), 'utf8').replace(/^<svg[^>]*>|<\/svg>\s*$/g, '');
function icon(size, art, round) {
  const h = size * art, w = h * 100 / 122, x = (size - w) / 2, y = (size - h) / 2;
  const bg = round ? `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#14110e"/>` : `<rect width="${size}" height="${size}" fill="#14110e"/>`;
  const glow = `<radialGradient id="g"><stop offset="0" stop-color="#3a2a14"/><stop offset="1" stop-color="#14110e" stop-opacity="0"/></radialGradient><circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.45}" fill="url(#g)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${bg}${glow}<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 122">${inner}</svg></svg>`;
  return new Resvg(svg).render().asPng();
}
fs.mkdirSync(OUT, { recursive: true });
const jobs = { 'icon-192.png': [192, 0.74, true], 'icon-512.png': [512, 0.74, true], 'maskable-512.png': [512, 0.56], 'maskable-192.png': [192, 0.56], 'apple-touch-icon.png': [180, 0.7], 'play-icon-512.png': [512, 0.66] };
for (const [f, [s, a, r]] of Object.entries(jobs)) { fs.writeFileSync(path.join(OUT, f), icon(s, a, r)); console.log(f); }
