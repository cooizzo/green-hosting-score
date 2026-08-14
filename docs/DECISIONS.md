# Product decisions

Locked decisions for Green Hosting Score (placeholder name; final brand TBD).

## Product & ops

| # | Decision | Choice |
|---|----------|--------|
| 1 | Packaging / host | **Docker, self-hosted** |
| 2 | Database | **Postgres** |
| 3 | Grid intensity | **GWF IP → CO₂ intensity** |
| 4 | Measurement | **Both** — fast crawl (default) + Playwright (accurate) |
| 5 | Auth | **Optional** (anonymous works; API keys optional) |
| 6 | Rate limits | **5 analyses / IP / day** when anonymous; **per API key** when authenticated |
| 7 | Cache TTL | **24 hours** (keyed by URL + measurement mode) |
| 8 | Result URLs | **Domain slug** (e.g. `/r/example-com-…`) |
| 9 | License / name | **MIT** · placeholder **Green Hosting Score** (`green-hosting-score`) · final brand TBD |
| 10 | Monetization | **Undecided** (keep auth/key plumbing flexible) |

## Tech stack (default — locked)

| Layer | Choice |
|-------|--------|
| Language | **TypeScript** end-to-end |
| UI + API | **Next.js** (App Router) — monolith for MVP |
| ORM | **Prisma** + Postgres 16 |
| Fast measure | `fetch`/`undici` + HTML parse (**cheerio** or **linkedom**) |
| Accurate measure | **Playwright** (Chromium) in the app image; split to `worker` later if needed |
| Jobs / queue | **Postgres job table** first (add Redis + BullMQ when scaling) |
| Cache / rate limits | **Postgres** (add Redis when running multiple app replicas) |
| Emissions | Website Carbon `/data` + **CO2.js** (`@tgwf/co2`) fallback |
| Green hosting | GWF Greencheck |
| Grid | GWF IP → CO₂ |
| Auth | **API keys** hashed in Postgres (Auth.js later if login UI needed) |
| Reverse proxy | **Caddy** (auto HTTPS) |
| Logging | **pino** + Docker logs |
| Tests | **Vitest** (unit: urlGuard, rateLimit, slug helpers) |
| Deploy | `docker compose up -d` — services: `caddy`, `app`, `postgres` |

### Compose topology (MVP)

```text
caddy  →  app (Next.js)  →  postgres
```

Later optional: `worker` (Playwright) ± `redis`.

## Notes

- Final product name postponed after trademark/search collisions for **GreenScore** and **GreenMark**.
- Monetization undecided: design optional API keys and quotas without assuming paid tiers.
- Self-hosted: ship `Dockerfile` + `docker-compose.yml` (app + Postgres + Caddy).
