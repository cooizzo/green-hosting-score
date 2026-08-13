# Product brief — Green Hosting Score

## One-liner

Enter any URL — get a carbon estimate for loading the page, adjusted for green hosting and grid context.

## Problem

“Website carbon” calculators give a static estimate. Reality depends on page weight **and** whether hosting is green **and** how clean the grid is. Agencies, indie hackers, and sustainability teams want a shareable score for audits and marketing — not a consultant PDF. Existing tools feel one-shot; they don’t become a monitoring habit.

## MVP user flow

1. Paste a URL on the home page.
2. See a result: letter grade, gCO₂e, bytes transferred, green-host yes/no, grid footnote, 3 plain fixes.
3. Share `/r/:id` or embed an SVG badge.

## Out of scope for v1

- User accounts
- CI / GitHub Action
- Leaderboards
- Scheduled rescans
- Multi-page site crawls

## Later (post-MVP)

- Re-check schedules
- Industry leaderboards
- CI check that fails a PR if the score tanks
- Custom domains / team workspaces

## Success criteria (MVP)

- Analyze a public URL end-to-end in under ~30s
- Show grade + gCO₂e + green hosting + at least one grid note
- Shareable `/r/:id` and working SVG badge
- Safe against basic SSRF
