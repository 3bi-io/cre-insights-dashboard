

# Refactor "Seamless Integrations" Section

## Current Issues

1. **No entrance animations** -- every other landing section uses Framer Motion `fadeUp` transitions; this section pops in statically
2. **No category icons** -- section headers are plain text while the rest of the landing page uses icon-driven cards (via `IconFeatureCard`)
3. **Cards lack visual depth** -- no hover gradient accent or border highlight like other sections
4. **Duplicate file exists** -- `src/components/landing/IntegrationsSection.tsx` is an unused copy of the same component with hardcoded content (violates DRY)
5. **Missing section badge** -- other sections (Features, Trust) use a `Badge` chip above the header for visual consistency
6. **No aria-label** on the wrapping section element

## Changes

### 1. `src/features/landing/components/sections/IntegrationsSection.tsx`

- Add staggered Framer Motion entrance animations on cards (matching FeaturesSection pattern: `initial={{ opacity: 0, y: 20 }}`, `whileInView`, stagger delay)
- Add a category icon per card using relevant Lucide icons (e.g., `Building2` for ATS, `Search` for Job Boards, `ShieldCheck` for Background Checks, `Calendar` for Calendar, `MessageSquare` for Communication, `BarChart3` for Analytics)
- Add subtle hover border accent (`hover:border-primary/30`) and a top gradient stripe for visual polish
- Add a `Badge` above the section header for consistency with other sections
- Wrap the section in an `id` and pass `aria-label` for accessibility
- Convert footer CTA link into an inline `Link` with icon (matching FeaturesSection's "Explore all features" pattern)

### 2. `src/features/landing/content/integrations.content.ts`

- Add a `badge` field (e.g., "100+ Integrations")
- Add an `icon` field (Lucide icon) to the `IntegrationCategory` type usage, importing the icons here to keep the component clean

### 3. `src/features/landing/content/types.ts`

- Extend `IntegrationCategory` to include an optional `icon: LucideIcon` field

### 4. `src/components/landing/IntegrationsSection.tsx`

- **Delete** this duplicate file -- it is unused (the landing page imports from `src/features/landing/`)

## Summary

| File | Action |
|------|--------|
| `src/features/landing/components/sections/IntegrationsSection.tsx` | Refactor with animations, icons, hover effects, badge, accessibility |
| `src/features/landing/content/integrations.content.ts` | Add badge text and category icons |
| `src/features/landing/content/types.ts` | Add optional `icon` to `IntegrationCategory` |
| `src/components/landing/IntegrationsSection.tsx` | Delete (unused duplicate) |

