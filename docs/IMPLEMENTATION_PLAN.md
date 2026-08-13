# Implementation plan — Green Hosting Score

## Critical constraint

Website Carbon’s public `/site` URL endpoint was removed (as of 14 July 2025). Public access is only:

```http
GET https://api.websitecarbon.com/data?bytes={bytes}&green={0|1}
```

We must:

1. Measure page transfer **bytes** ourselves
2. Determine **green hosting** (`0` or `1`)
3. Call Website Carbon `/data` (with CO2.js as a fallback calculator)

---

## Architecture

```text
Browser                    Your API                         External
───────                    ────────                         ────────
Paste URL  →  POST /api/analyze
                 │
                 ├─1. Resolve URL / hostname
                 ├─2. Measure transfer bytes (headless or lightweight fetch)
                 ├─3. Greencheck API → green: 0|1
                 ├─4. Website Carbon /data?bytes&green → gco2e, rating
                 ├─5. DNS/IP → geo → carbon intensity
                 └─6. Persist result → return JSON + public /r/:id
```

A backend is required: Website Carbon has no reliable CORS; byte measurement and greencheck should not run blindly from the browser (SSRF, CORS, future secrets).

---

## Suggested stack

| Layer | Choice | Why |
|-------|--------|-----|
| App | Next.js (App Router) | UI + API routes in one deploy |
| Measure | Playwright (preferred) | Real transfer size on load |
| Fallback measure | HTTP GET of HTML + linked assets | Faster/cheaper when headless is heavy |
| Emissions fallback | Green Web Foundation CO2.js | Same Sustainable Web Design model if `/data` flakes |
| DB | SQLite/Turso or Postgres | Cache results by URL hash + timestamp |
| Hosting | Fly.io / Docker (preferred) or Vercel + worker | Playwright is easier on a container than on pure serverless |

**Open decision:** deploy on **Fly/Docker** (Playwright-friendly) vs **Vercel + separate browser worker**.

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

### 3. Grid carbon intensity

Pick one for MVP:

- **UK Carbon Intensity** — good for GB context  
  https://carbon-intensity.github.io/api-definitions/
- **GWF IP → CO₂ intensity** — broader default (preferred for global URLs)

### 4. Geo / DNS

Resolve host → IP → intensity lookup. Keep this as a footnote, not the primary score driver in v1.

---

## Core modules

| Module | Responsibility |
|--------|----------------|
| `urlGuard` | Allow only `http(s)`; block private, link-local, metadata IPs (SSRF) |
| `measureBytes(url)` | Headless navigate; sum transfer sizes; ~20s timeout; concurrency cap |
| `checkGreen(hostname)` | Greencheck wrapper + short cache |
| `scoreEmissions(bytes, green)` | Website Carbon `/data` + CO2.js fallback |
| `gridContext(ip|region)` | Intensity + dirty/average/clean label |
| `suggestFixes(bytes, resources)` | Heuristics: large images, many third parties, compression signals |
| `resultsStore` | Persist `{ id, url, bytes, green, gco2e, rating, grid, fixes, createdAt }` |

---

## API surface (v1)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/analyze` body `{ url }` | Run pipeline; return full result |
| `GET /api/results/:id` | Cached / share result |
| `GET /badge/:id.svg` | Embeddable grade badge |

If Playwright is slow: accept ≤25s blocking for MVP, or return `pending` + poll.

---

## UI screens

1. **Home** — brand + URL field + CTA (single composition; no dashboard clutter in the first viewport)
2. **Result** — letter grade as hero signal; gCO₂e; bytes; green host; grid footnote; fixes; share + embed snippet
3. **Badge docs** — how to embed the SVG

Visual direction: earthy / forest energy; avoid generic purple SaaS. Grade is the dominant signal.

---

## Build phases

| Phase | Deliverable |
|-------|-------------|
| **0** | Repo, Next.js, URL guard, mock scorer so UI works |
| **1** | Greencheck + Website Carbon `/data` (manual or mock bytes) |
| **2** | Playwright byte measurement + resource breakdown |
| **3** | Grid intensity footnote + fixes heuristics |
| **4** | Persist results, share URLs, SVG badge |
| **5** | Rate limits, caching, hardening, basic analytics |

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `/site` URL API gone | Own measurement — non-negotiable |
| Playwright cost / cold starts | Cache by URL 24h; optional lightweight “fast mode” crawl |
| SSRF | Strict URL + IP validation before fetch |
| Flaky third parties | CO2.js fallback; label partial results as estimated |
| Sites blocking bots | Detect failure; optional advanced “manual bytes” mode |

---

## Security notes (MVP)

- Validate and normalize URLs before any network I/O
- Resolve DNS and reject non-public destinations
- Timeouts and size caps on measurement
- Rate-limit `/api/analyze` by IP
- Do not follow arbitrary redirects to internal hosts

---

## Attribution

Cite data providers in the product UI/footer where required:

- [Website Carbon](https://www.websitecarbon.com/)
- [The Green Web Foundation](https://www.thegreenwebfoundation.org/)
- Carbon intensity source chosen for MVP (UK National Grid ESO and/or GWF)

---

## Next implementation step

Scaffold Next.js and complete **Phase 0–1**: URL guard, greencheck integration, Website Carbon `/data` with measured or mock bytes, and a working result UI.
