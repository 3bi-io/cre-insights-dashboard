

## Blog SEO/AEO/GEO/E-E-A-T Optimization Plan

### Current State Assessment

**What's working well:**
- Article JSON-LD structured data on each post
- Breadcrumb navigation with schema markup
- Author bio section (E-E-A-T)
- Social share buttons (X, LinkedIn, Facebook, Email)
- Reading time, published/modified dates, categories, tags
- OG/Twitter meta tags with route-aware images
- Newsletter CTA on blog index
- Related posts component

**What's missing or needs improvement:**

### 1. Blog Index Page - Missing Structured Data

The blog index (`/blog`) has NO structured data at all -- no `CollectionPage`, `ItemList`, or `Blog` schema. Search engines and AI answer engines need this to understand the page as a content hub.

**Fix:** Add `CollectionPage` + `ItemList` schema listing all posts with position, URL, name, and image.

---

### 2. Article Schema is Too Basic

The current `buildArticleSchema` outputs a minimal `Article` type. For maximum E-E-A-T and AEO visibility:

- Change `@type` from `Article` to `BlogPosting` (more specific, preferred by Google)
- Add `wordCount`, `articleSection` (category), `keywords` (tags)
- Add `mainEntityOfPage` pointing to the canonical URL
- Expand `author` to include `url`, `jobTitle`, `sameAs` (social links) -- critical for E-E-A-T author entity signals
- Add `isPartOf` referencing the blog as a `Blog` entity
- Add `speakable` property for voice search / AEO optimization

---

### 3. Missing FAQ Schema on Posts

Posts with Q&A-style content (common in recruitment content) should auto-detect or allow manual FAQ sections that render `FAQPage` schema. This is the single highest-impact rich result for AEO/GEO -- AI engines pull FAQ answers directly.

**Fix:** Add an optional `faqs` JSON field to `blog_posts` table and render both visual FAQ accordion and `FAQPage` schema when present.

---

### 4. No Table of Contents (TOC)

Long-form posts (8,000-15,000 chars) lack a TOC. A TOC:
- Improves dwell time and UX
- Creates jump links that Google can surface as sitelinks
- Helps AI engines parse document structure for featured snippets

**Fix:** Auto-generate TOC from H2/H3 headings in post content with anchor links.

---

### 5. No `HowTo` Schema Integration

Several posts are procedural/guide content. The `buildHowToSchema` utility exists but is never used on blog posts.

**Fix:** Add optional `howto_steps` JSON field to blog posts and render `HowTo` schema when present.

---

### 6. Author Pages Missing (Critical E-E-A-T Gap)

Google's E-E-A-T guidelines emphasize author entity verification. Currently:
- Author bios exist but are inline-only
- No dedicated author pages (`/blog/author/{name}`)
- No `Person` schema with `sameAs` links to LinkedIn/social profiles

**Fix:** Create an `/blog/author/:id` page with author bio, credentials, social links, and a list of their posts. Link from each post's author byline.

---

### 7. No "Last Updated" Display

Posts show `datePublished` but not `dateModified`. Showing "Last updated: X" signals freshness to both users and search engines -- a key ranking factor for YMYL/advice content.

**Fix:** Display "Updated: {date}" when `updated_at` differs from `published_at`.

---

### 8. Content Rendering Security

Posts use `dangerouslySetInnerHTML` without sanitization. While content comes from an admin CMS, this should use DOMPurify (already installed) for defense-in-depth.

**Fix:** Sanitize HTML through DOMPurify before rendering.

---

### 9. Missing Blog RSS/Atom Feed

No RSS feed exists. RSS feeds:
- Are crawled by AI engines (Perplexity, ChatGPT browse mode)
- Feed aggregators and newsletters
- Signal content freshness

**Fix:** Create an edge function at `/functions/v1/blog-rss` that generates an Atom/RSS feed from published posts. Add `<link rel="alternate" type="application/rss+xml">` to the blog pages.

---

### 10. No `SpeakableSpecification` for AEO

Google's Speakable specification tells voice assistants which parts of a page to read aloud. This is the frontier of AEO.

**Fix:** Add `speakable` property to the Article schema targeting the title, description, and first paragraph.

---

### Implementation Priority (by SEO impact)

| Priority | Change | Impact |
|----------|--------|--------|
| 1 | Upgrade Article to BlogPosting schema with full E-E-A-T fields | High - rich results + AI citation |
| 2 | Add CollectionPage/ItemList schema to blog index | High - content hub signal |
| 3 | Add FAQ schema support (field + rendering) | High - featured snippets + AEO |
| 4 | Auto-generate Table of Contents | Medium - UX + sitelinks |
| 5 | DOMPurify sanitization | Medium - security |
| 6 | Show "Last Updated" date | Medium - freshness signal |
| 7 | Author pages with Person schema | Medium - E-E-A-T entity |
| 8 | Blog RSS feed edge function | Medium - AI crawlability |
| 9 | Speakable specification | Low - future AEO |
| 10 | HowTo schema integration | Low - conditional on content |

---

### Technical Changes

**Database:**
- Add `faqs` (jsonb, nullable) column to `blog_posts` for FAQ entries
- Add `howto_steps` (jsonb, nullable) column to `blog_posts` for HowTo data

**Files to modify:**
- `src/components/StructuredData.tsx` -- upgrade `buildArticleSchema` to `BlogPosting`, add `buildBlogIndexSchema`, add speakable
- `src/pages/public/BlogPage.tsx` -- add CollectionPage structured data, RSS link
- `src/pages/public/BlogPostPage.tsx` -- add TOC generation, FAQ section, DOMPurify, updated date, enhanced schema
- `src/components/blog/BlogTableOfContents.tsx` -- new component
- `src/components/blog/BlogFAQSection.tsx` -- new component with accordion + FAQ schema
- `src/components/blog/index.ts` -- export new components

**New files:**
- `src/pages/public/BlogAuthorPage.tsx` -- author page with Person schema
- `supabase/functions/blog-rss/index.ts` -- RSS feed edge function

