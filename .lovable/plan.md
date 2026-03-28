

# Replace All `ats.me` / `ATS.me` with `applyai.jobs` / `Apply AI`

## Current State

- **Source code**: Already clean. No `ats.me` references remain in `.ts`, `.tsx`, `.md`, or config files.
- **Database content**: Blog posts and profile data still contain `ATS.me` brand references and `ats.me` domain references from old migrations.
- **`apply_url` values**: Some job listings may still have `https://ats.me/apply?...` URLs from migration `20260206000753`.
- **Old migrations**: Historical SQL files -- these are immutable records and will NOT be edited.

## Plan

### Step 1: New migration to replace all remaining database content

Create a single migration that performs:

1. **Blog post content** -- Replace `ATS.me` with `Apply AI` and `ats.me` with `applyai.jobs` across all blog posts:
   ```sql
   UPDATE blog_posts
   SET content = REPLACE(REPLACE(content, 'ATS.me', 'Apply AI'), 'ats.me', 'applyai.jobs'),
       title = REPLACE(title, 'ATS.me', 'Apply AI'),
       description = REPLACE(description, 'ATS.me', 'Apply AI');
   ```

2. **Author profile** -- Update Cody Forbes' bio and title:
   ```sql
   UPDATE profiles
   SET author_bio = REPLACE(author_bio, 'ATS.me', 'Apply AI'),
       author_title = REPLACE(author_title, 'ATS.me', 'Apply AI')
   WHERE author_bio LIKE '%ATS.me%' OR author_title LIKE '%ATS.me%';
   ```

3. **Job listing apply URLs** -- Replace any lingering `ats.me` domain in apply URLs:
   ```sql
   UPDATE job_listings
   SET apply_url = REPLACE(apply_url, 'ats.me', 'applyai.jobs')
   WHERE apply_url LIKE '%ats.me%';
   ```

### What stays unchanged

- **Blog slugs** (`why-ats-me-will-thrive-2026`) -- preserved for SEO link continuity
- **Image asset filenames** (`ats-me-thrive-hero.jpg`) -- preserved to match slugs
- **`blogImageUtils.ts`** slug mappings -- preserved to match database slugs
- **Old migration files** -- immutable historical records

### Result

After this single migration, all live database content will reference `Apply AI` / `applyai.jobs` instead of `ATS.me` / `ats.me`.

