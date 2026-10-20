#!/usr/bin/env python3
"""Builds the Crest Studio guide and free-tool pages, sitemap.xml and llms.txt.
Run from the repo root:  python3 tools/build.py
Pages are plain static HTML so search engines and AI crawlers read everything without JS."""
import html, json, os, subprocess, sys, datetime
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(__file__))
from data import *  # noqa
from usecases import SPECS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://usurp.games'
TODAY = datetime.date.today().isoformat()
E = html.escape


def render(items):
    """items: list of (design, uid, label) -> list of {svg,url} using crest-core.js"""
    payload = json.dumps([{'d': d, 'uid': u, 'label': l} for d, u, l in items])
    out = subprocess.run(['node', os.path.join(ROOT, 'tools', 'render.js')], input=payload,
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


NAV = [('/crest.html', 'Studio'), ('/family-crest-generator.html', 'By last name'), ('/family-crest-gift.html', 'Gifts'), ('/latin-motto-generator.html', 'Mottos'),
       ('/fantasy-house-name-generator.html', 'House names'),
       ('/heraldry-symbols-and-meanings.html', 'Meanings'), ('/coat-of-arms-template.html', 'Templates')]

PAGES_INDEX = []  # (slug, title, blurb) filled by page()


def head(p):
    ld = json.dumps(p['ld'], ensure_ascii=False).replace('</', '<\\/')
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(p['title'])}</title>
<meta name="description" content="{E(p['desc'])}">
<link rel="canonical" href="{SITE}/{p['slug']}">
<meta property="og:title" content="{E(p['og_title'])}"><meta property="og:description" content="{E(p['desc'])}"><meta property="og:url" content="{SITE}/{p['slug']}"><meta property="og:type" content="website"><meta property="og:site_name" content="Crest Studio by Usurp"><meta property="og:image" content="{SITE}/og/{p['og']}.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{E(p['og_title'])}"><meta name="twitter:description" content="{E(p['desc'])}"><meta name="twitter:image" content="{SITE}/og/{p['og']}.png">
<script type="application/ld+json">{ld}</script>
<script type="text/javascript">(function(c,l,a,r,i,t,y){{c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);}})(window,document,"clarity","script","yzjmha008x");</script>
<meta name="theme-color" content="#14110e"><link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;700&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/studio.css"><link rel="stylesheet" href="/pages.css">{p.get('head_extra', '')}
</head>'''


def header(slug):
    cur = ' aria-current="page"'
    links = ''.join(f'<a href="{h}"{cur if h == "/" + slug else ""}>{t}</a>' for h, t in NAV)
    return f'<header class="site-head"><div class="head-in"><a class="brand" href="/crest.html"><span class="gilt">CREST STUDIO</span></a><nav class="nav" aria-label="Site">{links}</nav></div></header>'


# Every guide page: (slug, short title, one-line blurb). Spec pages from usecases.py are appended automatically.
REGISTRY = [
    ('family-crest-generator.html', 'Crest by last name', 'Six crests for your surname in one click'),
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
]


def footer():
    allp = [('/crest.html', 'Coat of arms maker')] + [('/' + s, t) for s, t, _ in REGISTRY]
    links = ''.join(f'<a href="{h}">{t}</a>' for h, t in allp)
    return f'''<footer class="site-foot"><nav class="foot-links" aria-label="Crest Studio pages">{links}</nav>
<p><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refunds</a> · <a href="mailto:hello@usurp.games">hello@usurp.games</a></p>
<p>Crest Studio by Usurp · Operated by Prakhar Murary (Murary Studios), Jaipur, Rajasthan, India</p></footer>'''


def gallery(designs, prefix, btn='Customize this crest'):
    out = render([(d, f'{prefix}{i}', f'Example coat of arms: {d["name"]}') for i, d in enumerate(designs)])
    cards = []
    for d, r in zip(designs, out):
        sub = f'<p class="sub">{E(d["motto"])}</p>' if d['motto'] else ''
        cards.append(f'<figure class="card">{r["svg"]}<figcaption class="cap">{E(d["name"])}</figcaption>{sub}'
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
        {'@type': 'ListItem', 'position': 1, 'name': 'Crest Studio', 'item': f'{SITE}/crest.html'},
        {'@type': 'ListItem', 'position': 2, 'name': name, 'item': f'{SITE}/{slug}'}]}


def write_page(p, body):
    PAGES_INDEX.append((p['slug'], p['h1'], p['desc']))
    doc = head(p) + '<body>' + header(p['slug']) + '<main>' + body + related(p['slug']) + '</main>' + footer() + p.get('scripts', '') + '</body></html>'
    with open(os.path.join(ROOT, p['slug']), 'w', encoding='utf-8') as f:
        f.write(doc)


def hero(eyebrow, h1, lede, cta_href='/crest.html', cta='Design yours free', second=None):
    s = f'<a class="btn ghost" href="{second[0]}">{second[1]}</a>' if second else ''
    return f'''<section class="pg-hero"><p class="eyebrow">{eyebrow}</p><h1 class="gilt">{h1}</h1>
