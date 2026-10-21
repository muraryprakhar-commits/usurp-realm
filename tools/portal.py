#!/usr/bin/env python3
"""Builds upload-ready copies of the games for a web game portal (CrazyGames), outside the website:
    python3 tools/portal.py [out_dir]
For each game it writes <out>/crazygames/<id>/ (index.html and every file the game needs, all relative paths) and
<out>/crazygames/<id>.zip, the three cover images CrazyGames asks for (landscape 1920x1080, portrait 800x1200,
square 800x800, title only), and UPLOAD-KIT.md with the listing text.

Portal builds run with window.USURP_PORTAL = 'crazygames': ads come only from the CrazyGames SDK at natural breaks
(a level won or lost, never on a button), there are no links out, no house ads and no analytics, and the SDK is told
when gameplay starts and stops. See games/engine.js."""
import io, os, re, shutil, sys, zipfile, http.server, socketserver, threading
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import build                                      # noqa: E402  (GAMES and their texts)
import game_shots                                 # noqa: E402  (the screenshot scenes)
from PIL import Image, ImageDraw, ImageFont, ImageFilter   # noqa: E402

FONT_D = os.path.join(ROOT, 'api', 'fonts', 'CinzelDecorative-Black.ttf')
SDK = 'https://sdk.crazygames.com/crazygames-sdk-v3.js'
FONTS = ['cinzel-latin.woff2', 'cinzel-latin-ext.woff2', 'cinzel-decorative-900-latin.woff2', 'cinzel-decorative-900-latin-ext.woff2',
         'cinzel-decorative-700-latin.woff2', 'cinzel-decorative-700-latin-ext.woff2', 'im-fell-english-latin.woff2', 'im-fell-english-italic-latin.woff2']
PORTRAIT_GAMES = 'Portrait (it also plays in landscape, centred, on desktop)'
LISTING = {
    'archery': dict(cat='Sports', tags='archery, bow, medieval, skill, wind, target', controls='Hold to draw the bow, drag to aim, release to shoot. Keyboard: hold Space to draw, arrow keys to aim, release Space.'),
    'joust': dict(cat='Sports', tags='jousting, knight, horse, medieval, timing, tournament', controls='Tap (or Space) three times per pass: spur, aim the lance, strike.'),
    'castle': dict(cat='Strategy', tags='castle defense, tower defense, archers, medieval, waves', controls='Tap or click the field to shoot. A pours boiling oil, D looses a volley.'),
    'duel': dict(cat='Action', tags='sword, duel, reflex, knight, medieval, fighting', controls='Tap the left, high or right button, swipe, or use the arrow keys to parry. Space or tap to riposte.'),
    'siege': dict(cat='Puzzle', tags='trebuchet, catapult, physics, castle, destruction, siege', controls='Drag back anywhere and let go to throw. Tap FIRE POT to switch ammunition. Keyboard: arrows aim, Space throws, Enter switches ammunition.'),
    'tafl': dict(cat='Board', tags='viking chess, hnefatafl, tafl, board game, strategy, two player', controls='Tap a piece, then a marked square. Drag also works. Keyboard: arrow keys and Space.'),
    'morris': dict(cat='Board', tags="nine men's morris, mills, board game, strategy, two player, classic", controls='Tap a point to place; tap a piece and then a glowing point to move. Keyboard: arrow keys and Space.'),
}


def page(G):
    pre = ''.join(f'<link data-matter href="{x.lstrip("/").replace("games/", "")}">' for x in G.get('pre', []))
    return f'''<!doctype html><html lang="en" class="ue"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>{G["name"]}</title>
<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="games.css">
<style>.ug-portal [data-fs]{{display:none!important}}body.ug-portal{{background:#0c0a08}}</style>
<script src="{SDK}"></script>
</head><body class="ug-embed ug-portal"><main class="ue-main"><div class="ug-wrap"><div class="ug" data-game="{G["id"]}"></div></div></main>
<script>window.USURP_ADS={{}};window.USURP_PORTAL='crazygames';window.USURP_BASE='./'</script>
{pre}<script src="engine.js"></script><script src="{G["js"]}.js"></script>
</body></html>'''


