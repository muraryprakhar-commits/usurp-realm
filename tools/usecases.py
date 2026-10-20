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
<h3>For campaigns, guilds and clubs</h3><p>Dragons are the classic sigil for a D&amp;D noble house or an online guild. See the <a href="/dnd-coat-of-arms-generator.html">D&amp;D coat of arms generator</a> and the <a href="/fantasy-house-name-generator.html">fantasy house name generator</a> for names and mottos to go with it.</p>
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
]
