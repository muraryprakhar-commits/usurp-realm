---
name: dailypublish
description: Generate, fact-check and package one day of Crest Studio (usurp.games) marketing content from content/10-day-plan.md into content/day<N>/. Use when the user types /dailypublish, optionally with a day number or date, or asks to make today's content pieces.
argument-hint: "[day number, e.g. 3, or a date; blank = next unbuilt day]"
---

# /dailypublish

Builds every content piece for one day of `content/10-day-plan.md`, in three passes: Brainstorm, Draft, Audit.
Output goes to `content/day<N>/`. Nothing is ever posted, scheduled or sent. Prakhar posts from his own accounts.

## 0. Load context (always)

1. Read `.agents/product-marketing.md` (product, prices, audience, competitors, brand voice). It is the source of truth.
2. Read `content/10-day-plan.md`. Pick the day:
   - argument is a number N: that day; a date: the row with that date; blank: the lowest day with no `content/day<N>/` folder.
   - Skip channels marked `off` in the plan's status table.
3. Read the rules at the top of `tools/usecases.py` (tinctures, emblems, divisions, rule of tincture, honesty rules).
4. If `content/day<N>/` already exists, ask before overwriting (unless running unattended: then write `content/day<N>-v2/`).

## 1. Brainstorm (per piece)

Research the piece's topic before writing a word. Use the research connectors in this order, whichever are connected
(check the tool list; never fail because one is missing):

| Need | First choice | Fallbacks |
|---|---|---|
| Find sources, examples of posts that did well, trends | Exa (`web_search_exa`) | Context.dev search, TinyFish `search`, WebSearch |
| Read a page in full (facts, subreddit rules, competitor pages) | Firecrawl `firecrawl_scrape` | Context.dev, TinyFish `fetch_content`, WebFetch |
| Scrape a platform (Reddit threads, Pinterest results, X posts) | Apify actors | TinyFish `run_web_automation`, Firecrawl search |

For each piece write `content/day<N>/<channel>/research.md`:
- 3 candidate angles, each with the hook and why it could work for this audience
- the angle picked and why
- every fact the draft will use, each with its source URL and the date checked
- for Reddit: the subreddit's current rules on self-promotion, copied in your own words with the rules URL.
  If the rules forbid it, mark the piece `skipped` and say why. Never work around a rule.

## 2. Draft (per piece)

Load the matching marketing skill with the Skill tool before drafting, and follow it:

| Piece | Skills |
|---|---|
| LinkedIn, X, Threads, Reels/Shorts captions, carousels | `social`, then `copywriting` |
| Pinterest pin title and description | `social` + `ai-seo`/`seo-audit` keyword thinking (search intent first) |
| Reddit post | `community-marketing`, then `copywriting` |
| Images | `image` for format and composition; render with `tools/social_media.py` |
| Video | `video` for hook and pacing; render with `tools/social_media.py` (`reel` type) |
| Anything with a claim or comparison | `competitors` for comparison framing, `marketing-psychology` only for honest persuasion |

Rules while drafting:
- Write like Prakhar talks: first person for LinkedIn and X, short sentences, plain words. No em dashes.
- Every link: `https://usurp.games<page>?utm_source=<channel>&utm_medium=social&utm_campaign=day<N>-<slug>`.
  For Reddit use `utm_source=reddit` and keep the link optional and secondary to the value of the post.
- Crests in images: build each design as a CREST dict (see `tools/social_media.py`) that obeys the rule of tincture
  (a metal, Or `#d4af5a` or Argent `#e8e4d8`, on a color or a color on a metal) using only emblems and divisions from
  `tools/usecases.py`. No trademarked or franchise names in crest names or mottos.
- Images and reels: write a spec JSON and run `python3 tools/social_media.py <spec.json>` from the repo root.
  Sizes: LinkedIn/X/Instagram 1080x1350, Pinterest 1000x1500, Reels/Shorts 1080x1920 (`reel`).
  If Playwright is missing: `pip install playwright --break-system-packages && python3 -m playwright install chromium`.
  Look at every rendered image (Read the PNG) and a frame of every video before moving on.
- Carousels: render each slide as a 1080x1350 image, then combine into `carousel.pdf` with Pillow.

Save per channel in `content/day<N>/<channel>/`:
- `post.md`: final copy exactly as it should be pasted, then a short block with link, best time to post (IST and US
  Eastern), alt text for every image, hashtags if the channel uses them
- media files (`image.png`, `pin.png`, `reel.mp4`, `carousel.pdf`) and the `spec.json` used to render them

## 3. Audit (per piece, nothing ships until it passes)

Write `content/day<N>/<channel>/audit.md` as a checklist with PASS or FIX for each line, fix every FIX, re-check:

**Facts**
- Every factual claim in the copy and on images appears in research.md with a source. Unsourced claims are removed.
- Prices are exactly $9, $19 Heirloom set, $29 Crest Logo Kit; free to design; instant download; 14-day refunds (re-check
  `refunds.html` and `crest.html` in the repo if anything looks different).
- No invented numbers, sales, users, testimonials, reviews or urgency. Day 10 numbers come only from real dashboards.
- No claim that a design is historical, official or "your family's" coat of arms.

**Brand**
- Matches the Brand Voice section of `.agents/product-marketing.md`. US spelling. Zero em dashes (search for the character).
- No AI tells: "it's not X, it's Y", "no X, no Y, no Z", "game-changer", "unlock", "dive in", "in today's world".
- Visuals use the site's engine, fonts and colors, show the usurp.games footer, and every crest obeys the rule of tincture.

**Channel**
- Within limits: X 280 characters per post; LinkedIn under 3,000 with the hook in the first two lines; Pinterest title
  up to 100 characters and description up to 500; Instagram caption under 2,200; Reddit title under 300.
  If a draft is close to a limit, check the platform's current limit before trusting this list.
- Format and size match the table above; the hook works with the image muted and the caption collapsed.
- Link has the right UTM tags and opens a real page (check the file exists in the repo, or fetch it on usurp.games).
- Reddit: complies with the rules captured in research.md, discloses that Prakhar built the tool.

Pieces that cannot pass are marked `skipped` with the reason in the day README instead of being shipped weak.

## 4. Package and report

1. Write `content/day<N>/README.md`: a table of channel, what to post, file names, link, best time, status
   (`ready` or `skipped: reason`). Put the order Prakhar should post in at the top.
2. Add a row to the Log table at the bottom of `content/10-day-plan.md`.
3. Commit `content/` (and nothing else unless a tool fix was needed) with a message like `Content: day 3 pieces`,
   `git fetch origin main`, rebase, push to main. `content/` is in `.vercelignore`, so the live site does not change.
4. Report in at most 5 lines: the day, pieces ready, anything skipped and why, where the files are.

## Never

Post, schedule, send, DM, comment, create accounts, buy anything, or change the site, prices, checkout or Dodo products.
If doing one of those would help, say so in the report instead.
