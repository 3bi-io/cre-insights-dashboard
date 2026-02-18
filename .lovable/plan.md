
# FeaturesPage Refactor — Remove Social Beacon, Elevate Core AI Narrative

## What Is Being Changed and Why

The Social Beacon section currently occupies the top slot on `/features` — above everything else, including Voice Apply Technology, which is the platform's #1 differentiator. Social Beacon has its own dedicated product page and dashboard. Giving it prime position on the features page creates two problems:

1. It buries the platform's core AI stack (Voice Apply, Instant Callbacks, AI Voice Agents) below the fold
2. It duplicates content that already has a dedicated home, creating page bloat

The refactor removes the Social Beacon featured component, restructures the page around the AI voice stack, and elevates the overall UX to "best in class" standards.

---

## Section-by-Section Plan

### 1. Hero Section — Rewrite Copy

Current hero copy is generic: "Powerful Features for Modern Recruiting." This will be replaced with a hero that leads with the AI voice narrative — the specific, measurable differentiator.

New headline: **"The AI Recruitment Platform Built for Speed"**
New subline: **"Voice Apply. Instant Callbacks. 24/7 AI Agents."**

The hero badge and CTA will also be updated to reflect the core platform story.

### 2. Remove Social Beacon Section

The `<div id="social-beacon">` block containing `<FeaturedProductCard>` will be removed entirely. The `socialBeaconContent` import and the `FeaturedProductCard` import will also be removed since they are no longer used on this page.

### 3. Remove "Social Beacon" from Scroll-Spy Navigation

The `sections` array currently leads with `{ id: 'social-beacon', label: 'Social Beacon' }`. This entry will be removed. The updated nav will be:

```text
Core AI  →  Capabilities  →  Comparison  →  Integrations
```

### 4. Upgrade Core AI Features Section — Add Stats Bar

The alternating text/visual layout is good but the visual side (icon on gradient background) is a missed opportunity. A "quick wins" stats bar will be added above the features list to set the stage with hard numbers before users read the feature details:

- 80% faster applications (Voice Apply)
- < 3 min callback time (Instant Callbacks)
- 24/7 coverage (AI Voice Agents)

These are already in the `primaryFeatures[].features` bullet points — this surfaces them as headline metrics first.

### 5. Add a "Social Beacon" Entry to the Capabilities Grid (Not a Featured Block)

Social Beacon should not disappear from the page entirely — it's a real feature. Instead of a full hero-style section, it will become one `IconFeatureCard` entry in the Capabilities grid, in its correct priority position (after the core AI features). This keeps Social Beacon discoverable on `/features` without dominating above the AI voice stack.

The card will be inserted as item #5 in the secondary features grid (after Multi-Platform Distribution, Automated Workflows, AI Writing Assistant, and Team Collaboration) since Social Beacon is a distribution-class feature.

### 6. Update SEO and Structured Data

- `<SEO title>` updated to remove "Social Beacon" from the primary title slot: **"Features | Voice Apply, AI Callbacks & Smart Recruiting"**
- `<SEO description>` rewritten to lead with Voice Apply and AI Callbacks
- `softwareAppSchema` description updated to match

### 7. Update the Comparison Table Header

The section subtitle currently reads "See why leading companies are switching to AI-powered recruitment." This is a missed opportunity. It will be updated to: **"See what you get that traditional ATS platforms simply can't offer."** — more pointed and conversion-focused.

### 8. Final CTA Copy Update

The CTA gradient section currently says "Get started today and see how ATS.me can transform your hiring process with AI-powered social recruitment and voice automation." Now that Social Beacon is de-featured, this will be updated to lead with voice: **"Experience AI-powered voice recruitment, instant callbacks, and smart hiring automation — all in one platform."**

---

## Technical Changes

### File: `src/pages/public/FeaturesPage.tsx`

All changes are in this single file:

1. Remove `socialHero` asset import
2. Remove `socialBeaconContent` and `FeaturedProductCard` from the `@/features/landing` import
3. Remove the `social-beacon` entry from the `sections` array
4. Replace `HeroBackground` with a clean in-page hero div (Voice Apply narrative copy)
5. Delete the entire Social Beacon `<div id="social-beacon">` block
6. Add a 3-stat highlight bar above the Core AI features list
7. Add Social Beacon as an `IconFeatureCard` into `secondaryFeatures` display (inline, not via content file edit)
8. Update `<SEO>` title, description, and keywords
9. Update `softwareAppSchema` description
10. Update comparison table section subtitle
11. Update final CTA body copy

### File: `src/features/landing/content/features.content.ts`

Add Social Beacon as item #5 in `secondaryFeatures` array (between Team Collaboration and Communication Hub), using the `Globe` or `Sparkles` icon with "Social Beacon" as the title and a one-line description pointing to the platform capability.

---

## No Changes Needed

- `FeaturedProductCard` component — not deleted (used elsewhere or may be reused)
- `socialBeaconContent` content file — not deleted (used on other pages)
- Scroll-spy hook logic — unchanged
- Comparison table data and order — already correct from previous refactor
- All other sections (Capabilities grid, Comparison, Integrations, CTA) — structure unchanged, copy only lightly updated
