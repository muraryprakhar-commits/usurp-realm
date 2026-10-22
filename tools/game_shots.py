#!/usr/bin/env python3
"""Photographs each game mid-action for its thumbnail (img/games/<id>.webp, 600x800) and share image (og/game-<id>.png,
1200x630), plus a collage for the games hub (og/games.png). Run from the repo root after build.py:
    python3 tools/game_shots.py
It serves the site locally, opens each game in Chromium, sets up a dramatic moment through the local-only test hook,
freezes it and takes the picture."""
import http.server, io, os, socketserver, sys, threading
from functools import partial
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_D = os.path.join(ROOT, 'api', 'fonts', 'CinzelDecorative-Black.ttf')
FONT = os.path.join(ROOT, 'api', 'fonts', 'Cinzel-Bold.ttf')

ENEMY = """const mk = (type, x, y, o) => Object.assign({ type, x, y, tx: x, hp: 3, max: 3, spd: 30, r: { foot: 14, runner: 12, shield: 16, ladder: 22, ram: 28, catapult: 26, knight: 20 }[type],
  dmg: 4, state: 'march', t: Math.random() * 6, flash: 0, wob: 0, climb: 0, fireT: 3, stopY: 90, burn: 0, anim: 0 }, o || {});"""
SCENES = {
    'archery': ("games/archery.html", """const S = __ug.st(); S.hits = [{ x: 262, y: 414, tilt: .1 }, { x: 281, y: 433, tilt: -.25 }]; S.ends[0] = [10, 9]; S.arrow = 2;
      S.phase = 'aim'; S.holding = true; S.draw = 0.92; S.holdT = 0.9; S.aim = { x: 4, y: -6 }; S.msgT = 0; S.wind = -2.4;"""),
    'joust': ("games/joust.html", """const S = __ug.st(); Object.assign(S, { phase: 'strike', z: 4.1, locked: true, aimOff: 0.03, aim: .95, v: 18, slow: 0, tapped: false, msgs: [], phaseT: 0, me: 2, them: 1, pass: 2, score: 14 });"""),
    'castle': ("games/castle-defense.html", ENEMY + """const S = __ug.st(); S.queue = []; S.wave = 5; S.score = 1240; S.hp = 74; S.oil = { cd: 22, t: 0 }; S.volley = { cd: 18, t: 7 }; S.bannerT = 0; S.quiver = 4; S.maxQ = 8;
      S.enemies = [mk('catapult', 410, 96, { state: 'aim', hp: 6, max: 6 }), mk('foot', 120, 170), mk('runner', 300, 210, { hp: 1, max: 1 }), mk('shield', 200, 300),
        mk('foot', 360, 330, { hp: 1, max: 1 }), mk('shield', 450, 380, { hp: 2 }), mk('ram', 272, 470, { hp: 9, max: 12 }), mk('ladder', 120, 560, { state: 'climb', climb: .6, hp: 4, max: 4 }),
        mk('foot', 410, 590, { state: 'attack', hp: 1, max: 1 }), mk('runner', 80, 300, { hp: 1, max: 1 })];
      S.arrows = [{ x0: 270, y0: 600, x1: 272, y1: 470, t: .55, dur: .4, dmg: 1 }, { x0: 448, y0: 600, x1: 360, y1: 330, t: .4, dur: .45, dmg: 1 }, { x0: 92, y0: 600, x1: 200, y1: 300, t: .7, dur: .5, dmg: 1 }];
      S.aim = [272, 470];"""),
    'duel': ("games/sword-duel.html", """const S = __ug.st(); Object.assign(S, { phase: 'attack', msgs: [], hearts: 2, score: 385, streak: 3, valour: 2 });
      S.atk = { dir: 'R', fake: null, T: 1, t: 0.88, switchAt: 0, input: null, inputT: 0, done: false };"""),
    'siege': ("games/trebuchet-game.html", """__ug.start(4); setTimeout(() => { const S = __ug.st(); S.aim.a = 0.62; S.aim.p = 0.93;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); }, 2300);"""),
    'tafl': ("games/viking-chess.html", """const S = __ug.st(), B = S.B; B.fill(0);
      [[0,3],[1,3],[5,3],[6,2],[3,0],[2,1],[3,5],[4,6],[1,5]].forEach(([x, y]) => B[y * 7 + x] = 1);
      [[2,3],[4,3],[3,4]].forEach(([x, y]) => B[y * 7 + x] = 2); B[2 * 7 + 5] = 3;
      Object.assign(S, { turn: 2, sel: 2 * 7 + 5, msgT: 0, think: 0, last: { f: 3 * 7 + 5, t: 2 * 7 + 5 }, taken: { 1: 1, 2: 2 } });"""),
    'morris': ("games/nine-mens-morris.html", """const S = __ug.st(), b = S.b; b.fill(0);
      [0, 1, 2, 9, 17, 12, 22].forEach(i => b[i] = 1); [3, 4, 5, 10, 14, 19].forEach(i => b[i] = 2);
      Object.assign(S, { h: [0, 2, 3], turn: 1, removing: true, msgT: 0, mill: { pts: [0, 1, 2], t: 0.15, p: 1 }, last: { f: -1, t: 2, p: 1 }, thinking: 0 });"""),
}
# menus: a first-time visitor sees 'start here' first in Viking chess and the training yard first in the duel
START = {'tafl': ['.ug [data-c="1"]', '.ug [data-c="1"]'], 'morris': ['.ug [data-c="1"]'], 'duel': ['.ug [data-c="1"]']}
AFTER = {'siege': 3700}


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = partial(Quiet, directory=ROOT)
    httpd = socketserver.TCPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def grab(page, port, gid):
    path, js = SCENES[gid]
    page.goto(f'http://127.0.0.1:{port}/{path}')
    page.wait_for_timeout(1500)
    for sel in START.get(gid, ['.ug [data-p]']):
        page.click(sel); page.wait_for_timeout(400)
    page.wait_for_timeout(2600 if gid in ('joust', 'duel', 'tafl') else 900)
    if gid in AFTER:
        page.evaluate('() => { window.__ugFreeze = false; ' + js + ' }')
        page.wait_for_timeout(AFTER[gid])
        page.evaluate('() => { window.__ugFreeze = true; }')
    else:
        page.evaluate('() => { window.__ugFreeze = false; ' + js + ' requestAnimationFrame(() => requestAnimationFrame(() => { window.__ugFreeze = true; })); }')
    page.wait_for_timeout(300)
    png = page.locator('.ug canvas').screenshot()
    return Image.open(io.BytesIO(png)).convert('RGB').resize((600, 800), Image.LANCZOS)


