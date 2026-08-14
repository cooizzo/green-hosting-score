# Green Hosting Score

> Placeholder name — final brand TBD. See [docs/DECISIONS.md](./docs/DECISIONS.md).

Paste any URL → get a **letter grade**, estimated **gCO₂e** per page load, **green hosting** status, a **grid intensity** footnote, and plain-language fixes. Share a result link or embed an SVG badge.

This repository currently holds the **implementation plan** and product documentation. Application code will follow the phases in the plan.

## Docs

- [Product decisions](./docs/DECISIONS.md) — locked product + tech stack choices
- [Implementation plan](./docs/IMPLEMENTATION_PLAN.md) — architecture, APIs, modules, phases, risks
- [Product brief](./docs/PRODUCT.md) — one-liner, MVP scope, success criteria

## Quick context

Website Carbon’s public `/site?url=` endpoint is **no longer available**. The public API only accepts:

```text
GET https://api.websitecarbon.com/data?bytes={n}&green={0|1}
```

So this product **measures page transfer size itself** (fast crawl and/or Playwright), checks green hosting via the Green Web Foundation Greencheck API, then scores emissions. Grid context uses **GWF IP → CO₂ intensity**.

## Locked stack (summary)

| Area | Choice |
|------|--------|
| Deploy | Docker Compose, self-hosted (`caddy` + `app` + `postgres`) |
| App | Next.js (App Router) + TypeScript |
| ORM | Prisma + Postgres 16 |
| Measure | Fast crawl (default) + Playwright (accurate) |
| Jobs | Postgres job table (Redis later) |
| Auth | Optional API keys |
| Limits | 5/IP/day anonymous; per API key when authed |
| Cache | 24h per URL + mode (Postgres) |
| Results | Domain-slug URLs |
| Proxy | Caddy |
| License | MIT |

## Status

| Area | Status |
|------|--------|
| Product / architecture docs | Done |
| App scaffold (Next.js + Docker) | Not started |
| Measurement + scoring pipeline | Not started |

## License

[MIT](./LICENSE)