def package(G, out):
    d = os.path.join(out, G['id'])
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(os.path.join(d, 'fonts'))
    with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page(G))
    for src, dst in [('games/engine.js', 'engine.js'), (f'games/{G["js"]}.js', f'{G["js"]}.js'), ('crest-core.js', 'crest-core.js'), ('games/games.css', 'games.css')]:
        shutil.copy(os.path.join(ROOT, src), os.path.join(d, dst))
    for x in G.get('pre', []):
        rel = x.lstrip('/').replace('games/', '')
        os.makedirs(os.path.dirname(os.path.join(d, rel)), exist_ok=True)
        shutil.copy(os.path.join(ROOT, x.lstrip('/')), os.path.join(d, rel))
        lic = os.path.join(ROOT, 'games', 'vendor', 'matter-LICENSE.txt')
        if 'matter' in x and os.path.exists(lic):
            shutil.copy(lic, os.path.join(d, 'vendor', 'matter-LICENSE.txt'))
    css = open(os.path.join(ROOT, 'styles.css'), encoding='utf-8').read().replace('url(/fonts/', 'url(fonts/')
    with open(os.path.join(d, 'styles.css'), 'w', encoding='utf-8') as f:
        f.write(css)
    for fn in FONTS:
        p = os.path.join(ROOT, 'fonts', fn)
        if os.path.exists(p):
            shutil.copy(p, os.path.join(d, 'fonts', fn))
    for fn in ('OFL-cinzel.txt', 'OFL-cinzeldecorative.txt', 'OFL-imfellenglish.txt'):
        if os.path.exists(os.path.join(ROOT, 'fonts', fn)):
            shutil.copy(os.path.join(ROOT, 'fonts', fn), os.path.join(d, 'fonts', fn))
    # every path must be relative: nothing may point back at usurp.games
    for root, _, files in os.walk(d):
        for fn in files:
            if fn.endswith(('.html', '.css')):
                t = open(os.path.join(root, fn), encoding='utf-8').read()
                assert 'usurp.games' not in t, (fn, 'links to the site')
    z = os.path.join(out, f'{G["id"]}.zip')
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(d):
            for fn in files:
                full = os.path.join(root, fn)
                zf.write(full, os.path.relpath(full, d))
    return d, z


def title_font(size):
    return ImageFont.truetype(FONT_D, size)


def fit_title(draw, text, max_w, start):
    size = start
    while size > 30 and draw.textlength(text, font=title_font(size)) > max_w:
        size -= 4
    return title_font(size)


def text_shadow(img, xy, text, font, anchor):
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    sd.text((xy[0] + 3, xy[1] + 5), text, font=font, fill=(0, 0, 0, 210), anchor=anchor)
    sh = sh.filter(ImageFilter.GaussianBlur(6))
    img.alpha_composite(sh)
    ImageDraw.Draw(img).text(xy, text, font=font, fill=(243, 220, 146, 255), anchor=anchor, stroke_width=3, stroke_fill=(40, 26, 10, 255))


