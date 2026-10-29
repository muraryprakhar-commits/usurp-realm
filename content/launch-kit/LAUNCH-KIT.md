# Usurp launch kit: The Usurper, ads, Play Store, social (29 Oct 2026)

Images in this folder: app icon, Play feature graphic, 8 Play screenshots, X header, YouTube banner, Usurper share image.
`content/` is never deployed.

## What is live after PR #7 is merged

- **The Usurper** at usurp.games/games/the-usurper.html: medieval social deduction for 4 to 10. Loyal knights do tasks;
  heavy tasks need several knights heaving together (strengths add up); hidden Usurpers strike, sabotage and fake heaves;
  councils accuse and vote. Play now (bots), Quick match (public, quick chat only), Private room (invite link or code).
  Peer to peer, no game server, no cost.
- **Login**: guest by default. "Save my progress" gives a 20-character save code, which is the login on any device
  (no email or password). Saves rank, stats, best scores, name and Crest Studio design.
- **Installable app** (manifest, service worker, icons): "Install the games as an app" on the games hub.
- **Ad space**: banner under every game and rails beside it, round-break slot, The Usurper lobby sponsor slot and
  sponsor name on the Great Hall banners. House ads show until a network or sponsor is set.

## Needs you, in order of impact

1. Merge PR #7 (one tap on GitHub). My merge was blocked by a safety rule, same as before.
2. Approve Vercel team access when I send the link, so I can create the free storage behind cloud save.
   Until then the save button says cloud save is not switched on yet; nothing breaks.
3. Google AdSense (free): sign up at adsense.google.com with muraryprakhar@gmail.com, add the site usurp.games.
   Send me the publisher ID (ca-pub-...). I add the site code, ads.txt and the ad units. After approval, also apply
   for H5 Games Ads (between-round ads) inside AdSense. For visitors in the EEA/UK, turn on Google's consent message
   (AdSense > Privacy & messaging) before ads go live.
4. Google Play Console ($25 once): see below.
5. Social accounts: see below. About 10 minutes each with the copy and images here.

## Ads: what is and is not possible

- Google: AdSense display ads plus H5 Games Ads are the right fit. Earnings per visit on game sites are small, so
  revenue depends almost entirely on traffic: traffic comes first.
- Meta: Meta stopped serving ads onto mobile websites (Audience Network) on 11 Apr 2020, so Meta ads cannot be shown
  on usurp.games. Meta is useful the other way round: promoting the games. The site has an optional Meta Pixel
  setting (`ADS['meta']` in tools/build.py) for measuring such campaigns; tell me before switching it on so the
  privacy page is updated first.
- Direct sponsors: usurp.games/advertise.html sells the banner, round-break and Usurper lobby placements. Direct sales
  need traffic numbers to quote, so pitch once the stats page shows steady weekly plays. Starting price idea:
  a flat USD 25 to 50 per week per placement while traffic is small, with real visit numbers shown before payment.

Sponsor email template (only to brands that publicly invite sponsorship or partnership pitches):

> Subject: Sponsor a medieval games site for a week?
>
> Hi [name], I run usurp.games, a set of free medieval browser games (a multiplayer traitor game called The Usurper,
> a trebuchet siege, Viking chess) and a coat of arms maker. Players are fans of history, fantasy and tabletop games,
> which looks close to [brand]'s audience. I can put your banner under every game and your name on the banners in the
> game's Great Hall for a week, for [price]. Last week the games had [plays] plays; I can share the live numbers.
> Interested? Prakhar

## Google Play Store

Recommendation: one app, **Usurp: Medieval Games**, containing all eight games and Crest Studio, built as a Trusted Web
Activity (the website wrapped as an Android app; every website update reaches the app with no new release).

Hurdles to know first:
- Personal Play developer accounts created after 13 Nov 2023 must run a closed test with at least 12 testers opted in
  for 14 days in a row before the app can go to production. Organization accounts need a D-U-N-S number (free, for
  Murary Studios) and identity checks; Google's help page states the 12-tester rule for personal accounts.
- The Play listing must declare: contains ads (once AdSense is on), users can interact (chat in private rooms),
  data collected (analytics, optional cloud save with no personal details).

