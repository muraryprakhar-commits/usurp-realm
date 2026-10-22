#!/usr/bin/env python3
"""Builds the Crest Studio guide and free-tool pages, sitemap.xml and llms.txt.
Run from the repo root:  python3 tools/build.py
Pages are plain static HTML so search engines and AI crawlers read everything without JS."""
import html, json, os, re, subprocess, sys, datetime, hashlib
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(__file__))
from data import *  # noqa
from usecases import SPECS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://usurp.games'
# Advertising on the free games (and nowhere near checkout). Leave 'client' empty until Google AdSense approves
# usurp.games; then set client to the publisher ID ('ca-pub-...') and slot to a responsive display ad unit ID.
# Set h5 to True only once Google has approved the account for H5 Games Ads (between-round ads); test=True shows
# Google's test ads while checking it. ga is an optional Google Analytics 4 measurement ID for play events.
# sponsor: a directly sold banner, e.g. {'href': 'https://...', 'img': '/img/sponsors/x.png', 'alt': 'Sponsor name'}.
ADS = {'client': '', 'slot': '', 'h5': False, 'test': False, 'ga': '', 'sponsor': None}
TODAY = datetime.date.today().isoformat()
E = html.escape


def render(items):
    """items: list of (design, uid, label) -> list of {svg,url} using crest-core.js"""
    payload = json.dumps([{'d': d, 'uid': u, 'label': l} for d, u, l in items])
    out = subprocess.run(['node', os.path.join(ROOT, 'tools', 'render.js')], input=payload,
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


# ---------- crest images: real files so Google Images and Bing can index them ----------
IMG_JOBS = {}   # filename -> design, rendered by tools/assets.py
PLAIN_C = {GULES: 'red', MURREY: 'deep red', AZURE: 'blue', VERT: 'green', PURPURE: 'purple', SABLE: 'black', OR: 'gold', ARGENT: 'silver', GOLD_LIGHT: 'gold'}
# plain-English names of every emblem in crest-core.js, for image alt text
CH_PLAIN = {'tower': 'tower', 'sword': 'sword', 'crown': 'crown', 'key': 'key', 'crescent': 'crescent moon', 'rose': 'rose', 'mullet': 'star',
            'lion': 'rampant lion', 'eagle': 'eagle with spread wings', 'dragon': 'dragon', 'griffin': 'griffin', 'wolf': "wolf's head",
            'bear': 'standing bear', 'stag': "stag's head with antlers", 'horse': "horse's head", 'unicorn': "unicorn's head", 'boar': "boar's head",
            'owl': 'owl', 'raven': 'raven', 'phoenix': 'phoenix rising from flames', 'bee': 'bee', 'swords': 'pair of crossed swords', 'sun': 'sun',
            'heart': 'heart', 'flame': 'flame', 'lightning': 'lightning bolt', 'anchor': 'anchor', 'ship': 'sailing ship', 'compass': 'compass rose',
            'cross': 'cross', 'maltese': 'Maltese cross', 'fleury': 'cross with lily-tipped arms', 'highcross': 'Celtic cross', 'triquetra': 'Celtic triquetra knot',
            'fleur': 'fleur-de-lis', 'tree': 'oak tree', 'acorn': 'acorn', 'shamrock': 'shamrock', 'thistle': 'thistle', 'wheat': 'sheaf of wheat',
            'mountain': 'mountain', 'laurel': 'laurel wreath', 'book': 'open book', 'hammer': 'hammer', 'axe': 'axe', 'scales': 'pair of scales',
            'dividers': "pair of drafting compasses", 'caduceus': 'caduceus'}


def slugify(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')[:60] or 'crest'


def describe(d):
    F, D, C = PLAIN_C.get(d['f'], 'colored'), PLAIN_C.get(d['d'], 'colored'), PLAIN_C.get(d['c'], 'colored')
    div = {'plain': f'a {F} shield', 'perpale': f'a shield split down the middle in {F} and {D}',
           'quarterly': f'a shield quartered in {F} and {D}', 'chevron': f'a {F} shield with a {D} chevron',
           'fess': f'a {F} shield with a {D} horizontal band', 'bend': f'a {F} shield with a {D} diagonal band',
           'saltire': f'a {F} shield with a {D} X-shaped cross', 'pale': f'a {F} shield with a {D} vertical stripe',
           'perfess': f'a shield split across the middle in {F} and {D}', 'perbend': f'a shield split diagonally in {F} and {D}',
           'perbendsin': f'a shield split diagonally in {F} and {D}', 'perchevron': f'a {F} shield with a {D} chevron-shaped base',
           'persaltire': f'a shield divided into four triangles of {F} and {D}', 'cross': f'a {F} shield with a {D} cross',
           'pile': f'a {F} shield with a {D} wedge from the top', 'chief': f'a {F} shield with a {D} band across the top',
           'bordure': f'a {F} shield with a {D} border', 'canton': f'a {F} shield with a {D} square in the corner',
           'paly': f'a shield striped vertically in {F} and {D}', 'barry': f'a shield striped horizontally in {F} and {D}',
           'bendy': f'a shield striped diagonally in {F} and {D}', 'checky': f'a shield checkered in {F} and {D}',
           'gyronny': f'a shield divided into eight wedges of {F} and {D}'}.get(d['div'], f'a {F} shield')
    nm = re.sub(r'^(house|clan|family|the)\s+', '', d['name'], flags=re.I).strip()
    k = d['ch']
    n3 = d.get('n') == 3
    ch = '' if k == 'none' else f'the letter {(nm[:1] or "?").upper()} in {C}' if k == 'initial' else (f'three {C} emblems, each a {CH_PLAIN[k]}' if n3 else f'a {C} {CH_PLAIN[k]}')
    if d.get('sup', 'none') != 'none':
        ch = (ch + ', ' if ch else '') + f'held by two {d["sup"]} supporters'
    if d.get('helm', 'none') != 'none':
        ch = (ch + ', ' if ch else '') + {'helm': "with a knight's helm above", 'crown': 'with a crown above', 'coronet': 'with a coronet above'}[d['helm']]
    who = f'Coat of arms of {d["name"]}' if d['name'] else 'Coat of arms example'
    out = f'{who}: {div}' + (f' and {ch}' if ch else '')
    return out + (f', motto "{d["motto"]}"' if d['motto'] else '')


def crest_img(d, cls=''):
    key = hashlib.sha1(json.dumps(d, sort_keys=True).encode()).hexdigest()[:8]
    fn = f"{slugify(d['name'] or d['div'] + '-' + d['ch'])}-coat-of-arms-{key}.webp"
    IMG_JOBS[fn] = d
    c = f' class="{cls}"' if cls else ''
    return f'<img src="/img/crests/{fn}" width="600" height="750" loading="lazy" decoding="async" alt="{E(describe(d))}"{c}>'


NAV = [('/crest.html', 'Studio'), ('/games/', 'Games'), ('/coat-of-arms-quiz.html', 'Quiz'), ('/family-crest-generator.html', 'By last name'), ('/family-crest-gift.html', 'Gifts'), ('/latin-motto-generator.html', 'Mottos'),
       ('/fantasy-house-name-generator.html', 'House names'),
       ('/heraldry-symbols-and-meanings.html', 'Meanings'), ('/coat-of-arms-template.html', 'Templates')]

PAGES_INDEX = []  # (slug, title, blurb) filled by page()


def page_url(slug):
    if slug == 'index.html':
        return f'{SITE}/'
    return f'{SITE}/{slug[:-10]}' if slug.endswith('/index.html') else f'{SITE}/{slug}'


def og_image(key):
    """URL of a page's 1200x630 share image. Game images also get a JPEG copy (about a third of the PNG's weight),
    so link previews in WhatsApp and other apps load quickly and stay under their size limits."""
    png = os.path.join(ROOT, 'og', key + '.png')
    if key.startswith('game') and os.path.exists(png):
        jpg = png[:-4] + '.jpg'
        if not os.path.exists(jpg) or os.path.getmtime(jpg) < os.path.getmtime(png):
            from PIL import Image
            Image.open(png).convert('RGB').save(jpg, 'JPEG', quality=86, optimize=True, progressive=True)
        return f'{SITE}/og/{key}.jpg', 'image/jpeg'
    return f'{SITE}/og/{key}.png', 'image/png'


def head(p):
    ld = json.dumps(p['ld'], ensure_ascii=False).replace('</', '<\\/')
    img, img_type = og_image(p['og'])
    alt = E(p.get('og_alt', p['og_title']))
    return f'''<!doctype html><html lang="{p.get('lang', 'en')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(p['title'])}</title>
<meta name="description" content="{E(p['desc'])}">
<link rel="canonical" href="{page_url(p['slug'])}">
<meta property="og:title" content="{E(p['og_title'])}"><meta property="og:description" content="{E(p['desc'])}"><meta property="og:url" content="{page_url(p['slug'])}"><meta property="og:type" content="website"><meta property="og:site_name" content="Crest Studio by Usurp"><meta property="og:image" content="{img}"><meta property="og:image:type" content="{img_type}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{alt}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{E(p['og_title'])}"><meta name="twitter:description" content="{E(p['desc'])}"><meta name="twitter:image" content="{img}"><meta name="twitter:image:alt" content="{alt}">
<script type="application/ld+json">{ld}</script>
<script type="text/javascript">(function(c,l,a,r,i,t,y){{c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);}})(window,document,"clarity","script","yzjmha008x");</script>
<meta name="theme-color" content="#14110e"><link rel="icon" href="/icon.svg" type="image/svg+xml">{f'<meta name="google-adsense-account" content="{ADS["client"]}">' if ADS['client'] else ''}
<link rel="preload" href="/fonts/cinzel-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/cinzel-decorative-900-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/studio.css"><link rel="stylesheet" href="/pages.css">{p.get('head_extra', '')}
</head>'''


def header(slug):
    cur = ' aria-current="page"'
    on = lambda h: h == '/' + slug or (h == '/games/' and slug.startswith('games/'))
    links = ''.join(f'<a href="{h}"{cur if on(h) else ""}>{t}</a>' for h, t in NAV)
    return f'<header class="site-head"><div class="head-in"><a class="brand" href="/"><span class="gilt">CREST STUDIO</span></a><nav class="nav" aria-label="Site">{links}</nav></div></header>'


# Every guide page: (slug, short title, one-line blurb). Spec pages from usecases.py are appended automatically.
REGISTRY = [
    ('family-crest-generator.html', 'Crest by last name', 'Six crests for your surname in one click'),
    ('coat-of-arms-quiz.html', 'Heraldry quiz', 'What would your coat of arms be?'),
    ('coat-of-arms-ideas.html', 'Coat of arms ideas', '70+ original crests to customize'),
    ('family-crest-gift.html', 'Family crest gift', 'A personal gift with a certificate'),
    ('crest-logo-maker.html', 'Crest logo maker', 'A logo kit for clubs and businesses'),
    ('family-crest-maker.html', 'Family crest maker', 'A crest that tells your family story'),
    ('dnd-coat-of-arms-generator.html', 'D&amp;D coat of arms', 'Noble houses, guilds and orders'),
    ('wedding-crest.html', 'Wedding crest', 'A joint crest for invitations'),
    ('clan-logo-maker.html', 'Clan and guild logos', 'Emblems for gaming groups'),
    ('school-house-crests.html', 'School house crests', 'Four houses for your classroom'),
    ('latin-motto-generator.html', 'Latin motto generator', '50+ mottos with translations'),
    ('fantasy-house-name-generator.html', 'House name generator', 'A name, motto and sigil in one click'),
    ('heraldry-symbols-and-meanings.html', 'Heraldry meanings', 'What colors and emblems stand for'),
    ('coat-of-arms-template.html', 'Printable templates', 'Free blank shields and worksheets'),
    ('games/', 'Medieval games', 'Trebuchet siege, Viking chess, archery and more'),
]


def footer():
    allp = [('/crest.html', 'Coat of arms maker')] + [('/' + s, t) for s, t, _ in REGISTRY]
    links = ''.join(f'<a href="{h}">{t}</a>' for h, t in allp)
    games = ''.join(f'<a href="/{g["slug"]}">{g["short"]}</a>' for g in GAMES)
    return f'''<footer class="site-foot"><nav class="foot-links" aria-label="Crest Studio pages">{links}</nav>
<nav class="foot-links" aria-label="Games"><a href="/games/">Medieval games</a>{games}<a href="/games/embed.html">Games for your website</a></nav>
<p><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refunds</a> · <a href="/advertise.html">Advertise</a> · <a href="mailto:hello@usurp.games">hello@usurp.games</a></p>
<p>Crest Studio by Usurp · Operated by Prakhar Murary (Murary Studios), Jaipur, Rajasthan, India · <a href="/realm.html">Usurp, the game (prototype)</a></p></footer>'''


def gallery(designs, prefix, btn='Customize this crest'):
    out = render([(d, f'{prefix}{i}', f'Example coat of arms: {d["name"]}') for i, d in enumerate(designs)])
    cards = []
    for d, r in zip(designs, out):
        sub = f'<p class="sub">{E(d["motto"])}</p>' if d['motto'] else ''
        cards.append(f'<figure class="card">{crest_img(d)}<figcaption class="cap">{E(d["name"])}</figcaption>{sub}'
                     f'<a class="btn ghost" href="{r["url"]}">{btn}</a></figure>')
    return '<div class="gallery">' + ''.join(cards) + '</div>'


def faq_html(faqs):
    return '<section class="sec faq" id="faq"><h2 class="gilt center">Questions</h2>' + ''.join(
        f'<details><summary>{E(q)}</summary><p>{a}</p></details>' for q, a in faqs) + '</section>'


def faq_ld(faqs):
    import re
    strip = lambda s: html.unescape(re.sub('<[^>]+>', '', s))
    return {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}} for q, a in faqs]}


def related(exclude):
    cells = ''.join(f'<a href="/{h}"><b>{t}</b><span>{s}</span></a>' for h, t, s in REGISTRY if h != exclude)
    return f'<section class="sec"><h2 class="gilt">More free heraldry tools</h2><div class="related">{cells}</div></section>'


def crumbs(slug, name):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Crest Studio', 'item': f'{SITE}/'},
        {'@type': 'ListItem', 'position': 2, 'name': name, 'item': f'{SITE}/{slug}'}]}


def write_page(p, body):
    PAGES_INDEX.append((p['slug'], p['h1'], p['desc']))
    rel = '' if p.get('no_related') else related(p['slug'])
    # Guide pages carry one ad slot, after the FAQ and far below the Studio pitch. Until an ad network is on it shows
    # our games; with one on, /ads.js swaps in the network ad (and falls back to the games if no ad comes).
    slot, js = '', ''
    if not p.get('no_related'):
        slot = content_slot()
        if ADS['client'] and ADS['slot']:
            js = f'<script>window.USURP_ADS={ads_json()}</script><script src="{ver("/ads.js")}" defer></script>'
    doc = head(p) + '<body>' + header(p['slug']) + '<main>' + body + slot + rel + '</main>' + footer() + p.get('scripts', '') + js + '</body></html>'
    os.makedirs(os.path.dirname(os.path.join(ROOT, p['slug'])), exist_ok=True)   # allows es/... pages
    with open(os.path.join(ROOT, p['slug']), 'w', encoding='utf-8') as f:
        f.write(doc)


def hero(eyebrow, h1, lede, cta_href='/crest.html', cta='Design yours free', second=None):
    s = f'<a class="btn ghost" href="{second[0]}">{second[1]}</a>' if second else ''
    return f'''<section class="pg-hero"><p class="eyebrow">{eyebrow}</p><h1 class="gilt">{h1}</h1>
<p class="lede">{lede}</p><div class="cta-row"><a class="btn big" href="{cta_href}">{cta}</a>{s}</div></section>'''


PRICE_NOTE = 'Designing is free and needs no account. When you love it, $9 gets the whole set: print-ready art (4000 px PNG and SVG), a certificate of arms explaining its meaning, a profile picture and a phone wallpaper. For a family gift or a wax seal, the $19 Heirloom set adds an engraving, seal, bookplates and a house banner. For a club, team or business, the <a href="/crest-logo-maker.html">$29 Logo Kit</a> adds logo, icon, banner and brand files.'


def ld_base(p, extra=None):
    g = [{'@type': 'WebPage', 'name': p['h1'], 'url': page_url(p['slug']), 'description': p['desc'],
          'isPartOf': {'@type': 'WebSite', 'name': 'Crest Studio by Usurp', 'url': f'{SITE}/'}}]
    if p['slug'] != 'index.html':
        g.append(crumbs(p['slug'], p['h1']))
    if extra:
        g += extra
    return {'@context': 'https://schema.org', '@graph': g}


APP_LD = {'@type': 'WebApplication', 'name': 'Crest Studio', 'url': f'{SITE}/crest.html', 'applicationCategory': 'DesignApplication',
          'operatingSystem': 'Any (web browser)', 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD',
          'description': 'Free to design. Optional $9 one-time purchase for print-ready PNG and SVG files.'}}


# ------------------------------------------------------------------ pages

