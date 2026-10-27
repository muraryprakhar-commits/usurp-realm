# Campaign links and QR codes

Every visit's marketing fields are read by `/attr.js` (loaded after the analytics snippet on every tracked page).
It records first touch and last touch in the browser for 90 days, tags the Clarity session, and sends the touch
to Dodo as checkout metadata, so each payment in the Dodo dashboard shows where the buyer came from.

## Fields captured

utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_id, ref, plus ad click IDs:
gclid, gbraid, wbraid, gad_source, gad_campaignid (Google Ads), msclkid (Microsoft), fbclid (Meta),
ttclid (TikTok), twclid (X), li_fat_id (LinkedIn). Also the referring site and the landing page.

Channel rules (first match wins): Google/Microsoft click ID or medium cpc/ppc/paid = paid_search;
paid_social; display; email; medium qr/print/poster/flyer/sticker/event = qr; AI assistants (ChatGPT,
Perplexity, Claude, Gemini, Copilot) = ai; social; referral; other tagged links = campaign; no tags:
search engine referrer = organic_search, social referrer = social, other site = referral, none = direct.
Our own hosts and dodopayments.com are ignored, so coming back from checkout never overwrites the source.

## Where to read it

- Clarity: Filters > Custom tags: channel, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
  referrer, landing_page, first_channel, first_source, first_campaign, ad_click, gad_campaignid.
  Smart events: campaign_landing, qr_scan.
- Dodo: each payment's metadata: channel, source, medium, campaign, term, content, landing, click_id,
  gad_campaignid, first_channel, first_source, first_campaign, first_seen.

## QR codes (editable destinations)

QR codes point at short `/qr/...` links. They are temporary redirects in `vercel.json`, so the
destination or the campaign name can change later without reprinting the code.

| Short link | Lands on | source / medium / campaign |
|---|---|---|
| usurp.games/qr | crest.html | qr / qr / general |
| usurp.games/qr/campus | crest.html | masters_union / qr / campus_poster |
| usurp.games/qr/class | crest.html | masters_union / qr / class_screen |
| usurp.games/qr/card | crest.html | business_card / qr / card |
| usurp.games/qr/sticker | crest.html | sticker / qr / sticker |
| usurp.games/qr/games | games/ | games_poster / qr / games_poster |
| usurp.games/qr/gift | family-crest-gift.html | gift_flyer / qr / gift |

## Ready links for posting

Use lowercase, underscores, and the same names every time so reports group cleanly.

- Reddit post: https://usurp.games/crest.html?utm_source=reddit&utm_medium=social&utm_campaign=launch
- Instagram bio: https://usurp.games/crest.html?utm_source=instagram&utm_medium=social&utm_campaign=bio
- LinkedIn post: https://usurp.games/crest.html?utm_source=linkedin&utm_medium=social&utm_campaign=launch
- WhatsApp share: https://usurp.games/crest.html?utm_source=whatsapp&utm_medium=social&utm_campaign=share
- Product Hunt: https://usurp.games/crest.html?utm_source=producthunt&utm_medium=referral&utm_campaign=launch
- shipped.money: https://usurp.games/?utm_source=shipped_money&utm_medium=referral&utm_campaign=leaderboard
- Outreach email: https://usurp.games/crest.html?utm_source=outreach&utm_medium=email&utm_campaign=pitch
- Google Ads (if ever run): set the account tracking template to
  `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={creative}`;
  auto-tagging adds gclid and gad_campaignid on its own.

New link format: `https://usurp.games/<page>?utm_source=<where>&utm_medium=<type>&utm_campaign=<name>`
