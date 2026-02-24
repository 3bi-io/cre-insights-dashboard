

## Firecrawl Web Scraper Tool for Admin Dashboard

### Overview
Add a new admin page at `/admin/web-scraper` that lets admins paste any URL and extract job listings or company information using the Firecrawl API. The tool will support three modes: **Job Extraction** (structured job data), **Company Info** (branding and metadata), and **Raw Scrape** (markdown content).

### Architecture

```text
+------------------+       +-------------------+       +-----------------+
| Admin Dashboard  | ----> | Supabase Edge Fns | ----> | Firecrawl API   |
| (React Page)     |       | firecrawl-scrape  |       | v1/scrape       |
|                  |       | firecrawl-search  |       | v1/search       |
| /admin/scraper   |       | firecrawl-map     |       | v1/map          |
+------------------+       +-------------------+       +-----------------+
```

### What Gets Built

**1. Firecrawl API Client** (`src/lib/api/firecrawl.ts`)
- Typed wrapper around `supabase.functions.invoke()` for scrape, search, and map operations
- Handles error responses consistently

**2. Four Supabase Edge Functions**
- `firecrawl-scrape/index.ts` -- Single URL scrape with format options
- `firecrawl-search/index.ts` -- Web search with optional content scraping
- `firecrawl-map/index.ts` -- URL discovery/sitemap generation
- `firecrawl-crawl/index.ts` -- Multi-page crawl

All use `FIRECRAWL_API_KEY` from environment. Each configured with `verify_jwt = false` in `config.toml` (auth handled in-app via role guard).

**3. Admin Page** (`src/pages/admin/WebScraperPage.tsx`)
- Uses `AdminPageLayout` with `requiredRole={['admin', 'super_admin']}`
- Tabbed interface with three modes:
  - **Job Extractor**: Paste a URL, extracts structured job data using Firecrawl's JSON extraction with a job-listing schema (title, company, location, pay, requirements)
  - **Company Info**: Extracts branding (logo, colors, fonts) using the `branding` format -- useful for client onboarding
  - **URL Explorer**: Uses the `map` endpoint to discover all pages on a site, filterable by keyword (e.g., "careers", "jobs")
- Results displayed in cards/tables with copy-to-clipboard and export options

**4. Route Registration** (`src/components/routing/AppRoutes.tsx`)
- Add lazy import and route at `/admin/web-scraper`

**5. Navigation Entry** (`src/components/CommandPalette.tsx`)
- Add "Web Scraper" to command palette for discoverability

### Technical Details

- **Edge functions**: Follow existing CORS pattern from the project's shared utilities
- **Job extraction schema** uses Firecrawl's `{ type: 'json', schema: {...} }` format to return structured data like:
  ```text
  { title, company, location, pay_range, job_type, requirements[], apply_url }
  ```
- **Branding extraction** uses `formats: ['branding']` to pull logo URLs, color palettes, and typography -- directly useful for auto-configuring new clients
- **URL mapping** helps admins discover career pages on carrier websites before scraping

### Files to Create
| File | Purpose |
|------|---------|
| `src/lib/api/firecrawl.ts` | Frontend API client |
| `supabase/functions/firecrawl-scrape/index.ts` | Scrape edge function |
| `supabase/functions/firecrawl-search/index.ts` | Search edge function |
| `supabase/functions/firecrawl-map/index.ts` | Map edge function |
| `supabase/functions/firecrawl-crawl/index.ts` | Crawl edge function |
| `src/pages/admin/WebScraperPage.tsx` | Main admin page |

### Files to Modify
| File | Change |
|------|--------|
| `supabase/config.toml` | Add `verify_jwt = false` for all 4 Firecrawl functions |
| `src/components/routing/AppRoutes.tsx` | Add lazy import + route for `/admin/web-scraper` |
| `src/components/CommandPalette.tsx` | Add Web Scraper entry |

