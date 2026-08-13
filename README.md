# Green Hosting Score

Paste any URL → get a **letter grade**, estimated **gCO₂e** per page load, **green hosting** status, a **grid intensity** footnote, and plain-language fixes. Share a result link or embed an SVG badge.

This repository currently holds the **implementation plan** and product documentation. Application code will follow the phases below.

## Docs

- [Implementation plan](./docs/IMPLEMENTATION_PLAN.md) — architecture, APIs, modules, phases, risks
- [Product brief](./docs/PRODUCT.md) — one-liner, MVP scope, success criteria

## Quick context

Website Carbon’s public `/site?url=` endpoint is **no longer available**. The public API only accepts:

```text
GET https://api.websitecarbon.com/data?bytes={n}&green={0|1}
```

So this product **measures page transfer size itself**, checks green hosting via the Green Web Foundation Greencheck API, then scores emissions.

## Status

| Area | Status |
|------|--------|
| Product / architecture docs | Done |
| App scaffold (Next.js) | Not started |
| Measurement + scoring pipeline | Not started |

## License

TBD
