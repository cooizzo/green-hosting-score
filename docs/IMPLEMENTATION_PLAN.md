# Implementation plan — Green Hosting Score

Placeholder name — final brand TBD. Locked choices: [DECISIONS.md](./DECISIONS.md).

## Critical constraint

Website Carbon’s public `/site` URL endpoint was removed (as of 14 July 2025). Public access is only:

```http
GET https://api.websitecarbon.com/data?bytes={bytes}&green={0|1}
```

We must:

1. Measure page transfer **bytes** ourselves (fast crawl and/or Playwright)
2. Determine **green hosting** (`0` or `1`)
3. Call Website Carbon `/data` (with CO2.js as a fallback calculator)

---

## Architecture

```text
Browser                    Your API                         External
───────                    ────────                         ────────
Paste URL  →  POST /api/analyze { url, mode }
                 │
                 ├─0. Rate limit (IP or API key)
                 ├─1. Resolve URL / hostname (SSRF guard)
                 ├─2. Cache lookup (URL + mode, 24h TTL)
                 ├─3. Measure bytes
                 │     ├─ fast: HTML + linked assets crawl
                 │     └─ accurate: Playwright page load
                 ├─4. Greencheck API → green: 0|1
                 ├─5. Website Carbon /data?bytes&green → gco2e, rating
                 ├─6. GWF IP → CO₂ intensity (grid footnote)
                 └─7. Persist → domain-slug result URL + badge
```

A backend is required: Website Carbon has no reliable CORS; byte measurement and greencheck should not run blindly from the browser (SSRF, CORS, future secrets).

**Packaging:** Docker image (portable). Cloud host TBD (Fly / Railway / Render / etc.).

---

## Stack (locked)

| Layer | Choice | Why |
|-------|--------|-----|
| Packaging | Docker | Portable; required |
| App | Next.js (App Router) | UI + API routes in one service |
| Measure (default) | Fast crawl (HTML + linked assets) | Quicker / cheaper |
| Measure (accurate) | Playwright | Real transfer size on load |
| Emissions | Website Carbon `/data` + CO2.js fallback | Sustainable Web Design model |
| Grid | GWF IP → CO₂ intensity | Global coverage |
| DB | Postgres | Results, cache, API keys, rate-limit state |
| Auth | Optional | Anonymous OK; API keys for higher limits |
| Host | TBD | Decide at deploy time |

---

## External APIs

### 1. Green Web Foundation — Greencheck

```http
GET https://api.thegreenwebfoundation.org/api/v3/greencheck/{hostname}
```

- Pass hostname only (no protocol/path)
- Use `green: true|false` → map to Website Carbon `green=1|0`
- Cache ~24h per hostname
- Docs: https://developers.thegreenwebfoundation.org/api/greencheck/v3/check-single-domain/

### 2. Website Carbon — `/data`

```http
GET https://api.websitecarbon.com/data?bytes={n}&green={0|1}
```

Response fields used:

- `gco2e` — grams CO₂e
- `rating` — Digital Carbon Rating (letter)
- `cleanerThan` — percentile vs HTTP Archive-ish baseline
- `statistics` — energy / grid vs renewable breakdown

Docs: https://api.websitecarbon.com/

### 3. Grid carbon intensity — GWF IP → CO₂

- Resolve host → public IP
- Look up carbon intensity for that IP/region via Green Web Foundation
- Surface as a footnote (dirty / average / clean), not the primary letter grade

### 4. Geo / DNS

Resolve host → IP for greencheck context and intensity lookup. Reject private destinations (SSRF).

---

## Core modules

| Module | Responsibility |
|--------|----------------|
| `urlGuard` | Allow only `http(s)`; block private, link-local, metadata IPs (SSRF) |
| `rateLimit` | 5/IP/day anonymous; per-API-key quotas when authenticated |
| `measureFast(url)` | HTML + linked-asset transfer estimate |
| `measureAccurate(url)` | Playwright navigate; sum transfer sizes; ~20s+ timeout; concurrency cap |
| `checkGreen(hostname)` | Greencheck wrapper + short cache |
| `scoreEmissions(bytes, green)` | Website Carbon `/data` + CO2.js fallback |
| `gridContext(ip)` | GWF IP → CO₂ intensity + label |
| `suggestFixes(bytes, resources)` | Heuristics: large images, many third parties, compression signals |
| `resultsStore` | Postgres: result + slug + mode + timestamps |
| `auth/apiKeys` | Optional keys; associate quotas (monetization undecided) |

---

## API surface (v1)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/analyze` `{ url, mode?: "fast"|"accurate" }` | Run pipeline; return full result |
| `GET /api/results/:slug` | Cached / share result by domain slug |
| `GET /badge/:slug.svg` | Embeddable grade badge |
| `POST /api/keys` (optional auth) | Create/manage API keys (shape TBD) |

Cache: **24h** per `(url, mode)`.

Result URLs: **domain slug** pattern, e.g. `/r/example-com-<shortid>`.

Rate limits:

- Anonymous: **5 / IP / day**
- API key: **per-key quota** (values TBD with monetization)

If Playwright is slow: accurate mode may return `pending` + poll, or block with a longer timeout; fast mode should stay near-interactive.

---

## UI screens

1. **Home** — brand (placeholder) + URL field + mode toggle + CTA
2. **Result** — letter grade as hero signal; gCO₂e; bytes; green host; grid footnote; fixes; share + embed snippet
3. **Badge docs** — how to embed the SVG
4. **Optional account / API keys** — create key, see quota (lightweight)

Visual direction: earthy / forest energy; avoid generic purple SaaS. Grade is the dominant signal. Final brand assets TBD.

---

## Build phases

| Phase | Deliverable |
|-------|-------------|
| **0** | Docker + Next.js scaffold, URL guard, mock scorer, Postgres wiring |
| **1** | Greencheck + Website Carbon `/data` (mock/fast bytes), basic result UI |
| **2** | Fast crawl measurement + Playwright accurate mode |
| **3** | GWF grid footnote + fixes heuristics |
| **4** | Persist results, domain-slug URLs, SVG badge, 24h cache |
| **5** | Optional auth + API keys, IP/key rate limits, hardening |

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `/site` URL API gone | Own measurement — non-negotiable |
| Playwright cost / cold starts | Fast mode default; 24h cache; concurrency caps |
| SSRF | Strict URL + IP validation before fetch |
| Flaky third parties | CO2.js fallback; label partial results as estimated |
| Sites blocking bots | Detect failure; surface clear error; rely on fast mode when possible |
| Abuse of public analyzer | 5/IP/day + API key quotas |
| Brand collisions | Placeholder name until trademark-safe brand chosen |

---

## Security notes (MVP)

- Validate and normalize URLs before any network I/O
- Resolve DNS and reject non-public destinations
- Timeouts and size caps on measurement
- Rate-limit `/api/analyze` by IP and by API key
- Do not follow arbitrary redirects to internal hosts
- Store API keys hashed; never log raw keys

---

## Attribution

Cite data providers in the product UI/footer where required:

- [Website Carbon](https://www.websitecarbon.com/)
- [The Green Web Foundation](https://www.thegreenwebfoundation.org/) (Greencheck + IP → CO₂ intensity)

---

## Next implementation step

Scaffold **Docker + Next.js + Postgres** and complete **Phase 0–1**: URL guard, greencheck, Website Carbon `/data` with fast/mock bytes, and a working result UI.
