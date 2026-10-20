/* Heraldry quiz: answers score a field color, a division, an emblem, a metal and a motto theme.
   The result is drawn with crest-core.js, so "Customize" opens the exact crest in Crest Studio,
   and the share link (usurp.games/c/CODE?via=quiz) previews the crest and brings friends to this quiz. */
(() => {
const C = window.CrestCore;
const data = JSON.parse(document.getElementById('quiz-data').textContent);
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const steps = $$('[data-q]'), total = steps.length;
let at = 0;
function show(i) {
  at = i;
  steps.forEach((el, k) => { el.hidden = k !== i; });
  $('[data-progress]').textContent = `Question ${i + 1} of ${total}`;
  $('[data-bar]').style.width = `${Math.round(100 * i / total)}%`;
  $('[data-back]').hidden = i === 0;
  const first = steps[i].querySelector('input'); if (first && i > 0) first.focus({ preventScroll:true });
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const title = s => s.replace(/(^|[\s,])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
function top(tally, order) {
  let best = null;
  for (const k of order) if (tally[k] && (best === null || tally[k] > tally[best])) best = k;
  return best || order[0];
}
function result() {
  const tally = { t:{}, c:{}, d:{}, m:{}, th:{} };
  for (const el of steps) {
    const pick = el.querySelector('input[type=radio]:checked');
    if (!pick) continue;
    const w = Number(el.dataset.w || 1);
    for (const kv of pick.value.split(';')) {
      const [k, v] = kv.split(':'); if (!v) continue;
      tally[k][v] = (tally[k][v] || 0) + (Number(el.dataset['w' + k]) || w);
    }
  }
  const raw = ($('[data-name]').value || '').replace(/[^\p{L}\p{M}' -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 28);
  const nm = raw ? title(raw) : 'Unnamed';
  const name = /^(house|clan|the)\s/i.test(nm) ? nm : `House ${nm}`;
  const theme = top(tally.th, data.themes);
  const pool = data.mottos.filter(m => m.t === theme);
  const motto = pool[hash(name.toLowerCase()) % pool.length];
  const metal = top(tally.m, ['#d4af5a', '#e8e4d8']);
  const d = { name: name.slice(0, 40), motto: title(motto.la).slice(0, 48), f: top(tally.t, data.tinctures), d: metal,
    c: metal === '#d4af5a' ? '#f3dc92' : '#e8e4d8', div: top(tally.d, data.divisions), ch: top(tally.c, data.charges), bg:'parch' };
  const arc = data.archetypes[d.ch];
  steps.forEach(el => { el.hidden = true; });
  $('[data-nav]').hidden = true;
  const out = $('[data-result]'); out.hidden = false;
  out.querySelector('[data-r-art]').innerHTML = C.svg(d, 'quiz', `Your coat of arms: ${d.name}`);
  out.querySelector('[data-r-title]').textContent = `You are ${arc.title} of ${d.name}`;
  out.querySelector('[data-r-desc]').textContent = arc.desc;
  out.querySelector('[data-r-motto]').textContent = `Your motto: ${motto.la} ("${motto.en}")`;
  out.querySelector('[data-r-blazon]').textContent = C.blazon(d);
  out.querySelector('[data-r-mean]').textContent = C.meaning(d);
  out.querySelector('[data-r-edit]').href = C.studioUrl(d);
  out.querySelector('[data-r-buy]').href = C.studioUrl(d);
  const shareUrl = `https://usurp.games/c/${C.enc(d)}?via=quiz`;
  out.querySelector('[data-r-share]').onclick = async () => {
    const text = `I'm ${arc.title} of ${d.name}. What's your coat of arms?`;
    try {
      if (navigator.share && matchMedia('(pointer:coarse)').matches) await navigator.share({ title:'My coat of arms', text, url: shareUrl });
      else { await navigator.clipboard.writeText(`${text} ${shareUrl}`); out.querySelector('[data-r-note]').textContent = 'Copied. Paste it anywhere: the link previews your crest.'; }
    } catch (e) { out.querySelector('[data-r-note]').textContent = shareUrl; }
    if (window.clarity) try { window.clarity('event', 'quiz_share'); } catch (e) {}
  };
  out.scrollIntoView({ behavior:'smooth', block:'start' });
  if (window.clarity) try { window.clarity('event', 'quiz_complete'); } catch (e) {}
}
steps.forEach((el, i) => {
  el.addEventListener('change', e => { if (e.target.type === 'radio') setTimeout(() => show(Math.min(i + 1, total - 1)), 180); });
});
$('[data-back]').onclick = () => show(Math.max(0, at - 1));
$('[data-finish]').onclick = () => {
  const missing = steps.findIndex(el => el.querySelector('input[type=radio]') && !el.querySelector('input[type=radio]:checked'));
  if (missing >= 0) { show(missing); $('[data-progress]').textContent = `Pick an answer for question ${missing + 1}`; return; }
  result();
};
$('[data-name]').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('[data-finish]').click(); } });
$('[data-again]').onclick = () => { $$('input[type=radio]').forEach(r => { r.checked = false; }); $('[data-result]').hidden = true; $('[data-nav]').hidden = false; show(0); $('[data-quiz]').scrollIntoView({ behavior:'smooth' }); };
// Arrived from a friend's shared result?
const r = new URLSearchParams(location.search).get('r');
if (r && C.dec) {
  const fd = C.dec(r);
  if (fd) {
    const box = $('[data-friend]'); box.hidden = false;
    box.querySelector('[data-f-art]').innerHTML = C.svg(fd, 'friend', `A friend's coat of arms: ${fd.name}`);
    box.querySelector('[data-f-name]').textContent = fd.name;
  }
}
show(0);
})();
