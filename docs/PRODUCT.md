# Product brief — Green Hosting Score

Placeholder name — final brand TBD ([decisions](./DECISIONS.md)).

## One-liner

Enter any URL — get a carbon estimate for loading the page, adjusted for green hosting and grid context.

## Problem

“Website carbon” calculators give a static estimate. Reality depends on page weight **and** whether hosting is green **and** how clean the grid is. Agencies, indie hackers, and sustainability teams want a shareable score for audits and marketing — not a consultant PDF. Existing tools feel one-shot; they don’t become a monitoring habit.

## MVP user flow

1. Paste a URL on the home page (optionally choose **fast** vs **accurate** measurement).
2. See a result: letter grade, gCO₂e, bytes transferred, green-host yes/no, grid footnote, 3 plain fixes.
3. Share a **domain-slug** result URL or embed an SVG badge.
4. Optionally sign in / use an API key for higher rate limits.

## Auth & limits

- **Anonymous:** 5 analyses / IP / day
- **Authenticated (API key):** per-key quotas (exact paid tiers undecided)
- Monetization: **undecided** — keep plumbing flexible

## Out of scope for v1

- Required accounts (auth is optional)
- CI / GitHub Action
- Leaderboards
- Scheduled rescans
- Multi-page site crawls
- Final product brand name

## Later (post-MVP)

- Re-check schedules
- Industry leaderboards
- CI check that fails a PR if the score tanks
- Custom domains / team workspaces
- Final naming + marketing site polish
- Monetization model (if any)

## Success criteria (MVP)

- Analyze a public URL end-to-end in under ~30s (fast mode); accurate mode may take longer
- Show grade + gCO₂e + green hosting + GWF grid note
- Shareable domain-slug result URL and working SVG badge
- Safe against basic SSRF
- Enforce anonymous + API-key rate limits
