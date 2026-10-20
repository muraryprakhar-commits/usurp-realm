# Usurp: The Kingdom (prototype)

A medieval status ladder. Rank is set only by lifetime spend, from Peasant up to King or Queen.

**This is a prototype. All purchases are simulated. No real money moves, and the Founding Houses are fictional lore, not real users.**

## What's in it

- **The Realm**: one leaderboard sorted by lifetime spend, with titles painted onto bands
- **The Rank Ladder**: seat counts and entry floors per title
- **Noble Houses**: the brand sponsorship layer (simulated)
- **Royal Decrees**: 140 character broadcasts, free allowance by rank
- **Court Games**: dice, trivia and a joust bracket, cosmetic badges only
- **The Charter**: why this stays a status product and not a wager

## Files

- `app.js`, `home.js`, `styles.css`, `home.css`, `icon.svg`: the Kingdom art from usurp-kingdom (living map, Court cutaway, crests, banners, rank insignia), unchanged
- `realm.js`, `realm.css`: the Realm game layer (ladder, leaderboard, decrees, houses, court games) built on that art
- `index.html`: the single page that ties them together

## Running it

It's a static site with no build step. Open it in a browser, or deploy the folder to any static host. Progress is saved in the visitor's own browser (localStorage), so every visitor gets their own realm.

## Not legal advice

A real Terms of Service and legal review are needed before any real money moves, including for the US market and India's Online Gaming Act (2025).

## Crest Studio traffic pages (added 20 Oct 2026)

Crest Studio (`crest.html`) is the only real paid product. These free pages exist to bring search and AI-answer traffic to it:

- Use-case pages: `family-crest-maker.html`, `dnd-coat-of-arms-generator.html`, `wedding-crest.html`, `clan-logo-maker.html`, `school-house-crests.html`
- Free tools: `latin-motto-generator.html` (`motto-gen.js`), `fantasy-house-name-generator.html` (`house-gen.js`), `heraldry-symbols-and-meanings.html`, `coat-of-arms-template.html` (files in `templates/`)
- `crest-core.js` is a copy of the Studio's crest art for these pages. Keep it in step with `crest-studio.js`.
- Studio links: `/crest.html?d=CODE` opens a design, `?motto=` and `?name=` fill just that field. `/crest` redirects to the Studio (`vercel.json`).
- Studio "Save a free preview image" gives an 800 px watermarked PNG that credits usurp.games, so shared previews bring people back.
- The $9 package (after payment): 4000 px PNG, 1200 px PNG, SVG, certificate of arms (US Letter 300 dpi, blazon + meaning + optional gift line), 1080 px profile picture, phone wallpaper. Blazon and meaning come from `crest-core.js` (`blazon`, `meaning`, `tinctureNote`), which `crest.html` also loads.
- $29 Crest Logo Kit (Dodo product `pdt_0Nq8R4zhafrgCTZA1HYkj`): everything in the $9 set plus transparent logos, shield-only mark, favicons, app icons, Discord icon, X/LinkedIn/YouTube banners and a brand sheet, zipped in the browser with JSZip. `api/verify.js` returns `plan: kit|crest` from Dodo's own product cart, so a $9 payment never unlocks the kit. Landing page: `crest-logo-maker.html`.
- `family-crest-generator.html` (`family-gen.js`): six crests seeded by a last name, shareable as `?name=`.
- New guide pages are specs in `tools/usecases.py` (rules at the top of that file). Topic ideas waiting to be built are in `tools/backlog.md`.

Rebuild after editing content (`tools/` is not deployed, see `.vercelignore`):

```
python3 tools/build.py     # pages, sitemap.xml, llms.txt
python3 tools/assets.py    # templates/ and og/ share images (needs Playwright)
python3 tools/indexnow.py  # after deploy: tell Bing, Yandex and others about every URL
```