Steps:
1. Create the Play Console account (play.google.com/console), USD 25, identity verification.
2. Go to pwabuilder.com, enter https://usurp.games/games/ and choose Package for stores > Android. Package ID
   `games.usurp.app`, app name "Usurp: Medieval Games", launcher name "Usurp". Download the zip. It contains the .aab,
   a signing key file and its passwords: keep the key safe forever (lose it and the app cannot be updated).
3. Send me the SHA-256 fingerprint shown in the zip's assetlinks.json (and later the one from Play Console > App
   integrity > App signing). I publish /.well-known/assetlinks.json so the app opens full screen with no browser bar.
4. Upload the .aab to a closed test, add 12+ testers (classmates who opt in), wait 14 days, then apply for production.

Listing copy:
- Title (21/30): Usurp: Medieval Games
- Short description (73/80): Find the traitor, topple castles, play Viking chess. Free medieval games.
- Full description:

  Eight free medieval games in one app, made for phones.

  THE USURPER: a social deduction game for 4 to 10 players. Loyal knights secure the keep while a hidden Usurper strikes
  from the shadows. Heavy tasks need knights heaving together, and their strength adds up, so a traitor faking the work
  shows up in the numbers. Talk it out in council and vote to banish. Play with friends through an invite link, join a
  public match, or play right away against computer knights.

  SIEGE: fling stones and fire pots with a trebuchet and topple ten castles with real physics.
  VIKING CHESS (Hnefatafl): defend the king or lead the raiders, against the computer or a friend.
  NINE MEN'S MORRIS: the medieval game of mills, at three strengths or two players.
  ARCHERY, THE JOUST, HOLD THE CASTLE and SWORD DUELS: quick games of skill.

  Design your own coat of arms in Crest Studio and it rides with you in every game. Play as a guest, or save your
  progress with a save code to carry it to another device.

## Social accounts

I cannot sign up for accounts myself (phone or email verification, CAPTCHAs, and the accounts must be yours).
Claim the same handle everywhere; first choice `usurpgames`, fallback `usurp.games` or `playusurp`.

- Profile picture: app-icon-512.png. Headers: x-header-1500x500.png, youtube-banner-2560x1440.png.
- Link: https://usurp.games/games/
- Bio (X, Instagram, TikTok, 150 chars): Free medieval games in your browser. Find the traitor in The Usurper, topple
  castles, play Viking chess. Design your coat of arms.
- Where: X, Instagram, TikTok, YouTube (Shorts), Reddit (u/usurpgames), Discord server (for finding Usurper players).

First five posts for The Usurper launch (reels can be made with tools/social_media.py; the 10-day plan in
content/10-day-plan.md covers Crest Studio):
1. "Among Us, but the traitor has to fake lifting a portcullis. The strength numbers give them away." + gameplay clip.
2. "Strength 5 of 7. Three knights heaving. Someone is lying." (screenshot of a heavy task) Who is it?
3. Friend-group post: "Send one link, play a traitor game in the browser, no download." + private room clip.
4. History angle: Mafia was created in Moscow in 1986 by Dmitry Davidoff; the werewolf version came in 1997 from
   Andrew Plotkin. The Usurper adds a medieval keep and strength you can measure.
5. Reddit: r/WebGames and r/playmygame (read each subreddit's self-promotion rules first; post as the developer).

## SEO, GEO and backlinks

Done in code: the game page has VideoGame, FAQ and breadcrumb structured data, is in sitemap.xml and llms.txt, links
from every footer, the hub and the guide pages, and an embed snippet with a credit link. After the deploy, IndexNow is
pinged and the daily growth task keeps shipping pages.

Backlink and listing targets that need your account (all free): itch.io (publish The Usurper as an HTML game linking
back), AlternativeTo (add it as an alternative to Among Us and Werewolf Online), Product Hunt, Indie Hackers,
r/WebGames, r/playmygame, the Discord server list sites (disboard.org) once a Discord server exists.

## License keys

Not needed. Paid Crest Studio files are already unlocked by checking the Dodo Payments order (api/verify.js).
The only key-like thing is the save code, which is the login. License keys would only matter for a paid unlock
inside the games, and Dodo has said game or virtual-goods sales are not allowed on the account.
