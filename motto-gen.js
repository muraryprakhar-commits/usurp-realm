/* Latin motto generator: picks established mottos by theme and links each one into Crest Studio. */
(() => {
const data = JSON.parse(document.getElementById('motto-data').textContent);
const out = document.querySelector('[data-out]');
let theme = 'all', bag = [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const title = s => s.replace(/(^|[\s,])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
function refill() {
  bag = data.mottos.filter(m => theme === 'all' || m.t === theme).slice();
  for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
}
function gen() {
  if (bag.length < 3) refill();
  const pick = bag.splice(0, 3);
  out.innerHTML = pick.map(m => `<div class="motto-card"><p class="la">${esc(m.la)}</p><p class="en">${esc(m.en)}</p>${m.s ? `<p class="src">${esc(m.s)}</p>` : ''}<a class="btn ghost" href="/crest.html?motto=${encodeURIComponent(title(m.la))}">Put it on my crest</a></div>`).join('');
  if (window.clarity) try { window.clarity('event', 'motto_generate'); } catch (e) {}
}
document.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', () => {
  theme = b.dataset.theme;
  document.querySelectorAll('[data-theme]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  refill(); gen();
}));
document.querySelector('[data-gen]').addEventListener('click', gen);
refill(); gen();
})();
