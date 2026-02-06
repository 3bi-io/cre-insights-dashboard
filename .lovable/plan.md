
# Hero Background Image Implementation Plan

## Overview
This plan implements best-in-class hero background images for 6 key pages, using the uploaded images with proper responsive loading, overlay gradients for text readability, and performance optimization.

## Image Mapping

| Page | Route | Image File | Target Location |
|------|-------|------------|-----------------|
| 1. Homepage | `/` | hm.jpeg | `src/assets/heroes/hero-home.jpeg` |
| 2. Companies | `/clients` | jobs.jpeg | `src/assets/heroes/hero-companies.jpeg` |
| 3. Features | `/features` | fr.jpeg | `src/assets/heroes/hero-features.jpeg` |
| 4. Resources | `/resources` | kb.jpeg | `src/assets/heroes/hero-resources.jpeg` |
| 5. Blog | `/blog` | blog.jpeg | `src/assets/heroes/hero-blog.jpeg` |
| 6. Contact | `/contact` | touch.png | `src/assets/heroes/hero-contact.png` |

## Implementation Details

### Phase 1: Asset Organization
Create `src/assets/heroes/` directory and copy all 6 uploaded images with semantic naming.

### Phase 2: Reusable HeroBackground Component
Create a shared component at `src/components/shared/HeroBackground.tsx` with:

```text
+--------------------------------------------------+
|  HeroBackground Component                        |
|  ------------------------------------------------|
|  Props:                                          |
|  - imageSrc: string (imported image)             |
|  - overlayVariant: 'dark' | 'gradient' | 'light' |
|  - className?: string                            |
|  - children: ReactNode                           |
+--------------------------------------------------+
```

**Features:**
- Lazy loading with `loading="lazy"`
- `object-cover` for responsive scaling
- Multiple overlay variants for different image brightness levels
- CSS `will-change: transform` for GPU-accelerated rendering
- Fallback gradient background during image load

**Overlay Variants:**
- `dark`: Strong overlay for bright images (Homepage, Companies)
- `gradient`: Gradient fade from top for balanced images (Features, Contact)
- `light`: Subtle overlay for darker images (Blog, Resources)

### Phase 3: Page-by-Page Updates

#### 1. Homepage (`HeroSection.tsx`)
- Replace animated CSS gradient blobs with hero-home.jpeg background
- Add dark overlay with gradient fade at bottom
- Maintain existing badge, headline, CTA buttons, and workflow cards
- Keep floating pulse effects for subtle motion

#### 2. Companies Page (`ClientsHero.tsx`)
- Replace CSS gradient background with hero-companies.jpeg
- Apply gradient overlay ensuring search input remains readable
- Maintain existing search functionality

#### 3. Features Page (`FeaturesPage.tsx`)
- Replace hero section gradient with hero-features.jpeg
- Use gradient overlay variant for professional appearance
- Keep badge, heading, subheading, and CTA button

#### 4. Resources Page (`ResourcesPage.tsx`)
- Add new hero section with hero-resources.jpeg (currently has no visual hero)
- Include the existing badge, title, and description inside the hero
- Apply light overlay for the darker cityscape image

#### 5. Blog Page (`BlogPage.tsx`)
- Replace gradient hero with hero-blog.jpeg background
- Use light overlay for the warm cityscape colors
- Maintain badge, heading, and description

#### 6. Contact Page (`ContactPage.tsx`)
- Replace gradient hero with hero-contact.png
- Use gradient overlay for the mixed dark/light composition
- Keep existing heading and subheading

### Technical Specifications

**Image Import Pattern:**
```tsx
import heroImage from '@/assets/heroes/hero-home.jpeg';
```

**Overlay CSS Classes:**
```text
Dark:     bg-black/50 + bg-gradient-to-b from-black/40 via-black/20 to-transparent
Gradient: bg-gradient-to-b from-black/60 via-black/30 to-background
Light:    bg-black/30 + bg-gradient-to-t from-background via-transparent to-black/20
```

**Responsive Behavior:**
- Full viewport width on all breakpoints
- `min-h-[50vh]` on mobile, `min-h-[60vh]` on desktop (adjustable per page)
- Text remains readable with `relative z-10` positioning

## Files to Create
1. `src/assets/heroes/hero-home.jpeg`
2. `src/assets/heroes/hero-companies.jpeg`
3. `src/assets/heroes/hero-features.jpeg`
4. `src/assets/heroes/hero-resources.jpeg`
5. `src/assets/heroes/hero-blog.jpeg`
6. `src/assets/heroes/hero-contact.png`
7. `src/components/shared/HeroBackground.tsx`

## Files to Modify
1. `src/features/landing/components/sections/HeroSection.tsx` - Homepage hero
2. `src/components/public/clients/ClientsHero.tsx` - Companies hero
3. `src/pages/public/FeaturesPage.tsx` - Features hero section
4. `src/pages/public/ResourcesPage.tsx` - Add hero section wrapper
5. `src/pages/public/BlogPage.tsx` - Blog hero section
6. `src/pages/public/ContactPage.tsx` - Contact hero section
7. `src/components/shared/index.ts` - Export HeroBackground

## Performance Considerations
- Images loaded via ES6 imports for Vite optimization
- WebP conversion can be added later via build plugins
- Lazy loading prevents blocking initial paint
- GPU-accelerated positioning via `will-change`
- Proper `alt` attributes for accessibility

## Accessibility
- All hero images use `role="img"` with descriptive `aria-label`
- Text contrast ratios maintained via overlay opacity tuning
- Prefers-reduced-motion respected for any animated elements