<p class="lede">{lede}</p><div class="cta-row"><a class="btn big" href="{cta_href}">{cta}</a>{s}</div></section>'''


PRICE_NOTE = 'Designing is free and needs no account. When you love it, $9 gets the whole set: print-ready art (4000 px PNG and SVG), a certificate of arms explaining its meaning, a profile picture and a phone wallpaper. For a club, team or business, the <a href="/crest-logo-maker.html">$29 Logo Kit</a> adds logo, icon, banner and brand files.'


def ld_base(p, extra=None):
    g = [{'@type': 'WebPage', 'name': p['h1'], 'url': f"{SITE}/{p['slug']}", 'description': p['desc'],
          'isPartOf': {'@type': 'WebSite', 'name': 'Crest Studio by Usurp', 'url': f'{SITE}/crest.html'}},
         crumbs(p['slug'], p['h1'])]
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
    ]
    p = dict(slug=slug, h1='Heraldry Symbols and Meanings', og='meanings', og_title='Heraldry Symbols and Meanings: colors, divisions and emblems',
             title='Heraldry Symbols and Meanings: Coat of Arms Colors and Emblems Explained | Crest Studio',
             desc='What the colors, divisions and emblems on a coat of arms mean: Or, Argent, Gules, Azure, Vert, Purpure, Sable, the rule of tincture, chevrons, towers, keys, roses and stars.')
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
    dcards = ''.join(f'<figure class="card">{r["svg"]}<figcaption class="cap">{n}</figcaption><p class="sub">{t}</p><a class="btn ghost" href="{r["url"]}">Try a {n.lower()}</a></figure>' for (k, n, t, f, d), r in zip(divs, dv))
    charges = [('tower', 'Tower', 'Defense, protection and the safety of a home. A good emblem for a family or a border house.', SABLE, OR, GOLD_LIGHT, 'chevron'),
               ('key', 'Key', 'Guardianship and trust. Keys are the emblem of Saint Peter, keeper of the keys of heaven.', AZURE, ARGENT, GOLD_LIGHT, 'bend'),
               ('rose', 'Rose', 'Hope and joy. The Tudor rose united the red rose of Lancaster and the white rose of York. In English cadency, a seventh son.', VERT, OR, GULES, 'fess'),
               ('crescent', 'Crescent', 'Hope of greater glory. In English cadency marks, the second son.', AZURE, ARGENT, ARGENT, 'plain'),
               ('mullet', 'Star (mullet)', 'A five-pointed star, originally a spur rowel. Read as a person who shines. In English cadency, a third son.', PURPURE, OR, GOLD_LIGHT, 'pale'),
               ('sword', 'Sword', 'Justice and military honor.', GULES, OR, ARGENT, 'chevron'),
               ('crown', 'Crown', 'Authority, victory, or loyalty to a sovereign.', AZURE, OR, OR, 'fess'),
               ('initial', 'Initial', 'A modern touch: your family or house initial, monogram style.', MURREY, OR, GOLD_LIGHT, 'chevron')]
    cv = render([(crest('', '', f, d, c, dv_, k), f'ch{i}', f'{n} emblem example') for i, (k, n, _, f, d, c, dv_) in enumerate(charges)])
    ccards = ''.join(f'<figure class="card">{r["svg"]}<figcaption class="cap">{n}</figcaption><p class="sub">{t}</p><a class="btn ghost" href="{r["url"]}">Use a {n.split(" (")[0].lower()}</a></figure>' for (k, n, t, *_), r in zip(charges, cv))
    body = hero('A plain-English guide', 'Heraldry Symbols and Meanings',
                'What the colors, divisions and emblems on a coat of arms traditionally mean, and how to use them to design a crest that says something true about you.',
                cta_href='#colors', cta='Read the guide', second=('/crest.html', 'Design a crest'))
    body += '''<section class="sec"><div class="callout"><b>A word of honesty.</b> Early heralds chose colors and shapes to be recognized, not to send a message. The meanings below were written down later, mostly by heraldic authors of the 1500s and 1600s, and different books disagree. Use them as inspiration, not rules.</div></section>'''
    body += f'''<section class="sec" id="colors"><h2 class="gilt">Heraldic colors (tinctures)</h2>
