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
