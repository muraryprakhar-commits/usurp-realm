#!/usr/bin/env python3
"""Renders on-brand social images and short vertical videos from real Crest Studio crests.
Used by the /dailypublish skill. Same crest engine as the site (crest-core.js), local fonts, no AI image models.

Usage, from the repo root:
  python3 tools/social_media.py spec.json

spec.json:
{
  "out": "content/day1/pinterest",
  "items": [
    {"type": "grid",   "file": "pin.png",  "size": "1000x1500", "headline": "...", "sub": "...", "crests": [CREST, ...]},
    {"type": "single", "file": "post.png", "size": "1080x1350", "headline": "...", "sub": "...", "crest": CREST},
    {"type": "reel",   "file": "reel.mp4", "seconds_per_crest": 2.2, "intro": "...", "outro": "...",
                       "crests": [{"crest": CREST, "caption": "..."}, ...]}
  ]
}
CREST = {"name": "House Okafor", "motto": "Together We Rise", "f": "#1f4e8a", "d": "#d4af5a",
         "c": "#f3dc92", "div": "chevron", "ch": "mullet", "bg": "parch"}
Crests must follow the rule of tincture and use the emblems and tinctures listed in tools/usecases.py.
Sizes: 1080x1350 (LinkedIn, Instagram, X), 1080x1080 (square), 1000x1500 (Pinterest), 1080x1920 (story).
Every image carries the usurp.games footer. Reels are silent H.264 MP4, 1080x1920, 30 fps.
"""
import html, json, os, shutil, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = html.escape
FPS = 30


def crest_svgs(crests):
    items = [{'d': c, 'uid': f'c{i}', 'label': c.get('name', '')} for i, c in enumerate(crests)]
    out = subprocess.run(['node', os.path.join(ROOT, 'tools', 'render.js')], input=json.dumps(items),
                         capture_output=True, text=True, check=True).stdout
    return [r['svg'] for r in json.loads(out)]


