

# Hero Background Image Distribution Plan

## Overview

The 5 uploaded images will be distributed across key public-facing pages to enhance visual appeal while maintaining thematic alignment. Each image will be stored in `src/assets/hero/` and integrated as background images with appropriate overlays for text contrast.

---

## Image-to-Page Mapping

| Image | Theme | Target Page | Rationale |
|-------|-------|-------------|-----------|
| Microphone + Sound Waves | Voice/AI Technology | **Landing Page** (HeroSection.tsx) | Core platform value proposition is AI Voice Apply |
| Social Media Network | Connectivity/Multi-platform | **Features Page** | Social Beacon is the flagship feature |
| Digital Truck + Circuits | Transportation/Technology | **Companies Page** (ClientsHero.tsx) | Employers focus on transportation industry |
| Financial Charts | ROI/Business Value | **Demo Page** | Demo shows business value and platform capabilities |
| Shield + Checkmark | Trust/Security/Compliance | **Contact Page** | Trust signal for prospects reaching out |

---

## Implementation Details

### Phase 1: Asset Organization

Create a new directory structure for hero backgrounds:

```text
src/assets/hero/
  voice-hero.png        (Microphone image)
  social-hero.png       (Social network image)
  transport-hero.png    (Digital truck image)
  roi-hero.png          (Financial charts image)
  trust-hero.png        (Shield image)
```

### Phase 2: Create Reusable HeroBackground Component

Build a shared component for consistent hero styling across all pages:

```text
src/components/shared/HeroBackground.tsx
```

Component features:
- Accepts image source as prop
- Provides consistent overlay variants (dark, gradient, light)
- Handles responsive behavior (object-cover, object-position)
- Ensures WCAG contrast for overlaid text
- Supports optional blur and opacity controls

### Phase 3: Page Updates

**1. Landing Page (src/features/landing/components/sections/HeroSection.tsx)**
- Import `voice-hero.png` as background
- Add dark gradient overlay (60-70% opacity)
- Preserve existing animated gradient blobs on top of image

**2. Features Page (src/pages/public/FeaturesPage.tsx)**
- Import `social-hero.png` as background
- Apply gradient overlay from bottom for text readability
- Update hero section (lines 73-102)

**3. Companies Page (src/components/public/clients/ClientsHero.tsx)**
- Import `transport-hero.png` as background
- Add overlay ensuring "Companies Hiring Now" text remains readable
- Maintain search bar positioning

**4. Demo Page (src/pages/public/DemoPage.tsx)**
- Import `roi-hero.png` as background
- Update hero section (lines 129-155)
- Apply appropriate overlay for demo badge and headings

**5. Contact Page (src/pages/public/ContactPage.tsx)**
- Import `trust-hero.png` as background
- Update hero section (lines 231-249)
- Maintain form visibility with gradient fade

---

## Technical Approach

### HeroBackground Component Props

```text
interface HeroBackgroundProps {
  imageSrc: string;
  imageAlt: string;
  overlayVariant?: 'dark' | 'gradient' | 'light';
  overlayOpacity?: number;
  children: React.ReactNode;
  className?: string;
}
```

### Overlay Variants

- **dark**: Solid dark overlay (for light-on-dark text)
- **gradient**: Gradient from bottom (for bottom-positioned content)
- **light**: Light overlay (for dark-on-light text)

### CSS Approach

Each hero section will use:
```text
- position: relative (container)
- position: absolute, inset-0 (image layer)
- object-cover, object-center (image sizing)
- z-index layering (image -> overlay -> content)
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/assets/hero/voice-hero.png` | Landing page background |
| `src/assets/hero/social-hero.png` | Features page background |
| `src/assets/hero/transport-hero.png` | Companies page background |
| `src/assets/hero/roi-hero.png` | Demo page background |
| `src/assets/hero/trust-hero.png` | Contact page background |
| `src/components/shared/HeroBackground.tsx` | Reusable hero component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/features/landing/components/sections/HeroSection.tsx` | Add voice-hero background |
| `src/pages/public/FeaturesPage.tsx` | Add social-hero background |
| `src/components/public/clients/ClientsHero.tsx` | Add transport-hero background |
| `src/pages/public/DemoPage.tsx` | Add roi-hero background |
| `src/pages/public/ContactPage.tsx` | Add trust-hero background |
| `src/components/shared/index.ts` | Export HeroBackground |

---

## Accessibility Considerations

- All images include descriptive `alt` text
- Overlays maintain WCAG AA contrast ratio (4.5:1) for text
- Images marked as decorative where appropriate (aria-hidden)
- Animations respect prefers-reduced-motion