def family():
    slug = 'family-crest-maker.html'
    faqs = [
        ('Is there a real coat of arms for my surname?', 'In English and Scottish heraldry, arms belong to one person and pass to their descendants. They do not belong to everyone who shares a surname, so a "surname crest" sold online is at best the arms of one particular family line. Designing your own is the honest, personal option.'),
        ('What is the difference between a crest and a coat of arms?', 'Strictly, the crest is the small figure that sits on top of the helmet above the shield, and the coat of arms is the design on the shield. In everyday speech most people say "family crest" for the whole thing, and that is fine.'),
        ('Can I combine two family names?', 'Yes. Use a name like "House Rossi-Chen" and the Per pale division, which splits the shield into two halves. Joining two families side by side on one shield is an old heraldic custom called impalement.'),
        ('Can I put it on T-shirts, mugs or a reunion banner?', 'Yes. Once you buy the files you can use them for any lawful purpose, including printing and merchandise. The SVG scales to any size without blurring.'),
        ('Is this an official grant of arms?', 'No. It is original decorative artwork in the style of heraldry. Official grants come from heraldic authorities such as the College of Arms in England or the Court of the Lord Lyon in Scotland.'),
    ]
    p = dict(slug=slug, h1='Family Crest Maker', og='family', og_title='Family Crest Maker: design your own family crest',
             title='Family Crest Maker: Design Your Own Family Crest Free | Crest Studio',
             desc='Design your own family crest online in a minute. Choose colors, an emblem and a family motto with meaning. Free to design, $9 for print-ready PNG and SVG files.')
    p['ld'] = ld_base(p, [faq_ld(faqs), APP_LD])
    ex = [crest('The Okafor Family', 'Together We Rise', AZURE, OR, GOLD_LIGHT, 'chevron', 'mullet'),
          crest('Famiglia Rossi', 'Fortes Fortuna Adiuvat', GULES, OR, ARGENT, 'fess', 'rose'),
          crest('The Patel Family', 'Root and Branch', VERT, OR, GOLD_LIGHT, 'perpale', 'key'),
          crest('The Nguyen Family', 'Ever Onward', SABLE, OR, ARGENT, 'quarterly', 'crescent'),
          crest('The Martinez Family', 'Home Is Our Hearth', PURPURE, ARGENT, GOLD_LIGHT, 'bend', 'tower'),
          crest('The Murphy Family', 'Faithful in All Things', VERT, ARGENT, GOLD_LIGHT, 'saltire', 'initial')]
    body = hero('Heraldry, made by your family', 'Family Crest Maker',
                'Make a family crest that actually means something to your family: your colors, your emblem, your motto. ' + PRICE_NOTE,
                second=('#how', 'How to design one'))
    body += gallery(ex, 'fam')
    body += '''<section class="sec" id="how"><h2 class="gilt">Is there a "real" crest for my surname?</h2>
<p>Probably not in the way websites selling surname crests suggest. In English and Scottish heraldry a coat of arms is granted to one person and inherited by their descendants. It never belonged to everyone with the same last name. So the "Smith coat of arms" printed on a mug belongs, at most, to one Smith family line that may have nothing to do with yours.</p>
<p>That is good news. You are free to design a crest from scratch that says something true about your own family, and that is what heralds did for every new family in the first place.</p>
<div class="callout"><b>Crest or coat of arms?</b> Strictly, the crest is the small figure on top of the helmet and the coat of arms is the shield. Most people say "family crest" for the whole design, and so do we.</div></section>
<section class="sec"><h2 class="gilt">How to design a family crest with meaning</h2>
<h3>1. Pick two colors that say something about you</h3>
<p>Heraldic colors carry traditional meanings: gold for generosity, blue for loyalty, green for hope, red for courage, purple for justice. Choose one for the field and one for the division. Pair a metal (gold or silver) with a color (red, blue, green, purple or black) so it reads clearly from across a room. See <a href="/heraldry-symbols-and-meanings.html">what each color and symbol means</a>.</p>
<h3>2. Choose a division</h3>
<p>A chevron is often read as the roof of a home, which suits a family crest. Per pale splits the shield in two, the traditional way to join two families. Quarterly gives you four parts of one story.</p>
<h3>3. Choose an emblem</h3>
<p>A tower for a family that built a home and protects it. A key for trust and keeping what matters safe. A rose for love. A star for a family that aims high. A crescent for hope. Or simply your family initial.</p>
<h3>4. Write a family motto</h3>
<p>The best mottos are something your family already says. If you would like Latin, our <a href="/latin-motto-generator.html">Latin motto generator</a> has more than 50 established mottos with translations. Short mottos (under about 25 letters) print largest on the ribbon.</p>
<h3>5. Keep it simple</h3>
<p>Medieval arms were designed to be recognized on a battlefield. One strong emblem and two contrasting colors will look better on a mug, a banner or an embroidered patch than a busy design.</p></section>
<section class="sec"><h2 class="gilt">Ideas for your family crest</h2><ul>
<li>A framed print for your parents or grandparents, or for the wall of a new home</li>
<li>Family reunion T-shirts, banners and name tags</li>
<li>The cover of a family history or genealogy book</li>
<li>Wedding stationery, wax seals and signage (see the <a href="/wedding-crest.html">wedding crest maker</a>)</li>
<li>Bookplates, letterheads and a custom stamp</li>
<li>A group chat icon for the whole family</li></ul>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Start your family crest</a></p></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def dnd():
    slug = 'dnd-coat-of-arms-generator.html'
    faqs = [
        ('Can I use the crest as a token or map marker in a virtual tabletop?', 'Yes. Tick "Transparent background" before you buy and the PNG has no parchment behind it, so it sits cleanly on a battle map, a token or a character sheet.'),
        ('Can I use it in an adventure or book I sell?', 'Yes. The files are yours to use for any lawful purpose, personal or commercial, including published adventures, maps and merchandise.'),
        ('Do I need to make an account?', 'No. Designing is free and needs no sign-up. You only pay $9 if you want the full-size files.'),
        ('Is this affiliated with D&D?', 'No. Crest Studio is an independent heraldry tool and is not affiliated with Wizards of the Coast. It works for any system or setting: Pathfinder, homebrew worlds, novels or games.'),
    ]
    p = dict(slug=slug, h1='D&D Coat of Arms Generator', og='dnd', og_title='D&D Coat of Arms Generator for houses, guilds and orders',
             title='D&D Coat of Arms Generator: Sigils for Noble Houses and Guilds | Crest Studio',
             desc='Make a coat of arms for your D&D noble house, guild, knightly order or character. Free online heraldry maker with transparent PNG for maps and tokens.')
    p['ld'] = ld_base(p, [faq_ld(faqs), APP_LD])
    ex = [crest('House Thornwall', 'The Root Holds', SABLE, OR, GOLD_LIGHT, 'chevron', 'tower'),
          crest('The Ember Guild', 'By Oath and Ember', GULES, OR, GOLD_LIGHT, 'fess', 'crown'),
          crest('Order of the Key', 'Ever the Vigil', AZURE, ARGENT, GOLD_LIGHT, 'bend', 'key'),
          crest('House Duskmere', 'We Rise by Night', PURPURE, ARGENT, ARGENT, 'perpale', 'crescent'),
          crest('Wolfsbane Company', 'Steel Remembers', VERT, OR, ARGENT, 'saltire', 'sword'),
          crest('House Valemont', 'First Light, Last Stand', MURREY, OR, GOLD_LIGHT, 'quarterly', 'mullet')]
    body = hero('For game masters and worldbuilders', 'D&amp;D Coat of Arms Generator',
                'Give every noble house, guild and knightly order in your campaign a sigil your players will remember. ' + PRICE_NOTE,
                second=('/fantasy-house-name-generator.html', 'Generate a house name'))
    body += gallery(ex, 'dnd', 'Open and edit')
    body += '''<section class="sec"><h2 class="gilt">Why heraldry makes a campaign better</h2>
<p>Players forget names. They remember the black shield with the gold tower. A banner on the horizon, a seal on a letter or a crest on a dead knight's tabard tells the table who is involved before anyone speaks, and it gives you a free clue to drop.</p>
<h3>A quick recipe for a fantasy sigil</h3><ol>
<li><b>One color for temperament.</b> Black and gold for old, grim power. Red for martial houses. Blue for loyal vassals. Purple for royalty or ambition. Green for woodland or rustic houses.</li>
<li><b>One emblem for history.</b> A key for a family of wardens or jailers. A tower for border lords. A crescent for a house that rose in secret. A sword for knights. A crown for a claim to the throne, real or pretended.</li>
<li><b>A motto that hides a hook.</b> "The Root Holds" sounds noble until the party learns what is buried under the root. Need ideas? Try the <a href="/fantasy-house-name-generator.html">house name generator</a>.</li></ol>
<h3>Keep sigils readable at the table</h3>
<p>Real heralds followed the rule of tincture: never put a metal (gold, silver) on a metal or a color on a color. Gold on black reads from across a battlefield, and it reads on a phone screen or a printed handout too. Learn more in the <a href="/heraldry-symbols-and-meanings.html">heraldry meanings guide</a>.</p></section>
<section class="sec"><h2 class="gilt">Ways to use it at the table</h2><ul>
<li>Transparent PNG tokens and banners on a virtual tabletop map</li>
<li>Printed handouts: sealed letters, wanted posters, writs of passage</li>
<li>Character sheet headers and player backstory handouts</li>
<li>Your campaign wiki, world map legend or Discord server icon</li>
<li>Cover art for a homebrew setting or adventure you publish</li></ul>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Design a house sigil</a></p></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def wedding():
    slug = 'wedding-crest.html'
    faqs = [
        ('Can a stationer or wax seal maker use the file?', 'Yes. Stationers and custom stamp makers usually ask for vector artwork, and that is what the SVG file is. The 4000 px PNG works for print shops and the 1200 px PNG for websites and invitation apps.'),
        ('Can we use both of our family names?', 'Yes. Use both names, a new joint name, or your initials. Choose the Per pale division to show two halves side by side, the traditional way heraldry joins two families.'),
        ('Can I get a version without the parchment background?', 'Yes. Tick "Transparent background" and the PNG comes with no background, ready to place on any invitation design.'),
        ('What if we change our minds after buying?', 'You can request a full refund within 14 days of purchase. Your design is saved in your browser, so you can also adjust it and buy the final version.'),
    ]
    p = dict(slug=slug, h1='Wedding Crest Maker', og='wedding', og_title='Wedding Crest Maker: a coat of arms for your invitations',
             title='Wedding Crest Maker: Custom Coat of Arms for Invitations | Crest Studio',
             desc='Design a wedding crest for your invitations, signage and wax seals. Join two family names on one shield. Free to design, $9 for print-ready SVG and PNG files.')
    p['ld'] = ld_base(p, [faq_ld(faqs), APP_LD])
    ex = [crest('Rossi & Chen', 'Omnia Vincit Amor', AZURE, OR, ARGENT, 'perpale', 'rose'),
          crest('The Okafors', 'Two Hearts, One Home', MURREY, OR, GOLD_LIGHT, 'chevron', 'initial'),
          crest('Lena & Arjun', 'Ever Yours', VERT, OR, GOLD_LIGHT, 'fess', 'mullet'),
          crest('House Bell-Hart', 'Ubi Concordia, Ibi Victoria', SABLE, OR, OR, 'quarterly', 'key')]
    body = hero('For couples who want something timeless', 'Wedding Crest Maker',
                'A wedding crest turns your two names into one emblem for invitations, signage, napkins, cake toppers and wax seals. ' + PRICE_NOTE)
    body += gallery(ex, 'wed')
    body += '''<section class="sec"><h2 class="gilt">How to design a wedding crest</h2>
<h3>Join two families on one shield</h3>
<p>When two families married, heralds often placed both coats of arms side by side on one shield split down the middle. It is called impalement, and the Per pale division in the studio does exactly that: your two wedding colors, one on each half.</p>
<h3>Name: both surnames, a new name, or initials</h3>
<p>"Rossi &amp; Chen", "The Okafors" or "Lena &amp; Arjun" all work. If you choose "Your initial" as the emblem, the shield shows the first letter of the name you type.</p>
<h3>Motto: a promise, a date or Latin</h3>
<p>A short phrase you both love, your wedding date, or a classic like <i>Omnia vincit amor</i> (love conquers all). Browse the <a href="/latin-motto-generator.html">Latin motto generator</a> for more.</p>
<h3>Match your palette</h3>
<p>Navy and gold, burgundy and gold, and forest green and gold are the classic wedding pairings and all follow the heraldic rule of a metal on a color, so they print crisply in one color too.</p></section>
<section class="sec"><h2 class="gilt">Where couples use their crest</h2><ul>
<li>Invitations, save the dates and thank-you cards</li>
<li>Welcome signs, table numbers and menus</li>
<li>Custom wax seal stamps and embossers (they need vector art: the SVG)</li>
<li>Cocktail napkins, coasters and favors</li>
<li>The wedding website and your new family's letterhead afterward</li></ul>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Design your wedding crest</a></p></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def clan():
    slug = 'clan-logo-maker.html'
    faqs = [
        ('Will it work as a Discord server icon?', 'Yes. Download the 1200 px or 4000 px PNG and crop it to a square around the shield. Tick "Transparent background" for a clean cut-out.'),
        ('Can my guild print it on hoodies or banners?', 'Yes. Once bought, you can use it for any lawful purpose, including merchandise. The SVG scales to any size.'),
        ('Can I make it free?', 'Designing is free and you can share a link to your design with your group to vote on. The $9 set gives you the full-resolution files without the watermark; the $29 Logo Kit adds icons, banners and a brand sheet.'),
    ]
    p = dict(slug=slug, h1='Clan and Guild Logo Maker', og='clan', og_title='Clan and Guild Logo Maker: heraldic emblems for gaming groups',
             title='Clan Logo Maker and Guild Emblem Maker (Heraldic Style) | Crest Studio',
             desc='Make a heraldic clan logo or guild emblem for your gaming group, Discord server or esports team. Free online maker, $9 for transparent PNG and SVG.')
    p['ld'] = ld_base(p, [faq_ld(faqs), APP_LD])
    ex = [crest('Iron Ravens', 'Swift and Unseen', SABLE, OR, GOLD_LIGHT, 'bend', 'sword'),
          crest('Night Owls Guild', 'We Rise by Night', AZURE, ARGENT, ARGENT, 'fess', 'crescent'),
          crest('Crownbreakers', 'The Crown Is Earned', GULES, OR, GOLD_LIGHT, 'saltire', 'crown'),
          crest('Starfall', 'Ad Astra', PURPURE, OR, GOLD_LIGHT, 'pale', 'mullet')]
    body = hero('For guilds, clans, servers and teams', 'Clan and Guild Logo Maker',
                'A heraldic emblem looks sharp as a Discord icon, on a guild banner or on a team hoodie. ' + PRICE_NOTE)
    body += gallery(ex, 'clan', 'Edit this emblem')
    body += '''<section class="sec"><h2 class="gilt">What makes a good clan emblem</h2><ul>
<li><b>High contrast.</b> Gold or silver on a dark color stays readable at 32 pixels in a member list.</li>
<li><b>One bold emblem.</b> A crown, sword, star or crescent reads instantly. Your initial works too.</li>
<li><b>A short name.</b> One or two words fit the banner at a large size.</li>
<li><b>A battle cry for a motto.</b> Two to four words. It shows on the ribbon of the full crest and makes a good server tagline.</li></ul>
<h3>Let the group vote</h3>
<p>Click "Copy link to my design" in the studio and paste it in your server. Anyone who opens the link sees the same design and can tweak their own version.</p>
<div class="callout"><b>Need the full set of team files?</b> The <a href="/crest-logo-maker.html">$29 Crest Logo Kit</a> adds a transparent logo, a shield-only icon, a Discord server icon and banners for X, LinkedIn and YouTube.</div>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Make your clan emblem</a></p></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def school():
    slug = 'school-house-crests.html'
    faqs = [
        ('How much does a set of four house crests cost?', 'Designing is free. Each finished design is a separate $9 download, so four house crests cost $36 in total, with files you can print as large as you like.'),
        ('Can students design their own family crests?', 'Yes, and it is free to design. For a no-screen version, print our <a href="/coat-of-arms-template.html">free coat of arms templates and worksheet</a>.'),
        ('Can I use the crests on posters, certificates and shirts?', 'Yes. The files can be used for any lawful purpose, including printing for your school.'),
    ]
    p = dict(slug=slug, h1='School House Crests', og='school', og_title='School House Crests for your classroom house system',
             title='School House Crests: Make Crests for a Classroom House System | Crest Studio',
             desc='Create a crest for each house in your school or classroom house system, with Latin mottos and colors. Free to design; print-ready files for posters and certificates.')
    p['ld'] = ld_base(p, [faq_ld(faqs), APP_LD])
    ex = [crest('House Fortis', 'Audentes Fortuna Iuvat', GULES, OR, GOLD_LIGHT, 'chevron', 'sword'),
          crest('House Sapientia', 'Sapere Aude', AZURE, ARGENT, ARGENT, 'bend', 'key'),
          crest('House Caritas', 'Non Sibi Sed Omnibus', VERT, OR, GOLD_LIGHT, 'fess', 'rose'),
          crest('House Constantia', 'Per Aspera ad Astra', PURPURE, OR, GOLD_LIGHT, 'pale', 'tower')]
    body = hero('For teachers and schools', 'School House Crests',
                'A house system works best when every house has a crest students want to wear. Make all four in an afternoon. ' + PRICE_NOTE)
    body += gallery(ex, 'sch', 'Edit for your school')
    body += '''<section class="sec"><h2 class="gilt">Setting up house crests</h2>
<h3>Name each house after a virtue</h3>
<p>Latin virtue names sound like they have always been there: <i>Fortis</i> (brave), <i>Sapientia</i> (wisdom), <i>Caritas</i> (kindness and charity), <i>Constantia</i> (steadfastness). Local landmarks, rivers or notable people from your town work well too. Avoid copying houses from famous books and films, so the identity belongs to your school.</p>
<h3>One color per house</h3>
<p>Red, blue, green and purple are the usual four, each paired with gold or silver so the crest stays readable when printed in black and white.</p>
<h3>A motto students can live up to</h3>
<p>Pick from the <a href="/latin-motto-generator.html">Latin motto generator</a>, where every motto comes with its translation.</p>
<h3>Turn it into a lesson</h3>
<p>Before the reveal, have students design their own family crest on the <a href="/coat-of-arms-template.html">free printable worksheet</a>, then vote on the emblem for each house.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Design your first house crest</a></p></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def mottos():
    slug = 'latin-motto-generator.html'
    faqs = [
        ('Can I translate my own English phrase into Latin?', 'Be careful. Latin word endings change with grammar, and machine translation often gets mottos wrong. The safest choice is an established motto like the ones on this page, or a check by someone who reads Latin.'),
        ('Can I use a motto that a state, school or family already uses?', 'Short phrases are generally not protected by copyright, and many mottos here are shared by several families and institutions. Some organizations do use their mottos as trademarks, so avoid using one commercially in a way that suggests you are connected to them.'),
        ('How long should a crest motto be?', 'Under about 25 letters keeps the text at full size on the ribbon in Crest Studio. Longer mottos still fit, they just print smaller.'),
        ('Should mottos be in Latin?', 'No. English, Irish, Spanish, Hindi or any language your family speaks works. Latin is popular because it is short, traditional and reads well in capitals.'),
    ]
    p = dict(slug=slug, h1='Latin Motto Generator', og='mottos', og_title='Latin Motto Generator: 50+ mottos with translations',
             title='Latin Motto Generator: 50+ Family Crest Mottos With Translations | Crest Studio',
             desc='Find a Latin motto for your family crest, coat of arms, team or tattoo. 50+ established Latin mottos with English translations and sources, by theme. Free.')
    tool_ld = {'@type': 'WebApplication', 'name': 'Latin Motto Generator', 'url': f'{SITE}/{slug}', 'applicationCategory': 'ReferenceApplication',
               'operatingSystem': 'Any (web browser)', 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'}}
    p['ld'] = ld_base(p, [faq_ld(faqs), tool_ld])
    data = [{'la': la, 'en': en, 't': t, 's': s} for la, en, t, s in MOTTOS]
    p['scripts'] = f'<script type="application/json" id="motto-data">{json.dumps({"themes": THEMES, "mottos": data}, ensure_ascii=False)}</script><script src="/motto-gen.js" defer></script>'
    chips = '<button class="chip" type="button" data-theme="all" aria-pressed="true">All</button>' + ''.join(
        f'<button class="chip" type="button" data-theme="{k}" aria-pressed="false">{E(n)}</button>' for k, n in THEMES)
    body = hero('Free tool', 'Latin Motto Generator',
                f'{len(MOTTOS)} established Latin mottos with translations, ready for a family crest, coat of arms, team, school house or tattoo. Pick one and put it straight onto your crest.',
                cta_href='#generator', cta='Generate mottos')
    body += f'''<section class="gen" id="generator" aria-label="Motto generator"><div class="chips" role="group" aria-label="Theme">{chips}</div>
<div class="gen-out three" data-out aria-live="polite"></div>
<p class="center" style="margin-top:16px"><button class="btn" type="button" data-gen>Give me three more</button></p></section>'''
    rows = []
    for k, n in THEMES:
        items = [m for m in MOTTOS if m[2] == k]
        if not items:
            continue
        trs = ''.join(f'<tr><td class="la">{E(la)}</td><td>{E(en)}</td><td>{E(s)}</td><td><a href="/crest.html?motto={quote(la.title())}">Use on my crest</a></td></tr>' for la, en, _, s in items)
        rows.append(f'<h3 id="{k}">{E(n)}</h3><div class="tblwrap"><table class="tbl"><thead><tr><th>Latin</th><th>English</th><th>Source</th><th></th></tr></thead><tbody>{trs}</tbody></table></div>')
    body += f'<section class="sec"><h2 class="gilt">Every motto, by theme</h2><p>Sources are given where the phrase is well known from a classical author or an existing motto. The rest are traditional phrases used by many families.</p>{"".join(rows)}</section>'
    body += '''<section class="sec"><h2 class="gilt">How to choose a motto</h2><ul>
