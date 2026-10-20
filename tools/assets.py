#!/usr/bin/env python3
"""Builds the free printable templates (SVG, PNG, PDF) and the 1200x630 share images for each page.
Run from the repo root after build.py:  python3 tools/assets.py"""
import json, os, subprocess, sys
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from data import *  # noqa

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = '<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;700&family=IM+Fell+English&display=swap" rel="stylesheet">'

# ---------------------------------------------------------------- printable templates (US Letter, 850 x 1100)
S, TX, TY = 6.2, 115, 132.8
SHIELD = 'M6 6H94V56C94 88 72 106 50 116C28 106 6 88 6 56Z'
SERIF = "Cinzel, Georgia, 'Times New Roman', serif"
BODY = "Georgia, 'Times New Roman', serif"


def tpl(kind):
    parts = [f'<rect width="850" height="1100" fill="#fff"/>',
             f'<text x="425" y="92" text-anchor="middle" font-family="{SERIF}" font-size="30" font-weight="700" fill="#222">Coat of Arms of</text>',
             '<line x1="215" y1="128" x2="635" y2="128" stroke="#999" stroke-width="1.5"/>']
    inner = ''
    if kind in ('quartered', 'worksheet'):
        inner = '<line x1="50" y1="0" x2="50" y2="122" stroke="#222" stroke-width=".5"/><line x1="0" y1="58" x2="100" y2="58" stroke="#222" stroke-width=".5"/>'
    parts.append(f'''<defs><clipPath id="sh"><path d="{SHIELD}"/></clipPath></defs>
<g transform="translate({TX} {TY}) scale({S})"><g clip-path="url(#sh)">{inner}</g>
<path d="{SHIELD}" fill="none" stroke="#222" stroke-width=".7"/></g>''')
    if kind == 'worksheet':
        prompts = [(288, 205, ['Something your family', 'loves to do']), (562, 205, ['Where your family', 'comes from']),
                   (288, 525, ['A value your family', 'lives by']), (562, 525, ['An object that', 'represents you'])]
        for x, y, lines in prompts:
            for i, ln in enumerate(lines):
                parts.append(f'<text x="{x}" y="{y + i * 20}" text-anchor="middle" font-family="{BODY}" font-size="16" font-style="italic" fill="#888">{ln}</text>')
    parts.append('''<g transform="translate(0 51.25) scale(.85)" stroke="#222" stroke-width="2.4" fill="#fff">
<path d="M120 1010L190 985L190 1085L120 1110L150 1060Z"/><path d="M880 1010L810 985L810 1085L880 1110L850 1060Z"/>
<path d="M180 975Q500 935 820 975V1075Q500 1035 180 1075Z"/></g>''')
    if kind == 'worksheet':
        parts.append(f'<text x="425" y="935" text-anchor="middle" font-family="{BODY}" font-size="15" font-style="italic" fill="#aaa">Your family motto</text>')
    parts.append(f'<text x="425" y="1062" text-anchor="middle" font-family="{BODY}" font-size="13" fill="#888">Free template from Crest Studio · design yours in color at usurp.games/crest</text>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 1100" width="850" height="1100">{"".join(parts)}</svg>'


def render_crests(items):
    payload = json.dumps([{'d': d, 'uid': u, 'label': l} for d, u, l in items])
    out = subprocess.run(['node', os.path.join(ROOT, 'tools', 'render.js')], input=payload, capture_output=True, text=True, check=True).stdout
    return json.loads(out)


OG = {
    'family': ('Family Crest Maker', 'Design a family crest with meaning', crest('The Okafor Family', 'Together We Rise', AZURE, OR, GOLD_LIGHT, 'chevron', 'mullet')),
    'dnd': ('D&D Coat of Arms Generator', 'Sigils for houses, guilds and orders', crest('House Thornwall', 'The Root Holds', SABLE, OR, GOLD_LIGHT, 'chevron', 'tower')),
    'wedding': ('Wedding Crest Maker', 'One crest for your two names', crest('Rossi & Chen', 'Omnia Vincit Amor', AZURE, OR, ARGENT, 'perpale', 'rose')),
    'clan': ('Clan and Guild Logo Maker', 'Heraldic emblems for gaming groups', crest('Iron Ravens', 'Swift and Unseen', SABLE, OR, GOLD_LIGHT, 'bend', 'sword')),
    'school': ('School House Crests', 'Four houses for your classroom', crest('House Sapientia', 'Sapere Aude', AZURE, ARGENT, ARGENT, 'bend', 'key')),
    'mottos': ('Latin Motto Generator', '50+ mottos with translations', crest('House Ashford', 'Per Aspera ad Astra', MURREY, OR, GOLD_LIGHT, 'chevron', 'mullet')),
    'houses': ('Fantasy House Name Generator', 'A name, motto and sigil in one click', crest('House Duskmere', 'We Rise by Night', PURPURE, ARGENT, ARGENT, 'perpale', 'crescent')),
    'meanings': ('Heraldry Symbols and Meanings', 'Colors, divisions and emblems explained', crest('House Valemont', 'Veritas Vincit', GULES, OR, GOLD_LIGHT, 'quarterly', 'crown')),
    'templates': ('Free Coat of Arms Templates', 'Printable shields and a family crest worksheet', None),
    'surname': ('Family Crest Generator', 'Six crests for your last name in one click', crest('The Carter Family', 'Together We Rise', AZURE, OR, GOLD_LIGHT, 'chevron', 'initial')),
    'quiz': ('What Would Your Coat of Arms Be?', 'A free 2-minute heraldry quiz', crest('House Ashford', 'Per Aspera Ad Astra', AZURE, OR, GOLD_LIGHT, 'chevron', 'tower')),
    'ideas': ('80 Coat of Arms Ideas', 'Original crests you can customize free', crest('House Ravenmere', 'We Rise by Night', PURPURE, OR, GOLD_LIGHT, 'chevron', 'crescent')),
}
from usecases import SPECS
for _sp in SPECS:
    OG.setdefault(_sp['og'], (_sp['h1'], _sp['blurb'], _sp['examples'][0]))


def og_html(title, sub, art):
    left = f'<div class="art">{art}</div>'
    return f'''<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>
*{{margin:0;box-sizing:border-box}}body{{width:1200px;height:630px;background:#14110e radial-gradient(120% 80% at 30% 0,rgba(255,140,50,.18),transparent 60%);color:#e8dcc2;display:flex;align-items:center;gap:48px;padding:0 70px;font-family:'IM Fell English',Georgia,serif}}
.art{{width:400px;flex:none}}.art svg,.art img{{width:100%;height:auto;display:block;filter:drop-shadow(0 16px 30px rgba(0,0,0,.6))}}
.eb{{font-family:Cinzel;font-size:20px;letter-spacing:.3em;color:#d4af5a;text-transform:uppercase}}
h1{{font-family:'Cinzel Decorative';font-weight:900;font-size:60px;line-height:1.08;margin:14px 0 18px;color:#f3dc92}}
p{{font-size:32px;color:#d9c9a6}}.u{{margin-top:34px;font-family:Cinzel;font-weight:700;font-size:24px;color:#d4af5a;letter-spacing:.12em}}
</style></head><body>{left}<div><div class="eb">Crest Studio · Free</div><h1>{title}</h1><p>{sub}</p><div class="u">usurp.games</div></div></body></html>'''


def render_images(browser):
    """Renders every crest image the pages reference (tools/img-jobs.json, written by build.py) as 600x750 WebP.
    Existing files are kept (names include a hash of the design); files no page uses any more are removed."""
    from PIL import Image
    import io
    jobs_path = os.path.join(ROOT, 'tools', 'img-jobs.json')
    if not os.path.exists(jobs_path):
        return
    jobs = json.load(open(jobs_path))
    idir = os.path.join(ROOT, 'img', 'crests'); os.makedirs(idir, exist_ok=True)
    for old in os.listdir(idir):
        if old not in jobs:
            os.remove(os.path.join(idir, old))
    todo = [(fn, d) for fn, d in jobs.items() if not os.path.exists(os.path.join(idir, fn))]
    if not todo:
        print('images: all', len(jobs), 'up to date'); return
    svgs = render_crests([(d, f'im{i}', d['name']) for i, (fn, d) in enumerate(todo)])
    pg = browser.new_page(viewport={'width': 600, 'height': 750})
    pg.set_content(f'<!doctype html><html><head>{FONTS}<style>html,body{{margin:0;background:#efe1bd}}#a svg{{display:block;width:600px;height:750px}}</style></head><body><div id="a"></div></body></html>')
    pg.wait_for_timeout(1200)
    for (fn, d), r in zip(todo, svgs):
        pg.evaluate('h => { document.getElementById("a").innerHTML = h; }', r['svg'])
        pg.evaluate('document.fonts.ready')
        png = pg.locator('#a svg').screenshot()
        Image.open(io.BytesIO(png)).convert('RGB').save(os.path.join(idir, fn), 'WEBP', quality=82, method=6)
    pg.close()
    print('images: rendered', len(todo), 'of', len(jobs))


def main():
    tdir = os.path.join(ROOT, 'templates'); os.makedirs(tdir, exist_ok=True)
    odir = os.path.join(ROOT, 'og'); os.makedirs(odir, exist_ok=True)
    names = {'blank': 'shield-blank', 'quartered': 'shield-quartered', 'worksheet': 'family-crest-worksheet'}
    svgs = {}
    for kind, fn in names.items():
        svgs[fn] = tpl(kind)
        with open(os.path.join(tdir, fn + '.svg'), 'w') as f:
            f.write(svgs[fn])
    crests = render_crests([(d, f'og{i}', t) for i, (k, (t, s, d)) in enumerate(OG.items()) if d])
    ci = iter(crests)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 850, 'height': 1100})
        for fn, svg in svgs.items():
            pg.set_content(f'<!doctype html><html><head>{FONTS}<style>@page{{size:8.5in 11in;margin:0}}html,body{{margin:0;padding:0}}svg{{display:block;width:8.5in;height:11in}}</style></head><body>{svg}</body></html>')
            pg.wait_for_timeout(900)
            pg.screenshot(path=os.path.join(tdir, fn + '.png'), clip={'x': 0, 'y': 0, 'width': 850, 'height': 1100})
            pg.pdf(path=os.path.join(tdir, fn + '.pdf'), width='8.5in', height='11in', print_background=True)
        og = b.new_page(viewport={'width': 1200, 'height': 630})
        for key, (title, sub, d) in OG.items():
            if d:
                art = next(ci)['svg']
            else:
                art = svgs['family-crest-worksheet'].replace('<svg ', '<svg style="background:#fff" ', 1)
            og.set_content(og_html(title, sub, art)); og.wait_for_timeout(900)
            og.screenshot(path=os.path.join(odir, key + '.png'))
        render_images(b)
        b.close()
    print('templates:', sorted(os.listdir(tdir)))
    print('og:', sorted(os.listdir(odir)))


if __name__ == '__main__':
    main()
