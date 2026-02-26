

## New Blog Post: Advanced SEO Implementation Guide

### Overview
Insert a comprehensive, SEO-optimized blog post into the `blog_posts` table via a Supabase migration. The post will cover advanced SEO, AEO, GEO, and E-E-A-T strategies for 2026 -- effectively documenting the exact techniques we've implemented on this platform, positioned as an authoritative guide.

### Post Metadata
- **Title**: "Advanced SEO in 2026: The Complete Guide to BlogPosting Schema, AEO, and E-E-A-T Optimization"
- **Slug**: `advanced-seo-implementation-guide-2026`
- **Category**: "SEO & Technology"
- **Tags**: `['SEO', 'AEO', 'E-E-A-T', 'structured data', 'schema markup', 'BlogPosting', 'voice search', 'GEO', 'rich results', 'technical SEO']`
- **Description**: "A comprehensive guide to implementing advanced SEO strategies in 2026, including BlogPosting schema, Answer Engine Optimization (AEO), Generative Engine Optimization (GEO), and E-E-A-T best practices for maximum search visibility."

### Content Outline (~8,000-10,000 characters of HTML)
The post will cover these H2/H3 sections (enabling automatic TOC generation):

1. **Why Traditional SEO Isn't Enough in 2026** -- The shift from 10 blue links to AI-generated answers
2. **Understanding the Modern Search Ecosystem**
   - Search engines (Google, Bing)
   - Answer engines (Perplexity, ChatGPT, Gemini)
   - Voice assistants (Alexa, Siri, Google Assistant)
3. **BlogPosting Schema: Beyond Basic Article Markup**
   - Why BlogPosting beats generic Article type
   - Required vs recommended properties
   - Speakable specification for AEO
4. **E-E-A-T: Building Author Entity Authority**
   - Dedicated author pages with Person schema
   - Social proof via sameAs links
   - Author bios and credentials
5. **Answer Engine Optimization (AEO)**
   - FAQ schema for featured snippets
   - Speakable markup for voice assistants
   - Concise, question-answer content patterns
6. **Generative Engine Optimization (GEO)**
   - How LLMs select sources for citations
   - Structured data as machine-readable context
   - RSS/Atom feeds for AI crawlers
7. **Technical Implementation Checklist**
   - A practical checklist with code examples
8. **Measuring SEO Success in 2026**
   - Rich result impressions, AI citations, voice query share

### FAQ Section (FAQPage schema)
The post will include 5 FAQ entries stored in the `faqs` JSONB column:
1. What is the difference between SEO and AEO?
2. Why should I use BlogPosting instead of Article schema?
3. What is E-E-A-T and why does it matter?
4. How does Generative Engine Optimization work?
5. What is the speakable specification?

### HowTo Steps
The `howto_steps` JSONB column will contain a 6-step "How to Implement Advanced SEO" guide for HowTo rich results.

### Blog Image
The post will use a default blog image (no custom hero image needed initially -- falls back to the existing default via `getBlogPlaceholderImage`). A custom OG image mapping can be added later.

### Technical Implementation
- **1 new file**: `supabase/migrations/[timestamp]_add_advanced_seo_blog_post.sql`
  - INSERT into `blog_posts` with full HTML content, FAQs, and HowTo steps
  - Sets `published = true` and `published_at = now()`
- **1 file modified**: `src/utils/blogImageUtils.ts`
  - Add the new slug to `BLOG_OG_IMAGE_MAP` with a default OG fallback

No other code changes are needed -- the existing blog infrastructure (TOC auto-generation, FAQ accordion, HowTo schema, BlogPosting schema, DOMPurify sanitization) will automatically render everything correctly.

