# Green Hosting Score

> Placeholder name — final brand TBD. See [docs/DECISIONS.md](./docs/DECISIONS.md).

Paste any URL → get a **letter grade**, estimated **gCO₂e** per page load, **green hosting** status, a **grid intensity** footnote, and plain-language fixes.

## Status

| Area | Status |
|------|--------|
| Docs + decisions | Done |
| Phase 0 scaffold (Next.js + Compose + mock scorer) | Done |
| Phase 1 Greencheck + Website Carbon `/data` | Done |
| Phase 2 fast crawl + Playwright accurate mode | Done |
| GWF grid footnote / rate limits / SVG badge | Not started |

## Stack

Self-hosted Docker Compose: **Caddy → Next.js (App Router) → Postgres 16 (Prisma)**. See [docs/DECISIONS.md](./docs/DECISIONS.md).

## Docs

- [Product decisions](./docs/DECISIONS.md)
- [Implementation plan](./docs/IMPLEMENTATION_PLAN.md)
- [Product brief](./docs/PRODUCT.md)

## Quick start (self-hosted)

```bash
cp .env.example .env
docker compose up --build -d
```

App via Caddy: http://localhost

Phase 2 measures transfer size (fast HTML+assets crawl; Playwright when you pick Accurate). Greencheck + Website Carbon `/data` (CO2.js fallback) produce the grade. Set `MOCK_SCORER=true` to skip live APIs.

Accurate mode needs Chromium (`npx playwright install chromium` for local dev; Compose installs it in the app image).

### Local dev (app only)

Needs a running Postgres matching `DATABASE_URL` in `.env`:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

### Tests

```bash
npm test
```

## License

[MIT](./LICENSE)
