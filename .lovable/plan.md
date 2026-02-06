
# Hero Section Visual Enhancement Implementation

## Overview

Transform the homepage hero section into a high-impact, conversion-focused experience with improved visual hierarchy, entrance animations, enhanced background visibility, prominent CTAs, and modern social proof featuring real company logos.

---

## Key Changes Summary

| Area | Current State | Enhanced State |
|------|---------------|----------------|
| Headline | `text-7xl` max | `text-8xl` desktop with entrance animation |
| How It Works | In-hero cards | Moved to separate section below fold |
| Background | 65% dark overlay | 50% gradient overlay revealing more image |
| CTA Buttons | Standard styling | Glow effect + enhanced prominence |
| Social Proof | Generic stars | Company logos carousel + testimonial snippet |

---

## Phase 1: Move How It Works Below Fold

**File:** `src/features/landing/components/sections/HeroSection.tsx`

- Remove the "How It Works" cards (lines 97-166) from the hero section
- This focuses the hero on a single, powerful message
- The HowItWorksSection already exists as a standalone component that can be added to the page

**File:** `src/pages/public/LandingPage.tsx`

- Import and add `HowItWorksSection` after `StatsSection`
- Use lazy loading with Suspense for performance

---

## Phase 2: Enhanced Headline with Entrance Animations

**File:** `src/features/landing/components/sections/HeroSection.tsx`

Add framer-motion entrance animations:

```text
- Badge: fade-in-up, 0.3s delay
- Headline: fade-in-up, 0.5s delay  
- Subheadline: fade-in-up, 0.7s delay
- CTAs: fade-in-up, 0.9s delay
- Social proof: fade-in-up, 1.1s delay
```

Increase headline typography:
- Mobile: `text-4xl` (currently `text-3xl`)
- Tablet: `text-6xl` (currently `text-5xl`)
- Desktop: `text-8xl` (currently `text-7xl`)

---

## Phase 3: Reduce Background Overlay

**File:** `src/features/landing/components/sections/HeroSection.tsx`

Update HeroBackground props:
- Change `overlayOpacity={65}` to `overlayOpacity={50}`
- Switch from `overlayVariant="dark"` to `overlayVariant="gradient"` for a fade effect that reveals more of the voice-hero image at the top

---

## Phase 4: Enhanced CTA Buttons with Glow Effect

**File:** `src/features/landing/components/sections/HeroSection.tsx`

Primary CTA (Jobseekers Browse Here):
- Add gradient background: `bg-gradient-to-r from-primary to-accent`
- Add glow shadow: `shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]`
- Add hover glow intensification
- Increase padding and font size for more prominence

Secondary CTA (Employers Start Here):
- Keep outline variant but enhance border
- Add subtle glow on hover

---

## Phase 5: Company Logos Social Proof

**File:** `src/features/landing/content/hero.content.ts`

Add company logo references:
```text
socialProof: {
  ...existing,
  logos: [
    { name: 'CR England', src: '/logos/cr-england.jpeg' },
    { name: 'Danny Herman', src: '/logos/danny-herman.png' },
    { name: 'Day & Ross', src: '/logos/day-and-ross.jpeg' },
    { name: 'Novco', src: '/logos/novco.png' }
  ],
  testimonial: {
    quote: 'Callbacks in under 3 minutes',
    author: 'Pilot Partner'
  }
}
```

**File:** `src/features/landing/components/sections/HeroSection.tsx`

Replace star rating with:
1. Horizontal logo strip with grayscale filter, hover to color
2. "Trusted by 50+ companies" text badge
3. Featured testimonial snippet with quote icon

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/features/landing/components/sections/HeroSection.tsx` | Major refactor with animations, reduced overlay, enhanced CTAs, logo social proof |
| `src/features/landing/content/hero.content.ts` | Add logo references and testimonial data |
| `src/pages/public/LandingPage.tsx` | Add HowItWorksSection import after StatsSection |
| `public/logos/` (copy files) | Copy 4 company logos to public folder for accessibility |

---

## Animation Specifications

Using framer-motion with staggered entrance:

```text
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};
```

---

## Accessibility Considerations

- All animations respect `prefers-reduced-motion`
- Company logos include proper alt text
- CTA glow effects maintain WCAG contrast ratios
- Reduced overlay still ensures 4.5:1 text contrast with `text-foreground`

---

## Expected Visual Result

1. **First impression**: Clean, focused hero with dramatic headline animation
2. **Background**: Voice-hero image more visible, creating modern tech aesthetic  
3. **CTAs**: Eye-catching with gradient glow, clear primary action hierarchy
4. **Social proof**: Professional company logos establish instant credibility
5. **Below fold**: How It Works section maintains engagement after scroll