def og_image(thumb, title, sub, out):
    W, H = 1200, 630
    bg = Image.new('RGB', (W, H), (20, 17, 14))
    glow = Image.new('RGB', (W, H), (20, 17, 14)); d = ImageDraw.Draw(glow)
    d.ellipse((-200, -260, 820, 760), fill=(70, 46, 22)); glow = glow.filter(ImageFilter.GaussianBlur(120))
    bg = Image.blend(bg, glow, 0.8)
    t = thumb.resize((450, 600), Image.LANCZOS)
    frame = Image.new('RGB', (462, 612), (138, 106, 36)); frame.paste(t, (6, 6))
    bg.paste(frame, (W - 462 - 42, 9))
    d = ImageDraw.Draw(bg)
    small, big, mid = ImageFont.truetype(FONT, 26), ImageFont.truetype(FONT_D, 58), ImageFont.truetype(FONT, 30)
    d.text((60, 120), 'FREE MEDIEVAL GAME', font=small, fill=(212, 175, 90))
    y = 170
    words, line = title.split(), ''
    for w in words:
        test = (line + ' ' + w).strip()
        if d.textlength(test, font=big) > 600 and line:
            d.text((60, y), line, font=big, fill=(243, 220, 146)); y += 72; line = w
        else:
            line = test
    d.text((60, y), line, font=big, fill=(243, 220, 146)); y += 96
    for ln in sub:
        d.text((60, y), ln, font=mid, fill=(232, 220, 194)); y += 44
    d.text((60, H - 70), 'usurp.games/games', font=small, fill=(168, 153, 124))
    bg.save(out, optimize=True)


