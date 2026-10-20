#!/usr/bin/env python3
"""Renders the sample product images shown on the homepage (img/home/) with the Studio's own file builders,
so the homepage shows exactly what a buyer receives. Run with the site served locally:
  python3 -m http.server 8765   (in the repo root, another shell)
  python3 tools/home_assets.py"""
import base64, io, json, os
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'img', 'home')
HERO = {'name': 'The Carter Family', 'motto': 'Fortis et Fidelis', 'f': '#1f4e8a', 'd': '#d4af5a', 'c': '#f3dc92', 'div': 'plain', 'ch': 'lion', 'bg': 'parch'}
KIT = {'name': 'Ironhold Brewing Co.', 'motto': 'Brewed With Patience', 'f': '#1d1915', 'd': '#d4af5a', 'c': '#f3dc92', 'div': 'chevron', 'ch': 'wheat', 'bg': 'clear'}


def save(png_bytes, name, width, q=84):
    im = Image.open(io.BytesIO(png_bytes)).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name), 'JPEG', quality=q, optimize=True, progressive=True)
    print('saved', name, im.size)


def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(accept_downloads=True); pg = ctx.new_page()
        pg.goto('http://localhost:8765/crest.html'); pg.wait_for_timeout(1500)
        for fn, call, w in [('certificate-of-arms-sample.jpg', 'downloadCertificate(d,{to:"The Carter Family",from:"Grandma Ruth"})', 900),
                            ('phone-wallpaper-sample.jpg', 'downloadWallpaper(d)', 600), ('profile-picture-sample.jpg', 'downloadAvatar(d)', 600)]:
            with pg.expect_download(timeout=60000) as dl:
                pg.evaluate('d => window.__crest.' + call, HERO)
            save(open(dl.value.path(), 'rb').read(), fn, w)
        b64 = pg.evaluate('''async d => { const bl = await window.__crest.bannerBlob(d, 1500, 500, 1100, 340);
            return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(',')[1]); fr.readAsDataURL(bl); }); }''', KIT)
        save(base64.b64decode(b64), 'logo-kit-banner-sample.jpg', 1200)
        b.close()


if __name__ == '__main__':
    main()