def page(w, h, inner, extra_css=''):
    f = 'file://' + os.path.join(ROOT, 'fonts')
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:'Cinzel';font-weight:400 900;src:url({f}/cinzel-latin.woff2) format('woff2')}}
@font-face{{font-family:'Cinzel Decorative';font-weight:700;src:url({f}/cinzel-decorative-700-latin.woff2) format('woff2')}}
@font-face{{font-family:'Cinzel Decorative';font-weight:900;src:url({f}/cinzel-decorative-900-latin.woff2) format('woff2')}}
@font-face{{font-family:'IM Fell English';src:url({f}/im-fell-english-latin.woff2) format('woff2')}}
@font-face{{font-family:'IM Fell English';font-style:italic;src:url({f}/im-fell-english-italic-latin.woff2) format('woff2')}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{w}px;height:{h}px;overflow:hidden}}
body{{background:radial-gradient(ellipse at 50% 30%,#2a231c 0%,#14110e 70%);color:#e8dcc2;font-family:'IM Fell English',Georgia,serif;
  display:flex;flex-direction:column;align-items:center;padding:{round(h*0.05)}px {round(w*0.06)}px {round(h*0.035)}px;border:{max(6,w//120)}px solid #8a6a24}}
.h{{font-family:'Cinzel Decorative',serif;font-weight:900;color:#f3dc92;text-align:center;line-height:1.08;font-size:{round(w*0.068)}px}}
.s{{font-size:{round(w*0.036)}px;text-align:center;color:#e8dcc2;margin-top:{round(h*0.014)}px;line-height:1.3}}
.art{{flex:1;width:100%;display:flex;align-items:center;justify-content:center;min-height:0}}
.art svg{{height:100%;max-width:100%}}
.grid{{display:grid;gap:{round(w*0.03)}px;width:100%;flex:1;min-height:0;align-content:center;justify-items:center}}
.grid svg{{width:100%;height:auto;max-height:100%}}
.foot{{font-family:'Cinzel',serif;font-weight:700;letter-spacing:.12em;color:#d4af5a;font-size:{round(w*0.032)}px;margin-top:{round(h*0.012)}px}}
{extra_css}</style></head><body>{inner}</body></html>'''


def size(s):
    w, h = s.lower().split('x')
    return int(w), int(h)


def shoot(pg, html_doc, w, h, dst, tmp):
    p = os.path.join(tmp, 'p.html')
    open(p, 'w').write(html_doc)
    pg.set_viewport_size({'width': w, 'height': h})
    pg.goto('file://' + p)
    pg.evaluate('document.fonts.ready')
    pg.wait_for_timeout(150)
    pg.screenshot(path=dst)


def head(it):
    s = f'<div class="h">{E(it.get("headline", ""))}</div>'
    if it.get('sub'):
        s += f'<div class="s">{E(it["sub"])}</div>'
    return s


def grid(it, w, h):
    svgs = crest_svgs(it['crests'])
    n = len(svgs)
    cols = 1 if n == 1 else 2 if n in (2, 4) else 3
    inner = head(it) + f'<div class="grid" style="grid-template-columns:repeat({cols},1fr)">{"".join(svgs)}</div><div class="foot">USURP.GAMES</div>'
    return page(w, h, inner)


def single(it, w, h):
    svg = crest_svgs([it['crest']])[0]
    return page(w, h, head(it) + f'<div class="art">{svg}</div><div class="foot">USURP.GAMES</div>')


def reel(it, pg, dst, tmp):
    w, h = 1080, 1920
    items = it['crests']
    svgs = crest_svgs([c['crest'] for c in items])
    per = float(it.get('seconds_per_crest', 2.2))
    intro, outro = 1.8, 2.4
    total = intro + per * len(items) + outro
    css = ['.slide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 80px;opacity:0}',
           '.slide svg{width:86%;height:auto}', '.cap{font-family:Cinzel,serif;font-weight:700;font-size:54px;color:#f3dc92;text-align:center;margin-top:40px;line-height:1.2}',
           '.big{font-family:"Cinzel Decorative",serif;font-weight:900;font-size:92px;color:#f3dc92;text-align:center;line-height:1.1}',
           '.sm{font-size:50px;text-align:center;margin-top:30px}',
           '@keyframes show{0%{opacity:0;transform:scale(.92)}12%{opacity:1;transform:scale(1)}88%{opacity:1;transform:scale(1.02)}100%{opacity:0;transform:scale(1.03)}}']
    slides, t = [], 0.0

    def add(content, dur):
        nonlocal t
        slides.append(f'<div class="slide" style="animation:show {dur}s linear {t}s both">{content}</div>')
        t += dur
    add(f'<div class="big">{E(it.get("intro", ""))}</div>', intro)
    for c, s in zip(items, svgs):
        add(f'{s}<div class="cap">{E(c.get("caption", ""))}</div>', per)
    add(f'<div class="big">{E(it.get("outro", "Design yours free"))}</div><div class="sm">usurp.games</div>', outro)
    doc = page(w, h, ''.join(slides), '\n'.join(css)).replace('display:flex;flex-direction:column;align-items:center;padding', 'position:relative;padding', 1)
    p = os.path.join(tmp, 'reel.html')
    open(p, 'w').write(doc)
    pg.set_viewport_size({'width': w, 'height': h})
    pg.goto('file://' + p)
    pg.evaluate('document.fonts.ready')
    frames = os.path.join(tmp, 'frames')
    os.makedirs(frames, exist_ok=True)
    pg.evaluate('document.getAnimations().forEach(a => a.pause())')
    for i in range(int(total * FPS)):
        pg.evaluate(f'document.getAnimations().forEach(a => a.currentTime = {i * 1000 / FPS})')
        pg.screenshot(path=os.path.join(frames, f'f{i:04d}.png'))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(frames, 'f%04d.png'),
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dst], check=True)


def main(spec_path):
    spec = json.load(open(spec_path))
    out = os.path.join(ROOT, spec['out'])
    os.makedirs(out, exist_ok=True)
    tmp = tempfile.mkdtemp()
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page()
            for it in spec['items']:
                dst = os.path.join(out, it['file'])
                if it['type'] == 'reel':
                    reel(it, pg, dst, tmp)
                else:
                    w, h = size(it.get('size', '1080x1350'))
                    doc = grid(it, w, h) if it['type'] == 'grid' else single(it, w, h)
                    shoot(pg, doc, w, h, dst, tmp)
                print(os.path.relpath(dst, ROOT))
            b.close()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main(sys.argv[1])
