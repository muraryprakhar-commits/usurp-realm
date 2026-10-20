#!/usr/bin/env python3
"""Builds a private sample page for an outreach target at /press/<key>/ (not indexed, see robots.txt).
Usage, from the repo root, with the site served locally (python3 -m http.server 8765 in another shell):
  python3 tools/press.py '[{"key":"emily","name":"Emily Reviews","design":{"name":"Emily Reviews","motto":"Tried, Tested, Loved",
                            "f":"#1f4e8a","d":"#d4af5a","c":"#e8e4d8","div":"chevron","ch":"rose","bg":"parch"}}]'
Keys: lowercase letters, digits and hyphens. Designs must follow the rule of tincture (see tools/usecases.py).
Each page gets: crest-preview.jpg (share image, use it inline in the pitch email), certificate-of-arms.jpg,
phone-wallpaper.jpg, profile-picture.jpg and index.html. Then commit and push to publish."""
import html, io, json, os, re, subprocess, sys
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = html.escape
HEAD = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>{t}</title><link rel="icon" href="/icon.svg" type="image/svg+xml"><link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&family=Cinzel:wght@700&family=IM+Fell+English&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/pages.css">
<style>.press{{max-width:900px;margin:0 auto;padding:40px 16px 60px}}.press h1{{font-size:clamp(28px,6vw,46px);margin:8px 0 14px}}.press img{{width:100%;height:auto;border:1px solid #3a2e1f}}.pgrid{{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));margin:18px 0}}.pgrid figure{{margin:0}}.pgrid figcaption{{font-size:15px;color:var(--muted);margin-top:6px}}</style></head><body><main class="press">'''
FOOT = '<p class="fine">Crest Studio by Usurp · Operated by Prakhar Murary (Murary Studios), Jaipur, Rajasthan, India · <a href="mailto:hello@usurp.games">hello@usurp.games</a></p></main></body></html>'


def jpg(png_bytes, dst, maxw=None, q=88):
    im = Image.open(io.BytesIO(png_bytes)).convert('RGB')
    if maxw and im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(dst, 'JPEG', quality=q, optimize=True, progressive=True)


def share_png(design):
    js = ("const og=require(process.argv[1]+'/api/og.js'),C=require(process.argv[1]+'/crest-core.js');"
          "const d=JSON.parse(process.argv[2]);const code=C.enc(d);const chunks=[];"
          "og({query:{d:code}},{setHeader(){},writeHead(){},end(b){process.stdout.write(JSON.stringify({code,png:b.toString('base64')}))}});")
    out = json.loads(subprocess.run(['node', '-e', js, ROOT, json.dumps(design)], capture_output=True, text=True, check=True).stdout)
    import base64
    return out['code'], base64.b64decode(out['png'])


def main(targets):
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(accept_downloads=True); pg = ctx.new_page()
        pg.goto('http://localhost:8765/crest.html'); pg.wait_for_timeout(1200)
        for t in targets:
            key = t['key']
            assert re.fullmatch(r'[a-z0-9-]{2,40}', key), key
            d = os.path.join(ROOT, 'press', key); os.makedirs(d, exist_ok=True)
            code, png = share_png(t['design'])
            jpg(png, os.path.join(d, 'crest-preview.jpg'), 1200, 84)
            for fn, call in [('certificate-of-arms', 'downloadCertificate(d,{to:"",from:""})'), ('phone-wallpaper', 'downloadWallpaper(d)'), ('profile-picture', 'downloadAvatar(d)')]:
                with pg.expect_download(timeout=60000) as dl:
                    pg.evaluate('d => window.__crest.' + call, t['design'])
                jpg(open(dl.value.path(), 'rb').read(), os.path.join(d, fn + '.jpg'), None, 90)
            name = t['name']
            body = HEAD.format(t=f'A coat of arms for {E(name)} · Crest Studio') + f'''<p class="eyebrow">Made for {E(name)}</p><h1 class="gilt">The arms of {E(name)}</h1>
<p>A sample of what a Crest Studio customer receives, designed for {E(name)}. Every file is yours to keep and use.</p>
<img src="crest-preview.jpg" width="1200" height="630" alt="Coat of arms made for {E(name)}">
<div class="pgrid">
<figure><a href="certificate-of-arms.jpg" download><img src="certificate-of-arms.jpg" alt="Certificate of arms for {E(name)}" loading="lazy"></a><figcaption>Certificate of arms (US Letter, 300 dpi), with the blazon and its meaning</figcaption></figure>
<figure><a href="phone-wallpaper.jpg" download><img src="phone-wallpaper.jpg" alt="Phone wallpaper" loading="lazy"></a><figcaption>Phone wallpaper</figcaption></figure>
<figure><a href="profile-picture.jpg" download><img src="profile-picture.jpg" alt="Profile picture" loading="lazy"></a><figcaption>Profile picture, 1080 px</figcaption></figure>
</div>
<p>Customers also get the print file at 4000 px and an SVG vector. <a href="/crest.html?d={code}">Open this crest in Crest Studio</a> to change anything, or <a href="/press/">see the press kit</a>.</p>''' + FOOT
            open(os.path.join(d, 'index.html'), 'w').write(body)
            print('press page:', f'https://usurp.games/press/{key}/', '| inline image:', f'https://usurp.games/press/{key}/crest-preview.jpg')
        b.close()


if __name__ == '__main__':
    main(json.loads(sys.argv[1]))