def covers(scene, title, out, gid):
    """scene: a 3:4 RGB capture of the game. Writes landscape, portrait and square covers with only the title on them."""
    W, H = scene.size
    # Covers may carry the title and nothing else, so keep only the play area: drop the score bar on top and the
    # prompt and button bar at the bottom of the 540 x 720 game.
    scene = scene.crop((0, round(H * 62 / 720), W, round(H * 640 / 720)))
    W, H = scene.size
    def cover(w, h):
        k = max(w / W, h / H); im = scene.resize((round(W * k), round(H * k)), Image.LANCZOS)
        x, y = (im.size[0] - w) // 2, (im.size[1] - h) // 2
        return im.crop((x, y, x + w, y + h))
    # portrait 800x1200: fill, keep the middle
    s = cover(800, 1200).convert('RGBA')
    g = Image.new('RGBA', s.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
    for y in range(260): gd.line([(0, y), (800, y)], fill=(12, 10, 8, int(200 * (1 - y / 260))))
    s.alpha_composite(g); d = ImageDraw.Draw(s)
    text_shadow(s, (400, 110), title, fit_title(d, title, 720, 84), 'mm')
    s.convert('RGB').save(os.path.join(out, f'{gid}-portrait-800x1200.png'), optimize=True)
    # square 800x800: the upper middle of the scene
    q = cover(800, 800).convert('RGBA')
    g = Image.new('RGBA', q.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
    for y in range(220): gd.line([(0, y), (800, y)], fill=(12, 10, 8, int(200 * (1 - y / 220))))
    q.alpha_composite(g); d = ImageDraw.Draw(q)
    text_shadow(q, (400, 92), title, fit_title(d, title, 720, 76), 'mm')
    q.convert('RGB').save(os.path.join(out, f'{gid}-square-800x800.png'), optimize=True)
    # landscape 1920x1080: the scene blurred behind, the scene itself on the right, the title on the left
    bg = cover(1920, 1080).filter(ImageFilter.GaussianBlur(28))
    bg = Image.blend(bg, Image.new('RGB', bg.size, (12, 10, 8)), 0.5).convert('RGBA')
    fh = 1000; fw = round(W * fh / H)
    fg = scene.resize((fw, fh), Image.LANCZOS)
    bg.paste(fg, (1920 - fw - 70, 40))
    d = ImageDraw.Draw(bg)
    words, lines, cur = title.split(), [], ''
    f = title_font(110)
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) > 900 and cur:
            lines.append(cur); cur = w
        else:
            cur = t
    lines.append(cur)
    y0 = 540 - (len(lines) - 1) * 70
    for i, ln in enumerate(lines):
        text_shadow(bg, (540, y0 + i * 140), ln, f, 'mm')
    bg.convert('RGB').save(os.path.join(out, f'{gid}-landscape-1920x1080.png'), optimize=True)


def capture(out):
    from playwright.sync_api import sync_playwright
    httpd = game_shots.serve(); port = httpd.server_address[1]
    shots = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1000, 'height': 1500}, device_scale_factor=2)
        for gid, (path, js) in game_shots.SCENES.items():
            pg.goto(f'http://127.0.0.1:{port}/{path}'); pg.wait_for_timeout(1500)
            for sel in game_shots.START.get(gid, ['.ug [data-p]']):
                pg.click(sel); pg.wait_for_timeout(400)
            pg.wait_for_timeout(2600 if gid in ('joust', 'duel', 'tafl') else 900)
            if gid in game_shots.AFTER:
                pg.evaluate('() => { window.__ugFreeze = false; ' + js + ' }'); pg.wait_for_timeout(game_shots.AFTER[gid]); pg.evaluate('() => { window.__ugFreeze = true; }')
            else:
                pg.evaluate('() => { window.__ugFreeze = false; ' + js + ' requestAnimationFrame(() => requestAnimationFrame(() => { window.__ugFreeze = true; })); }')
            pg.wait_for_timeout(300)
            png = pg.locator('.ug canvas').screenshot()
            shots[gid] = Image.open(io.BytesIO(png)).convert('RGB').resize((1200, 1600), Image.LANCZOS)
            print('captured', gid)
        b.close()
    httpd.shutdown()
    return shots


def kit(out, built):
    lines = ['# CrazyGames upload kit', '',
             'One folder and one zip per game. Upload the zip; the folder is the same files, for testing.', '',
             '## Before the first upload (about 10 minutes, once)',
             '1. Open developer.crazygames.com and sign up as a developer with your own email.',
             '2. Fill in your payout details (CrazyGames asks for these before a submission).',
             '3. For each game: Submit a game, upload the zip, then add the three covers and the text below.',
             '', 'CrazyGames reviews each game. A new game starts in Basic Launch, where ads are off; games selected for Full Launch earn a share of the ads.',
             'These builds already include the CrazyGames SDK v3: ads only at natural breaks (after a level is won or lost, never during play or on a button), sound muted during ads, gameplay start and stop events, and no links or other ads.',
             'They are not published on any other game portal, which keeps them eligible.', '']
    for G, d in built:
        L = LISTING.get(G['id'], {})
        lines += [f'## {G["name"]}', f'- Zip: `{G["id"]}.zip`', f'- Covers: `{G["id"]}-landscape-1920x1080.png`, `{G["id"]}-portrait-800x1200.png`, `{G["id"]}-square-800x800.png`',
                  f'- Category: {L.get("cat", "")}', f'- Tags: {L.get("tags", "")}', f'- Orientation: {PORTRAIT_GAMES}', '- Devices: desktop and mobile',
                  f'- Short description: {G["card"]}', f'- Description: {re.sub("<[^>]+>", "", G["desc"]).replace(" No download.", "").replace(" (Free, No Download)", "")}',
                  f'- How to play: {" ".join(G["how"])}', f'- Controls: {L.get("controls", "")}', '']
    with open(os.path.join(out, 'UPLOAD-KIT.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


def main():
    out = os.path.join(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist'), 'crazygames')
    os.makedirs(out, exist_ok=True)
    built = []
    for G in build.GAMES:
        d, z = package(G, out)
        built.append((G, d))
        print('packaged', G['id'], os.path.getsize(z) // 1024, 'KB')
    shots = capture(out)
    for G in build.GAMES:
        if G['id'] in shots:
            covers(shots[G['id']], G['name'].split(':')[0] if G['id'] != 'siege' else 'Siege', out, G['id'])
    kit(out, built)
    print('done:', out)


if __name__ == '__main__':
    main()
