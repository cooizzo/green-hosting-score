# Green Hosting Score

> Placeholder name — final brand TBD. See [docs/DECISIONS.md](./docs/DECISIONS.md).

Paste any URL → get a **letter grade**, estimated **gCO₂e** per page load, **green hosting** status, a **grid intensity** footnote, and plain-language fixes.

## Status

| Area | Status |
|------|--------|
| Docs + decisions | Done |
| Phase 0 scaffold (Next.js + Compose + mock scorer) | Done |
| Phase 1 Greencheck + Website Carbon `/data` | Done (bytes still estimated) |
| Fast crawl / Playwright | Not started |
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

Phase 1 calls Greencheck and Website Carbon `/data` (CO2.js fallback). Page weight is still estimated until Phase 2. Set `MOCK_SCORER=true` to skip live APIs.

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