<p>Heraldry calls its colors tinctures. There are two metals, five main colors and a few rarer "stains".</p>
<div class="tblwrap"><table class="tbl"><thead><tr><th>Tincture</th><th>Plain English</th><th>Type</th><th>Traditional meaning</th></tr></thead><tbody>{trs}</tbody></table></div>
<h3>The rule of tincture</h3><p>Never put a metal on a metal or a color on a color. Gold on blue reads from across a field; red on blue blurs. Every example on this site follows the rule, and following it is the single easiest way to make a crest look authentic.</p></section>'''
    body += f'<section class="sec" id="divisions"><h2 class="gilt">Divisions and ordinaries</h2><p>The broad shapes that divide or cross the shield. Heralds call bands like the chevron and fess "ordinaries" and splits like per pale "partitions".</p></section><div class="gallery">{dcards}</div>'
    body += f'<section class="sec" id="emblems"><h2 class="gilt">Emblems (charges)</h2><p>Anything placed on the shield is a charge. These are the emblems available in Crest Studio. Cadency marks, mentioned below, were small symbols English heralds used to tell sons of the same father apart.</p></section><div class="gallery">{ccards}</div>'
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
    ex = [crest('The Carter Family', 'Together We Rise', AZURE, OR, GOLD_LIGHT, 'chevron', 'initial'),
          crest('The Carter Family', 'Root and Branch', VERT, ARGENT, GOLD_LIGHT, 'perpale', 'key'),
          crest('The Carter Family', 'Hold Fast', SABLE, OR, OR, 'fess', 'tower'),
          crest('The Carter Family', 'Per Aspera ad Astra', PURPURE, OR, GOLD_LIGHT, 'bend', 'mullet'),
          crest('The Carter Family', 'Faithful in All Things', GULES, OR, ARGENT, 'quarterly', 'rose'),
          crest('The Carter Family', 'Ever Onward', MURREY, ARGENT, ARGENT, 'saltire', 'crescent')]
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
<li><b>Then the emblem.</b> A tower for a family that built a home, a key for trust, a rose for love, a star for big ambitions, your initial for something unmistakably yours.</li>
<li><b>Then make it personal.</b> Open your favorite in Crest Studio and swap in a motto your family actually says, or pick one from the <a href="/latin-motto-generator.html">Latin motto generator</a>.</li></ul>
<div class="callout"><b>Why not just look up "our" crest?</b> Sites that sell a coat of arms for every surname are showing arms that belonged to one family line, which may have no connection to yours. Designing your own is honest, and it can say something true about your family today.</div>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Open the full studio</a></p></section>'''
    body += faq_html(faqs)
    write_page(p, body)


def spec_page(sp):
    p = dict(slug=sp['slug'], h1=sp['h1'], og=sp['og'], og_title=sp['og_title'], title=sp['title'], desc=sp['desc'])
    p['ld'] = ld_base(p, [faq_ld(sp['faqs']), APP_LD])
    body = hero(sp['eyebrow'], sp.get('h1_html', E(sp['h1'])), sp['lede'] + ' ' + sp.get('price_note', PRICE_NOTE),
                cta=sp.get('cta', 'Design yours free'), second=sp.get('second'))
    body += gallery(sp['examples'], 'x' + sp['og'][:4])
    body += sp['body']
    body += faq_html(sp['faqs'])
    write_page(p, body)


for _sp in SPECS:
    if not any(r[0] == _sp['slug'] for r in REGISTRY):
        REGISTRY.append((_sp['slug'], _sp['short'], _sp['blurb']))


def sitemap_and_llms():
    pages = [('crest.html', '1.0')] + [(s, '0.8') for s, _, _ in PAGES_INDEX] + [('', '0.5'), ('terms.html', '0.2'), ('privacy.html', '0.2'), ('refunds.html', '0.2')]
    urls = ''.join(f'<url><loc>{SITE}/{s}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority></url>\n' for s, pr in pages)
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w') as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    lines = ['# Crest Studio by Usurp', '',
             '> Free online coat of arms and family crest maker. Anyone can design a heraldic crest (name, motto, colors, division, emblem) in the browser for free with no account. A one-time $9 purchase downloads print-ready files (4000 px PNG, 1200 px PNG, SVG vector), a certificate of arms with its blazon and meaning, a profile picture and a phone wallpaper. A $29 Crest Logo Kit adds transparent logo files, favicons and app icons, social banners and a brand sheet for clubs, teams and businesses. All files are usable for any lawful purpose, personal or commercial. Original decorative artwork, not an official grant of arms. Payments by Dodo Payments; 14-day refunds.', '',
             '## Main tool', f'- [Crest Studio: design your own coat of arms]({SITE}/crest.html): the free designer and $9 download', '',
             '## Free tools and guides']
    lines += [f'- [{h}]({SITE}/{s}): {d}' for s, h, d in PAGES_INDEX]
    lines += ['', '## Policies', f'- [Terms]({SITE}/terms.html)', f'- [Refunds]({SITE}/refunds.html)', f'- [Privacy]({SITE}/privacy.html)', '',
              'Contact: hello@usurp.games. Operated by Prakhar Murary (Murary Studios), Jaipur, India.', '']
    with open(os.path.join(ROOT, 'llms.txt'), 'w') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    for fn in (surname, family, dnd, wedding, clan, school, mottos, houses, meanings, templates):
        fn()
    for sp in SPECS:
        spec_page(sp)
    sitemap_and_llms()
    print('built', len(PAGES_INDEX), 'pages:', ', '.join(s for s, _, _ in PAGES_INDEX))
