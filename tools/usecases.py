"""Spec-driven guide pages. To add a page, append one dict to SPECS and run tools/build.py then tools/assets.py.

Rules every page must follow (the weekly autopilot reads this too):
- Honest, checkable content only. No invented statistics, testimonials, sales counts or fake urgency.
- Never claim a design is an official or inherited coat of arms. No trademarked or fictional-franchise names.
- US spelling. No em dashes. Plain, warm, specific writing; at least ~500 words of body that is unique to the page.
- examples: 3 to 6 crests using only the tinctures and emblems in data.py, following the rule of tincture
  (a metal, Or or Argent, against a color). Charges available: tower, sword, crown, key, crescent, rose, mullet, initial, none.
  Divisions: plain, perpale, fess, bend, chevron, quarterly, saltire, pale. Names up to 40 characters, mottos up to 48.
- body: HTML using <section class="sec">, <h2 class="gilt">, <h3>, <p>, <ul>/<ol>, <div class="callout"><b>..</b> ..</div>.
  Link to 2 or 3 related pages and end with a CTA button to /crest.html.
- faqs: 3 to 5 (question, answer-html) pairs that a real searcher would ask.
"""
from data import *  # noqa

SPECS = [
    dict(
        slug='family-crest-gift.html', short='Family crest gift', blurb='A personal gift with a certificate', og='gift',
        h1='Family Crest Gift', h1_html='A Family Crest Gift They Will Keep',
        title='Family Crest Gift: Personalized Coat of Arms With Certificate | Crest Studio',
        og_title='Family Crest Gift: a personalized coat of arms with certificate',
        desc='Give a personalized family crest: print-ready coat of arms art plus a certificate of arms with its meaning and a "presented to" line. Instant download, $9.',
        eyebrow='For Christmas, anniversaries, weddings and new homes',
        lede='A family crest is a gift with a story: their name, their colors, their motto, and a certificate explaining what it all means. You design it in a few minutes, it downloads instantly, and it prints at any size.',
        examples=[crest('The Okafor Family', 'Together We Rise', AZURE, OR, GOLD_LIGHT, 'chevron', 'mullet'),
                  crest('Grandma and Grandpa Rossi', 'Root and Branch', VERT, OR, GOLD_LIGHT, 'perpale', 'rose'),
                  crest('The Lees', 'Home Is Our Hearth', MURREY, OR, GOLD_LIGHT, 'fess', 'tower'),
                  crest('House Kowalski', 'Ever Onward', SABLE, OR, OR, 'quarterly', 'key')],
        body='''<section class="sec"><h2 class="gilt">Why a family crest makes a good gift</h2>
<p>Most gifts are things. A crest is a little piece of identity: it takes what a family cares about and turns it into one emblem they can hang on the wall, print on mugs or pass down. Because you choose every part of it, it says "I thought about you" in a way a gift card never does.</p>
<ul><li><b>Personal.</b> Their family name, colors with meaning, an emblem that fits them and a motto they actually say.</li>
<li><b>Explained.</b> The certificate of arms spells out the design in heraldic language (the blazon) and in plain English, so it starts conversations.</li>
<li><b>Instant.</b> Files download the moment you pay, which makes it one of the few personalized gifts that works the night before.</li>
<li><b>Prints anywhere.</b> Any local print shop, office store photo counter or online printer can print the files. No shipping from us.</li></ul></section>
<section class="sec"><h2 class="gilt">Gift ideas by occasion</h2>
<h3>Christmas and the holidays</h3><p>A framed crest for parents or in-laws, or the same crest on a set of mugs for every household in the family.</p>
<h3>Weddings and anniversaries</h3><p>Join two family names on one shield with the Per pale division, the old heraldic way of uniting two families. See the <a href="/wedding-crest.html">wedding crest guide</a>.</p>
<h3>A new home</h3><p>A tower or key emblem for a housewarming print above the door, with the family name and the year they moved in as the motto.</p>
<h3>Grandparents and family reunions</h3><p>A crest for the whole family tree, printed on the reunion banner and T-shirts, with a framed copy for the grandparents who started it all.</p>
<h3>Father's Day, Mother's Day and birthdays</h3><p>A crest built around one person: their initial on the shield and a motto that is pure them.</p></section>
<section class="sec"><h2 class="gilt">How to give it</h2><ol>
<li><b>Design it</b> in <a href="/crest.html">Crest Studio</a>. Need words? The <a href="/latin-motto-generator.html">Latin motto generator</a> has 50+ mottos with translations, and the <a href="/heraldry-symbols-and-meanings.html">meanings guide</a> explains every color and emblem.</li>
<li><b>Add the gift line.</b> Open "Giving it as a gift?" and type who it is for and who it is from. It prints on the certificate.</li>
<li><b>Download the set</b> for $9: print art, certificate, profile picture and phone wallpaper.</li>
<li><b>Print and frame.</b> The 4000 by 5000 px file prints at about 13 by 16 inches at full photo quality (300 pixels per inch), and comfortably at 16 by 20. The certificate is sized for US Letter.</li></ol>
<div class="callout"><b>Short on time?</b> In the studio, open "Send it as a free e-card": they get a link where their crest appears with your message, and you can print a framed copy later. It still counts.</div>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Design the gift</a></p></section>''',
        faqs=[('Can I give it as a last-minute gift?', 'Yes. The files download as soon as payment goes through, so you can print or email them the same day.'),
              ('Does the recipient need an account or anything else?', 'No. They receive ordinary image files (PNG and SVG) that open on any phone or computer.'),
              ('Can I add a personal message?', 'Yes. Under "Giving it as a gift?" in the studio, add who it is presented to and who it is from. It prints on the certificate of arms along with the date.'),
              ('Is it their real, historical family coat of arms?', 'No. It is original artwork you design for them in the style of heraldry, not an official grant of arms or a claim about their ancestors. Many people find that more meaningful, because it describes the family as it is today.')],
    ),
    dict(
        slug='crest-logo-maker.html', short='Crest logo maker', blurb='A logo kit for clubs and businesses', og='logo',
        h1='Crest Logo Maker', h1_html='Crest Logo Maker for Clubs and Businesses',
        title='Crest Logo Maker: Heraldic Logo Kit for Clubs, Teams and Businesses | Crest Studio',
        og_title='Crest Logo Maker: a heraldic logo kit for clubs and businesses',
        desc='Design a crest logo for your brewery, barbershop, club, team or channel, then get a full logo kit: transparent PNG and SVG, favicons, social banners and a brand sheet. $29.',
        eyebrow='For breweries, barbershops, clubs, teams and creators',
        lede='A crest says "established" before anyone reads a word. Design yours in the free studio, then get the Crest Logo Kit: every file a small brand needs, in one ZIP.',
        cta='Design your crest logo',
        price_note='Designing is free with no account. The kit is a one-time $29. Only need the artwork? The $9 set has print files, an SVG and a certificate of arms.',
        examples=[crest('Ironhold Brewing Co.', 'Brewed With Patience', SABLE, OR, GOLD_LIGHT, 'chevron', 'tower'),
                  crest('Ravensgate FC', 'Ever Onward', GULES, OR, GOLD_LIGHT, 'quarterly', 'mullet'),
                  crest('Oakmere Coffee', 'First Light', VERT, OR, GOLD_LIGHT, 'fess', 'crescent'),
                  crest('The Copper Key Inn', 'All Are Welcome', MURREY, OR, GOLD_LIGHT, 'bend', 'key'),
                  crest('Briarwood Books', 'Sapere Aude', PURPURE, ARGENT, ARGENT, 'pale', 'rose'),
                  crest('Fairhaven Barbers', 'Sharp Since Today', AZURE, ARGENT, ARGENT, 'saltire', 'sword')],
        body='''<section class="sec"><h2 class="gilt">What is in the Crest Logo Kit ($29)</h2>
<ul><li><b>Logo files:</b> the full crest as a transparent 4000 px PNG, on parchment for print, a web-size PNG and a scalable SVG vector.</li>
<li><b>Shield-only mark:</b> a square transparent PNG and SVG of just the shield, for places where the full crest is too detailed.</li>
<li><b>Icons:</b> favicons (32 and 48 px), app icons (192 and 512 px) and an Apple touch icon.</li>
<li><b>Social:</b> a 1080 px profile picture, a 512 px Discord server icon, and banners sized for X (1500 by 500), LinkedIn (1584 by 396) and YouTube (2560 by 1440, with the artwork inside the safe area that shows on every device).</li>
<li><b>Brand sheet:</b> your exact colors in HEX and RGB, the typefaces (all free Google Fonts) and simple usage rules.</li>
<li><b>Everything in the $9 set too:</b> a printable certificate of arms with the heraldic blazon and its meaning, and a phone wallpaper.</li></ul>
<p>Everything is generated from your design the moment payment goes through. A plain README in the ZIP explains each file and the license.</p></section>
<section class="sec"><h2 class="gilt">Designing a crest logo that works</h2>
<h3>Make it readable at 32 pixels</h3><p>A logo spends most of its life small: a browser tab, a map pin, a social avatar. Pick one bold emblem and two strongly contrasting colors. Heraldry's own rule helps here: put a metal (gold or silver) against a color (red, blue, green, purple or black). The kit's shield-only files exist for the smallest sizes.</p>
<h3>Let the emblem hint at what you do</h3><p>A tower for a brewery or anything built to last, a key for an inn or a locksmith, a crescent for a coffee shop that opens early, a star for a team, a rose for a bookshop or florist, a sword for a barbershop. Or use your initial, which never goes out of date. The <a href="/heraldry-symbols-and-meanings.html">heraldry meanings guide</a> explains the traditional symbolism of each.</p>
<h3>Keep the name short</h3><p>Two or three words sit at full size across the top of the crest. Put a longer tagline in the motto ribbon instead.</p>
<div class="callout"><b>Before you print a thousand cups:</b> a tool-made design is not exclusive, because someone else can make something similar. If the logo matters to your business, search existing trademarks in your country and take local advice before you register it.</div></section>
<section class="sec"><h2 class="gilt">Who uses crest logos</h2><ul>
<li>Breweries, distilleries, coffee roasters and bakeries that want a heritage feel</li>
<li>Barbershops, tailors and leather workers</li>
<li>Amateur and Sunday league sports clubs, fantasy leagues and esports teams (see <a href="/clan-logo-maker.html">clan and guild logos</a>)</li>
<li>Streamers, podcasters and tabletop creators building a recognizable channel</li>
<li>Family businesses, societies and alumni groups</li></ul>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html">Design your crest logo</a></p></section>''',
        faqs=[('Can I use the logo commercially?', 'Yes. Once bought, you can use the files for any lawful purpose, including your business logo, signage, packaging and merchandise.'),
              ('Is the design exclusive to my business?', 'No. Other people can make similar designs with the same free tool, so we cannot grant exclusivity. If you need a registrable trademark, check for conflicts first and take local advice.'),
              ('What is the difference between the $9 set and the $29 Logo Kit?', 'The $9 set covers personal use: print art, an SVG, a certificate of arms, a profile picture and a wallpaper. The $29 kit adds everything a brand needs: transparent logo files, a shield-only mark, favicons and app icons, social banners for X, LinkedIn and YouTube, a Discord icon and a brand sheet, in one ZIP.'),
              ('Can I edit the files afterwards?', 'Yes. The SVG files open in any vector editor such as Illustrator, Affinity Designer, Inkscape or Figma.'),
              ('What if it is not right for us?', 'Email hello@usurp.games within 14 days of purchase for a full refund.')],
    ),
]
