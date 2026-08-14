# Green Hosting Score

> Placeholder name — final brand TBD. See [docs/DECISIONS.md](./docs/DECISIONS.md).

Paste any URL → get a **letter grade**, estimated **gCO₂e** per page load, **green hosting** status, a **grid intensity** footnote, and plain-language fixes.

## Status

| Area | Status |
|------|--------|
| Docs + decisions | Done |
| Phase 0 scaffold (Next.js + Compose + mock scorer) | Done |
| Live Greencheck / Website Carbon / Playwright | Not started |

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

Phase 0 uses `MOCK_SCORER=true` (deterministic scores; no external carbon APIs yet).

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