<li><b>Say it out loud.</b> A motto is something you would actually say to your family, team or yourself.</li>
<li><b>Short beats clever.</b> Two to four words read best on a ribbon and on a ring.</li>
<li><b>Match the emblem.</b> <i>Per aspera ad astra</i> with a star, <i>Semper paratus</i> with a sword, <i>Omnia vincit amor</i> with a rose.</li>
<li><b>Skip DIY Latin.</b> Use an established phrase rather than running English through a translator.</li></ul></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def houses():
    slug = 'fantasy-house-name-generator.html'
    faqs = [
        ('Are these names taken from a book or show?', 'No. Names are built from old English place-name parts (like -ford, -mere, -wick and -wall) and nature words, so they sound medieval without copying any published setting. Always do a quick search before publishing a name commercially.'),
        ('Can I edit the sigil?', 'Yes. Click "Open in Crest Studio" to change the colors, division, emblem and motto. Designing is free; $9 buys the print-ready files.'),
        ('Does it work for guilds and knightly orders?', 'Yes. Switch the style to Guild, Order or Clan to get names like "The Emberwick Guild" or "Order of the Silver Key".'),
    ]
    p = dict(slug=slug, h1='Fantasy House Name Generator', og='houses', og_title='Fantasy House Name Generator with a sigil for every house',
             title='Fantasy House Name Generator With Sigils and Mottos | Crest Studio',
             desc='Generate fantasy noble house names with a matching motto and coat of arms sigil. For D&D, novels and worldbuilding. Free, no sign-up.')
    tool_ld = {'@type': 'WebApplication', 'name': 'Fantasy House Name Generator', 'url': f'{SITE}/{slug}', 'applicationCategory': 'GameApplication',
               'operatingSystem': 'Any (web browser)', 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'}}
    p['ld'] = ld_base(p, [faq_ld(faqs), tool_ld])
    # deterministic sample list for crawlers
    import random
    rnd = random.Random(7)
    names = sorted({rnd.choice(HOUSE_A) + rnd.choice(HOUSE_B) for _ in range(120)})[:48]
    sample = ''.join(f'<li>House {E(n)}</li>' for n in names)
    p['scripts'] = (f'<script type="application/json" id="house-data">{json.dumps({"a": HOUSE_A, "b": HOUSE_B, "m": HOUSE_MOTTOS})}</script>'
                    '<script src="/crest-core.js" defer></script><script src="/house-gen.js" defer></script>')
    styles = ''.join(f'<button class="chip" type="button" data-style="{k}" aria-pressed="{"true" if k == "house" else "false"}">{n}</button>'
                     for k, n in [('house', 'Noble house'), ('guild', 'Guild'), ('order', 'Knightly order'), ('clan', 'Clan')])
    first = render([(crest('House Thornwall', 'The Root Holds', SABLE, OR, GOLD_LIGHT, 'chevron', 'tower'), 'h0', 'Generated sigil')])[0]
    body = hero('Free tool', 'Fantasy House Name Generator',
                'One click gives you a noble house name, a motto and a full coat of arms sigil. Reroll until it fits your world, then open it in Crest Studio to make it yours.',
                cta_href='#generator', cta='Generate a house')
    body += f'''<section class="gen" id="generator" aria-label="House name generator"><div class="chips" role="group" aria-label="Style">{styles}</div>
<div class="house"><div class="art" data-art>{first["svg"]}</div>
<div><p class="eyebrow">Your house</p><h2 class="gilt" data-name>House Thornwall</h2><p class="lede" data-motto>"The Root Holds"</p>
<div class="cta-row" style="justify-content:flex-start;margin-top:16px"><button class="btn" type="button" data-gen>Generate another</button><a class="btn ghost" data-open href="{first["url"]}">Open in Crest Studio</a></div>
<p class="alts" data-alts></p></div></div></section>'''
    body += f'''<section class="sec"><h2 class="gilt">How fantasy house names work</h2>
<p>Most convincing house names are old place names: a feature of the land plus a word for a settlement or landmark. <i>Ash</i> + <i>ford</i> (a river crossing by ash trees), <i>Thorn</i> + <i>wall</i>, <i>Raven</i> + <i>mere</i> (a lake). Real English surnames formed exactly this way, which is why these names feel familiar without belonging to anyone.</p>
<ul><li><b>-ford</b>: a river crossing</li><li><b>-mere</b>: a lake or pool</li><li><b>-wick</b>: a farm or trading settlement</li><li><b>-combe</b>: a narrow valley</li><li><b>-shaw</b>: a small wood</li><li><b>-bourne</b>: a stream</li><li><b>-fell</b>: a hill or high moor</li></ul>
<h3>Sample house names</h3><ul class="namelist">{sample}</ul></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def meanings():
    slug = 'heraldry-symbols-and-meanings.html'
    faqs = [
        ('Did medieval knights choose colors for their meaning?', 'Mostly no. Early heraldry was about being recognizable. The symbolic meanings of colors and charges were written down later, largely by heraldic authors in the 1500s and 1600s, and they vary from book to book. They are a fine source of inspiration for a modern crest.'),
        ('What is the rule of tincture?', 'Never put a metal on a metal or a color on a color. Gold and silver are metals; red, blue, green, purple and black are colors. Gold on blue is correct; red on blue breaks the rule and is hard to read at a distance.'),
        ('What does a crescent mean on a coat of arms?', 'It is often said to stand for hope of greater glory. In English heraldry a small crescent is also the cadency mark of a second son.'),
        ('What does a star (mullet) mean in heraldry?', 'A mullet is a five-pointed star, originally the rowel of a spur. It is often read as a sign of a person who shines or of divine favor, and in English cadency it marks a third son.'),
        ('What does a lion mean on a coat of arms?', 'Courage and strength. The lion is the most common animal in heraldry. Rearing on its hind legs it is "rampant"; walking past with one forepaw raised it is "passant".'),
        ('What does an eagle mean on a coat of arms?', 'Nobility, strength and a lofty spirit. An eagle with its wings spread is "displayed"; it has been the emblem of empires from Rome to Germany.'),
        ('What does a wolf mean in heraldry?', 'Valor, perseverance and loyalty. Wolves often appear as a head "erased", torn off at the neck with a jagged edge.'),
    ]
    p = dict(slug=slug, h1='Heraldry Symbols and Meanings', og='meanings', og_title='Heraldry Symbols and Meanings: colors, animals and emblems',
             title='Heraldry Symbols and Meanings: Coat of Arms Colors, Animals and Emblems | Crest Studio',
             desc='What the colors, animals and emblems on a coat of arms mean: lions, eagles, dragons, wolves, stags, the rule of tincture, chevrons, crosses, oak trees and more.')
    p['ld'] = ld_base(p, [faq_ld(faqs), {'@type': 'Article', 'headline': 'Heraldry Symbols and Meanings', 'author': {'@type': 'Organization', 'name': 'Crest Studio by Usurp'}, 'datePublished': TODAY, 'dateModified': TODAY, 'image': f'{SITE}/og/meanings.png'}])
    tinctures = [
        ('Or', 'Gold or yellow', 'Metal', OR, 'Generosity and elevation of mind'),
        ('Argent', 'Silver or white', 'Metal', ARGENT, 'Peace and sincerity'),
        ('Gules', 'Red', 'Color', GULES, 'Courage, military strength, the warrior or martyr'),
        ('Azure', 'Blue', 'Color', AZURE, 'Truth and loyalty'),
        ('Vert', 'Green', 'Color', VERT, 'Hope, joy and loyalty in love'),
        ('Purpure', 'Purple', 'Color', PURPURE, 'Royal majesty, sovereignty and justice'),
        ('Sable', 'Black', 'Color', SABLE, 'Constancy, sometimes grief'),
        ('Murrey', 'Mulberry, a dark red', 'Stain', MURREY, 'Patience in battle'),
    ]
    trs = ''.join(f'<tr><td><span class="sw-dot" style="background:{hx}"></span><b>{n}</b></td><td>{plain}</td><td>{kind}</td><td>{m}</td></tr>' for n, plain, kind, hx, m in tinctures)
    divs = [('chevron', 'Chevron', 'An inverted V. Often said to stand for protection or the roof of a house, which makes it a favorite for family crests.', VERT, OR),
            ('fess', 'Fess', 'A horizontal band across the middle, often linked to a military belt and readiness to serve.', AZURE, ARGENT),
            ('pale', 'Pale', 'A vertical band down the center, often read as a palisade or fortification.', GULES, OR),
            ('bend', 'Bend', "A diagonal band from the shield's top left (as you look at it) to bottom right, sometimes linked to a knight's sash.", SABLE, OR),
            ('saltire', 'Saltire', "An X-shaped cross, the cross of Saint Andrew, often said to stand for resolution.", AZURE, ARGENT),
            ('perpale', 'Per pale', 'The shield split into two halves. Historically used to join two families side by side (impalement).', MURREY, OR),
            ('quarterly', 'Quarterly', 'Four quarters, historically used to combine inherited arms. In a modern crest, four parts of one story.', PURPURE, ARGENT),
            ('plain', 'Plain', 'One color only. Rare and striking, used for some of the oldest and simplest arms.', GULES, OR)]
    dv = render([(crest('', '', f, d, GOLD_LIGHT, k, 'none'), f'dv{i}', f'{n} division example') for i, (k, n, _, f, d) in enumerate(divs)])
    dcards = ''.join(f'<figure class="card">{crest_img(crest('', '', f, d, GOLD_LIGHT, k, 'none'))}<figcaption class="cap">{n}</figcaption><p class="sub">{t}</p><a class="btn ghost" href="{r["url"]}">Try a {n.lower()}</a></figure>' for (k, n, t, f, d), r in zip(divs, dv))
    charges = [('tower', 'Tower', 'Defense, protection and the safety of a home. A good emblem for a family or a border house.', SABLE, OR, GOLD_LIGHT, 'chevron'),
               ('key', 'Key', 'Guardianship and trust. Keys are the emblem of Saint Peter, keeper of the keys of heaven.', AZURE, ARGENT, GOLD_LIGHT, 'bend'),
               ('rose', 'Rose', 'Hope and joy. The Tudor rose united the red rose of Lancaster and the white rose of York. In English cadency, a seventh son.', VERT, OR, GULES, 'fess'),
               ('crescent', 'Crescent', 'Hope of greater glory. In English cadency marks, the second son.', AZURE, ARGENT, ARGENT, 'plain'),
               ('mullet', 'Star (mullet)', 'A five-pointed star, originally a spur rowel. Read as a person who shines. In English cadency, a third son.', PURPURE, OR, GOLD_LIGHT, 'pale'),
               ('sword', 'Sword', 'Justice and military honor.', GULES, OR, ARGENT, 'chevron'),
               ('crown', 'Crown', 'Authority, victory, or loyalty to a sovereign.', AZURE, OR, OR, 'fess'),
               ('initial', 'Initial', 'A modern touch: your family or house initial, monogram style.', MURREY, OR, GOLD_LIGHT, 'chevron'),
               ('fleur', 'Fleur-de-lis', 'A stylized lily standing for purity and light, and the royal emblem of France.', AZURE, OR, GOLD_LIGHT, 'plain'),
               ('cross', 'Cross', 'Faith and service. This flared form, the cross formy (or pattée), recalls the crusading orders.', GULES, ARGENT, ARGENT, 'plain'),
               ('highcross', 'Celtic cross', 'A cross with a ring around its arms: the high cross of Ireland and Scotland.', VERT, OR, GOLD_LIGHT, 'plain'),
               ('tree', 'Oak tree', 'Strength, endurance and deep family roots. Shown with its roots, heralds call it "eradicated".', VERT, OR, GOLD_LIGHT, 'plain'),
               ('thistle', 'Thistle', 'The emblem of Scotland, standing for courage and defiance.', PURPURE, OR, GOLD_LIGHT, 'plain'),
               ('shamrock', 'Shamrock', 'The emblem of Ireland, standing for faith and good fortune.', VERT, ARGENT, ARGENT, 'plain'),
               ('anchor', 'Anchor', 'Hope and steadfastness, and a natural choice for seafaring families.', AZURE, OR, GOLD_LIGHT, 'plain'),
               ('heart', 'Heart', 'Charity and sincerity.', GULES, OR, GOLD_LIGHT, 'plain'),
               ('sun', 'Sun', 'Glory and splendor.', AZURE, OR, OR, 'plain'),
               ('swords', 'Crossed swords', 'Honor and readiness to defend.', SABLE, ARGENT, ARGENT, 'plain'),
               ('book', 'Book', 'Learning and knowledge, common in the arms of universities and schools.', GULES, ARGENT, ARGENT, 'plain'),
               ('scales', 'Scales', 'Justice and fairness, a favorite for lawyers and judges.', AZURE, OR, GOLD_LIGHT, 'plain'),
               ('ship', 'Ship (lymphad)', 'Voyages, trade and adventure across the sea.', AZURE, OR, GOLD_LIGHT, 'plain'),
               ('laurel', 'Laurel wreath', 'Victory and achievement.', VERT, OR, GOLD_LIGHT, 'plain')]
    beasts = [('lion', 'Lion', 'Courage and strength. The most common beast in heraldry; rampant (rearing on its hind legs) is its classic pose.', GULES, OR, GOLD_LIGHT, 'plain'),
              ('eagle', 'Eagle', 'Nobility, strength and a lofty spirit. Shown displayed, wings spread, it is the emblem of empires and of anyone who aims high.', AZURE, OR, GOLD_LIGHT, 'plain'),
              ('dragon', 'Dragon', 'A valiant defender of what it holds dear. The red dragon of Wales is the most famous.', SABLE, OR, GOLD_LIGHT, 'plain'),
              ('griffin', 'Griffin', 'Half eagle and half lion: vigilance and courage, the legendary guardian of treasure.', PURPURE, OR, GOLD_LIGHT, 'plain'),
              ('wolf', 'Wolf', 'Valor, perseverance and loyalty. Often shown as a head "erased", torn off at the neck, as here.', VERT, ARGENT, ARGENT, 'plain'),
              ('bear', 'Bear', 'Strength and the protection of family. The bear is the emblem of both Berlin and Bern.', AZURE, ARGENT, ARGENT, 'plain'),
              ('stag', 'Stag', 'Peace and harmony: one who will not fight unless provoked. A head shown facing out is "caboshed".', VERT, OR, GOLD_LIGHT, 'plain'),
              ('boar', 'Boar', "Bravery: a fierce fighter that never retreats. The boar's head is common in Scottish and English arms.", GULES, ARGENT, ARGENT, 'plain'),
              ('horse', 'Horse', 'Readiness to serve, speed and loyalty.', MURREY, ARGENT, ARGENT, 'plain'),
              ('unicorn', 'Unicorn', 'Purity, strength and courage. The unicorn is the national animal of Scotland.', PURPURE, ARGENT, ARGENT, 'plain'),
              ('owl', 'Owl', 'Wisdom and vigilance, a favorite for schools, libraries and scholars.', SABLE, ARGENT, ARGENT, 'plain'),
              ('raven', 'Raven', 'Wisdom and foresight. In Norse stories, two ravens carried news to Odin.', AZURE, ARGENT, ARGENT, 'plain'),
              ('phoenix', 'Phoenix', 'Renewal: rising again, stronger, from the flames.', GULES, OR, GOLD_LIGHT, 'plain'),
              ('bee', 'Bee', 'Industry and hard work. Napoleon chose golden bees as an emblem of his empire.', SABLE, OR, GOLD_LIGHT, 'plain')]

    def cards(items, pre):
        rr = render([(crest('', '', f, d, c, dv_, k), f'{pre}{i}', f'{n} emblem example') for i, (k, n, _, f, d, c, dv_) in enumerate(items)])
        return ''.join(f'<figure class="card" id="{k}">{crest_img(crest('', '', f, d, c, dv_, k))}<figcaption class="cap">{n}</figcaption><p class="sub">{t}</p><a class="btn ghost" href="{r["url"]}">Use this emblem</a></figure>' for (k, n, t, f, d, c, dv_), r in zip(items, rr))
    ccards, bcards = cards(charges, 'ch'), cards(beasts, 'bs')
    body = hero('A plain-English guide', 'Heraldry Symbols and Meanings',
                'What the colors, divisions and emblems on a coat of arms traditionally mean, and how to use them to design a crest that says something true about you.',
                cta_href='#colors', cta='Read the guide', second=('/crest.html', 'Design a crest'))
    body += '''<section class="sec"><div class="callout"><b>A word of honesty.</b> Early heralds chose colors and shapes to be recognized, not to send a message. The meanings below were written down later, mostly by heraldic authors of the 1500s and 1600s, and different books disagree. Use them as inspiration, not rules.</div></section>'''
    body += f'''<section class="sec" id="colors"><h2 class="gilt">Heraldic colors (tinctures)</h2>
<p>Heraldry calls its colors tinctures. There are two metals, five main colors and a few rarer "stains".</p>
<div class="tblwrap"><table class="tbl"><thead><tr><th>Tincture</th><th>Plain English</th><th>Type</th><th>Traditional meaning</th></tr></thead><tbody>{trs}</tbody></table></div>
<h3>The rule of tincture</h3><p>Never put a metal on a metal or a color on a color. Gold on blue reads from across a field; red on blue blurs. Every example on this site follows the rule, and following it is the single easiest way to make a crest look authentic.</p></section>'''
    body += f'<section class="sec" id="divisions"><h2 class="gilt">Divisions and ordinaries</h2><p>The broad shapes that divide or cross the shield. Heralds call bands like the chevron and fess "ordinaries" and splits like per pale "partitions".</p></section><div class="gallery">{dcards}</div>'
    body += f'<section class="sec" id="beasts"><h2 class="gilt">Heraldic animals and what they mean</h2><p>Beasts are the most loved charges in heraldry. Each has a traditional pose with its own name: a lion <i>rampant</i> rears up, an eagle <i>displayed</i> spreads its wings, a stag\'s head <i>caboshed</i> looks straight at you. All of these are in Crest Studio, drawn in the bold, flat style of real heraldic art. Deeper guides: <a href="/lion-coat-of-arms.html">lion</a>, <a href="/eagle-coat-of-arms.html">eagle</a>, <a href="/dragon-coat-of-arms.html">dragon</a> and <a href="/wolf-coat-of-arms.html">wolf</a> coats of arms.</p></section><div class="gallery">{bcards}</div>'
    body += f'<section class="sec" id="emblems"><h2 class="gilt">Symbols and emblems (charges)</h2><p>Anything placed on the shield is a charge. These are some of the 50 emblems in Crest Studio. Cadency marks, mentioned below, were small symbols English heralds used to tell sons of the same father apart.</p></section><div class="gallery">{ccards}</div>'
    body += '''<section class="sec"><h2 class="gilt">Put it together</h2><ol>
<li>Pick a metal and a color whose meanings fit you (say, Azure for loyalty and Or for generosity).</li>
<li>Choose a division with a story (a chevron for a family home, per pale to join two families).</li>
<li>Add one emblem (a key for the family that keeps everyone together).</li>
<li>Finish with a motto from the <a href="/latin-motto-generator.html">Latin motto generator</a> or your own words.</li></ol>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Design your coat of arms</a></p></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def templates():
    slug = 'coat-of-arms-template.html'
    faqs = [
        ('Are the templates really free?', 'Yes. Print as many as you like for home, classroom or library use. No sign-up and no email.'),
        ('What paper size are they?', 'The PDFs are US Letter with margins that also print fine on A4. The PNG and SVG versions can be resized for anything.'),
        ('Can students make a digital version?', 'Yes. The online <a href="/crest.html">Crest Studio</a> is free to design in, and the finished design can be shared as a link to hand in.'),
    ]
    p = dict(slug=slug, h1='Free Printable Coat of Arms Template', og='templates', og_title='Free Printable Coat of Arms Templates and Family Crest Worksheet',
             title='Free Printable Coat of Arms Template and Family Crest Worksheet (PDF) | Crest Studio',
             desc='Free printable coat of arms templates: a blank shield, a quartered family crest worksheet with prompts, and a motto banner. PDF, PNG and SVG. No sign-up.')
    p['ld'] = ld_base(p, [faq_ld(faqs)])
    tpls = [('shield-blank', 'Blank shield with motto ribbon', 'For any crest project'),
            ('shield-quartered', 'Quartered shield', 'Four sections, no prompts'),
            ('family-crest-worksheet', 'Family crest worksheet', 'With prompts for each quarter')]
    figs = ''.join(f'''<figure><img src="/templates/{k}.png" width="850" height="1100" loading="lazy" alt="{E(t)} printable template"><figcaption>{E(t)}</figcaption><p class="sub" style="text-align:left">{E(s)}</p>
<div class="dlrow"><a class="btn" href="/templates/{k}.pdf" download>PDF</a><a class="btn ghost" href="/templates/{k}.png" download>PNG</a><a class="btn ghost" href="/templates/{k}.svg" download>SVG</a></div></figure>''' for k, t, s in tpls)
    body = hero('Free to print, no sign-up', 'Free Printable Coat of Arms Template',
                'Blank shields and a family crest worksheet for classrooms, homeschool, scouts and family reunions. Download the PDF and print. Want it in full color instead? Design it online for free.',
                cta_href='#download', cta='Download templates', second=('/crest.html', 'Design it online'))
    body += f'<section class="sec" id="download"><h2 class="gilt">Download</h2><div class="tpl-grid">{figs}</div></section>'
    body += '''<section class="sec"><h2 class="gilt">Family crest activity (30 to 45 minutes)</h2><ol>
<li><b>Warm up (5 min).</b> Show a few coats of arms and ask what each one tells you about its owner. The <a href="/heraldry-symbols-and-meanings.html">heraldry meanings guide</a> has examples.</li>
<li><b>Fill the quarters (15 min).</b> On the worksheet, draw: something your family loves to do; where your family comes from; a value your family lives by; an object that represents you.</li>
<li><b>Write a motto (5 min).</b> A short phrase your family says, or a Latin motto from the <a href="/latin-motto-generator.html">motto generator</a>.</li>
<li><b>Color with meaning (10 min).</b> Pick two colors from the meanings guide and explain why.</li>
<li><b>Share (5 to 10 min).</b> Each student presents their crest in three sentences.</li></ol>
<div class="callout"><b>Make it digital:</b> students can recreate their crest in <a href="/crest.html">Crest Studio</a> for free and share the link with you. No account needed.</div></section>'''
    body += faq_html(faqs)
    write_page(p, body)


FAMILY_MOTTOS = ['Together We Rise', 'Root and Branch', 'Faithful in All Things', 'Ever Onward', 'Home Is Our Hearth',
                 'Hold Fast', 'Kindness Is Our Strength', 'Per Aspera ad Astra', 'Fortes Fortuna Adiuvat', 'Ex Unitate Vires',
                 'Semper Fidelis', 'Ubi Concordia, Ibi Victoria', 'Labor Omnia Vincit', 'Dum Spiro Spero', 'Stand Together',
                 'By Love and Labor', 'Steadfast and True', 'Faith Before Fear']


def surname():
    slug = 'family-crest-generator.html'
    faqs = [
        ('Is this the official coat of arms for my last name?', 'No. In English and Scottish heraldry, arms belong to one person and their descendants, not to everyone who shares a surname. These are original designs for your family, which you are free to use and change. <a href="/family-crest-maker.html">Read more about surname crests</a>.'),
        ('Why do I get the same designs for the same name?', 'The generator is seeded by your last name, so "Okafor" always starts with the same six ideas and you can share the link. Click "Show six more" for new ones.'),
        ('Can I change a design I like?', 'Yes. Click "Customize" to open it in Crest Studio and change any color, division, emblem or the motto. Designing is free.'),
        ('What does the $9 include?', 'Print-ready art (a 4000 px PNG, a web PNG and an SVG vector), a certificate of arms with its blazon and meaning, a 1080 px profile picture and a phone wallpaper.'),
    ]
    p = dict(slug=slug, h1='Family Crest Generator by Last Name', og='surname', og_title='Family Crest Generator: six crests for your last name',
             title='Family Crest Generator by Last Name: Free Coat of Arms Ideas | Crest Studio',
             desc='Type your last name and get six original family crest designs in one click, each with its heraldic blazon. Free to customize; $9 for print-ready files and a certificate.')
    tool_ld = {'@type': 'WebApplication', 'name': 'Family Crest Generator', 'url': f'{SITE}/{slug}', 'applicationCategory': 'DesignApplication',
               'operatingSystem': 'Any (web browser)', 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'}}
    p['ld'] = ld_base(p, [faq_ld(faqs), tool_ld])
    p['scripts'] = (f'<script type="application/json" id="fam-data">{json.dumps({"m": FAMILY_MOTTOS})}</script>'
                    '<script src="/crest-core.js" defer></script><script src="/family-gen.js" defer></script>')
    ex = [crest('The Carter Family', 'Together We Rise', AZURE, OR, ARGENT, 'chevron', 'initial'),
          crest('The Carter Family', 'Fortis et Fidelis', GULES, OR, GOLD_LIGHT, 'plain', 'lion'),
          crest('The Carter Family', 'Root and Branch', VERT, OR, GOLD_LIGHT, 'plain', 'tree'),
          crest('The Carter Family', 'Ever Onward', SABLE, OR, GOLD_LIGHT, 'plain', 'eagle'),
          crest('The Carter Family', 'Hold Fast', PURPURE, ARGENT, GOLD_LIGHT, 'fess', 'tower'),
          crest('The Carter Family', 'Peace Through Strength', MURREY, ARGENT, ARGENT, 'plain', 'stag')]
    body = hero('Free tool', 'Family Crest Generator by Last Name',
                'Type your last name and get six original family crests in one click. Each one follows real heraldic rules, comes with its blazon, and opens in a free editor so you can make it yours.',
                cta_href='#generator', cta='Try it with your name')
    body += '''<section class="gen" id="generator" aria-label="Family crest generator">
<form class="surname-form" data-form onsubmit="return false"><label class="fld"><span>Your last name</span><input type="text" maxlength="30" data-surname autocomplete="family-name" placeholder="Carter"></label>
<button class="btn" type="submit" data-go>Show my crests</button></form>
<p class="center muted-s" data-status>Showing ideas for "Carter". Type your own name above.</p></section>'''
    body += '<div data-results>' + gallery(ex, 'sur', 'Customize') + '</div>'
    body += '<p class="center"><button class="btn ghost" type="button" data-more>Show six more</button></p>'
    body += '''<section class="sec"><h2 class="gilt">How it works</h2>
<p>The generator combines the building blocks of real heraldry: a field color, a division in a contrasting metal (gold or silver), one emblem and a motto. It always follows the rule of tincture, so every design reads clearly from across a room, and it is seeded by your name, so the same name gives the same first six ideas and you can share the link with family.</p>
<h3>Choosing between designs</h3><ul>
<li><b>Go by color first.</b> Blue for loyalty, green for hope, red for courage, black for constancy, purple for justice. The <a href="/heraldry-symbols-and-meanings.html">meanings guide</a> has the full list.</li>
<li><b>Then the emblem.</b> A lion for courage, a stag for a peaceful family, an oak tree for deep roots, a tower for a family that built a home, a key for trust, or your initial for something unmistakably yours. There are 50 to choose from.</li>
<li><b>Then make it personal.</b> Open your favorite in Crest Studio and swap in a motto your family actually says, or pick one from the <a href="/latin-motto-generator.html">Latin motto generator</a>.</li></ul>
<div class="callout"><b>Why not just look up "our" crest?</b> Sites that sell a coat of arms for every surname are showing arms that belonged to one family line, which may have no connection to yours. Designing your own is honest, and it can say something true about your family today.</div>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Open the full studio</a></p></section>'''
    body += faq_html(faqs)
    write_page(p, body)


HOME_HERO = crest('The Carter Family', 'Fortis et Fidelis', AZURE, OR, GOLD_LIGHT, 'plain', 'lion')


def home():
    """The homepage: what Crest Studio is, six crests for the visitor's last name, what $9 buys, and the way into the Studio."""
    slug = 'index.html'
    faqs = [
        ("Is this my family's real coat of arms?", 'No, and be wary of sites that say otherwise. In English and Scottish heraldry, arms belong to one person and their descendants, not to everyone who shares a surname. Crest Studio helps you design an original coat of arms for your family as it is today, using real heraldic colors, rules and symbols, and tells you what every part means.'),
        ('What do I get for $9?', 'Print-ready art (a 4000 x 5000 px PNG, a web-size PNG and an SVG vector that scales to any size), a printable certificate of arms with your blazon and its meaning, a 1080 px profile picture and a phone wallpaper. The files download the moment payment goes through.'),
        ('Do I need an account?', 'No. Designing is free in your browser with no sign-up, and your design is saved on your device. You only give an email and billing details at checkout, for the receipt.'),
        ('Can I print it on mugs, shirts or canvas?', 'Yes. The files are yours to use for any lawful purpose, with any print shop or print-on-demand service. The 4000 px file prints sharply at about 13 by 16 inches, and the SVG scales to any size.'),
        ('What if I am not happy with it?', 'Email hello@usurp.games within 14 days of purchase for a full refund.'),
        ('Who makes Crest Studio?', 'Crest Studio is made by Murary Studios in Jaipur, India. Payments are handled by Dodo Payments, the merchant of record, on their secure checkout page, so card details never touch this site.'),
    ]
    p = dict(slug=slug, h1='Your Family Coat of Arms, Designed in Minutes', og='home', og_title='Design your family coat of arms free | Crest Studio',
             title='Coat of Arms Maker: Design Your Family Crest Free | Crest Studio',
             desc='Design your own family coat of arms free: 50 heraldic emblems including lions, eagles, dragons and stags, real heraldic colors and the meaning of every part. Print-ready files and a certificate of arms for $9.',
             no_related=True)
    org = {'@type': 'Organization', 'name': 'Crest Studio by Usurp', 'url': f'{SITE}/', 'logo': f'{SITE}/icon.svg', 'email': 'hello@usurp.games',
           'address': {'@type': 'PostalAddress', 'addressLocality': 'Jaipur', 'addressRegion': 'Rajasthan', 'addressCountry': 'IN'}}
    p['ld'] = ld_base(p, [faq_ld(faqs), org, APP_LD])
    p['scripts'] = (f'<script type="application/json" id="fam-data">{json.dumps({"m": FAMILY_MOTTOS})}</script>'
                    '<script src="/crest-core.js" defer></script><script src="/family-gen.js" defer></script>'
                    "<script>document.addEventListener('DOMContentLoaded',function(){var f=document.querySelector('[data-form]');if(f)f.addEventListener('submit',function(){"
                    "setTimeout(function(){var r=document.querySelector('[data-status]');if(r)r.scrollIntoView({behavior:'smooth',block:'start'})},60)})});</script>")
    hero_svg = render([(HOME_HERO, 'home', 'Coat of arms of the Carter Family: a gold lion rampant on blue, motto Fortis et Fidelis')])[0]['svg']
    ex = [crest('The Carter Family', 'Together We Rise', VERT, OR, ARGENT, 'chevron', 'initial'),
          crest('The Carter Family', 'Ever Onward', SABLE, OR, GOLD_LIGHT, 'plain', 'eagle'),
          crest('The Carter Family', 'Peace Through Strength', GULES, OR, GOLD_LIGHT, 'plain', 'stag'),
          crest('The Carter Family', 'Root and Branch', VERT, OR, GOLD_LIGHT, 'plain', 'tree'),
          crest('The Carter Family', 'Lux in Tenebris', AZURE, OR, GOLD_LIGHT, 'plain', 'fleur'),
          crest('The Carter Family', 'Loyal to the End', PURPURE, ARGENT, ARGENT, 'plain', 'wolf')]
    emblems = [('lion', 'Lion', 'Courage', GULES, OR), ('eagle', 'Eagle', 'Vision', AZURE, OR), ('dragon', 'Dragon', 'Valor', SABLE, OR),
               ('wolf', 'Wolf', 'Loyalty', VERT, ARGENT), ('stag', 'Stag', 'Peace', MURREY, OR), ('bear', 'Bear', 'Strength', AZURE, ARGENT),
               ('griffin', 'Griffin', 'Vigilance', PURPURE, OR), ('unicorn', 'Unicorn', 'Purity', GULES, ARGENT), ('phoenix', 'Phoenix', 'Renewal', SABLE, OR),
               ('fleur', 'Fleur-de-lis', 'Light', AZURE, OR), ('tree', 'Oak tree', 'Roots', VERT, OR), ('highcross', 'Celtic cross', 'Faith', VERT, ARGENT)]
    eds = [crest('', m, f, c, c, 'plain', k) for k, _, m, f, c in emblems]
    eurls = render([(d, f'em{i}', f'{n} coat of arms') for i, (d, (_, n, _, _, _)) in enumerate(zip(eds, emblems))])
    estrip = ''.join(f'<a href="{r["url"]}">{crest_img(d)}<span>{n}</span></a>' for d, (_, n, _, _, _), r in zip(eds, emblems, eurls))
    tools = ''.join(f'<a href="/{h}"><b>{t}</b><span>{s_}</span></a>' for h, t, s_ in REGISTRY)
    body = f'''<section class="home-hero">
<div class="hh-copy"><p class="eyebrow">Free coat of arms maker</p>
<h1 class="gilt">Your Family Coat of Arms, Designed in Minutes</h1>
<p class="lede">Type your last name and see six crests made for your family. Choose from 50 heraldic emblems, from lions and eagles to oak trees and Celtic crosses, and learn what every color and symbol means.</p>
<form class="surname-form" data-form onsubmit="return false"><label class="fld"><span>Your last name</span><input type="text" maxlength="30" data-surname autocomplete="family-name" placeholder="Carter"></label>
<button class="btn big" type="submit" data-go>Show my crests</button></form>
<p class="hh-alt">or <a href="/crest.html">start from scratch in the studio</a> · <a href="/coat-of-arms-quiz.html">take the 2-minute quiz</a></p></div>
<div class="hh-art">{hero_svg}</div></section>
<ul class="trust"><li>Free to design</li><li>No account</li><li>Instant download</li><li>Print anywhere</li><li>14-day refunds</li></ul>
<section class="gen" aria-label="Crests for your last name"><p class="center muted-s" data-status>Six ideas for "Carter". Type your own last name above.</p></section>
<div data-results>{gallery(ex, 'hm', 'Customize')}</div>
<p class="center"><button class="btn ghost" type="button" data-more>Show six more</button></p>
<section class="sec" id="what-you-get"><h2 class="gilt center">Everything you get for $9</h2>
<p class="center">One payment, no subscription. Every file is generated from your design the moment you pay.</p>
<div class="pack">
<figure>{crest_img(HOME_HERO)}<figcaption>Print-ready art<br><small>4000 px PNG and SVG vector</small></figcaption></figure>
<figure><img src="/img/home/certificate-of-arms-sample.jpg" width="900" height="1165" loading="lazy" decoding="async" alt="Sample certificate of arms for the Carter Family, with the blazon Azure, a lion rampant Or, and what it means"><figcaption>Certificate of arms<br><small>Its blazon and meaning, ready to frame</small></figcaption></figure>
<figure><img src="/img/home/phone-wallpaper-sample.jpg" width="600" height="1298" loading="lazy" decoding="async" alt="Sample phone wallpaper with the Carter Family coat of arms"><figcaption>Phone wallpaper<br><small>Sized for modern phones</small></figcaption></figure>
<figure><img src="/img/home/profile-picture-sample.jpg" width="600" height="600" loading="lazy" decoding="async" alt="Sample profile picture with the Carter Family shield"><figcaption>Profile picture<br><small>1080 px, for any social app</small></figcaption></figure>
</div>
<p class="center" style="margin-top:20px"><a class="btn big" href="/crest.html">Design yours free</a></p></section>
<section class="sec"><h2 class="gilt center">How it works</h2><ol class="steps3">
<li><b>Design it</b><span>Pick colors, a division, one of 50 emblems and a motto. See the heraldic blazon and what it means as you go. Free, no account.</span></li>
<li><b>Download it</b><span>Love it? Pay $9 once and download every file instantly. Checkout is handled securely by Dodo Payments.</span></li>
<li><b>Print or share it</b><span>Frame it, put it on mugs and shirts, use it as a profile picture or send it to the family. It is yours to use.</span></li></ol></section>
<section class="sec" id="emblems"><h2 class="gilt center">50 emblems with real meaning</h2>
<p class="center">Every emblem is drawn in the bold, flat style of real heraldry. Tap one to start a crest with it, or read <a href="/heraldry-symbols-and-meanings.html">what each one means</a>.</p></section>
<div class="emb-strip">{estrip}</div>
<section class="sec"><div class="split"><div><p class="eyebrow">For Christmas, anniversaries and new homes</p><h2 class="gilt">A gift with a story</h2>
<p>Give a family their own coat of arms: their name, their colors, their motto, and a certificate explaining what it all means, with a "presented to" line from you. It downloads instantly, so it even works the night before.</p>
<p>Short on time? Send it as a free e-card first and print a framed copy later.</p>
<p style="margin-top:16px"><a class="btn" href="/family-crest-gift.html">Family crest gift ideas</a></p></div>
<div>{crest_img(crest('Grandma and Grandpa Rossi', 'Root and Branch', VERT, OR, GOLD_LIGHT, 'plain', 'tree'))}</div></div></section>
<section class="sec"><div class="split"><div><img src="/img/home/logo-kit-banner-sample.jpg" width="1200" height="400" loading="lazy" decoding="async" alt="Sample social banner from the Crest Logo Kit for Ironhold Brewing Co., with a sheaf of wheat crest"></div>
<div><p class="eyebrow">For clubs, teams and businesses</p><h2 class="gilt">The $29 Crest Logo Kit</h2>
<p>Everything a small brand needs in one ZIP: transparent logo files, a shield-only mark, favicons and app icons, banners for X, LinkedIn and YouTube, a Discord icon and a brand sheet, plus the full $9 set. Commercial use included.</p>
<p style="margin-top:16px"><a class="btn" href="/crest-logo-maker.html">See the Logo Kit</a></p></div></div></section>
<section class="sec"><div class="split"><div><p class="eyebrow">Free to play on your phone</p><h2 class="gilt">Medieval games</h2>
<p>An archery contest, a jousting tournament, a castle under siege and a sword duel. Short, replayable and free, and the coat of arms you design here rides with you in every game.</p>
<p style="margin-top:16px"><a class="btn" href="/games/">Play the games</a></p></div>
<div class="gm-mini">{''.join(f'<a href="/{g["slug"]}"><img src="/img/games/{g["id"]}.webp" width="600" height="800" loading="lazy" decoding="async" alt="{E(g["name"])}"><span>{E(g["short"])}</span></a>' for g in GAMES)}</div></div></section>
<section class="sec"><h2 class="gilt">Free heraldry tools</h2><div class="related">{tools}</div></section>'''
    body += faq_html(faqs)
    body += '<section class="sec center"><h2 class="gilt">Ready to make yours?</h2><p>It takes a few minutes and costs nothing to design.</p><p style="margin-top:16px"><a class="btn big" href="/crest.html">Design your coat of arms</a></p></section>'
    write_page(p, body)


def ideas():
    """A large gallery of original crests by theme: built for image search and for browsing."""
    import random
    slug = 'coat-of-arms-ideas.html'
    rnd = random.Random(1066)
    COLS, MET, CMET = [GULES, MURREY, AZURE, VERT, PURPURE, SABLE], [OR, ARGENT], [GOLD_LIGHT, ARGENT, OR]
    DIVS = ['chevron', 'perpale', 'fess', 'bend', 'quarterly', 'saltire', 'pale', 'plain']
    CH = ['lion', 'eagle', 'stag', 'wolf', 'bear', 'griffin', 'tower', 'key', 'rose', 'mullet', 'crown', 'fleur', 'tree', 'initial']
    POOLS = {'family': ['lion', 'eagle', 'stag', 'bear', 'tree', 'fleur', 'tower', 'key', 'acorn', 'cross', 'thistle', 'shamrock', 'initial', 'boar', 'horse', 'heart'],
             'fantasy': ['dragon', 'griffin', 'wolf', 'raven', 'phoenix', 'unicorn', 'boar', 'owl', 'swords', 'flame', 'crescent', 'mountain'],
             'teams': ['lion', 'eagle', 'wolf', 'bear', 'griffin', 'lightning', 'swords', 'mullet', 'horse', 'phoenix'],
             'wedding': ['heart', 'rose', 'fleur', 'tree', 'laurel', 'stag', 'triquetra', 'sun'],
             'school': ['owl', 'book', 'lion', 'eagle', 'laurel', 'griffin', 'flame', 'tree'],
             'gaming': ['wolf', 'dragon', 'raven', 'phoenix', 'lightning', 'swords', 'owl', 'griffin', 'flame']}

    def mk(name, motto, ch=None, div=None, pool=None):
        return crest(name, motto, rnd.choice(COLS), rnd.choice(MET), rnd.choice(CMET), div or rnd.choice(DIVS), ch or rnd.choice(POOLS.get(pool, CH)))
    fam_m = FAMILY_MOTTOS
    fantasy_m = HOUSE_MOTTOS
    themes = [
        ('family', 'Family crest ideas', 'Crests built around a family name, with mottos a family might actually say. Type your own surname into the <a href="/family-crest-generator.html">family crest generator</a> for six more.',
         [mk(f'The {n} Family', rnd.choice(fam_m), pool='family') for n in ['Smith', 'Johnson', 'Williams', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Lee', 'Patel']]),
        ('fantasy', 'Fantasy noble house ideas', 'Sigils for the great houses of a campaign or novel. More in the <a href="/fantasy-house-name-generator.html">house name generator</a>.',
         [mk(f'House {a}{b}', rnd.choice(fantasy_m), pool='fantasy') for a, b in [('Thorn', 'wall'), ('Raven', 'mere'), ('Ash', 'ford'), ('Storm', 'hold'), ('Silver', 'vale'), ('Ember', 'wick'), ('Grey', 'combe'), ('Frost', 'gard'), ('Dusk', 'haven'), ('Iron', 'ridge'), ('Wren', 'bourne'), ('Oak', 'shaw')]]),
        ('teams', 'Sports club and team crest ideas', 'Badges for amateur clubs, Sunday leagues and fantasy leagues. Clubs can get logo and banner files with the <a href="/crest-logo-maker.html">Crest Logo Kit</a>.',
         [mk(n, m, pool='teams') for n, m in [('Ravensgate FC', 'Ever Onward'), ('Northvale Rovers', 'Run Together'), ('Oakmere Athletic', 'Strength in Unity'), ('Harbor Town Rowing', 'Pull as One'), ('Ironbridge RFC', 'Hold the Line'), ('Westbrook Wanderers', 'Far and Fast'), ('Saltmarsh Cricket Club', 'Steady Hands'), ('Highfield Harriers', 'Swift and True'), ('Kingsford Fantasy League', 'Glory Is Earned'), ('Millbrook Chess Club', 'Think Twice')]]),
        ('business', 'Business and brand crest ideas', 'Heritage-style marks for small businesses. See the <a href="/crest-logo-maker.html">crest logo maker</a> for the full brand kit.',
         [mk(n, m, ch=c) for n, m, c in [('Ironhold Brewing Co.', 'Brewed With Patience', 'wheat'), ('Oakmere Coffee', 'First Light', 'sun'), ('The Copper Key Inn', 'All Are Welcome', 'key'), ('Briarwood Books', 'Sapere Aude', 'book'), ('Fairhaven Barbers', 'Sharp Since Today', 'swords'), ('Stonegate Bakery', 'Daily Bread', 'wheat'), ('Ashford Leatherworks', 'Made to Last', 'hammer'), ('Thornfield Distillery', 'Slow and Steady', 'flame'), ('Wrenbourne Florist', 'Grow Gently', 'rose'), ('Hartwell Tailors', 'Measure Twice', 'dividers'), ('Northgate Law', 'Fiat Iustitia', 'scales'), ('Harborview Clinic', 'Care First', 'caduceus')]]),
        ('wedding', 'Wedding and couple crest ideas', 'Joint crests for invitations and wax seals, often split per pale to join two families. More in the <a href="/wedding-crest.html">wedding crest guide</a>.',
         [mk(n, m, div='perpale', pool='wedding') for n, m in [('Rossi & Chen', 'Omnia Vincit Amor'), ('Lena & Arjun', 'Ever Yours'), ('The Okafors', 'Two Hearts, One Home'), ('Kim & Alvarez', 'Together We Rise'), ('Maya & Sam', 'Always'), ('The Novaks', 'Root and Branch'), ('Priya & Daniel', 'Home Is Our Hearth'), ('Bell & Hart', 'Ubi Concordia, Ibi Victoria')]]),
        ('school', 'School house crest ideas', 'Crests for classroom and school house systems, named after virtues. See <a href="/school-house-crests.html">school house crests</a>.',
         [mk(n, m, pool='school') for n, m in [('House Fortis', 'Audentes Fortuna Iuvat'), ('House Sapientia', 'Sapere Aude'), ('House Caritas', 'Non Sibi Sed Omnibus'), ('House Constantia', 'Per Aspera ad Astra'), ('House Veritas', 'Veritas Vincit'), ('House Spes', 'Dum Spiro Spero'), ('House Honor', 'Facta Non Verba'), ('House Lux', 'Fiat Lux')]]),
        ('gaming', 'Gaming clan and guild crest ideas', 'Emblems that still read as a small server icon. See <a href="/clan-logo-maker.html">clan and guild logos</a>.',
         [mk(n, m, pool='gaming') for n, m in [('Iron Ravens', 'Swift and Unseen'), ('Night Owls Guild', 'We Rise by Night'), ('Crownbreakers', 'The Crown Is Earned'), ('Starfall', 'Ad Astra'), ('The Ember Pact', 'By Oath and Ember'), ('Wolfsbane Company', 'Steel Remembers'), ('Moonkeepers', 'Watch and Ward'), ('Last Light Guild', 'First Light, Last Stand')]]),
    ]
    total = sum(len(t[3]) for t in themes)
    faqs = [('Can I use one of these crests?', 'Yes. Click "Customize" to open any of them in Crest Studio, change anything you like, and design for free. Buying the files ($9, or $29 for the Logo Kit) gives you print-ready art you can use anywhere.'),
            ('Are these real historical coats of arms?', 'No. Every crest on this page is an original design made with Crest Studio. The names are illustrative, and none is an official grant of arms or a claim about any real family or organization.'),
            ('Why do they all look so readable?', 'Every example follows the heraldic rule of tincture: a metal (gold or silver) against a color. It is the simplest way to make a crest clear from a distance.')]
    p = dict(slug=slug, h1='Coat of Arms Ideas', og='ideas', og_title=f'{total} Coat of Arms Ideas you can customize free',
             title=f'{total} Coat of Arms Ideas: Family, Fantasy, Team and Business Crests | Crest Studio',
             desc=f'Browse {total} original coat of arms and family crest ideas for families, fantasy houses, sports clubs, businesses, weddings, school houses and gaming clans. Customize any of them free.')
    p['ld'] = ld_base(p, [faq_ld(faqs), {'@type': 'ImageGallery', 'name': 'Coat of arms ideas', 'url': f'{SITE}/{slug}'}])
    toc = ' · '.join(f'<a href="#{k}">{E(t.replace(" ideas", ""))}</a>' for k, t, _, _ in themes)
    body = hero('Free to customize', f'{total} Coat of Arms Ideas',
                'Original crests for families, fantasy houses, clubs, businesses, couples, schools and gaming groups. Every one opens in Crest Studio so you can make it yours. ' + PRICE_NOTE)
    body += f'<p class="center muted-s" style="margin:-8px 16px 10px">{toc}</p>'
    for k, t, intro, ds in themes:
        body += f'<section class="sec" id="{k}"><h2 class="gilt">{E(t)}</h2><p>{intro}</p></section>' + gallery(ds, 'id' + k[:3], 'Customize')
    body += faq_html(faqs)
    write_page(p, body)


QUIZ = [
    dict(q='When a friend is in trouble, you are the one who...', w={'wt': 1, 'wc': 2}, a=[
        ('steps in and stands up for them', {'t': GULES, 'c': 'lion'}),
        ('keeps their secret safe', {'t': AZURE, 'c': 'wolf'}),
        ('makes them laugh until it is better', {'t': VERT, 'c': 'stag'}),
        ('makes a plan to fix it', {'t': PURPURE, 'c': 'owl'}),
        ('stays calm and steady beside them', {'t': SABLE, 'c': 'bear'})]),
    dict(q='Pick the place you would rule from.', w={'wc': 1, 'wd': 1}, a=[
        ('A castle on a sea cliff', {'c': 'dragon', 'd': 'pale'}),
        ('A harbor town under the moon', {'c': 'owl', 'd': 'fess'}),
        ('The great hall of the capital', {'c': 'lion', 'd': 'quarterly'}),
        ('A manor with a walled rose garden', {'c': 'stag', 'd': 'chevron'}),
        ('A watchtower where four roads meet', {'c': 'eagle', 'd': 'saltire'})]),
    dict(q='Which creature would guard your hall?', w={'wc': 3}, a=[
        ('A lion, proud and fearless', {'c': 'lion'}), ('A wolf, loyal to its pack', {'c': 'wolf'}),
        ('An eagle, watching from above', {'c': 'eagle'}), ('A dragon, fierce and rare', {'c': 'dragon'}),
        ('A stag, calm and graceful', {'c': 'stag'}), ('A bear, strong and protective', {'c': 'bear'}),
        ('An owl, wise and watchful', {'c': 'owl'})]),
    dict(q='Which matters most to you?', w={'wt': 2}, a=[
        ('Courage', {'t': GULES}), ('Truth and loyalty', {'t': AZURE}), ('Hope and joy', {'t': VERT}),
        ('Justice', {'t': PURPURE}), ('Patience', {'t': MURREY}), ('Staying the same when everything changes', {'t': SABLE})]),
    dict(q='How do you take on a big challenge?', w={'wd': 2, 'wth': 1}, a=[
        ('Head on, right away', {'d': 'bend', 'th': 'courage'}),
        ('With a careful plan', {'d': 'quarterly', 'th': 'wisdom'}),
        ('Together with my people', {'d': 'chevron', 'th': 'family'}),
        ('Slowly and steadily until it is done', {'d': 'pale', 'th': 'perseverance'}),
        ('My own way, whatever anyone says', {'d': 'saltire', 'th': 'ambition'})]),
    dict(q='Gold or silver?', w={'wm': 1}, a=[
        ('Gold: warm, generous, a little bold', {'m': OR}), ('Silver: calm, clear, quietly confident', {'m': ARGENT})]),
    dict(q='Pick a time of day.', w={'wc': 1, 'wth': 1}, a=[
        ('Dawn, before anyone else is up', {'c': 'eagle', 'th': 'ambition'}),
        ('High noon', {'c': 'lion', 'th': 'courage'}),
        ('Golden hour at dusk', {'c': 'stag', 'th': 'love'}),
        ('Midnight', {'c': 'owl', 'th': 'perseverance'}),
        ('A long dinner with everyone at the table', {'c': 'wolf', 'th': 'family'})]),
    dict(q='What would you most like to be remembered for?', w={'wth': 2}, a=[
        ('Being brave', {'th': 'courage'}), ('Being kind', {'th': 'love'}), ('Being wise', {'th': 'wisdom'}),
        ('Being loyal', {'th': 'family'}), ('Building something great', {'th': 'ambition'}), ('Doing the right thing', {'th': 'honor'})]),
]
ARCHETYPES = {
    'lion': ('The Lionheart', 'Brave, warm and impossible to ignore. You lead from the front and protect your people.'),
    'wolf': ('The Wolf', 'Loyal to your pack above everything. You are at your best with your people around you, and fierce when they need you.'),
    'eagle': ('The Visionary', 'You see the whole picture from above and aim higher than anyone else dares.'),
    'dragon': ('The Dragonheart', 'Fierce, rare and independent. You guard the people and things you love like treasure.'),
    'stag': ('The Peacemaker', 'Calm, graceful and kind. You only fight when you have to, and then you do not lose.'),
    'bear': ('The Guardian', 'Strong, steady and protective. Nobody messes with your family.'),
    'owl': ('The Sage', 'Wise and watchful. You are the one everyone asks for advice.'),
}


def quiz():
    slug = 'coat-of-arms-quiz.html'
    faqs = [('Is this based on real heraldry?', 'Yes, loosely. The colors, divisions and emblems are real heraldic elements, and the quiz uses the traditional meanings later heraldic writers gave them (courage for red, loyalty for blue, hope for green and so on). It is a bit of fun, not a historical grant of arms.'),
            ('Can I change my result?', 'Yes. Click "Make it yours" to open your crest in Crest Studio and change any color, emblem or the motto. Designing is free.'),
            ('Can I get my crest as a picture or print?', 'Yes. In the Studio, $9 gets print-ready art (4000 px PNG and SVG), a certificate of arms explaining its meaning, a profile picture and a phone wallpaper.'),
            ('How do I share my result?', 'Click "Share my result". The link previews your crest in WhatsApp, iMessage, Discord and most social apps, and brings friends to the quiz so they can find theirs.')]
    p = dict(slug=slug, h1='What Would Your Coat of Arms Be?', og='quiz', og_title='Heraldry quiz: what would your coat of arms be?',
             title='Coat of Arms Quiz: What Would Your Coat of Arms Be? | Crest Studio',
             desc='Take the free 2-minute heraldry quiz and get your own coat of arms: colors, emblem and Latin motto chosen from your answers, with its meaning. Share it with friends.')
    p['ld'] = ld_base(p, [faq_ld(faqs), {'@type': 'WebApplication', 'name': 'Coat of Arms Quiz', 'url': f'{SITE}/{slug}', 'applicationCategory': 'GameApplication',
                                          'operatingSystem': 'Any (web browser)', 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'}}])
    data = {'themes': ['courage', 'perseverance', 'family', 'wisdom', 'ambition', 'honor', 'love'],
            'tinctures': [GULES, AZURE, VERT, PURPURE, SABLE, MURREY], 'divisions': ['chevron', 'bend', 'quarterly', 'fess', 'pale', 'saltire', 'perpale'],
            'charges': ['lion', 'wolf', 'eagle', 'dragon', 'stag', 'bear', 'owl'],
            'archetypes': {k: {'title': t, 'desc': dsc} for k, (t, dsc) in ARCHETYPES.items()},
            'mottos': [{'la': la, 'en': en, 't': t} for la, en, t, _ in MOTTOS if t != 'faith']}
    p['scripts'] = (f'<script type="application/json" id="quiz-data">{json.dumps(data, ensure_ascii=False)}</script>'
                    '<script src="/crest-core.js" defer></script><script src="/quiz.js" defer></script>')
    qs = ''
    for i, q in enumerate(QUIZ, 1):
        attrs = ' '.join(f'data-{k}="{v}"' for k, v in q['w'].items())
        opts = ''.join(f'<label class="opt"><input type="radio" name="q{i}" value="{E(";".join(f"{k}:{v}" for k, v in a.items()))}"><span>{E(t)}</span></label>' for t, a in q['a'])
        qs += f'<fieldset class="qstep" data-q {attrs}><legend>{E(q["q"])}</legend>{opts}</fieldset>'
    qs += ('<fieldset class="qstep" data-q><legend>Last one: what name should your house carry?</legend>'
           '<label class="fld"><span>Your name or family name</span><input type="text" maxlength="28" data-name autocomplete="family-name" placeholder="Ashford"></label>'
           '<button class="btn big" type="button" data-finish style="margin-top:14px;width:100%">Reveal my coat of arms</button></fieldset>')
    arcs = ''.join(f'<li><b>{E(t)}</b> ({k}): {E(dsc)}</li>' for k, (t, dsc) in ARCHETYPES.items())
    body = hero('Free 2-minute quiz', 'What Would Your Coat of Arms Be?',
                'Eight quick questions about how you live. We turn your answers into a real heraldic crest, with colors, a heraldic beast and a Latin motto chosen for you, and tell you what it all means.',
                cta_href='#quiz', cta='Start the quiz')
    body += f'''<section class="gen quiz" id="quiz" data-quiz aria-label="Heraldry quiz">
<div class="friend" data-friend hidden><div class="f-art" data-f-art></div><p>A friend sent you their coat of arms: <b data-f-name></b>. Take the quiz to find yours.</p></div>
<div class="qnav" data-nav><button class="btn ghost" type="button" data-back hidden>Back</button><span data-progress>Question 1 of {len(QUIZ) + 1}</span><div class="bar"><i data-bar></i></div></div>
{qs}
<div class="qres" data-result hidden>
<div class="r-art" data-r-art></div>
<h2 class="gilt" data-r-title></h2><p class="lede" data-r-desc></p>
<p class="r-motto" data-r-motto></p><p class="r-blz" data-r-blazon></p><p data-r-mean></p>
<div class="cta-row" style="margin-top:18px"><button class="btn big" type="button" data-r-share>Share my result</button><a class="btn ghost" data-r-edit href="/crest.html">Make it yours</a></div>
<p class="muted-s center" data-r-note></p>
<p class="center" style="margin-top:10px"><a data-r-buy href="/crest.html">Get it as print files, a certificate and a wallpaper ($9)</a> · <button class="linkish" type="button" data-again>Take it again</button></p>
</div></section>'''
    body += f'''<section class="sec"><h2 class="gilt">How the quiz works</h2>
<p>Each answer nudges one part of your crest. Your values choose the field color, using the traditional meanings from heraldry (red for courage, blue for truth and loyalty, green for hope, purple for justice, black for constancy, mulberry for patience). How you face a challenge sets the division, gold or silver sets the metal, and your other answers choose your heraldic beast (lion, wolf, eagle, dragon, stag, bear or owl) and the theme of your Latin motto. Your name goes across the top.</p>
<p>The meanings come from heraldic writers of the 1500s and 1600s rather than the medieval knights themselves, so treat your result as a bit of fun with real roots. More in the <a href="/heraldry-symbols-and-meanings.html">heraldry meanings guide</a>.</p>
<h3>The seven beasts</h3><ul>{arcs}</ul>
<p class="center" style="margin-top:22px"><a class="btn big" href="#quiz">Take the quiz</a></p></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def spec_page(sp):
    p = dict(slug=sp['slug'], h1=sp['h1'], og=sp['og'], og_title=sp['og_title'], title=sp['title'], desc=sp['desc'], lang=sp.get('lang', 'en'))
    p['ld'] = ld_base(p, [faq_ld(sp['faqs']), APP_LD])
    body = hero(sp['eyebrow'], sp.get('h1_html', E(sp['h1'])), sp['lede'] + ' ' + sp.get('price_note', PRICE_NOTE),
                cta_href=sp.get('cta_href', '/crest.html'), cta=sp.get('cta', 'Design yours free'), second=sp.get('second'))
    body += gallery(sp['examples'], 'x' + sp['og'][:4])
    body += sp['body']
    body += faq_html(sp['faqs'])
    write_page(p, body)


for _sp in SPECS:
    if not any(r[0] == _sp['slug'] for r in REGISTRY):
        REGISTRY.append((_sp['slug'], _sp['short'], _sp['blurb']))


# ------------------------------------------------------------------ games
# Short medieval games and board games. Each is one canvas drawn in code (no image files), with a shared engine in games/engine.js.
# Thumbnails and share images come from tools/game_shots.py, which plays each game and photographs it.
GAMES = [
    dict(id='archery', slug='games/archery.html', js='archery', short='Archery', name="The King's Archery Contest",
         h1="Archery Game: The King's Archery Contest", og_title="Archery game: can you win the King's Archery Contest?",
         title="Free Archery Game Online: The King's Archery Contest",
         desc='Free medieval archery game for phone and computer. Hold to draw, aim into the wind and shoot nine arrows at three distances. A new contest every day.',
         tagline='Nine arrows, three distances, one champion. Mind the wind.', genre=['Sports', 'Skill', 'Archery'],
         card='Hold to draw, aim into the wind, hit the gold.',
         how=['Press and hold anywhere on the field to draw your bow. The ring around your sight fills as you draw.',
              'While you hold, drag to move your aim. The sight steadies at full draw, but hold too long and your arm starts to shake.',
              'Let go to loose the arrow. The wind, shown top right, pushes it sideways, more at longer range, so aim into the wind.',
              'Three ends of three arrows, at 20, 40 and 60 metres. Gold scores 9 and 10, and the small X in the middle is a perfect ten.'],
         touch='Hold anywhere to draw, drag to aim, lift your finger to shoot.',
         keys='Hold Space to draw, aim with the arrow keys or WASD, release Space to shoot. Or hold, drag and release with the mouse.',
         tips=['Draw fully before you loose: a half-drawn bow drops the arrow low.',
               'Shoot in the first second or two at full draw, while your sight is steadiest.',
               'Watch the pennants and the wind arrow. At 60 metres a strong wind moves an arrow by most of the target.',
               'The daily contest gives everyone the same winds today, so you can compare scores fairly with friends.'],
         faqs=[('Is the archery game free?', 'Yes. It runs in your browser on phones, tablets and computers, with no download and no account.'),
               ('How is the target scored?', 'Like a real archery target: gold scores 10 and 9, red 8 and 7, blue 6 and 5, black 4 and 3, and white 2 and 1. The small X ring in the centre counts as 10 and breaks ties. The best possible score is 90.'),
               ('What is the daily contest?', 'A contest with the same winds for everyone that day, so you can share your score and compare it fairly. It changes at midnight UTC.'),
               ('Can I put my own coat of arms in the game?', 'Yes. Design your coat of arms free in <a href="/crest.html">Crest Studio</a> on this device and it appears in every game, on your shield and your banners.')]),
    dict(id='joust', slug='games/joust.html', js='joust', short='Jousting', name='The Joust',
         h1='Jousting Game: The Joust', og_title='Jousting game: unhorse five knights and win the tournament',
         title='Jousting Game Online: Free Medieval Tournament',
         desc='Free jousting game for phone and computer. Spur your horse, aim your lance and strike as the ring closes. Unhorse five knights to win the tournament.',
         tagline='Three taps a pass. Five challengers. Unhorse them all.', genre=['Sports', 'Action', 'Timing'],
         card='Spur, aim, strike. Unhorse five knights.',
         how=['Spur: tap when the needle crosses the gold, to gallop at full speed.',
              "Aim: your lance tip sweeps across your opponent's shield. Tap to lock it on the centre.",
              'Strike: time slows as you meet. Tap the moment the shrinking ring touches the shield.',
              'A clean hit scores 1, a shattered lance 2, and unhorsing your opponent wins the bout at once. Otherwise the most points after three passes wins.'],
         touch='Tap anywhere on the screen for each step.', keys='Space or Enter for each step, or click.',
         tips=['Speed, aim and timing all count, but a lance on the centre of the shield counts most.',
               'Each challenger rides faster and sweeps your aim quicker than the last.',
               "A well-timed strike also braces you against your opponent's lance.",
               'Every challenger rides under their own coat of arms, drawn fresh for each tournament.'],
         faqs=[('How do you win a joust?', 'Score more points over three passes, or unhorse your opponent to win the bout at once. Win five bouts to become Champion of the Realm.'),
               ('Were real jousts scored with points?', 'Yes. In the 1500s heralds kept score on jousting cheques: vellum score sheets that tallied hits to the head and body, lances broken and faults. This game keeps the spirit with simpler rules.'),
               ('Is it suitable for kids?', 'Yes. It is free, needs no account or download, and has no blood: knights are knocked from the saddle, not hurt.'),
               ('Can my knight carry my own coat of arms?', "Yes. Design one free in <a href=\"/crest.html\">Crest Studio</a> and it appears on your shield, your lance and your horse's cloth.")]),
    dict(id='castle', slug='games/castle-defense.html', js='castle', short='Castle defense', name='Hold the Castle',
         h1='Castle Defense Game: Hold the Castle', og_title='Castle defense game: how many waves can you hold?',
         title='Castle Defense Game Online: Hold the Castle (Free)',
         desc='Free castle defense game for phone and computer. Shoot from your towers, stop rams, ladders and catapults, and pick a reward after each wave.',
         tagline="The Usurper's host is at the gates. Hold the wall.", genre=['Strategy', 'Tower defense', 'Action'],
         card='Loose arrows, stop the rams, hold the wall.',
         how=['Tap or click the field to loose an arrow from the nearest tower. Arrows take a moment to fly, so aim ahead of moving foes.',
              'Your quiver refills on its own: watch the arrows in the bottom corner.',
              'Foes that reach the wall hack at it. Rams batter the gate, ladders climb, and catapults lob stones from out of reach.',
              'After each wave, choose one reward: faster reloads, fire arrows, an archer for hire, boiling oil and more.'],
         touch='Tap the field to shoot. Tap OIL or VOLLEY when you have them.', keys='Click to shoot. A pours boiling oil, D looses a volley.',
         tips=['Shoot the foes at the wall first: they are doing the damage right now.', 'Rams are slow but hit hard, so start on them early.',
               'Catapults never come close. Long shots fly for longer, so lead them a little more.', 'Fire arrows burn everything near where they land: ideal for crowds.'],
         faqs=[('Is there an end?', 'No. The waves keep coming and grow stronger. Your score counts every foe defeated and every wave held.'),
               ('What do the rewards do?', "Swifter hands reload faster, a bigger quiver holds more arrows, bodkin points hit harder and fire arrows burn nearby foes. A hired archer shoots on his own. Mason's repair and Stone on stone mend and strengthen the wall. Boiling oil and Volley are special attacks that recharge."),
               ('Does it work on phones?', 'Yes. It is built for touch first and runs in any modern browser with no download.'),
               ('Whose banner flies on the wall?', 'Yours, if you have designed a coat of arms in <a href="/crest.html">Crest Studio</a> on this device. Until then a golden lion on blue flies there.')]),
    dict(id='duel', slug='games/sword-duel.html', js='duel', short='Sword duel', name='Duel',
         h1='Sword Fighting Game: Duel', og_title='Sword fighting reflex game: how fast is your parry?',
         title='Sword Fighting Game Online: Free Parry Reflex Test',
         desc="Free medieval sword fighting game. Read the knight's blade, parry left, high or right, beat the feints and riposte. See your parry speed in milliseconds.",
         tagline='Read the blade. Parry. Riposte. How fast are your hands?', genre=['Action', 'Reflex', 'Fighting'],
         card='Read the blade, parry, riposte. Test your reflexes.',
         how=['Your opponent raises his sword to your left, overhead or to your right, then strikes. Parry that side before the blade lands: tap LEFT, HIGH or RIGHT, swipe, or use the arrow keys.',
              'A ring appears on the button you need and shrinks as the blow comes. Parry while it is inside the gold band for a perfect parry.',
              'A perfect parry opens a riposte: tap the knight within a second to strike him. Ripostes are what beat a knight; his health bar shows how many he can take.',
              'Three perfect parries fill your Valour and light the Mighty Blow button: two hits at once. Use it between his attacks.',
              'New to it? The training yard teaches every move in about a minute, with nothing to lose.'],
         touch='Tap the three buttons, or swipe left, up or right. Tap the knight to riposte, and MIGHTY BLOW when it glows.', keys='Arrow keys or A, W and D to parry. Space to riposte or for the Mighty Blow.',
         tips=['Do not guess. Parry only once the ring is on a button; on a feint it jumps, so follow it.', 'Ordinary parries keep you alive, perfect parries win: early in a duel, aim for the gold every time.',
               'Save the Mighty Blow for the pause after a combo, or press it the moment he starts a wind-up to strike first.', 'Five perfect parries in a row win back a heart, and beating a knight restores one too.'],
         about=('How to win the duel', '<p>Every knight fights in a style of his own, and each one is introduced with a tip before the fight.</p><ul>'
                '<li><b>The Squire</b> is slow and honest: the place to practise perfect parries.</li>'
                '<li><b>The Brute</b> is slow but tough. Only ripostes hurt him, so be patient for the gold.</li>'
                '<li><b>The Trickster</b> feints: his blade starts one way and switches. Wait for the ring to settle.</li>'
                '<li><b>The Berserker</b> strikes in twos and threes. Parry each blow, then use your Mighty Blow in the pause.</li>'
                '<li><b>The Swift</b> is very fast. Read the blade early and accept ordinary parries.</li>'
                '<li><b>Champions</b> come after that, mixing every trick and growing faster each time.</li></ul>'
                '<p>When a duel ends, the game tells you what hit you most often (slow parries, the wrong side or feints) and what to change.</p>'),
         faqs=[('Is this a reaction time test?', 'Partly. It times how long you take to parry once the blade shows where it is going, so it rewards quick reading as well as quick hands. Feints keep it fair: guessing does not work.'),
               ('Is it violent?', 'No blood. Knights clash, parry and yield.'),
               ('How do I beat a knight?', 'Land ripostes. A perfect parry, made while the shrinking ring is inside the gold band, opens a riposte: tap the knight to hit him. Each riposte takes one point from his health bar, and a Mighty Blow takes two.'),
               ('Does it work on a phone?', 'Yes, with big buttons and swipes, in any modern browser.'),
               ('Can I use my own coat of arms?', 'Yes. Design one free in <a href="/crest.html">Crest Studio</a>: your arms appear beside your hearts and your sword grip takes your colours.')]),
    dict(id='siege', slug='games/trebuchet-game.html', js='trebuchet', short='Trebuchet siege', name='Siege: The Trebuchet Game',
         pre=['/games/vendor/matter.min.js'], h1='Trebuchet Game: Siege', og_title='Trebuchet game: can you topple all ten castles?',
         title='Trebuchet Game Online: Topple 10 Castles, Free',
         desc='Free trebuchet game with real physics. Aim, fling stones and fire pots, and bring down ten castles of timber and stone. Plays on phone and computer.',
         tagline='Ten castles. Real physics. Never quite enough stones.', genre=['Physics', 'Puzzle', 'Strategy'],
         card='Fling stones, topple castles, win the siege.',
         how=['Pull back anywhere on the screen, like a slingshot: down and to the left aims up and to the right. The arrow on the trebuchet shows your angle, and it grows longer and redder with power.',
              'Let go to throw. White dots show the start of the flight, and the orange dots show where your last stone went, so you can adjust: more power to throw further, a higher angle to drop onto the top of a tower.',
              'Knock the castle down until every one of the Usurper\'s guards yields. A guard yields when he falls, is knocked flat or takes a hard hit.',
              'From the fourth castle you also get fire pots: tap FIRE POT to load one. It bursts on impact and shoves everything nearby.'],
         touch='Pull back anywhere and let go. Tap FIRE POT to switch ammunition.',
         keys='Up and down change the angle one degree at a time, left and right change the power, Space throws, Enter switches to a fire pot. Or pull back with the mouse.',
         tips=['Most castles fall to about 45 degrees and 60 to 75 percent power. Start there and adjust from the orange trail.', 'Hit the posts low: when a post goes, the whole floor above it comes down.', 'Stone blocks shrug off glancing blows. Aim at timber, or drop a stone on them from high above.',
               'Every stone you keep scores 1,000 points and earns stars, so the first shot matters most.', 'A high lob lands on the guards on top; a flat, fast shot breaks the lower floors.'],
         faqs=[('How many levels are there?', 'Ten castles, from a timber watch post to the Usurper\'s Keep, with your progress saved on this device. Take a castle with stones to spare to earn up to three stars.'),
               ('Is the physics real?', 'Yes. Every block, guard and stone is a physical body with weight and friction, run by the open-source Matter.js engine, so no two collapses are quite the same.'),
               ('Is it violent?', 'No. Guards wave a white flag and yield when they fall or are knocked over. Nobody is hurt.'),
               ('Did trebuchets really knock down castles?', 'They did. Edward I of England had an enormous trebuchet, the Warwolf, built for the siege of Stirling Castle in 1304, and it brought down part of the castle wall. The defenders were allowed to surrender that July.')],
         about=('A siege engine that ended sieges', '<p>A counterweight trebuchet is a giant lever. A heavy box of stones on the short arm drops, the long arm whips over, and a sling at its tip lets go of the stone at the top of the swing. Medieval armies used them to batter walls from out of bowshot.</p>'
                '<p>The most famous is the Warwolf, built for Edward I of England at the siege of Stirling Castle in 1304. Master James of St George oversaw its construction, and its shots demolished a section of the curtain wall. In this game you only need to topple timber and stone, and the guards simply wave a white flag.</p>')),
    dict(id='tafl', slug='games/viking-chess.html', js='tafl', short='Viking chess', name='Viking Chess (Hnefatafl)', play_mode=['SinglePlayer', 'MultiPlayer'],
         h1='Viking Chess (Hnefatafl): Play Online Free', og_title='Viking chess: can the king escape?',
         title='Viking Chess (Hnefatafl) Online: Free vs Computer',
         desc='Play Viking chess free in your browser: defend the king or lead the raiders in Brandubh or Tablut, against the computer at three levels or a friend.',
         tagline='Get the king to a corner, or trap him. Every piece moves like a rook.', genre=['Board game', 'Strategy', 'Abstract'],
         card='Lead the king to a corner, or trap him.',
         how=['The defenders and their king start in the middle; the raiders start around the edges. The raiders move first.',
              'Every piece moves any number of empty squares in a straight line, like a rook in chess. Only the king may stop on the throne in the middle or on a corner.',
              'Take an enemy piece by trapping it between two of yours, in a line. A corner, or the empty throne, counts as one of yours.',
              'The defenders win when the king reaches a corner. The raiders win by surrounding the king: four sides on the throne, three beside it, two anywhere else.'],
         touch='Tap a piece, then one of the dots. You can also drag pieces.', keys='Click a piece, then a square. Or use the arrow keys to move the blue frame and Space to choose.',
         tips=['As the king, open two routes to corners at once. The raiders can only block one per move.', 'As the raiders, guard the squares next to the corners before you attack the king.',
               'A piece may move between two enemy pieces safely. Pieces are only taken by the move that closes the trap.', 'The king can take part in captures, so use him as a fighter.'],
         faqs=[('Is Viking chess the same as chess?', 'No. Hnefatafl is an older and different game. The sides are unequal: a king and a small guard against twice as many raiders, and the two sides have different goals.'),
               ('Which rules does this game use?', 'The full Viking rules were never written down, so players use modern reconstructions. Here the king escapes to a corner, and he is captured by four raiders on the throne, three beside it, or two anywhere else. The two boards use the same rules.'),
               ('What are Brandubh and Tablut?', 'Two members of the tafl family. Brandubh is played on a 7 by 7 board; small 7 by 7 tafl boards have been found mainly in Ireland, and the name is usually translated as raven black. Tablut, on 9 by 9, was recorded by Carl Linnaeus in 1732 during his expedition to Lapland.'),
               ('Can two people play?', 'Yes. Choose Two players to pass and play on one phone, tablet or computer.')],
         about=('A board game from the age of the Vikings', '<p>Tafl games were played across the Viking world, and the Icelandic sagas mention hnefatafl by name. A wooden game board from the Gokstad ship burial in Norway has a tafl grid on one side and Nine Men\'s Morris on the other.</p>'
                '<p>The clearest account of how a tafl game was played comes much later. In 1732 the Swedish naturalist Carl Linnaeus recorded Tablut in the journal of his expedition to Lapland. Every modern rule set, including the one used here, is a reconstruction built from that account and from the boards that survive.</p>')),
    dict(id='morris', slug='games/nine-mens-morris.html', js='morris', short="Nine Men's Morris", name="Nine Men's Morris", play_mode=['SinglePlayer', 'MultiPlayer'],
         h1="Nine Men's Morris: Play Online Free", og_title="Nine Men's Morris: can you beat the Lord?",
         title="Nine Men's Morris Online: Free vs Computer or Friend",
         desc="Play Nine Men's Morris free in your browser against the computer at three levels or a friend on one device. The medieval game of mills, with clear rules.",
         tagline='The medieval game of mills. Three in a row takes a piece.', genre=['Board game', 'Strategy', 'Abstract'],
         card='Place, slide, make mills. Beat the Lord.',
         how=['Each player has nine pieces. Take turns placing them on the empty points where the lines meet.',
              'Three of your pieces in a row along a line is a mill. Every mill you make lets you take one of your opponent\'s pieces.',
              'When all eighteen are placed, take turns sliding one piece along a line to the next empty point.',
              'A player down to three pieces may fly to any empty point. Leave your opponent with two pieces, or with no move, and you win.'],
         touch='Tap a point to place a piece. To move, tap your piece and then a glowing point, or drag it.',
         keys='Click, or use the arrow keys to move the blue ring and Space to choose.',
         tips=['Make two-in-a-rows that the computer has to answer, so it spends its turns blocking.', 'A piece that can slide out of a mill and back in again makes a new mill every other turn.',
               'Corners touch only two points; the middle of a side touches three or four. Pieces on corners are easier to hem in.', 'Keep your pieces free to move. Being blocked after the placing phase loses the game.'],
         faqs=[('Can you take a piece that is in a mill?', 'Only when every one of your opponent\'s pieces is in a mill. Otherwise you must take a piece that is not.'),
               ('What happens with three pieces left?', 'That player may fly: move any piece to any empty point, not only along a line. It makes a comeback possible.'),
               ('Can the game be a draw?', 'Yes. Here it is a draw if the same position comes round three times, or if 30 moves each pass without a capture.'),
               ("How old is Nine Men's Morris?", "Very old. A Viking-age board from the Gokstad ship burial in Norway has it on one side, and by the 1300s it was one of the most played games in Europe. In Shakespeare's A Midsummer Night's Dream, Titania complains that the nine men's morris marked out on the village green is filled up with mud.")],
         about=("The game of mills", "<p>Nine Men's Morris goes by many names: mills, merels, and in German Mühle. Boards were scratched into stone benches and church seats, and cut into the turf of village greens.</p>"
                "<p>It was already played in the Viking age: the game board from the Gokstad ship burial in Norway has Nine Men's Morris on one side and a tafl game on the other. The rules here are the common modern ones, including flying when a player is down to three pieces.</p>")),
]
def tafl_svg(title, pieces, arrows=(), taken=(), special=((0, 0), (4, 0), (0, 4), (4, 4), (2, 2)), bad=()):
    """A 5 by 5 rules diagram: pieces (x, y, 'r'aider|'g'uard|'k'ing), moves as arrows, taken pieces crossed out."""
    C, M = 40, 6
    sz = 5 * C + 2 * M
    out = [f'<svg viewBox="0 0 {sz} {sz}" width="{sz}" height="{sz}" role="img" aria-label="{E(title)}">',
           f'<rect x="0" y="0" width="{sz}" height="{sz}" fill="#5c3a1c"/>']
    for y in range(5):
        for x in range(5):
            f = '#8f5f2e' if (x, y) in special else ('#b98a52' if (x + y) % 2 else '#c69a60')
            out.append(f'<rect x="{M + x * C}" y="{M + y * C}" width="{C}" height="{C}" fill="{f}" stroke="rgba(60,34,14,.5)"/>')
            if (x, y) in special:
                cx, cy = M + x * C + C / 2, M + y * C + C / 2
                out.append(f'<path d="M{cx-10} {cy-10}L{cx+10} {cy+10}M{cx+10} {cy-10}L{cx-10} {cy+10}" stroke="rgba(255,225,170,.5)" stroke-width="2"/>')
    ctr = lambda x, y: (M + x * C + C / 2, M + y * C + C / 2)
    for (x0, y0), (x1, y1) in bad:
        (a, b), (c, d) = ctr(x0, y0), ctr(x1, y1)
        out.append(f'<path d="M{a} {b}L{c} {d}" stroke="#c8312f" stroke-width="3" stroke-dasharray="6 5"/>'
                   f'<path d="M{c-8} {d-8}L{c+8} {d+8}M{c+8} {d-8}L{c-8} {d+8}" stroke="#c8312f" stroke-width="4"/>')
    for x, y, k in pieces:
        cx, cy = ctr(x, y)
        fill, ring = {'r': ('#1d1915', '#c9a84f'), 'g': ('#efe6d0', '#7a1020'), 'k': ('#efe6d0', '#7a1020')}[k]
        op = ' opacity=".45"' if (x, y) in taken else ''
        out.append(f'<g{op}><circle cx="{cx}" cy="{cy+2}" r="15" fill="rgba(0,0,0,.35)"/><circle cx="{cx}" cy="{cy}" r="15" fill="{fill}" stroke="#2a1a0e" stroke-width="1.5"/>'
                   f'<circle cx="{cx}" cy="{cy}" r="10" fill="none" stroke="{ring}" stroke-width="2.5"/>')
        if k == 'k':
            out.append(f'<path d="M{cx-8} {cy+4}L{cx-9} {cy-5}L{cx-4} {cy-1}L{cx} {cy-8}L{cx+4} {cy-1}L{cx+9} {cy-5}L{cx+8} {cy+4}Z" fill="#ffd76a" stroke="#5a3a10"/>')
        out.append('</g>')
        if (x, y) in taken:
            out.append(f'<path d="M{cx-12} {cy-12}L{cx+12} {cy+12}M{cx+12} {cy-12}L{cx-12} {cy+12}" stroke="#c8312f" stroke-width="4" stroke-linecap="round"/>')
    for (x0, y0), (x1, y1) in arrows:
        (a, b), (c, d) = ctr(x0, y0), ctr(x1, y1)
        L = ((c - a) ** 2 + (d - b) ** 2) ** 0.5
        ux, uy = (c - a) / L, (d - b) / L
        ex, ey = c - ux * 17, d - uy * 17
        out.append(f'<path d="M{a + ux * 17} {b + uy * 17}L{ex} {ey}" stroke="#ffd76a" stroke-width="4" stroke-linecap="round"/>'
                   f'<path d="M{ex + ux * 8} {ey + uy * 8}L{ex - uy * 7} {ey + ux * 7}L{ex + uy * 7} {ey - ux * 7}Z" fill="#ffd76a"/>')
    out.append('</svg>')
    return ''.join(out)


def tafl_figs():
    figs = [
        ('Moving', 'Every piece slides any distance in a straight line, like a rook. No diagonals, no jumping.',
         tafl_svg('Moving', [(2, 2, 'g')], arrows=[((2, 2), (2, 0)), ((2, 2), (4, 2))], special=((0, 0), (4, 0), (0, 4), (4, 4)), bad=[((2, 2), (4, 4))])),
        ('Taking a piece', 'Trap an enemy between two of your pieces in a line. The trapped piece is taken.',
         tafl_svg('Taking a piece', [(0, 2, 'g'), (1, 2, 'r'), (2, 2, 'g')], arrows=[((2, 4), (2, 2))], taken={(1, 2)}, special=((0, 0), (4, 0), (0, 4), (4, 4)))),
        ('Corners help', 'A corner, or the empty throne, counts as your piece when you trap against it.',
         tafl_svg('Corners help', [(1, 0, 'r'), (2, 0, 'g')], arrows=[((2, 3), (2, 0))], taken={(1, 0)}, special=((0, 0), (4, 0), (0, 4), (4, 4)))),
        ('The king escapes', 'The defenders win as soon as the king reaches any corner.',
         tafl_svg('The king escapes', [(4, 1, 'k'), (1, 3, 'r'), (2, 0, 'r')], arrows=[((4, 1), (4, 4))])),
        ('Trapping the king', 'Away from the throne, two raiders on opposite sides take the king. On the throne he needs four; beside it, three and the throne.',
         tafl_svg('Trapping the king', [(1, 1, 'r'), (2, 1, 'k'), (3, 1, 'r')], arrows=[((3, 4), (3, 1))], taken={(2, 1)}, special=((0, 0), (4, 0), (0, 4), (4, 4)))),
    ]
    cells = ''.join(f'<figure>{svg}<figcaption><b>{E(t)}.</b> {E(c)}</figcaption></figure>' for t, c, svg in figs)
    return f'<h2 class="gilt" style="margin-top:22px">The rules in pictures</h2><div class="rules-figs">{cells}</div>'


GAMES_LD_PUB = {'@type': 'Organization', 'name': 'Usurp (Murary Studios)', 'url': f'{SITE}/'}
for _G in GAMES:
    if _G['id'] == 'tafl':
        _G['figs'] = tafl_figs()
NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
GN = NUM[len(GAMES)]                                   # 'seven': used in page text so it stays right as games are added


def game_scripts(G, embed=False):
    # 'pre' files load on demand inside the game (the physics library): the page only names them
    pre = ''.join(f'<link data-matter href="{ver(x)}">' for x in G.get('pre', []))
    return pre + f'<script src="{ver("/games/engine.js")}" defer></script><script src="{ver("/games/" + G["js"] + ".js")}" defer></script>'


def games_rail(G):
    """House content for the left rail beside a game on wide screens: the other games. A network ad replaces it when on."""
    first = ['siege', 'tafl', 'morris', 'archery', 'joust', 'castle', 'duel']
    others = sorted((g for g in GAMES if g['id'] != G['id']), key=lambda g: first.index(g['id']) if g['id'] in first else 99)
    return ('<div class="rail-games"><p class="ad-lbl">More games</p>' + ''.join(
        f'<a href="/{g["slug"]}"><img src="/img/games/{g["id"]}-400.webp" width="400" height="533" loading="lazy" decoding="async" alt=""><span>{E(g["short"])}</span></a>'
        for g in others[:6]) + '</div>')


def games_promo():
    """House content for the slot low on every crest guide: our free games, so a reader who is done with crests stays."""
    picks = [g for g in GAMES if g['id'] in ('siege', 'tafl', 'morris', 'archery')]
    cells = ''.join(f'<a href="/{g["slug"]}"><img src="/img/games/{g["id"]}-400.webp" width="400" height="533" loading="lazy" decoding="async" alt=""><b>{E(g["short"])}</b></a>' for g in picks)
    return (f'<div class="hg"><p class="hg-k">Free to play, no download</p><h2 class="gilt">Medieval games</h2>'
            f'<p>Take a break from heraldry: {GN} free games, from a trebuchet siege to Viking chess. Your coat of arms rides with you in every one.</p>'
            f'<div class="hg-row">{cells}</div><p><a class="btn ghost" href="/games/">All {GN} games</a></p></div>')


def content_slot():
    return f'<div class="ad-slot ad-content" data-ad-slot data-house="static">{games_promo()}</div>'


def ver(path):
    """'/games/engine.js' -> '/games/engine.js?v=1a2b3c4d' from the file's content, so year-long caching stays safe."""
    with open(os.path.join(ROOT, path.lstrip('/')), 'rb') as f:
        return f'{path}?v={hashlib.sha1(f.read()).hexdigest()[:8]}'


def game_cards(exclude=None, small=False, eager=False):
    out = []
    for g in GAMES:
        if g['id'] == exclude:
            continue
        play = '' if small else '<em>Play free</em>'
        load = ('fetchpriority="high"' if not out else 'loading="eager"' if len(out) < 2 else 'loading="lazy"') if eager else 'loading="lazy"'
        src = (f'src="/img/games/{g["id"]}.webp" srcset="/img/games/{g["id"]}-400.webp 400w, /img/games/{g["id"]}.webp 600w" '
               f'sizes="{"(max-width:560px) 46vw, 260px" if not small else "(max-width:560px) 46vw, 200px"}"')
        out.append(f'<a class="gm-card" href="/{g["slug"]}"><img {src} width="600" height="800" {load} decoding="async" '
                   f'alt="{E(g["name"])}: screenshot of the game"><span class="gc-t"><b>{E(g["name"])}</b><span>{E(g["card"])}</span>{play}</span></a>')
    return ''.join(out)


def ads_json():
    keys = ('client', 'slot', 'h5', 'test', 'ga', 'sponsor')
    return json.dumps({k: ADS[k] for k in keys if ADS.get(k)}, separators=(',', ':'))


EMBED_W = 480
EMBED_H = round(EMBED_W * 4 / 3 + 84)   # the 3:4 game plus its sound bar and the credit line


def embed_code(G):
    """The snippet site owners paste: the game in an iframe, plus a plain text credit link (the part search engines count).
    The height falls back to the fixed attribute wherever the CSS min()/calc() is unsupported or stripped by a CMS."""
    return (f'<iframe src="{SITE}/embed/{G["id"]}.html" title="{G["name"]}, a free medieval game" width="{EMBED_W}" height="{EMBED_H}" '
            f'style="display:block;width:100%;max-width:{EMBED_W}px;height:min({EMBED_H}px,calc(100vw * 1.42));border:0;margin:0 auto" '
            f'loading="lazy" allow="fullscreen; clipboard-write; web-share" allowfullscreen></iframe>\n'
            f'<p style="text-align:center;font-size:14px;margin:6px 0 0"><a href="{page_url(G["slug"])}">{G["name"]}</a>, '
            f'a free game from <a href="{SITE}/">Crest Studio</a></p>')


def embed_box(G):
    return (f'<div class="ge-box" data-emb="{G["id"]}"><textarea readonly rows="6" spellcheck="false" aria-label="Embed code for {E(G["name"])}">{E(embed_code(G))}</textarea>'
            f'<div class="ge-row"><button type="button" class="btn" data-copy>Copy the code</button>'
            f'<a href="/embed/{G["id"]}.html" target="_blank" rel="noopener">Preview</a></div></div>')


def embed_page(G):
    """/embed/<id>.html: just the game, for other sites' iframes. No analytics, no ad network, no cookies; every link opens
    in a new tab; noindex with a canonical to the real game page so search engines credit that page."""
    canon = page_url(G['slug'])
    doc = f'''<!doctype html><html lang="en" class="ue"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(G["name"])}: a free medieval game | Usurp</title>
<meta name="description" content="{E(G["desc"])}"><meta name="robots" content="noindex">
<link rel="canonical" href="{canon}"><base target="_blank"><meta name="theme-color" content="#0c0a08"><link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/cinzel-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/cinzel-decorative-900-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{ver("/styles.css")}"><link rel="stylesheet" href="{ver("/games/games.css")}">
</head><body class="ug-embed"><main class="ue-main"><div class="ug-wrap"><div class="ug" data-game="{G["id"]}"><noscript><p style="padding:24px;text-align:center">This game needs JavaScript turned on. <a href="{canon}">Play it on usurp.games</a></p></noscript></div></div></main>
<a class="ue-by" href="{canon}?from=embed">{E(G["name"])} · free at <b>usurp.games</b></a>
<script>window.USURP_ADS={{}};window.USURP_EMBED=1</script>{game_scripts(G)}
</body></html>'''
    os.makedirs(os.path.join(ROOT, 'embed'), exist_ok=True)
    with open(os.path.join(ROOT, 'embed', f'{G["id"]}.html'), 'w', encoding='utf-8') as f:
        f.write(doc)


def share_row(G):
    """Share links under each game: plain links to each network's own share page (no scripts or trackers from them),
    plus a copy-link button. Every link shares the game's own address, so its share image and title show up."""
    url = page_url(G['slug'])
    text = G.get('share_text') or f'{G["og_title"]} Free to play:'
    u, t = quote(url, safe=''), quote(text, safe='')
    nets = [('whatsapp', 'WhatsApp', f'https://wa.me/?text={quote(text + " " + url, safe="")}'),
            ('x', 'X', f'https://x.com/intent/post?text={t}&url={u}'),
            ('facebook', 'Facebook', f'https://www.facebook.com/sharer/sharer.php?u={u}'),
            ('reddit', 'Reddit', f'https://www.reddit.com/submit?url={u}&title={quote(G["og_title"], safe="")}'),
            ('email', 'Email', f'mailto:?subject={quote(G["og_title"], safe="")}&body={quote(text + " " + url, safe="")}')]
    links = ''.join(f'<a href="{E(h)}" data-share="{k}" target="_blank" rel="noopener">{n}</a>' for k, n, h in nets)
    return (f'<div class="gm-share" aria-label="Share this game"><span>Share this game</span>'
            f'<button type="button" data-share="link" data-url="{url}">Copy link</button>{links}</div>')


def game_page(G):
    p = dict(slug=G['slug'], h1=G['h1'], og='game-' + G['id'], og_title=G['og_title'], title=G['title'], desc=G['desc'], no_related=True,
             og_alt=f'{G["name"]}, a free medieval game: title and a screenshot of the game',
             head_extra=f'<link rel="stylesheet" href="{ver("/games/games.css")}">')
    vg = {'@type': 'VideoGame', 'name': G['name'], 'url': page_url(G['slug']), 'description': G['desc'], 'genre': G['genre'],
          'gamePlatform': ['Web browser', 'Mobile web browser'], 'applicationCategory': 'Game', 'operatingSystem': 'Any', 'playMode': G.get('play_mode', 'SinglePlayer'),
          'inLanguage': 'en', 'isAccessibleForFree': True, 'image': f'{SITE}/img/games/{G["id"]}.webp', 'publisher': GAMES_LD_PUB,
          'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'}}
    crumbs3 = {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Crest Studio', 'item': f'{SITE}/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Medieval games', 'item': f'{SITE}/games/'},
        {'@type': 'ListItem', 'position': 3, 'name': G['name'], 'item': page_url(G['slug'])}]}
    p['ld'] = {'@context': 'https://schema.org', '@graph': [{'@type': 'WebPage', 'name': G['h1'], 'url': page_url(G['slug']), 'description': G['desc']}, crumbs3, vg, faq_ld(G['faqs'])]}
    p['scripts'] = f'<script>window.USURP_ADS={ads_json()}</script>{game_scripts(G)}'
    how = ''.join(f'<li>{E(x)}</li>' for x in G['how'])
    tips = ''.join(f'<li>{E(x)}</li>' for x in G['tips'])
    body = (f'<div class="gm-top"><h1 class="gilt">{E(G["h1"])}</h1><p>{E(G["tagline"])}</p></div>'
            f'<div class="gm-stage"><aside class="ad-slot ad-rail" data-ad-slot data-house="static" aria-label="More games">{games_rail(G)}</aside>'
            f'<div class="ug-wrap"><div class="ug" data-game="{G["id"]}"><noscript><p style="padding:24px;text-align:center">This game needs JavaScript turned on.</p></noscript></div></div>'
            '<aside class="ad-slot ad-rail" data-ad-slot aria-label="Sponsored"></aside></div>'
            f'{share_row(G)}'
            f'<section class="gm-info" id="how-to-play"><h2 class="gilt">How to play</h2><ol>{how}</ol>{G.get("figs", "")}'
            f'<div class="gm-keys"><div><b>Phone and tablet</b>{E(G["touch"])}</div><div><b>Computer</b>{E(G["keys"])}</div></div>'
            f'<h2 class="gilt" style="margin-top:22px">Tips</h2><ul>{tips}</ul>'
            '<div class="callout"><b>Ride under your own banner.</b> Design your coat of arms free in <a href="/crest.html">Crest Studio</a> and it appears in every game on this site: on your shield, your banners and your lance.</div>'
            + (f'<h2 class="gilt" style="margin-top:22px">{E(G["about"][0])}</h2>{G["about"][1]}' if G.get('about') else '') + '</section>'
            f'<section class="gm-embed" id="embed"><details><summary>Put this game on your website (free)</summary>'
            '<p>For blogs, class pages and club sites. Paste this code into an HTML or embed block in WordPress, Blogger, Google Sites, Wix or Squarespace. '
            'Inside the game there are no ad networks, no analytics and no cookies.</p>'
            f'{embed_box(G)}<p style="margin:0 0 14px"><a href="/games/embed.html">All {GN} games, and help adding them</a></p></details></section>'
            '<div class="ad-slot" data-ad-slot></div>'
            f'<section class="gm-more"><h2 class="gilt">More medieval games</h2><div class="gm-grid">{game_cards(G["id"], small=True)}</div>'
            '<p class="center" style="margin-top:14px"><a href="/games/">All games</a> · <a href="/crest.html">Design your coat of arms</a></p></section>')
    body += faq_html(G['faqs'])
    write_page(p, body)


def games_hub():
    slug = 'games/index.html'
    faqs = [('Are the games free?', f'Yes. All {GN} games are free to play in your browser, with no download, no account and no purchase needed.'),
            ('Can I play with a friend?', 'Yes. Viking chess and Nine Men\'s Morris have a two-player mode for one phone, tablet or computer, and every game has a share button to challenge a friend to beat your score.'),
            ('Do they work on phones?', 'Yes. Every game is designed for touch first and also plays with a mouse and keyboard. Use the full-screen button under a game for the best view on a phone.'),
            ('Are the games suitable for children?', 'Yes. There is no blood or gore: arrows hit targets, lances shatter, knights yield and walls crumble.'),
            ('Do you save anything about me?', 'Only your best scores and sound setting, kept in your own browser. There are no accounts. See the <a href="/privacy.html">privacy policy</a>.'),
            ('What does my coat of arms have to do with it?', 'Design a coat of arms in <a href="/crest.html">Crest Studio</a> and every game uses it: on your shield in the duel and the joust, on the banners of your castle and beside your score in the archery contest.')]
    p = dict(slug=slug, h1='Medieval Games', og='games', og_title='Free medieval games: trebuchet siege, Viking chess, archery, jousting and more',
             title='Free Medieval Games Online: Trebuchet, Viking Chess and More',
             desc=f'{GN.capitalize()} free medieval games for phone or computer: trebuchet siege, Viking chess, Nine Men\'s Morris, archery, jousting, castle defense and sword duels.',
             no_related=True, head_extra=f'<link rel="stylesheet" href="{ver("/games/games.css")}">')
    items = {'@type': 'ItemList', 'name': 'Medieval games', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': page_url(g['slug']), 'name': g['name']} for i, g in enumerate(GAMES)]}
    p['ld'] = ld_base(p, [faq_ld(faqs), items])
    p['scripts'] = f'<script>window.USURP_ADS={ads_json()}</script><script src="{ver("/games/engine.js")}" defer></script>'
    body = hero('Free to play · no download', 'Medieval Games',
                f'{GN.capitalize()} games of skill and strategy for your phone or computer, from a trebuchet siege to the board games of the Vikings. Each takes a minute to learn and a lot longer to master.',
                cta_href='#games', cta='Play now', second=('/crest.html', 'Design your coat of arms'))
    body += f'<section id="games"><div class="gm-grid">{game_cards(eager=True)}</div></section>'
    body += ('<section class="gm-info"><h2 class="gilt">Your coat of arms, in every game</h2>'
             '<p>These games are made by Crest Studio, the free coat of arms maker. Design your arms there and they ride with you: on your shield in the joust and the duel, '
             'on the banners of your castle, and beside your score at the archery butts. Your design is saved on your device, so there is nothing to sign up for.</p>'
             '<p style="margin-top:14px"><a class="btn" href="/crest.html">Design my coat of arms</a></p>'
             '<h2 class="gilt" style="margin-top:26px">Put a game on your website</h2>'
             '<p>Run a blog, a class page or a club site? Every game can sit on your page for free with one line of code, and it works on phones. '
             '<a href="/games/embed.html">Get the code</a>.</p></section>'
             '<div class="ad-slot" data-ad-slot></div>')
    body += faq_html(faqs)
    write_page(p, body)


def embed_hub():
    """/games/embed.html: free embeddable games for site owners. Every embed carries a credit link back to the game."""
    slug = 'games/embed.html'
    faqs = [('Is it really free?', 'Yes. Embedding is free for any website, personal, school, club or business. No sign-up, no fee and no key.'),
            ('Are there ads in the embedded games?', 'No ad networks. Every few rounds a short card invites players to design their own coat of arms on Crest Studio, our free coat of arms maker, and they continue with one tap.'),
            ('Do you collect data about my visitors?', 'The embedded games load no analytics, no advertising and no cookies. Best scores and the sound setting stay in the player’s own browser. See the <a href="/privacy.html">privacy policy</a>.'),
            ('Are the games suitable for students?', 'Yes. There is no blood, no chat, no accounts and nothing to buy inside the games: arrows hit targets, lances shatter, knights yield and walls crumble. They work on school Chromebooks, tablets and phones.'),
            ('Can I change the size?', f'Yes. Change the {EMBED_W} in max-width and width to any size you like; the game scales to fit and keeps its shape. It works from about 300 pixels wide.'),
            ('Do I need to update the code when you improve a game?', 'No. The code loads the current version of the game, so fixes and new features reach your page on their own.'),
            ('Can I put the games on a site that sells things?', 'Yes. Please keep the credit line under the game. You may not resell the games, put them behind a paywall or present them as your own.')]
    p = dict(slug=slug, h1='Free Medieval Games for Your Website', og='games', og_title='Free medieval games for your website: copy one code, no sign-up',
             title='Free Medieval Games to Embed on Your Website or Blog | Usurp',
             desc='Put free Viking chess, Nine Men\'s Morris, archery, jousting or a trebuchet siege on your blog or class page. Copy one code. No sign-up, no ad networks.',
             no_related=True, head_extra=f'<link rel="stylesheet" href="{ver("/games/games.css")}">')
    items = {'@type': 'ItemList', 'name': 'Embeddable medieval games', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': page_url(g['slug']), 'name': g['name']} for i, g in enumerate(GAMES)]}
    p['ld'] = ld_base(p, [faq_ld(faqs), items])
    tabs = ''.join(f'<button type="button" data-prev="{g["id"]}" aria-pressed="{str(i == 0).lower()}">{E(g["short"])}</button>' for i, g in enumerate(GAMES))
    # The preview is a screenshot until someone taps it, so a running game never slows the page down.
    p['scripts'] = (f'<script src="{ver("/games/engine.js")}" defer></script>'
                    '<script>(function(){var cur="' + GAMES[0]['id'] + '",box=document.querySelector("[data-prev-box]");'
                    'function show(id,play){cur=id;var f=box.querySelector("iframe");if(play||f){if(!f){f=document.createElement("iframe");f.title="Preview of an embedded game";'
                    'f.setAttribute("allow","fullscreen; clipboard-write; web-share");f.allowFullscreen=true;box.innerHTML="";box.appendChild(f)}f.src="/embed/"+id+".html"}'
                    'else{box.querySelector("img").src="/img/games/"+id+"-400.webp"}'
                    'document.querySelectorAll("[data-prev]").forEach(function(x){x.setAttribute("aria-pressed",String(x.dataset.prev===id))})}'
                    'document.querySelectorAll("[data-prev]").forEach(function(b){b.onclick=function(){show(b.dataset.prev,false)}});'
                    'box.querySelector("[data-prev-play]").onclick=function(){show(cur,true)}})()</script>')
    body = hero('Free for your website', 'Free Medieval Games for Your Website',
                'Put Viking chess, Nine Men\'s Morris, a trebuchet siege, an archery contest or a joust on your blog, class page or club site. Copy the code, paste it in, done. No sign-up, and it works on phones.',
                cta_href='#games', cta='Get the code', second=('/games/', 'Play them first'))
    body += (f'<section class="ge-prev"><h2 class="gilt">This is what your visitors see</h2><div class="ge-tabs">{tabs}</div>'
             f'<div class="ge-frame" data-prev-box><img src="/img/games/{GAMES[0]["id"]}-400.webp" width="400" height="533" loading="lazy" decoding="async" alt="">'
             '<button type="button" class="btn big" data-prev-play>Play the preview</button></div></section>')
    cards = ''.join(f'<div class="ge-game"><img src="/img/games/{g["id"]}-400.webp" width="400" height="533" loading="lazy" decoding="async" alt="{E(g["name"])}: screenshot">'
                    f'<div><h3>{E(g["name"])}</h3><p>{E(g["card"])}</p>{embed_box(g)}</div></div>' for g in GAMES)
    body += f'<section id="games" class="sec" style="padding-bottom:0"><h2 class="gilt center">Pick a game and copy its code</h2><div class="ge-games">{cards}</div></section>'
    steps = [('WordPress', 'Add a Custom HTML block where you want the game and paste the code. On WordPress.com this needs a plan that allows custom code.'),
             ('Blogger', 'In the post editor, switch to HTML view, paste the code where you want the game, then switch back.'),
             ('Google Sites', 'Insert, then Embed, then the Embed code tab. Paste the code, press Next, then Insert. Drag the box taller if the game looks cut off.'),
             ('Wix', 'Add, then Embed Code, then Embed HTML. Paste the code into the box and resize the element to about 480 by 720.'),
             ('Squarespace', 'Add an Embed block, choose Code Snippet, and paste the code. A Code block works too.'),
             ('Anywhere else', 'Any page editor that accepts HTML or an iframe works the same way: paste the code where the game should appear.')]
    body += ('<section class="gm-info"><h2 class="gilt">How to add it</h2><div class="ge-steps">'
             + ''.join(f'<div><b>{E(a)}</b>{E(b)}</div>' for a, b in steps) + '</div>'
             f'<p>Only want a link? Point to <a href="/games/">usurp.games/games</a> for all {GN} games.</p>'
             '<div class="callout"><b>Made by Crest Studio.</b> These games come from <a href="/crest.html">Crest Studio</a>, the free coat of arms maker. '
             'Questions or a game you would like for your class or club: <a href="mailto:hello@usurp.games?subject=Embedded%20games">hello@usurp.games</a>.</div></section>')
    body += faq_html(faqs)
    write_page(p, body)


def games_pages():
    for G in GAMES:
        game_page(G)
        embed_page(G)
    games_hub()
    embed_hub()
    # ads.txt tells ad buyers which sellers may sell this site's ad space. Written only once AdSense is configured.
    path = os.path.join(ROOT, 'ads.txt')
    if ADS['client']:
        with open(path, 'w') as f:
            f.write(f"google.com, {ADS['client'].replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n")
    elif os.path.exists(path):
        os.remove(path)


def stats_page():
    """usurp.games/stats.html: plays per game per week, for Prakhar to check himself. Not linked, not indexed."""
    names = json.dumps({g['id']: g['name'] for g in GAMES})
    slugs = json.dumps({g['id']: '/' + g['slug'] for g in GAMES})
    short = json.dumps({g['id']: g['short'] for g in GAMES})
    doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Game plays | Usurp</title><meta name="robots" content="noindex,nofollow"><link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/cinzel-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="{ver("/styles.css")}">
<style>
main{{max-width:980px;margin:0 auto;padding:24px 16px 60px}}h1{{font-size:clamp(26px,5vw,38px);margin:0}}
.sub{{color:var(--muted);margin:4px 0 18px}}.box{{border:1px solid #3a2e1f;background:#120e0a;padding:14px 16px;margin:14px 0}}
.tw{{overflow-x:auto;border:1px solid #3a2e1f;margin:12px 0}}table{{border-collapse:collapse;width:100%;font-size:16px;font-variant-numeric:tabular-nums}}
th,td{{padding:9px 12px;text-align:right;border-bottom:1px solid #2a2117;white-space:nowrap}}th:first-child,td:first-child{{text-align:left}}
th{{font-family:var(--serif);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-2);background:#17120d;font-weight:700}}
tr.tot td{{font-weight:700;color:var(--gold-2);border-top:1px solid #5a4523}}td a{{color:var(--text)}}.muted{{color:var(--muted);font-size:15px}}
h2{{font-size:clamp(20px,4vw,26px);margin:26px 0 4px}}
.wk th,.wk td{{padding:8px 9px;font-size:15px}}.wk th{{font-size:11px;letter-spacing:.08em}}
</style></head><body><main>
<h1 class="gilt">Game plays</h1><p class="sub" data-sub>Loading the counts…</p>
<div data-out></div>
<div class="box muted"><b style="color:var(--gold-2)">What counts.</b> A play is someone starting a game on usurp.games (in Siege, starting a castle). Finished means they reached the results screen
(Nine Men's Morris, Viking chess and Siege count a finished match or castle). Weeks run Monday to Sunday in UTC, so they start at 5:30 am India time on Monday.
Games embedded on other sites and the CrazyGames versions are not counted here: embeds collect nothing, and CrazyGames shows its own numbers in its developer portal.
The same plays also appear in Microsoft Clarity as Smart events named play_archery, play_joust and so on.</div>
</main>
<script>
(function(){{
var NAMES={names},SLUGS={slugs},SHORT={short},out=document.querySelector('[data-out]'),sub=document.querySelector('[data-sub]');
function n(x){{return (x||0).toLocaleString('en-US')}}
function esc(s){{return String(s).replace(/[&<>"]/g,function(c){{return{{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}}[c]}})}}
function day(s){{var d=new Date(s+'T00:00:00Z');return d.toLocaleDateString('en-GB',{{day:'numeric',month:'short',timeZone:'UTC'}})}}
fetch('/api/stats',{{cache:'no-store'}}).then(function(r){{return r.json()}}).then(function(j){{
  if(!j.connected){{sub.textContent='The play counter is built but not connected to its database yet, so there are no counts to show.';out.innerHTML='<div class="box">Connect the free Upstash Redis database to the usurp-realm project in Vercel (Storage, then Create Database, then Upstash for Redis) and redeploy. Counting starts from that moment.</div>';return}}
  if(!j.ok){{sub.textContent='The counter could not be reached just now. Try again in a minute.';return}}
  var G=j.games,W=j.weeks,cur=W[0],prev=W[1],sum=function(w,g,e){{return (w&&w.counts[g]&&w.counts[g][e])||0}};
  var four=function(g,e){{var t=0;for(var i=0;i<4&&i<W.length;i++)t+=sum(W[i],g,e);return t}};
  var all=function(g,e){{return (j.all[g]&&j.all[g][e])||0}};
  var rows=G.map(function(g){{return {{g:g,tw:sum(cur,g,'play'),lw:sum(prev,g,'play'),f4:four(g,'play'),al:all(g,'play'),fin:all(g,'finish')}}}}).sort(function(a,b){{return b.tw-a.tw||b.lw-a.lw||b.al-a.al}});
  var T={{tw:0,lw:0,f4:0,al:0,fin:0}};rows.forEach(function(r){{for(var k in T)T[k]+=r[k]}});
  sub.textContent='This week started '+day(cur.start)+'. Updated '+new Date(j.updated).toLocaleString('en-GB',{{dateStyle:'medium',timeStyle:'short'}})+'.';
  var h='<h2 class="gilt">Plays per game</h2><div class="tw"><table><thead><tr><th>Game</th><th>This week</th><th>Last week</th><th>Last 4 weeks</th><th>All time</th><th>Finished</th></tr></thead><tbody>';
  rows.forEach(function(r){{h+='<tr><td><a href="'+SLUGS[r.g]+'">'+esc(NAMES[r.g]||r.g)+'</a></td><td>'+n(r.tw)+'</td><td>'+n(r.lw)+'</td><td>'+n(r.f4)+'</td><td>'+n(r.al)+'</td><td>'+n(r.fin)+(r.al?' ('+Math.round(100*r.fin/r.al)+'%)':'')+'</td></tr>'}});
  h+='<tr class="tot"><td>All games</td><td>'+n(T.tw)+'</td><td>'+n(T.lw)+'</td><td>'+n(T.f4)+'</td><td>'+n(T.al)+'</td><td>'+n(T.fin)+'</td></tr></tbody></table></div>';
  h+='<h2 class="gilt">Week by week</h2><p class="muted">Plays per game, newest week first.</p><div class="tw"><table class="wk"><thead><tr><th>Week of</th>'+G.map(function(g){{return '<th>'+esc(SHORT[g]||g)+'</th>'}}).join('')+'<th>Total</th></tr></thead><tbody>';
  var any=function(w){{return G.some(function(g){{return sum(w,g,'play')}})}},last=3;W.forEach(function(w,i){{if(any(w))last=Math.max(last,i)}});
  W.slice(0,last+1).forEach(function(w){{var t=0;h+='<tr><td>'+day(w.start)+'</td>'+G.map(function(g){{var v=sum(w,g,'play');t+=v;return '<td>'+n(v)+'</td>'}}).join('')+'<td>'+n(t)+'</td></tr>'}});
  out.innerHTML=h+'</tbody></table></div>';
}}).catch(function(){{sub.textContent='The counter could not be reached just now. Try again in a minute.'}});
}})();
</script></body></html>'''
    with open(os.path.join(ROOT, 'stats.html'), 'w', encoding='utf-8') as f:
        f.write(doc)


def advertise():
    """A plain page for selling the game ad slots directly, linked from every house banner."""
    slug = 'advertise.html'
    p = dict(slug=slug, h1='Advertise on Usurp', og='games', og_title='Advertise on Usurp: medieval games and Crest Studio',
             title='Advertise on Usurp: Medieval Games and Crest Studio',
             desc='Put your brand in front of players of free medieval games and people designing family crests and fantasy sigils. Banner and round-sponsor placements, family friendly, no pop-ups.',
             no_related=True)
    p['ld'] = ld_base(p)
    rows = [('Game banner', f'Under each of the {GN} games and on the games hub. Your 728 x 90 image and link, scaled to fit phones. It sits below the game, so it never catches a tap meant for the game.'),
            ('Round sponsor', 'Your image and link on the intermission card between rounds, titled as today\'s tournament sponsor. Shown only at natural breaks, never during play, and players continue with one tap.'),
            ('Custom sponsorship', 'For example a tournament named after your brand, or your arms carried by a challenger in the joust and the duel. Ask us.')]
    table = ''.join(f'<div><b>{E(a)}</b>{E(b)}</div>' for a, b in rows)
    body = hero('Advertising', 'Advertise on Usurp',
                'Our free medieval games (archery, jousting, castle defense and sword duels) and Crest Studio, the coat of arms maker, reach fans of history, fantasy, tabletop games and family heritage.',
                cta_href='mailto:hello@usurp.games?subject=Advertising%20on%20Usurp', cta='Email us')
    body += f'''<section class="sec"><h2 class="gilt">Placements</h2><div class="gm-keys">{table}</div>
<h2 class="gilt" style="margin-top:22px">What we accept</h2>
<ul><li>A static image (PNG, JPG or WebP), a link and a line of alt text. No pop-ups, no auto-playing sound, no trackers.</li>
<li>Products and services suitable for a general audience, including children. No gambling, adult content, alcohol, tobacco or weapons.</li>
<li>Every placement is labelled as a sponsor.</li></ul>
<h2 class="gilt" style="margin-top:22px">Price</h2>
<p>A flat fee per week or per month, quoted on request. Before you pay, we show you the current visits to the pages your ad would run on, so you know what you are buying.</p>
<p style="margin-top:16px"><a class="btn" href="mailto:hello@usurp.games?subject=Advertising%20on%20Usurp">hello@usurp.games</a></p></section>'''
    p['head_extra'] = f'<link rel="stylesheet" href="{ver("/games/games.css")}">'
    write_page(p, body)


def sitemap_and_llms():
    pages = [('index.html', '1.0'), ('crest.html', '0.9')] + [(s, '0.8') for s, _, _ in PAGES_INDEX if s != 'index.html'] + [('terms.html', '0.2'), ('privacy.html', '0.2'), ('refunds.html', '0.2')]
    def imgs(slug):
        try:
            body = open(os.path.join(ROOT, slug), encoding='utf-8').read() if slug else ''
        except FileNotFoundError:
            return ''
        found = list(dict.fromkeys(re.findall(r'src="(/img/(?:crests|home|games)/[^"]+)"', body)))
        return ''.join(f'<image:image><image:loc>{SITE}{u}</image:loc></image:image>' for u in found[:1000])
    urls = ''.join(f'<url><loc>{page_url(s)}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority>{imgs(s)}</url>\n' for s, pr in pages)
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w') as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n{urls}</urlset>\n')
    with open(os.path.join(ROOT, 'tools', 'img-jobs.json'), 'w') as f:
        json.dump(IMG_JOBS, f)
    lines = ['# Crest Studio by Usurp', '',
             '> Free online coat of arms and family crest maker. Anyone can design a heraldic crest (name, motto, colors, division, emblem) in the browser for free with no account. A one-time $9 purchase downloads print-ready files (4000 px PNG, 1200 px PNG, SVG vector), a certificate of arms with its blazon and meaning, a profile picture and a phone wallpaper. A $19 Heirloom set adds a hatched engraving, line-art and two-tone files for stamps and embroidery, a round seal for wax seal stamps, a coloring page, bookplates, a house banner and an A4 certificate. A $29 Crest Logo Kit adds the heirloom files plus transparent logo files, favicons and app icons, social banners and a brand sheet for clubs, teams and businesses. All files are usable for any lawful purpose, personal or commercial. Original decorative artwork, not an official grant of arms. Payments by Dodo Payments; 14-day refunds.', '',
             '## Main tool', f'- [Crest Studio home]({SITE}/): what Crest Studio is, sample files, and six crests for any last name',
             f'- [Crest Studio: design your own coat of arms]({SITE}/crest.html): the free designer with 50 heraldic emblems, and the $9 download', '',
             '## Free tools and guides']
    lines += [f'- [{h}]({SITE}/{s}): {d}' for s, h, d in PAGES_INDEX if s != 'index.html']
    lines += ['', '## Policies', f'- [Terms]({SITE}/terms.html)', f'- [Refunds]({SITE}/refunds.html)', f'- [Privacy]({SITE}/privacy.html)', '',
              'Contact: hello@usurp.games. Operated by Prakhar Murary (Murary Studios), Jaipur, India.', '']
    with open(os.path.join(ROOT, 'llms.txt'), 'w') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    for fn in (home, surname, quiz, ideas, family, dnd, wedding, clan, school, mottos, houses, meanings, templates, games_pages, advertise, stats_page):
        fn()
    for sp in SPECS:
        spec_page(sp)
    sitemap_and_llms()
    print('built', len(PAGES_INDEX), 'pages:', ', '.join(s for s, _, _ in PAGES_INDEX))
