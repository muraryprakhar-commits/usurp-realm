"""Spec-driven guide pages. To add a page, append one dict to SPECS and run tools/build.py then tools/assets.py.

Rules every page must follow (the weekly autopilot reads this too):
- Honest, checkable content only. No invented statistics, testimonials, sales counts or fake urgency.
- Never claim a design is an official or inherited coat of arms. No trademarked or fictional-franchise names.
- US spelling. No em dashes. Plain, warm, specific writing; at least ~500 words of body that is unique to the page.
- examples: 3 to 6 crests using only the tinctures and emblems in data.py, following the rule of tincture
  (a metal, Or or Argent, against a color). Charges (emblems) available, from crest-core.js CHARGES:
  beasts: lion, eagle, dragon, griffin, wolf, bear, stag, horse, unicorn, boar, owl, raven, phoenix, bee;
  symbols: initial, tower, sword, swords, crown, key, crescent, mullet (star), sun, heart, flame, lightning, anchor, ship, compass;
  crosses: cross, maltese, fleury, highcross, triquetra; nature: fleur, rose, tree, acorn, shamrock, thistle, wheat, mountain, laurel;
  trades: book, hammer, axe, scales, dividers, caduceus; or none. Pick emblems that fit the page's audience.
  Divisions: plain, perpale, fess, bend, chevron, quarterly, saltire, pale. Names up to 40 characters, mottos up to 48.
- body: HTML using <section class="sec">, <h2 class="gilt">, <h3>, <p>, <ul>/<ol>, <div class="callout"><b>..</b> ..</div>.
  Link to 2 or 3 related pages and end with a CTA button to /crest.html (add ?ch=<emblem id> to open the Studio with that emblem chosen).
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
                  crest('Grandma and Grandpa Rossi', 'Root and Branch', VERT, OR, GOLD_LIGHT, 'plain', 'tree'),
                  crest('The Lees', 'Home Is Our Hearth', MURREY, OR, GOLD_LIGHT, 'fess', 'tower'),
                  crest('House Kowalski', 'Ever Onward', SABLE, OR, OR, 'quarterly', 'eagle')],
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
        examples=[crest('Ironhold Brewing Co.', 'Brewed With Patience', SABLE, OR, GOLD_LIGHT, 'chevron', 'wheat'),
                  crest('Ravensgate FC', 'Ever Onward', GULES, OR, GOLD_LIGHT, 'quarterly', 'raven'),
                  crest('Oakmere Coffee', 'First Light', VERT, OR, GOLD_LIGHT, 'fess', 'crescent'),
                  crest('The Copper Key Inn', 'All Are Welcome', MURREY, OR, GOLD_LIGHT, 'bend', 'key'),
                  crest('Briarwood Books', 'Sapere Aude', PURPURE, ARGENT, ARGENT, 'pale', 'rose'),
                  crest('Fairhaven Barbers', 'Sharp Since Today', AZURE, ARGENT, ARGENT, 'plain', 'swords')],
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
<h3>Let the emblem hint at what you do</h3><p>A sheaf of wheat for a brewery or bakery, a key for an inn or a locksmith, a crescent or sun for a coffee shop that opens early, a lion, eagle or raven for a team, an open book for a bookshop, crossed swords for a barbershop, scales for a law firm. There are 50 emblems in the studio. Or use your initial, which never goes out of date. The <a href="/heraldry-symbols-and-meanings.html">heraldry meanings guide</a> explains the traditional symbolism of each.</p>
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
    dict(
        slug='lion-coat-of-arms.html', cta_href='/crest.html?ch=lion', short='Lion coat of arms', blurb='Meaning, poses and famous lion arms', og='lion',
        h1='Lion Coat of Arms', h1_html='The Lion Coat of Arms: Meaning and Design',
        title='Lion Coat of Arms: Meaning, Poses and How to Design Yours | Crest Studio',
        og_title='Lion coat of arms: meaning, poses and how to design yours',
        desc='What a lion means on a coat of arms, the classic poses from rampant to passant, famous lion arms, and how to design your own lion crest free in a few minutes.',
        eyebrow='The most popular beast in heraldry',
        lede='The lion has been the favorite animal of heralds since the 1100s. Here is what it stands for, how heralds draw it, and how to put one on your own family crest.',
        cta='Design a lion crest',
        examples=[crest('The Carter Family', 'Fortis et Fidelis', AZURE, OR, GOLD_LIGHT, 'plain', 'lion'),
                  crest('House Valcourt', 'Audaces Fortuna Iuvat', GULES, OR, GOLD_LIGHT, 'plain', 'lion'),
                  crest('The Mensah Family', 'Virtute et Valore', VERT, ARGENT, ARGENT, 'plain', 'lion'),
                  crest('The Novak Family', 'Courage and Kindness', SABLE, OR, GOLD_LIGHT, 'plain', 'lion'),
                  crest('The Byrne Family', 'Fortitudine', OR, OR, GULES, 'plain', 'lion'),
                  crest('Kingsbridge Lions FC', 'Pride in Every Match', PURPURE, ARGENT, ARGENT, 'plain', 'lion')],
        body='''<section class="sec"><h2 class="gilt">What a lion means on a coat of arms</h2>
<p>Courage, strength and valor. Medieval writers called the lion the king of beasts, and heraldry took it up almost at once: one of the oldest pictures of a coat of arms, the enamel portrait of Geoffrey Plantagenet made around 1151, shows him with a blue shield covered in small gold lions. Within a century lions were everywhere, on the shields of kings, knights and merchant families alike.</p>
<p>Because it is so common, a lion on its own does not point to any one family. What makes a lion coat of arms yours is everything around it: your colors, your name across the top and a motto you actually live by.</p></section>
<section class="sec"><h2 class="gilt">Lion poses and their names</h2>
<p>Heralds have a word for every attitude a lion can take. The main ones:</p>
<ul><li><b>Rampant:</b> rearing up on one hind leg, forepaws raised to strike. The classic fighting lion, and the one drawn in Crest Studio.</li>
<li><b>Passant:</b> walking past with the right forepaw raised, like the three lions of England.</li>
<li><b>Guardant:</b> any pose with the face turned to look straight at you.</li>
<li><b>Sejant:</b> sitting upright.</li>
<li><b>Couchant:</b> lying down with the head raised, at rest but alert.</li>
<li><b>Statant:</b> standing with all four feet on the ground.</li></ul>
<p>Heraldic lions usually show their tongue and claws, which heralds describe as "armed and langued", often in red.</p></section>
<section class="sec"><h2 class="gilt">Famous lion arms</h2><ul>
<li><b>England:</b> three gold lions passant guardant on red, used by English kings since Richard I in the 1190s.</li>
<li><b>Scotland:</b> a red lion rampant on gold inside a double border decorated with fleurs-de-lis, still the royal banner of Scotland.</li>
<li><b>Belgium:</b> a gold lion rampant on black, inherited from the old Duchy of Brabant.</li>
<li><b>Norway:</b> a crowned gold lion rampant holding an axe, on red.</li></ul>
<p>These belong to nations and royal houses, so treat them as inspiration rather than copying them. A different color pair plus your own name and motto are enough to make a lion yours.</p></section>
<section class="sec"><h2 class="gilt">Designing your lion crest</h2>
<h3>Pick a strong color pair</h3><p>Gold on red, gold on blue and silver on green are the classics. A red lion on gold works too: heraldry's one firm rule is to put a metal (gold or silver) against a color, never color on color or metal on metal. The <a href="/heraldry-symbols-and-meanings.html">meanings guide</a> explains what each color stands for.</p>
<h3>Keep the field simple</h3><p>A lion is a busy shape, so it looks best on a plain field. Save chevrons and saltires for simpler emblems such as a star or a key.</p>
<h3>Choose a motto</h3><p>Lion crests suit mottos about courage: <i>Fortis et Fidelis</i> (strong and faithful), <i>Audaces Fortuna Iuvat</i> (fortune favors the bold) or <i>Virtute et Valore</i> (by virtue and valor). The <a href="/latin-motto-generator.html">Latin motto generator</a> has dozens more, each with a translation.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=lion">Design a lion crest</a></p></section>''',
        faqs=[('What does a lion mean on a coat of arms?', 'Courage, strength and valor. The lion has been the most common beast in heraldry since the 1100s, chosen by kings, knights and families alike.'),
              ('What is the difference between a lion rampant and a lion passant?', 'A lion rampant rears up on one hind leg with its forepaws raised. A lion passant walks past with one forepaw raised and the other three on the ground. Rampant is the fighting pose.'),
              ('Why are some heraldic lions called leopards?', 'In early heraldry written in French, a lion walking and looking at the viewer (passant guardant) was called a leopard. The three lions of England were blazoned as leopards for centuries, although they are drawn as lions.'),
              ('Can I use a lion on my own family crest?', 'Yes. The lion is a common charge that anyone can use in an original design. Avoid copying a real coat of arms exactly, such as a royal or national one. In Scotland, arms are regulated by the Court of the Lord Lyon, so keep a Crest Studio design as decorative art rather than presenting it as official arms.')],
    ),
    dict(
        slug='wolf-coat-of-arms.html', cta_href='/crest.html?ch=wolf', short='Wolf coat of arms', blurb='Wolf crests: meaning and design', og='wolf',
        h1='Wolf Coat of Arms', h1_html='The Wolf Coat of Arms: Meaning and Design',
        title='Wolf Coat of Arms: Meaning, Heraldry and How to Design Yours | Crest Studio',
        og_title='Wolf coat of arms: meaning and how to design a wolf crest',
        desc='What a wolf means in heraldry, why so many wolf crests show only the head, wolves in family names, and how to design your own wolf crest free for a family, team or clan.',
        eyebrow='Loyalty, valor and the pack',
        lede='Few emblems feel as personal as a wolf: loyal to its own and fearless with everyone else. Here is what the wolf means in heraldry and how to design a wolf crest for your family, team or clan.',
        cta='Design a wolf crest',
        examples=[crest('The Lopez Family', 'Siempre Fieles', AZURE, ARGENT, ARGENT, 'plain', 'wolf'),
                  crest('House Wolfram', 'The Pack Endures', SABLE, ARGENT, ARGENT, 'plain', 'wolf'),
                  crest('Greywater Wolves', 'Hunt Together', VERT, OR, GOLD_LIGHT, 'plain', 'wolf'),
                  crest('The Wolfe Family', 'Loyal to the End', GULES, OR, GOLD_LIGHT, 'plain', 'wolf'),
                  crest('Iron Wolves Guild', 'Steel and Silence', PURPURE, ARGENT, ARGENT, 'plain', 'wolf')],
        body='''<section class="sec"><h2 class="gilt">What a wolf means in heraldry</h2>
<p>Valor, perseverance and loyalty. Later heraldic writers said the wolf stood for valor guarded by wisdom, and for a reward earned through a long struggle. Today most people choose a wolf for its loyalty to the pack: a family, a team or a group of friends who look after each other.</p>
<p>Wolves were especially popular in German, Spanish and Scandinavian heraldry, and in English arms they often appear as a head on its own.</p></section>
<section class="sec"><h2 class="gilt">Why so many wolf crests show only the head</h2>
<p>A head is bold and easy to read from a distance, so heralds often used one in place of the whole animal. There are two ways to cut it:</p>
<ul><li><b>Erased:</b> torn off at the neck, leaving a jagged edge. This is the wolf's head drawn in Crest Studio.</li>
<li><b>Couped:</b> cut off with a clean, straight line.</li></ul>
<p>Whole wolves appear too: rampant (rearing), passant (walking) and salient (leaping).</p></section>
<section class="sec"><h2 class="gilt">Wolves and family names</h2>
<p>Heralds loved a pun. Arms that play on the owner's name are called <i>canting arms</i>, and wolves turn up in many of them: Spanish families named López (from the Latin <i>lupus</i>, wolf) often bear wolves, as do English families named Wolfe and Lovett (from the Old French <i>louvet</i>, a young wolf). The Bavarian city of Passau has shown a red wolf on silver for centuries.</p>
<p>If your name has a wolf hidden in it, a wolf crest is a nod to a very old heraldic joke. If it does not, the wolf still works as a symbol of the people you call your pack.</p></section>
<section class="sec"><h2 class="gilt">Designing your wolf crest</h2>
<h3>Silver on dark colors</h3><p>A silver wolf on black, blue or green looks the most like a real wolf and reads well at any size. Gold on red is warmer and more royal.</p>
<h3>For clans, guilds and teams</h3><p>A wolf's head is one of the best emblems for a gaming clan or sports team because it stays recognizable as a small icon. See <a href="/clan-logo-maker.html">clan and guild logos</a>, and the <a href="/crest-logo-maker.html">Crest Logo Kit</a> for server icons and banners.</p>
<h3>Mottos for a wolf</h3><p>Try <i>Fidelis</i> (faithful), <i>Nunquam Retrorsum</i> (never backward) or plain English such as "The Pack Endures". More in the <a href="/latin-motto-generator.html">Latin motto generator</a>.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=wolf">Design a wolf crest</a></p></section>''',
        faqs=[('What does a wolf mean on a coat of arms?', 'Valor, perseverance and loyalty. Heraldic writers described the wolf as valor guarded by wisdom, and many people today choose it for its loyalty to the pack.'),
              ('What does "erased" mean in heraldry?', 'A head or limb that is erased has been torn off, leaving a jagged edge. One cut off with a clean straight line is couped.'),
              ('Is a wolf a good emblem for a gaming clan?', "Yes. A wolf's head is bold and recognizable even as a tiny server icon, which is why it is one of the most popular clan emblems."),
              ('Did my family have a wolf on its coat of arms?', 'Possibly, if a particular ancestor was granted arms with a wolf, but arms belong to individual family lines rather than to everyone with a surname. Designing your own wolf crest is the honest way to use it.')],
    ),
    dict(
        slug='dragon-coat-of-arms.html', cta_href='/crest.html?ch=dragon', short='Dragon coat of arms', blurb='Dragons, wyverns and the Welsh dragon', og='dragon',
        h1='Dragon Coat of Arms', h1_html='The Dragon Coat of Arms: Meaning and Design',
        title='Dragon Coat of Arms: Meaning, Dragons vs Wyverns and Welsh Dragons | Crest Studio',
        og_title='Dragon coat of arms: meaning and how to design a dragon crest',
        desc='What a dragon means in heraldry, the difference between a dragon and a wyvern, the red dragon of Wales and the dragons of London, and how to design your own dragon crest free.',
        eyebrow='Guardians, defenders and the red dragon of Wales',
        lede="The dragon is heraldry's fiercest monster and one of its most loved. Here is what it means, how to tell it from a wyvern, and how to design a dragon crest of your own.",
        cta='Design a dragon crest',
        examples=[crest('The Griffiths Family', 'Cymru am Byth', ARGENT, ARGENT, GULES, 'plain', 'dragon'),
                  crest('House Drakemoor', 'Fire Keeps Faith', SABLE, OR, GOLD_LIGHT, 'plain', 'dragon'),
                  crest('The Pendragon Society', 'Guard What You Love', AZURE, OR, GOLD_LIGHT, 'plain', 'dragon'),
                  crest('Emberfall Guild', 'From the Ashes', GULES, OR, GOLD_LIGHT, 'plain', 'dragon'),
                  crest('The Dragon Readers', 'Here Be Stories', VERT, OR, GOLD_LIGHT, 'plain', 'dragon')],
        body='''<section class="sec"><h2 class="gilt">What a dragon means in heraldry</h2>
<p>A valiant defender. In legend dragons guard treasure, so in heraldry the dragon came to stand for a fierce protector of something precious: a homeland, a family, even a hoard of good books. Armies carried dragon standards long before coats of arms existed, from Roman cavalry to the English at Hastings, and the dragon passed into heraldry as a sign of courage and menace.</p></section>
<section class="sec"><h2 class="gilt">Dragon or wyvern?</h2>
<p>In English heraldry the difference is the legs. A <b>dragon</b> has four legs and bat-like wings. A <b>wyvern</b> has two legs, wings and a coiled tail. Both usually have a barbed tongue and a tail ending in an arrow-shaped point. Elsewhere in Europe the line is blurrier, and many continental "dragons" have only two legs.</p>
<p>The dragon in Crest Studio is a four-legged dragon rampant, rearing with its wings raised, the classic heraldic pose.</p></section>
<section class="sec"><h2 class="gilt">Famous heraldic dragons</h2><ul>
<li><b>Wales:</b> the red dragon, <i>Y Ddraig Goch</i>. It was made a royal badge for Wales in 1807, and the Welsh flag was officially recognized in 1959.</li>
<li><b>The City of London:</b> two silver dragons hold up the city's shield, and dragon statues mark the old boundaries of the City.</li>
<li><b>Ljubljana:</b> the arms of the Slovenian capital show a green dragon standing on a castle.</li></ul>
<p>National and civic emblems belong to their owners, so treat them as inspiration and give your dragon its own colors and motto.</p></section>
<section class="sec"><h2 class="gilt">Designing your dragon crest</h2>
<h3>Colors</h3><p>A red dragon on silver nods to Wales. A gold dragon on black or red feels like a great fantasy house. Keep to the rule of tincture: a metal (gold or silver) against a color.</p>
<h3>For campaigns, guilds and clubs</h3><p>Dragons are the classic sigil for a D&amp;D noble house or an online guild, with the <a href="/phoenix-crest.html">phoenix</a> a close second for groups with a comeback story. See the <a href="/dnd-coat-of-arms-generator.html">D&amp;D coat of arms generator</a> and the <a href="/fantasy-house-name-generator.html">fantasy house name generator</a> for names and mottos to go with it.</p>
<h3>Mottos</h3><p>Try the Welsh <i>Cymru am Byth</i> (Wales forever), the Latin <i>Custos Fidelis</i> (faithful guardian), or plain English such as "Guard What You Love".</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=dragon">Design a dragon crest</a></p></section>''',
        faqs=[('What does a dragon mean on a coat of arms?', 'A valiant defender: a fierce protector of something precious, from a homeland to a family. In legend dragons guard treasure, and heraldry kept that idea.'),
              ('What is the difference between a dragon and a wyvern?', 'In English heraldry a dragon has four legs and a wyvern has two. Both have wings, and both usually have a barbed tail.'),
              ('Can I put the Welsh dragon on my family crest?', 'You can design your own red dragon in the same spirit. The Welsh flag itself is a national emblem, so give your crest its own design, colors and motto rather than copying the flag.'),
              ('Is a dragon a good emblem for a D&D house or a guild?', 'Yes. It is the classic fantasy sigil, and a dragon rampant stays recognizable as a small icon for a server or a character sheet.')],
    ),
    dict(
        slug='eagle-coat-of-arms.html', cta_href='/crest.html?ch=eagle', short='Eagle coat of arms', blurb='The eagle in heraldry, from Rome to today', og='eagle',
        h1='Eagle Coat of Arms', h1_html='The Eagle Coat of Arms: Meaning and Design',
        title='Eagle Coat of Arms: Meaning, Displayed and Double-Headed Eagles | Crest Studio',
        og_title='Eagle coat of arms: meaning and how to design an eagle crest',
        desc='What an eagle means in heraldry, what "displayed" means, the double-headed eagle, famous eagle arms from Germany to Poland, and how to design your own eagle crest free.',
        eyebrow='Nobility, strength and a lofty spirit',
        lede='After the lion, the eagle is the most important creature in heraldry, and the favorite of empires. Here is what it stands for and how to design an eagle crest of your own.',
        cta='Design an eagle crest',
        examples=[crest('The Kowalski Family', 'Ever Onward', GULES, ARGENT, ARGENT, 'plain', 'eagle'),
                  crest('The Schneider Family', 'Treu und Fest', OR, OR, SABLE, 'plain', 'eagle'),
                  crest('House Aquila', 'Ad Astra', AZURE, OR, GOLD_LIGHT, 'plain', 'eagle'),
                  crest('The Martinez Family', 'Siempre Adelante', VERT, OR, GOLD_LIGHT, 'plain', 'eagle'),
                  crest('Highfield Eagles', 'Fly Higher', SABLE, OR, GOLD_LIGHT, 'plain', 'eagle')],
        body='''<section class="sec"><h2 class="gilt">What an eagle means in heraldry</h2>
<p>Nobility, strength and a lofty spirit. The eagle was the standard of the Roman legions, and states that saw themselves as Rome's heirs took it up, from the Holy Roman Empire to Russia and Napoleon's France. In family arms it stands for someone who aims high and sees far.</p></section>
<section class="sec"><h2 class="gilt">Eagle poses and their names</h2><ul>
<li><b>Displayed:</b> facing you with wings and legs spread wide, head turned to one side. This is the classic heraldic eagle, and the one drawn in Crest Studio.</li>
<li><b>Rising:</b> about to take flight, wings raised.</li>
<li><b>Close:</b> standing with its wings folded.</li>
<li><b>Double-headed:</b> one body with two heads looking both ways, used by the Byzantine and Holy Roman empires and today by Russia, Serbia and Albania.</li></ul>
<p>A small eagle shown without beak or feet is an <i>alerion</i>, famous from the arms of Lorraine in France.</p></section>
<section class="sec"><h2 class="gilt">Famous eagle arms</h2><ul>
<li><b>Germany:</b> a black eagle on gold, descended from the eagle of the Holy Roman Empire.</li>
<li><b>Poland:</b> a crowned white eagle on red, in use since the late 1200s.</li>
<li><b>Austria:</b> a black eagle holding a sickle and a hammer.</li>
<li><b>The United States:</b> the bald eagle displayed on the Great Seal, adopted in 1782.</li>
<li><b>Mexico:</b> an eagle on a cactus devouring a snake, from the founding legend of Tenochtitlan.</li></ul>
<p>These are national emblems, so give your eagle its own colors, name and motto.</p></section>
<section class="sec"><h2 class="gilt">Designing your eagle crest</h2>
<h3>Colors with history</h3><p>Black on gold recalls German arms, silver on red recalls Polish ones, and gold on blue is a classic for any family. Families with roots in those countries often pick those colors as a nod to their heritage while keeping the design their own.</p>
<h3>Plain field, bold eagle</h3><p>An eagle displayed fills the shield, so a plain field shows it off best. Add your family name across the top and a motto on the scroll.</p>
<h3>Mottos</h3><p>Try <i>Ad Astra</i> (to the stars), <i>Altius</i> (higher), <i>Treu und Fest</i> (loyal and steadfast, in German) or <i>Siempre Adelante</i> (always forward, in Spanish). The <a href="/latin-motto-generator.html">Latin motto generator</a> has more.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=eagle">Design an eagle crest</a></p></section>''',
        faqs=[('What does an eagle mean on a coat of arms?', 'Nobility, strength and a lofty spirit. As the old standard of Rome, it also became the emblem of empires and of anyone who aims high.'),
              ('What does "displayed" mean in heraldry?', 'An eagle displayed faces the viewer with its wings and legs spread wide, usually with its head turned to one side. It is the most common way to draw an eagle in arms.'),
              ('Why do some eagles have two heads?', 'The double-headed eagle was used by the Byzantine Empire and later by the Holy Roman Empire, Russia, Serbia and Albania, often said to look both east and west.'),
              ('Can I use an eagle on my family crest?', 'Yes. The eagle is a common charge open to anyone in an original design. Avoid copying a national coat of arms exactly, and make the colors, name and motto your own.')],
    ),
    dict(
        slug='irish-family-crest.html', cta_href='/crest.html?ch=shamrock', short='Irish family crest', blurb='Shamrocks, Celtic crosses and knots', og='irish',
        h1='Irish Family Crest Maker', h1_html='Design an Irish Family Crest',
        title='Irish Family Crest Maker: Shamrock, Celtic Cross and Knot Designs | Crest Studio',
        og_title='Irish family crest maker: design your own with Celtic symbols',
        desc='Design an Irish family crest with a shamrock, Celtic cross, triquetra or oak tree, plus the honest truth about surname coats of arms and the Chief Herald of Ireland. Free to design.',
        eyebrow='For Irish families and the Irish diaspora',
        lede='Shamrocks, Celtic crosses, knotwork and the oak: design a crest that celebrates Irish roots, with real heraldic colors and the meaning of every part.',
        cta='Design an Irish crest',
        examples=[crest('The Murphy Family', 'Erin go Bragh', VERT, OR, GOLD_LIGHT, 'plain', 'shamrock'),
                  crest('The Kelly Family', 'Fortis et Fidelis', AZURE, OR, GOLD_LIGHT, 'plain', 'highcross'),
                  crest("The O'Brien Family", 'Root and Branch', VERT, OR, GOLD_LIGHT, 'plain', 'tree'),
                  crest('The Walsh Family', 'Together Always', GULES, ARGENT, ARGENT, 'plain', 'triquetra'),
                  crest('The Byrne Family', 'Faith and Courage', AZURE, ARGENT, ARGENT, 'plain', 'stag')],
        body='''<section class="sec"><h2 class="gilt">First, the honest part</h2>
<p>Many sites sell "the Murphy coat of arms" or "the Kelly crest" as if everyone with a surname shares one. In Irish heraldry, as in English and Scottish, arms belong to a particular person and their descendants, and new arms are granted by the Chief Herald of Ireland. Arms listed under a surname usually belonged to one chief or one family line, which may have no connection to yours.</p>
<p>So the honest and more personal option is to design your own: a crest for your family as it is today, built from symbols that mean something to you. If you would like official arms, you can apply to the Office of the Chief Herald, part of the National Library of Ireland.</p></section>
<section class="sec"><h2 class="gilt">Irish symbols for your crest</h2><ul>
<li><b>Shamrock:</b> the three-leaved emblem linked with Saint Patrick and with Ireland itself. It stands for faith and good fortune.</li>
<li><b>Celtic cross:</b> a cross with a ring around its center, the shape of the high crosses carved across early medieval Ireland.</li>
<li><b>Triquetra:</b> a three-cornered knot from early Celtic art, a symbol of unity and of things that endure.</li>
<li><b>Oak tree:</b> honored in old Ireland. Derry comes from the Irish <i>Doire</i>, oak grove, and Kildare from <i>Cill Dara</i>, church of the oak.</li>
<li><b>Stag:</b> the red deer, native to Ireland, which stands for peace and harmony in heraldry.</li></ul></section>
<section class="sec"><h2 class="gilt">Colors with an Irish feel</h2>
<p>Green is the obvious choice; in heraldry it is called Vert and stands for hope and joy. Blue has an older claim: Saint Patrick's blue was long associated with Ireland, and the arms of Ireland are a gold harp on a blue field. Put a gold or silver emblem on either and you follow the heraldic rule of tincture.</p>
<h3>Mottos</h3><p>Popular choices include <i>Erin go Bragh</i> (Ireland forever, an anglicized form of the Irish <i>Éirinn go brách</i>), Latin mottos such as <i>Fortis et Fidelis</i> (strong and faithful), or a line your family actually says. The <a href="/latin-motto-generator.html">Latin motto generator</a> has more with translations.</p>
<p>Making it a gift? A crest with the family name and a certificate explaining every symbol makes a lovely present for Saint Patrick's Day, a wedding or a reunion. See <a href="/family-crest-gift.html">family crest gifts</a>.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=shamrock">Design an Irish crest</a></p></section>''',
        faqs=[('Is there an official coat of arms for my Irish surname?', 'No. Irish arms are granted to individuals and their descendants, not to everyone who shares a surname. Arms sold under a surname usually belonged to one chief or one family line.'),
              ('Who grants coats of arms in Ireland?', 'The Chief Herald of Ireland, whose office is part of the National Library of Ireland. People of Irish descent living abroad can apply too.'),
              ('What symbols are Irish?', 'The shamrock, the harp, the Celtic cross and Celtic knotwork such as the triquetra are the most recognizable. The oak and the red deer also have deep roots in Ireland.'),
              ('Can I get the crest printed?', 'Yes. The $9 download includes a 4000 px print file and an SVG, which any print shop or print-on-demand service can use for framed prints, mugs or reunion shirts.')],
    ),
    dict(
        slug='scottish-family-crest.html', cta_href='/crest.html?ch=thistle', short='Scottish family crest', blurb='Thistles, unicorns and the saltire', og='scottish',
        h1='Scottish Family Crest Maker', h1_html='Design a Scottish Family Crest',
        title='Scottish Family Crest Maker: Thistle, Unicorn and Saltire Designs | Crest Studio',
        og_title='Scottish family crest maker: thistles, unicorns and the saltire',
        desc='Design a Scottish-style family crest with a thistle, unicorn, lion or the saltire of Saint Andrew, and learn how clan crest badges and the Lord Lyon really work. Free to design.',
        eyebrow='For Scottish families and the Scottish diaspora',
        lede='The thistle, the unicorn, the lion and the saltire of Saint Andrew: design a crest that celebrates Scottish roots, and learn how Scottish heraldry really works.',
        cta='Design a Scottish crest',
        examples=[crest('The Anderson Family', 'Stand Fast and True', AZURE, ARGENT, ARGENT, 'saltire', 'none'),
                  crest('The Reid Family', 'Courage and Kindness', PURPURE, OR, GOLD_LIGHT, 'plain', 'thistle'),
                  crest('The Paterson Family', 'Strength and Purity', AZURE, ARGENT, ARGENT, 'plain', 'unicorn'),
                  crest('The Mitchell Family', 'Ever Faithful', GULES, OR, GOLD_LIGHT, 'plain', 'lion'),
                  crest('The Duncan Family', 'Ever Onward', VERT, OR, GOLD_LIGHT, 'plain', 'stag')],
        body='''<section class="sec"><h2 class="gilt">How Scottish heraldry really works</h2>
<p>Scotland takes heraldry more seriously than anywhere else. Coats of arms there are regulated by the Court of the Lord Lyon, and each one belongs to a single person. A clan chief's arms belong to the chief alone.</p>
<p>What clan members may wear is the <b>crest badge</b>: the chief's crest (the figure that sits above the shield) inside a strap and buckle bearing the chief's motto. The badge shows that you belong to the clan; it is not your own coat of arms.</p>
<p>So a Crest Studio design is decorative art for your home, gifts and gatherings, not a grant of arms, and it should not copy a chief's arms or crest. If you want official arms of your own, you can petition the Lord Lyon.</p></section>
<section class="sec"><h2 class="gilt">Scottish symbols for your crest</h2><ul>
<li><b>Thistle:</b> the national flower of Scotland, standing for courage and defiance. Legend says a barefoot Norse raider stepped on one and cried out, warning the Scots.</li>
<li><b>Unicorn:</b> Scotland's national animal, a symbol of purity and strength, and the supporter of the Scottish royal arms.</li>
<li><b>Saltire:</b> the X-shaped cross of Saint Andrew, Scotland's patron saint. Choose the Saltire division in the Studio.</li>
<li><b>Lion:</b> the beast of Scotland's royal arms. Use your own colors, because the red lion rampant on gold belongs to the Crown and flying it without authority is technically an offense.</li>
<li><b>Stag:</b> the red deer of the Highlands, a symbol of peace and harmony.</li></ul></section>
<section class="sec"><h2 class="gilt">Colors with a Scottish feel</h2>
<p>Blue and silver echo the saltire flag, and in heraldry blue (Azure) stands for truth and loyalty. Gold on red, green or purple feels royal and Highland. If your family has a clan tartan, you can pick crest colors that echo it.</p>
<h3>Mottos</h3><p>Choose words your family lives by rather than copying a clan chief's motto, which belongs to the chief. Plain English works well, such as "Stand Fast and True" or "Courage and Kindness", or pick a Latin line from the <a href="/latin-motto-generator.html">Latin motto generator</a>.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=thistle">Design a Scottish crest</a></p></section>''',
        faqs=[('Is there a coat of arms for my Scottish clan?', "The clan chief has arms, but they belong to the chief alone. Clan members can wear the crest badge: the chief's crest inside a strap and buckle with the chief's motto."),
              ('Is it legal to design my own coat of arms in Scotland?', "Designing decorative art is fine. Scottish law treats coats of arms as property regulated by the Court of the Lord Lyon, so do not copy anyone else's arms or present a design as official arms. You can petition the Lord Lyon for a real grant."),
              ('Why is the unicorn the national animal of Scotland?', 'The unicorn was a symbol of purity and power in medieval legend, and Scottish kings used it from the 1400s. Two unicorns supported the royal arms of Scotland.'),
              ('Can I use a saltire on my crest?', 'Yes. The saltire, an X-shaped cross, is a common heraldic shape. In the Studio, choose the Saltire division; silver on blue echoes the flag of Scotland.')],
    ),
    dict(
        slug='bear-coat-of-arms.html', cta_href='/crest.html?ch=bear', short='Bear coat of arms', blurb='Berlin, Bern and the bear rampant', og='bear',
        h1='Bear Coat of Arms', h1_html='The Bear Coat of Arms: Meaning and Design',
        title='Bear Coat of Arms: Meaning, Poses and the Bears of Berlin and Bern | Crest Studio',
        og_title='Bear coat of arms: meaning, poses and how to design a bear crest',
        desc='What a bear means in heraldry, rampant vs passant, the famous bears of Berlin, Bern, Madrid and Greenland, and how to design your own bear crest free in a few minutes.',
        eyebrow='Strength, protection and the bears of Europe',
        lede='Bears guard the arms of Berlin, Bern and Madrid, and a polar bear stands on the arms of Greenland. Here is what the bear means, how heralds draw it, and how to put one on a crest of your own.',
        cta='Design a bear crest',
        examples=[crest('The Hoffmann Family', 'Strength Protects', ARGENT, ARGENT, SABLE, 'plain', 'bear'),
                  crest('The Okonkwo Family', 'Fortis et Fidelis', GULES, OR, GOLD_LIGHT, 'plain', 'bear'),
                  crest('Northwind Bears RFC', 'Stand Together', AZURE, ARGENT, ARGENT, 'plain', 'bear'),
                  crest('The Bjornsson Family', 'Steady as Stone', SABLE, OR, GOLD_LIGHT, 'plain', 'bear'),
                  crest('The Marsh Family', 'Guard the Hearth', OR, OR, SABLE, 'plain', 'bear')],
        body='''<section class="sec"><h2 class="gilt">What a bear means in heraldry</h2>
<p>Strength, and the protection of family. A bear is slow to anger and terrifying once roused, which is exactly what most people want an emblem to say about the people they look after. Heraldic meanings were written down by later authors rather than set by any rule, so treat them as tradition, not law, but this one has stuck for good reason.</p>
<p>The bear is far less common in arms than the lion, which makes it a good choice if you want a strong beast that does not look like everyone else's. It was most at home in the heraldry of Germany, Switzerland and Spain, where real bears still roamed the forests when coats of arms were young.</p></section>
<section class="sec"><h2 class="gilt">Famous bear arms</h2><ul>
<li><b>Bern, Switzerland:</b> a black bear walking up a gold diagonal band on a red field. The bear appears on the city's seals as early as 1224, and the city legend says Duke Berthold V of Zähringen named the new town after the first animal his hunters caught: a bear.</li>
<li><b>Berlin, Germany:</b> a black bear rearing up on a silver shield, with red tongue and claws, under a crown. The current design was adopted in 1954.</li>
<li><b>Madrid, Spain:</b> a black bear standing up against a strawberry tree, the <i>madroño</i>, inside a blue border with seven silver stars. The bear goes back to the medieval town council's banner.</li>
<li><b>Greenland:</b> a silver polar bear on a blue shield, adopted in 1989. The blue stands for the oceans around the island.</li>
<li><b>Warwick, England:</b> the bear and ragged staff, the badge of the medieval Earls of Warwick, still flies on the flag of Warwickshire.</li></ul>
<p>These belong to their cities and countries, so treat them as inspiration and give your bear its own colors, name and motto.</p></section>
<section class="sec"><h2 class="gilt">Bear poses and their names</h2><ul>
<li><b>Rampant:</b> rearing on its hind legs with forepaws raised, as in Berlin. This is the bear drawn in Crest Studio.</li>
<li><b>Passant:</b> walking on all fours, as in Bern.</li>
<li><b>Sejant:</b> sitting upright.</li>
<li><b>Statant:</b> standing still with all four feet on the ground.</li></ul>
<p>Heralds also use a bear's head on its own, cut off cleanly (<i>couped</i>) or with a jagged edge (<i>erased</i>). One old quirk: some English heraldry books said a bear should always be drawn wearing a muzzle unless the blazon said otherwise, so you will see many muzzled bears in older arms.</p></section>
<section class="sec"><h2 class="gilt">Designing your bear crest</h2>
<h3>Black on silver or gold</h3><p>A black bear on silver or gold is the classic look of Berlin and Bern, and it reads clearly at any size. A silver bear on blue recalls the polar bear of the north. A gold bear on red or green feels warm and royal. All of these keep the heraldic rule of tincture: a metal against a color.</p>
<h3>Names with a bear in them</h3><p>Some names already carry a bear. Björn is the Scandinavian word for bear, and Ursula comes from the Latin <i>ursa</i>, a she-bear. A bear crest for a family or a person with a name like that is a quiet heraldic pun, the kind heralds have always loved.</p>
<h3>For teams and clubs</h3><p>A rearing bear is a natural badge for a rugby or hockey club, a scout troop or an online guild, because the silhouette stays bold even as a small icon. See <a href="/clan-logo-maker.html">clan and guild logos</a> and the <a href="/crest-logo-maker.html">Crest Logo Kit</a>.</p>
<h3>Mottos</h3><p>Try <i>Fortis et Fidelis</i> (strong and faithful), <i>Fortitudine</i> (by fortitude) or plain English such as "Guard the Hearth". The <a href="/latin-motto-generator.html">Latin motto generator</a> has 50 more with translations. Comparing beasts? The <a href="/lion-coat-of-arms.html">lion</a> and <a href="/wolf-coat-of-arms.html">wolf</a> guides cover the other two favorites.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=bear">Design a bear crest</a></p></section>''',
        faqs=[('What does a bear mean on a coat of arms?', 'Strength and the protection of family. Heraldic meanings come from later tradition rather than strict rules, but the bear has long been read as a powerful protector.'),
              ('What is the difference between a bear rampant and a bear passant?', 'A bear rampant rears up on its hind legs with its forepaws raised, as on the arms of Berlin. A bear passant walks on all fours, as on the arms of Bern.'),
              ('What does the Berlin coat of arms look like?', 'A black bear rampant, with red tongue and claws, on a silver shield under a crown. Bears have stood for Berlin for centuries, and the current design was adopted in 1954.'),
              ('Can I put a bear on my family crest?', 'Yes. The bear is an ordinary heraldic beast open to anyone in an original design. Just avoid copying a city or national coat of arms exactly, and make the colors, name and motto your own.')],
    ),
    dict(
        slug='stag-coat-of-arms.html', cta_href='/crest.html?ch=stag', short='Stag coat of arms', blurb='Stags, harts and the caboshed head', og='stag',
        h1='Stag Coat of Arms', h1_html='The Stag Coat of Arms: Meaning and Design',
        title='Stag Coat of Arms: Meaning, Caboshed Heads and Deer in Heraldry | Crest Studio',
        og_title='Stag coat of arms: meaning and how to design a deer crest',
        desc="What a stag means in heraldry, the special words heralds use for deer, the stag's head caboshed, famous stags from the Highlands to Richard II, and how to design your own stag crest free.",
        eyebrow='Peace, harmony and the deer of the Highlands',
        lede="The stag is heraldry's gentle strongman: peaceful until provoked, and crowned with antlers. Here is what it means, how heralds describe it, and how to put one on a crest of your own.",
        cta='Design a stag crest',
        examples=[crest('The Hartley Family', 'Peace With Strength', VERT, OR, GOLD_LIGHT, 'plain', 'stag'),
                  crest('The Dunmore Family', 'Stand Still, See Far', AZURE, OR, GOLD_LIGHT, 'plain', 'stag'),
                  crest('The Keane Family', 'Gentle but Unbowed', GULES, ARGENT, ARGENT, 'plain', 'stag'),
                  crest('The Hirsch Family', 'Friede und Kraft', ARGENT, ARGENT, SABLE, 'plain', 'stag'),
                  crest('Glenhallow Walking Club', 'Into the Hills', SABLE, OR, GOLD_LIGHT, 'plain', 'stag')],
        body='''<section class="sec"><h2 class="gilt">What a stag means in heraldry</h2>
<p>Peace and harmony: someone who will not fight unless provoked. The stag is strong and well armed, yet it lives quietly in the forest, so heraldic tradition made it a symbol of strength held in reserve. Those meanings come from later writers rather than any fixed rule, but they suit the animal well, and they make the stag a lovely emblem for a calm, steady family.</p>
<p>Deer were also the great beasts of the medieval hunt, so a stag on a shield could hint at forests, estates and the outdoors. That is still why people choose one today: it feels like the hills, the woods and home.</p></section>
<section class="sec"><h2 class="gilt">The special words heralds use for deer</h2>
<p>Heralds gave deer a vocabulary of their own. A <b>stag</b> or <b>hart</b> is the male red deer; <b>hart</b> is the older word for a mature stag. A <b>buck</b> is a fallow deer and a <b>hind</b> is a female. The antlers are called <b>attires</b> and each point is a <b>tyne</b>, so a stag with gold antlers is "attired Or".</p>
<p>The poses have their own names too:</p><ul>
<li><b>Caboshed:</b> just the head, seen from the front with its antlers, with no neck showing. This is the stag drawn in Crest Studio, and the most common deer in Scottish arms.</li>
<li><b>At gaze:</b> standing still and turning its head to look straight at you.</li>
<li><b>Trippant:</b> walking at an easy pace, the deer's word for passant.</li>
<li><b>Courant:</b> running at full speed.</li>
<li><b>Springing:</b> leaping, the deer's word for salient.</li>
<li><b>Lodged:</b> lying down, used for deer where other beasts are couchant.</li></ul></section>
<section class="sec"><h2 class="gilt">Famous stags in heraldry</h2><ul>
<li><b>The Mackenzies of Kintail:</b> the earliest known record of their chief's arms, from 1542, is a gold stag's head caboshed on blue. Those arms belong to the chief, so use them as inspiration only.</li>
<li><b>Württemberg:</b> three black stag antlers on gold, still seen in the greater arms of the German state of Baden-Württemberg.</li>
<li><b>Richard II of England:</b> his personal badge was a white hart, painted on the Wilton Diptych of about 1395 to 1399. It is why the White Hart is still a common name for English pubs.</li></ul>
<p>Outside heraldry, Edwin Landseer's 1851 painting <i>The Monarch of the Glen</i>, now owned by the National Galleries of Scotland, made the Highland stag a picture of Scotland itself. Red deer are native to Ireland as well, which is why the stag suits both <a href="/scottish-family-crest.html">Scottish</a> and <a href="/irish-family-crest.html">Irish</a> crests.</p></section>
<section class="sec"><h2 class="gilt">Designing your stag crest</h2>
<h3>Colors</h3><p>A gold stag on green is the forest itself, and gold on blue echoes the old Mackenzie arms. A silver stag on red is bright and bold, and a black stag on silver reads crisply even at small sizes. Each keeps the rule of tincture: a metal against a color.</p>
<h3>Names with a deer in them</h3><p>Hart and Hartley come from the Old English <i>heorot</i>, a hart, and Hirsch is German for deer. A stag on a crest for a family with one of those names is a classic heraldic pun, known as canting arms.</p>
<h3>Mottos</h3><p>Try <i>Pax et Fortitudo</i> (peace and strength), <i>Dum Spiro Spero</i> (while I breathe, I hope) or plain English such as "Gentle but Unbowed". The <a href="/latin-motto-generator.html">Latin motto generator</a> has more, and the <a href="/heraldry-symbols-and-meanings.html">meanings guide</a> explains every color.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=stag">Design a stag crest</a></p></section>''',
        faqs=[('What does a stag mean on a coat of arms?', 'Peace and harmony: someone strong who will not fight unless provoked. As the great beast of the medieval hunt, it can also suggest forests, the outdoors and a love of the land.'),
              ('What does "caboshed" mean in heraldry?', "A head that is caboshed (also spelled cabossed) is shown from the front with no neck visible. A stag's head caboshed shows the face and full antlers."),
              ('What is the difference between a stag, a hart and a buck?', 'In heraldry a stag or hart is a male red deer, hart being the older word for a mature stag. A buck is usually a fallow deer, and a hind is a female deer.'),
              ('Is a stag a Scottish symbol?', 'The red deer is closely tied to the Scottish Highlands, and a stag\'s head caboshed appears in several Scottish arms, including those of the Mackenzie chiefs. It is also native to Ireland and common in English and German heraldry.'),
              ('Can I use a stag on my family crest?', 'Yes. The stag is a common heraldic charge open to anyone in an original design. Just avoid copying a clan chief\'s or a state\'s arms exactly.')],
    ),
    dict(
        slug='griffin-coat-of-arms.html', cta_href='/crest.html?ch=griffin', short='Griffin coat of arms', blurb='Eagle, lion and the griffin segreant', og='griffin',
        h1='Griffin Coat of Arms', h1_html='The Griffin Coat of Arms: Meaning and Design',
        title='Griffin Coat of Arms: Meaning, Segreant and the Griffins of Pomerania | Crest Studio',
        og_title='Griffin coat of arms: meaning and how to design a griffin crest',
        desc='What a griffin means in heraldry, why a rearing griffin is called segreant, the wingless keythong, famous griffins from Pomerania to Perugia, and how to design your own griffin crest free.',
        eyebrow='Half eagle, half lion, all courage',
        lede="The griffin joins the king of the birds to the king of the beasts: an eagle's head, wings and talons on a lion's body. Here is what it means, the words heralds use for it, and how to put one on a crest of your own.",
        cta='Design a griffin crest',
        examples=[crest('The Greif Family', 'Watchful and Bold', ARGENT, ARGENT, GULES, 'plain', 'griffin'),
                  crest('The Adeyemi Family', 'Courage Keeps Watch', AZURE, OR, GOLD_LIGHT, 'plain', 'griffin'),
                  crest('Griffon Hall', 'Guard What Matters', SABLE, OR, GOLD_LIGHT, 'plain', 'griffin'),
                  crest('Harwick Griffins RFC', 'Wings and Claws', GULES, OR, GOLD_LIGHT, 'plain', 'griffin'),
                  crest('The Sorensen Family', 'Strength With Sight', VERT, ARGENT, ARGENT, 'plain', 'griffin')],
        body='''<section class="sec"><h2 class="gilt">What a griffin means in heraldry</h2>
<p>Courage, strength and leadership, with a watchful eye. The griffin borrows from the two most popular animals in heraldry: the eagle for sharp sight and the sky, the lion for strength and the earth. Put together, it reads as someone both brave and vigilant. Heraldic meanings come from later writers rather than any fixed rule, so treat them as tradition, but this one is old and widely shared.</p>
<p>In ancient stories griffins guarded gold and treasure, which is why many people still choose one to stand for protecting what matters: a family, a home, a team or a business.</p></section>
<section class="sec"><h2 class="gilt">Segreant, keythong and the griffin's own words</h2>
<p>Heralds gave the griffin its own vocabulary. Where a lion rearing on its hind legs is <b>rampant</b>, a griffin in the same pose is <b>segreant</b>, usually with its wings raised. That rearing griffin is the one drawn in Crest Studio.</p>
<ul><li><b>Passant:</b> walking, as with other beasts.</li>
<li><b>Griffin's head:</b> the eagle-like head alone, often with its ears showing, since a heraldic griffin has ears where an eagle has none.</li>
<li><b>Keythong:</b> in British heraldry, a "male griffin" is drawn without wings, with spikes or rays coming from its body. It is rare and makes a striking choice if you want something unusual.</li></ul>
<p>The spelling varies too: griffin, gryphon and griffon all appear in old books and mean the same creature.</p></section>
<section class="sec"><h2 class="gilt">Famous griffins in heraldry</h2><ul>
<li><b>Pomerania:</b> a red griffin with gold beak and claws on a silver shield, the arms of the Dukes of Pomerania. The dynasty was even known as the House of Griffins, and the oldest known reference to its griffin is a deed from the early 1190s. The family died out with Duke Bogislaw XIV in 1637, but the red griffin lives on in the arms of the Polish West Pomeranian Voivodeship and the German state of Mecklenburg-Vorpommern.</li>
<li><b>Perugia, Italy:</b> a griffin segreant wearing a crown, a symbol of the city since the Middle Ages.</li>
<li><b>Genoa, Italy:</b> two griffins support the old republic's shield with its red cross.</li>
<li><b>Trinity College, Oxford:</b> uses griffins in its crest.</li></ul>
<p>These belong to their regions and institutions, so use them for inspiration and give your griffin its own colors, name and motto.</p></section>
<section class="sec"><h2 class="gilt">Designing your griffin crest</h2>
<h3>Colors</h3><p>A red griffin on silver is the Pomeranian classic and very bold. A gold griffin on blue or black looks regal, and a silver griffin on green feels fresh and calm. Each follows the rule of tincture: a metal (gold or silver) against a color, so the beast stands out at any size.</p>
<h3>Griffin supporters</h3><p>Griffins are also popular as supporters, the animals that stand on either side of the shield. In Crest Studio you can add a pair of griffin supporters to any design, so even a crest with a key, a book or an initial on the shield can have griffins guarding it.</p>
<h3>Names with a griffin in them</h3><p>Griffith, Griffin and the German Greif all echo the creature in sound, and a griffin crest for a family with one of those names is a classic heraldic pun, known as canting arms.</p>
<h3>For teams, schools and guilds</h3><p>The griffin is a favorite mascot because it combines two strong animals in one bold silhouette. See <a href="/school-house-crests.html">school house crests</a> and <a href="/clan-logo-maker.html">clan and guild logos</a>. Comparing beasts? The <a href="/eagle-coat-of-arms.html">eagle</a> and <a href="/lion-coat-of-arms.html">lion</a> guides cover its two halves, and the <a href="/phoenix-crest.html">phoenix crest guide</a> covers the other great fiery bird of heraldry.</p>
<h3>Mottos</h3><p>Try <i>Semper Vigilans</i> (always watchful), <i>Fortis et Fidelis</i> (strong and faithful) or plain English such as "Guard What Matters". The <a href="/latin-motto-generator.html">Latin motto generator</a> has more with translations.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=griffin">Design a griffin crest</a></p></section>''',
        faqs=[('What does a griffin mean on a coat of arms?', 'Courage, strength and leadership combined with vigilance. As half eagle and half lion, it joins the qualities of both, and in older stories griffins guarded treasure, so it also suggests protection.'),
              ('What does segreant mean in heraldry?', 'Segreant is the word for a griffin rearing up on its hind legs, usually with its wings raised. It is the griffin equivalent of a lion rampant.'),
              ('What is a keythong?', 'In British heraldry a keythong, or male griffin, is a griffin drawn without wings and with spikes or rays coming from its body. It is rare in real arms.'),
              ('Which coat of arms has a red griffin?', 'The arms of the Dukes of Pomerania show a red griffin with gold beak and claws on a silver shield. It still appears in the arms of the West Pomeranian Voivodeship in Poland and of Mecklenburg-Vorpommern in Germany.'),
              ('Can I put a griffin on my family crest?', 'Yes. The griffin is a traditional heraldic creature open to anyone in an original design. Just avoid copying a regional or institutional coat of arms exactly.')],
    ),
    dict(
        slug='unicorn-coat-of-arms.html', cta_href='/crest.html?ch=unicorn', short='Unicorn coat of arms', blurb="Scotland's unicorn and what it means", og='unicorn',
        h1='Unicorn Coat of Arms', h1_html='The Unicorn Coat of Arms: Meaning and Design',
        title="Unicorn Coat of Arms: Meaning, Scotland's Chained Unicorn and Design Ideas | Crest Studio",
        og_title='Unicorn coat of arms: meaning and how to design a unicorn crest',
        desc="What a unicorn means in heraldry, why Scotland's royal unicorns wear chains, how the unicorn met the English lion in 1603, and how to design your own unicorn crest free.",
        eyebrow="Purity, strength and Scotland's national animal",
        lede="The unicorn is Scotland's national animal and one half of the most famous pair of supporters in heraldry. Here is what it means, where it came from, and how to put one on a crest of your own.",
        cta='Design a unicorn crest',
        examples=[crest('The MacAllister Family', 'Untamed and True', AZURE, ARGENT, ARGENT, 'plain', 'unicorn'),
                  crest('The Blanchard Family', 'Pure in Purpose', GULES, ARGENT, ARGENT, 'plain', 'unicorn'),
                  crest('The Lindqvist Family', 'Free and Faithful', VERT, OR, GOLD_LIGHT, 'plain', 'unicorn'),
                  crest('Saint Ninian House', 'Lux et Veritas', PURPURE, ARGENT, ARGENT, 'plain', 'unicorn'),
                  crest('The Weiss Family', 'Gentle, Never Tame', SABLE, ARGENT, ARGENT, 'plain', 'unicorn')],
        body='''<section class="sec"><h2 class="gilt">What a unicorn means in heraldry</h2>
<p>Purity, courage and a strength that cannot be tamed. In medieval stories the unicorn was fierce and impossible to capture by force, so it came to stand for something noble and free. Heraldic meanings come from later tradition rather than strict rules, but the unicorn's has stayed remarkably steady for five hundred years.</p>
<p>The heraldic unicorn is not quite a horse with a horn. Heralds traditionally draw it with a goat's beard, cloven hooves and a lion's tail, which is why it looks wilder and more ancient than the unicorns of modern cartoons.</p></section>
<section class="sec"><h2 class="gilt">Scotland and the unicorn</h2>
<p>The unicorn is Scotland's national animal, and its place in Scottish royal heraldry goes back centuries. James I of Scotland, who reigned from 1406 to 1437, used a unicorn, and from James V onward a pair of unicorns supported the royal arms. Scotland even had a gold coin called the unicorn, first issued under James III and in circulation from 1484 to 1525.</p>
<p>The royal unicorns are shown crowned and wearing gold chains. A popular explanation is that only a Scottish king was strong enough to tame such a wild creature, so the chain shows power held in check rather than a prisoner.</p>
<h3>The lion and the unicorn</h3><p>In 1603 James VI of Scotland also became James I of England and Ireland. His royal arms put the English lion on one side of the shield and the Scottish unicorn on the other, and that pairing still supports the royal arms of the United Kingdom today. In the version used in Scotland, the unicorn takes the place of honor on the left as you look at it.</p></section>
<section class="sec"><h2 class="gilt">Designing your unicorn crest</h2>
<h3>Colors</h3><p>A silver unicorn on blue is the most Scottish look, echoing the saltire flag's white on blue. Silver on red is bright and dramatic, gold on green feels like an old forest tale, and silver on purple or black looks elegant and a little mysterious. All keep the rule of tincture: a metal against a color.</p>
<h3>Unicorn supporters</h3><p>Crest Studio lets you add a pair of unicorns as supporters on either side of any shield, so you can keep a family emblem on the shield and still have unicorns standing guard.</p>
<h3>Scottish families</h3><p>If your family has Scottish roots, the unicorn is a natural choice. Pair it with a thistle or a saltire division for a design that clearly says Scotland. The <a href="/scottish-family-crest.html">Scottish family crest guide</a> explains clan crest badges and how they differ from personal arms.</p>
<h3>For schools, houses and storytellers</h3><p>The unicorn suits school houses, book clubs and fantasy settings that want an emblem of wonder rather than war. See <a href="/school-house-crests.html">school house crests</a> and the <a href="/dnd-coat-of-arms-generator.html">D&amp;D coat of arms generator</a>. For a house of wisdom instead, the <a href="/owl-coat-of-arms.html">owl coat of arms guide</a> covers heraldry's great emblem of learning.</p>
<h3>Mottos</h3><p>Try <i>Lux et Veritas</i> (light and truth), <i>Nemo Me Impune Lacessit</i> (no one provokes me with impunity, the motto long associated with Scotland and the Order of the Thistle) or plain English such as "Gentle, Never Tame". The <a href="/latin-motto-generator.html">Latin motto generator</a> has more with translations.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=unicorn">Design a unicorn crest</a></p></section>''',
        faqs=[('What does a unicorn mean on a coat of arms?', 'Purity, courage and a strength that cannot be tamed. In medieval stories the unicorn could not be captured by force, so it became a symbol of nobility and freedom.'),
              ("Why is the Scottish unicorn chained?", "The royal unicorns of Scotland are shown crowned and chained. The usual explanation is that only a Scottish king could tame such a wild creature, so the chain represents controlled power."),
              ('Why are there a lion and a unicorn on the royal coat of arms?', 'When James VI of Scotland also became King of England and Ireland in 1603, his arms paired the English lion with the Scottish unicorn as supporters. The pairing remains on the royal arms of the United Kingdom.'),
              ('Is the unicorn the national animal of Scotland?', 'Yes. The unicorn has been a Scottish royal emblem for centuries and is widely recognized as Scotland\'s national animal.'),
              ('Can I put a unicorn on my family crest?', 'Yes. The unicorn is a traditional heraldic creature open to anyone in an original design, either on the shield or as a pair of supporters. Just avoid copying the royal arms exactly.')],
    ),
    dict(
        slug='phoenix-crest.html', cta_href='/crest.html?ch=phoenix', short='Phoenix crest', blurb='Renewal, comebacks and rising from flames', og='phoenix',
        h1='Phoenix Crest', h1_html='The Phoenix Crest: Meaning and Design',
        title='Phoenix Crest: Meaning in Heraldry, Famous Phoenix Emblems and Design Ideas | Crest Studio',
        og_title='Phoenix crest: what it means and how to design a phoenix emblem',
        desc='What a phoenix means on a coat of arms, how heralds draw it rising from flames, famous phoenix emblems from Tudor England to San Francisco, and how to design your own phoenix crest free.',
        eyebrow='Renewal, resilience and the comeback',
        lede='The phoenix is the emblem of starting again: a bird that burns and rises from its own ashes. Here is what it means in heraldry, where it has flown before, and how to design a phoenix crest for a family, a team or a clan with a comeback story.',
        cta='Design a phoenix crest',
        examples=[crest('The Okonkwo Family', 'Resurgam', GULES, OR, GOLD_LIGHT, 'plain', 'phoenix'),
                  crest('House Ashcombe', 'From Ashes, Higher', SABLE, OR, GOLD_LIGHT, 'plain', 'phoenix'),
                  crest('The Delgado Family', 'Post Tenebras Lux', AZURE, OR, GOLD_LIGHT, 'plain', 'phoenix'),
                  crest('Emberfall Gaming', 'We Respawn Stronger', PURPURE, ARGENT, ARGENT, 'plain', 'phoenix'),
                  crest('Emberton Rovers', 'Up From the Ashes', VERT, OR, GOLD_LIGHT, 'plain', 'phoenix'),
                  crest('The Halvorsen Family', 'Per Ardua', MURREY, OR, GOLD_LIGHT, 'plain', 'phoenix')],
        body='''<section class="sec"><h2 class="gilt">What a phoenix means on a coat of arms</h2>
<p>Renewal, resurrection and the strength to begin again. The legend is ancient: Herodotus, writing in the 400s BC, described a sacred bird said to visit Egypt only once every 500 years. Later writers added the version everyone knows, a bird that burns and rises young from its own ashes. Christian writers in the Middle Ages read it as a symbol of resurrection, and heraldry took it up as a badge of hope and endurance.</p>
<p>That makes the phoenix different from most heraldic beasts. A lion or a bear says "we are strong". A phoenix says "we have been through fire and we are still here". It suits families who rebuilt after hard years, people marking a new chapter, and teams that came back from a losing season.</p></section>
<section class="sec"><h2 class="gilt">How heralds draw the phoenix</h2>
<p>The heraldic phoenix looks much like an eagle, with wings raised, and it is almost always shown rising from a bed of flames. A blazon will usually say so directly, for example "a phoenix in flames" or "a phoenix rising from the flames". Old reference books also give examples of the phoenix in plain colors, such as a silver phoenix on black.</p>
<ul><li><b>The bird:</b> eagle-like, with its wings spread or raised.</li>
<li><b>The flames:</b> usually drawn in natural colors, which heralds call "proper", so they stay red and gold whatever the field.</li>
<li><b>Close relatives:</b> the salamander, a creature shown living in fire, is the phoenix's nearest cousin in heraldry, and the <a href="/eagle-coat-of-arms.html">heraldic eagle</a> shares its outline.</li></ul>
<p>The phoenix in Crest Studio follows that tradition: an eagle-like bird with spread wings, rising from flames at the base.</p></section>
<section class="sec"><h2 class="gilt">Famous phoenix emblems</h2><ul>
<li><b>Jane Seymour:</b> the third wife of Henry VIII used a badge of a crowned phoenix rising from flames. The Seymour family crest, as recorded for the later Dukes of Somerset, is a phoenix rising from flames out of a ducal coronet.</li>
<li><b>Fenwick of that Ilk, Scotland:</b> listed in Parker's classic glossary of heraldry as bearing a silver phoenix in flames on red.</li>
<li><b>Coventry, England:</b> the city's arms gained a pair of supporters in 1959, the eagle of Leofric and a phoenix. The city explains the phoenix as the new Coventry reborn from the ashes of the old, after the destruction of the Second World War.</li>
<li><b>San Francisco:</b> the city seal, adopted in 1859, has a phoenix rising from flames above the shield, linked to the city recovering from the great fires of its early years. The motto reads <i>Oro en Paz, Fierro en Guerra</i> (gold in peace, iron in war).</li>
<li><b>Atlanta:</b> the city seal shows a phoenix rising from fire with the Latin motto <i>Resurgens</i> (rising again), for the city's rebuilding after the Civil War.</li></ul>
<p>These belong to their families and cities, so use them as inspiration and give your phoenix its own colors, name and motto.</p></section>
<section class="sec"><h2 class="gilt">Designing your phoenix crest</h2>
<h3>Colors</h3><p>Gold on red is the most fiery choice and looks right at home with the flames. Gold on black reads like embers in the dark, and gold on blue calms the whole design down. A silver phoenix on purple or green is less expected and very striking. Each pair keeps the rule of tincture: a metal (gold or silver) against a color.</p>
<h3>Keep the field plain</h3><p>A phoenix with spread wings and flames fills the shield, so it looks best without a division behind it. Put the story into the name and motto instead.</p>
<h3>For gaming clans, teams and comebacks</h3><p>The phoenix is a natural sigil for a clan that rebuilt its roster, a guild relaunching on a new server, or a club that came back up after relegation. See <a href="/clan-logo-maker.html">clan and guild logos</a> for sizing tips, and the <a href="/crest-logo-maker.html">Crest Logo Kit</a> if you need favicons, a Discord icon and banners.</p>
<h3>For families and new chapters</h3><p>A phoenix crest makes a thoughtful gift for someone starting over: a new home after a hard year, recovery, a business reopening. The <a href="/family-crest-gift.html">family crest gift guide</a> explains how to add a "presented to" line to the certificate.</p>
<h3>Mottos</h3><p>Try <i>Resurgam</i> (I shall rise again), <i>Post Tenebras Lux</i> (after darkness, light), <i>Per Ardua</i> (through difficulties) or plain English such as "From Ashes, Higher". The <a href="/latin-motto-generator.html">Latin motto generator</a> has more, each with a translation.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=phoenix">Design a phoenix crest</a></p></section>''',
        faqs=[('What does a phoenix mean on a coat of arms?', 'Renewal, resurrection and resilience. In legend the phoenix burns and rises again from its own ashes, so in heraldry it stands for surviving hardship and starting again stronger.'),
              ('How is a phoenix shown in heraldry?', 'As an eagle-like bird with raised or spread wings, rising from a bed of flames. A blazon will usually describe it as "a phoenix in flames" or "rising from the flames", with the flames in natural colors.'),
              ('Which cities have a phoenix on their emblem?', 'Among others, Coventry in England has a phoenix as one of the supporters of its arms, and the city seals of San Francisco and Atlanta both show a phoenix rising from flames.'),
              ('Is a phoenix a good emblem for a gaming clan or team?', 'Yes. It is one of the most popular choices for groups with a comeback story, and its bold silhouette reads well at small sizes such as a Discord icon or a team avatar.'),
              ('Can I put a phoenix on my family crest?', 'Yes. The phoenix is a traditional heraldic creature anyone can use in an original design. Just avoid copying a real family or civic coat of arms exactly, and treat a Crest Studio design as decorative art rather than official arms.')],
    ),
    dict(
        slug='owl-coat-of-arms.html', cta_href='/crest.html?ch=owl', short='Owl coat of arms', blurb='Wisdom, Athena and the owls of Leeds and Oldham', og='owl',
        h1='Owl Coat of Arms', h1_html='The Owl Coat of Arms: Meaning and Design',
        title='Owl Coat of Arms: Meaning, Famous Owl Crests and Design Ideas | Crest Studio',
        og_title='Owl coat of arms: what it means and how to design an owl crest',
        desc='What an owl means on a coat of arms, why owls guard the arms of Leeds and Oldham, how heralds draw them, and how to design an owl crest for a family, school or library, free.',
        eyebrow='Wisdom, vigilance and learning',
        lede='The owl is the emblem of wisdom and of keeping watch. It has stood for learning since the coins of ancient Athens, and it still guards the arms of English towns and schools. Here is what it means and how to put one on a crest of your own.',
        cta='Design an owl crest',
        examples=[crest('The Whitlock Family', 'Sapere Aude', SABLE, ARGENT, ARGENT, 'plain', 'owl'),
                  crest('Ravenscroft Library', 'Lux et Veritas', AZURE, OR, GOLD_LIGHT, 'plain', 'owl'),
                  crest('House Sapientia', 'Scientia Potentia Est', PURPURE, ARGENT, ARGENT, 'plain', 'owl'),
                  crest('The Achebe Family', 'Wise and Watchful', VERT, OR, GOLD_LIGHT, 'plain', 'owl'),
                  crest('Night Owls Quiz Team', 'We Know Things', GULES, OR, GOLD_LIGHT, 'plain', 'owl')],
        body='''<section class="sec"><h2 class="gilt">What an owl means on a coat of arms</h2>
<p>Wisdom, learning and vigilance. The link is very old: the owl was the bird of Athena, the Greek goddess of wisdom, and from around 500 BC the silver coins of Athens showed her head on one side and an owl with an olive sprig on the other. The Romans gave the same owl to Minerva, their goddess of wisdom, and the idea has never really gone away. When people today want an emblem that says "we think before we act", they still reach for the owl.</p>
<p>Heraldry added a second meaning. An owl sees in the dark and stays awake while others sleep, so it also stands for watchfulness: the guardian who keeps an eye on the house at night. That makes it a gentle but serious choice, wise rather than fierce.</p></section>
<section class="sec"><h2 class="gilt">How heralds draw the owl</h2>
<p>The heraldic owl is usually drawn standing, with its face turned toward the viewer, so its two large round eyes look straight out of the shield. That front-facing stare is what makes an owl easy to recognize even at a small size. Owls are often shown in silver or gold, and a blazon may also call for an owl "proper", meaning in its natural brown colors.</p>
<p>The owl in Crest Studio follows that tradition: a front-facing owl perched on a branch, with its ear tufts up and its wings folded.</p></section>
<section class="sec"><h2 class="gilt">Famous owls in heraldry</h2>
<h3>Leeds</h3><p>The coat of arms of the city of Leeds has an owl as its crest and two crowned owls as supporters on either side of the shield. The owls come from the arms of Sir John Savile, the first Alderman of Leeds, and the owl has become a much-loved symbol of the city.</p>
<h3>Oldham and Hugh Oldham</h3><p>The arms of Oldham in Lancashire show three silver owls on black with a gold chevron, and an owl as the crest. They were granted in 1894 and based on the arms of the Oldham family. The owls are a visual pun: the name was said locally as something like "Owdham". Heralds call this kind of pun canting arms, and it is one of the oldest jokes in heraldry. The borough's motto, <i>Sapere Aude</i> (dare to be wise), plays on the owl too.</p>
<p>The family's best-known member was Hugh Oldham, Bishop of Exeter, who founded Manchester Grammar School in 1515. The school also uses the motto <i>Sapere Aude</i>, and his owls still appear in the arms of Corpus Christi College, Oxford, which he helped found.</p>
<p>These arms belong to their cities, families and schools, so use them as inspiration and give your own owl its own colors, name and motto.</p></section>
<section class="sec"><h2 class="gilt">Designing your owl crest</h2>
<h3>Colors</h3><p>A silver owl on black is the night watch itself and looks especially sharp in print. Gold on blue feels scholarly, silver on purple looks like an old university, and gold on green or red is warm and friendly. Each pair keeps the rule of tincture: a metal (gold or silver) against a color. The <a href="/heraldry-symbols-and-meanings.html">heraldry meanings guide</a> explains what each color traditionally stands for.</p>
<h3>Keep the field simple</h3><p>The owl's round face and big eyes are its whole character, so a plain field shows it best. If you want more on the shield, try a chevron or a fess behind it, and keep the owl in a metal so it stands out.</p>
<h3>For schools, libraries and quiz teams</h3><p>The owl is a natural emblem for a school house of wisdom, a library, a tutoring business, a book club or a pub quiz team. See <a href="/school-house-crests.html">school house crests</a> for setting up a whole house system, and the <a href="/crest-logo-maker.html">Crest Logo Kit</a> if you need a logo, favicons and social banners for a small business.</p>
<h3>For families</h3><p>An owl suits a family that values learning: parents who were the first to go to college, a long line of teachers, or grandparents who always had the answer. It also makes a thoughtful graduation or retirement gift for a teacher.</p>
<h3>Mottos</h3><p>Try <i>Sapere Aude</i> (dare to be wise), <i>Lux et Veritas</i> (light and truth), <i>Scientia Potentia Est</i> (knowledge is power) or plain English such as "Wise and Watchful". The <a href="/latin-motto-generator.html">Latin motto generator</a> has more, each with a translation.</p>
<p class="center" style="margin-top:22px"><a class="btn big" href="/crest.html?ch=owl">Design an owl crest</a></p></section>''',
        faqs=[('What does an owl mean on a coat of arms?', 'Wisdom, learning and vigilance. The owl was the bird of Athena, the Greek goddess of wisdom, and because it watches through the night it also stands for keeping guard.'),
              ('Why does Leeds have owls on its coat of arms?', 'The owls on the arms of Leeds, as the crest and as the two supporters, were taken from the arms of Sir John Savile, the first Alderman of Leeds.'),
              ('Why are there owls on the Oldham coat of arms?', 'They are a pun on the name. The Oldham family name was pronounced something like "Owdham", so the family took owls for their arms, and the borough arms granted in 1894 were based on them. The motto Sapere Aude, dare to be wise, refers to the owls.'),
              ('Is an owl a good emblem for a school or library?', 'Yes. It is one of the most popular emblems for schools, libraries and learning groups because its link to wisdom goes back to ancient Greece, and its front-facing face reads clearly at small sizes.'),
              ('Can I put an owl on my family crest?', 'Yes. The owl is a traditional heraldic charge anyone can use in an original design. Just avoid copying a real city, school or family coat of arms exactly, and treat a Crest Studio design as decorative art rather than official arms.')],
    ),
]
