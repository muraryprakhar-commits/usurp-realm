// Build helper: renders crest SVGs and Studio links with the same code the site uses.
// stdin: JSON [{d, uid, label}]  stdout: JSON [{svg, url}]
const C = require('../crest-core.js');
let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  const items = JSON.parse(raw);
  process.stdout.write(JSON.stringify(items.map(it => ({ svg: C.svg(it.d, it.uid, it.label), url: C.studioUrl(it.d) }))));
});