def main():
    httpd = serve(); port = httpd.server_address[1]
    os.makedirs(os.path.join(ROOT, 'img', 'games'), exist_ok=True)
    thumbs = {}
    subs = {'archery': ['Hold to draw. Aim into the wind.', 'Nine arrows, three distances.'],
            'joust': ['Spur, aim, strike.', 'Unhorse five knights.'],
            'castle': ['Loose arrows, stop the rams.', 'How many waves can you hold?'],
            'duel': ['Read the blade. Parry. Riposte.', 'How fast are your hands?'],
            'siege': ['Fling stones. Topple castles.', 'Ten castles, real physics.'],
            'tafl': ['Get the king to a corner,', 'or trap him. Hnefatafl.'],
            'morris': ['Make mills, take pieces.', 'Can you beat the Lord?']}
    titles = {'archery': "The King's Archery Contest", 'joust': 'The Joust', 'castle': 'Hold the Castle', 'duel': 'Duel',
              'siege': 'Siege: The Trebuchet Game', 'tafl': 'Viking Chess', 'morris': "Nine Men's Morris"}
    only = sys.argv[1:]
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={'width': 900, 'height': 1250}, device_scale_factor=1)
        for gid in SCENES:
            if only and gid not in only:
                p_ = os.path.join(ROOT, 'img', 'games', f'{gid}.webp'); thumbs[gid] = Image.open(p_).convert('RGB'); continue
            page.evaluate('() => { try { localStorage.clear(); } catch (e) {} }') if page.url.startswith('http') else None
            im = grab(page, port, gid); thumbs[gid] = im
            im.save(os.path.join(ROOT, 'img', 'games', f'{gid}.webp'), 'WEBP', quality=82, method=6)
            im.resize((400, 533), Image.LANCZOS).save(os.path.join(ROOT, 'img', 'games', f'{gid}-400.webp'), 'WEBP', quality=80, method=6)   # phones
            og_image(im, titles[gid], subs[gid], os.path.join(ROOT, 'og', f'game-{gid}.png'))
            print('shot', gid)
        b.close()
    # hub collage
    W, H = 1200, 630
    bg = Image.new('RGB', (W, H), (20, 17, 14)); d = ImageDraw.Draw(bg)
    order = ['siege', 'tafl', 'archery', 'joust', 'morris', 'castle', 'duel']
    n = len(order); tw = (W - 40 - (n - 1) * 10) // n; th = tw * 4 // 3
    for i, gid in enumerate(order):
        t = thumbs[gid].resize((tw - 6, th - 6), Image.LANCZOS)
        fr = Image.new('RGB', (tw, th), (138, 106, 36)); fr.paste(t, (3, 3)); bg.paste(fr, (20 + i * (tw + 10), 200))
    d.text((W // 2, 70), 'MEDIEVAL  GAMES', font=ImageFont.truetype(FONT_D, 64), fill=(243, 220, 146), anchor='mm')
    d.text((W // 2, 140), 'Trebuchet · Viking chess · Archery · Jousting · and more', font=ImageFont.truetype(FONT, 30), fill=(232, 220, 194), anchor='mm')
    d.text((W // 2, 600), 'Free in your browser · usurp.games/games', font=ImageFont.truetype(FONT, 22), fill=(168, 153, 124), anchor='mm')
    bg.save(os.path.join(ROOT, 'og', 'games.png'), optimize=True)
    httpd.shutdown()
    print('done')


if __name__ == '__main__':
    main()
