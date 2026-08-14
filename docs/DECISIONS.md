# Product decisions

Locked decisions for Green Hosting Score (placeholder name; final brand TBD).

| # | Decision | Choice |
|---|----------|--------|
| 1 | Packaging / host | **Docker, self-hosted** |
| 2 | Database | **Postgres** |
| 3 | Grid intensity | **GWF IP → CO₂ intensity** |
| 4 | Measurement | **Both** — fast crawl (default) + Playwright (accurate) |
| 5 | Auth | **Optional** (anonymous works; accounts/API keys optional) |
| 6 | Rate limits | **5 analyses / IP / day** when anonymous; **per API key** when authenticated |
| 7 | Cache TTL | **24 hours** (keyed by URL + measurement mode) |
| 8 | Result URLs | **Domain slug** (e.g. `/r/example-com-…`) |
| 9 | License / name | **MIT** · placeholder **Green Hosting Score** (`green-hosting-score`) · final brand TBD |
| 10 | Monetization | **Undecided** (keep auth/key plumbing flexible) |

## Notes

- Final product name postponed after trademark/search collisions for **GreenScore** and **GreenMark**.
- Monetization undecided: design optional API keys and quotas without assuming paid tiers.
- Deploy target is **self-hosted** (own VPS/server). Ship `Dockerfile` + `docker-compose` (app + Postgres + optional reverse proxy).
