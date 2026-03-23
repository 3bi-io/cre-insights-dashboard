

# Update All "ats.me" / "ats-me" References to "Apply AI" / "applyai.jobs"

## Overview
38 files contain legacy branding. Changes are grouped by type and risk level.

---

## Group 1: Environment Config (1 file)

### `.env.example`
- `VITE_APP_NAME=ATS.me` → `Apply AI`
- `VITE_APP_URL=https://ats.me` → `https://applyai.jobs`
- `VITE_SUPPORT_EMAIL=support@ats.me` → `support@applyai.jobs`

---

## Group 2: Database — Logo URLs (new migration)

Three past migrations set `logo_url` to `https://ats-me.lovable.app/logos/...`. The data in the `clients` table currently points to the old domain. We need a **new migration** to update the live data:

```sql
UPDATE clients SET logo_url = REPLACE(logo_url, 'https://ats-me.lovable.app', 'https://applyai.jobs') WHERE logo_url LIKE '%ats-me.lovable.app%';
```

Old migration files are left as-is (they're historical records).

---

## Group 3: Blog Post Content (new migration)

The blog post `why-ats-me-will-thrive-2026` has "ATS.me" throughout its title, description, and HTML content in the database. A new migration will update the live `blog_posts` row:

```sql
UPDATE blog_posts 
SET title = REPLACE(title, 'ATS.me', 'Apply AI'),
    description = REPLACE(description, 'ATS.me', 'Apply AI'),
    content = REPLACE(content, 'ATS.me', 'Apply AI'),
    content = REPLACE(content, 'ats.me', 'applyai.jobs')
WHERE slug = 'why-ats-me-will-thrive-2026';
```

The slug itself stays unchanged to preserve SEO URLs.

---

## Group 4: Markdown Documentation (8 files)

Find-and-replace across all `.md` files. Key changes:

| File | Changes |
|------|---------|
| `README.md` | Brand name, `cd ats-me` → `cd apply-ai`, directory tree, GitHub URLs |
| `CONTRIBUTING.md` | Repo URLs, `dev@ats.me` → `dev@applyai.jobs`, Discord link |
| `TROUBLESHOOTING.md` | Support emails, Discord, forum URL |
| `ADMIN_GUIDE.md` | `admin-support@ats.me` → `admin-support@applyai.jobs` |
| `USER_GUIDE.md` | `support@ats.me` → `support@applyai.jobs` |
| `DEPLOYMENT.md` | Brand name, docker commands |
| `PRODUCTION_DEPLOYMENT.md` | Brand name |
| `PRODUCTION_DEPLOYMENT_CHECKLIST.md` | Brand name |
| `PRODUCTION_ENVIRONMENT_GUIDE.md` | Brand name |
| `PRODUCTION_READY.md` | Support email |
| `PHASE_7_COMPLETE.md` | PWA manifest references |
| `PHASE_11_COMPLETE.md` | App name |
| `PHASE_12_COMPLETE.md` | AI assistant prompt |
| `docs/LOGO_OPTIMIZATION.md` | Fallback name references |

---

## Group 5: Source Code — Blog Image Utils (no change)

`src/utils/blogImageUtils.ts` — The slug `why-ats-me-will-thrive-2026`, asset filename `ats-me-thrive-hero.jpg`, and OG image path `og-blog-ats-me-thrive.png` are all tied to actual files on disk and published URLs. **No change** to avoid breaking image loading and blog routing.

---

## Group 6: Capacitor Config (no change)

`capacitor.config.json` — The `appName: "intel-ats"` and Lovable project URL are auto-generated. No `ats.me` reference present.

---

## Summary

| Category | Files | Action |
|----------|-------|--------|
| `.env.example` | 1 | Update brand/URLs |
| New DB migration (logos) | 1 | Update `clients.logo_url` |
| New DB migration (blog) | 1 | Update blog post text |
| Markdown docs | ~14 | Replace brand/emails/URLs |
| Blog image utils | 1 | Skip (preserves routing) |
| Old migration SQL files | 3 | Skip (historical records) |

