
# Add Depth Perception and Subtle Animations to Homepage Hero

## Overview

Enhance the homepage hero section with cinematic depth effects and subtle animations for each slideshow image, creating a more immersive and engaging first impression.

## Current State

The HeroBackground component currently:
- Displays 4 rotating images (voiceHero, cyberHero, tradesHero, healthcareHero)
- Uses simple opacity crossfade transitions (1 second)
- Has static overlays for text readability
- Content is static with no entrance animations

## Enhancement Strategy

We'll add three layers of visual enhancements:

1. **Ken Burns Effect** - Subtle zoom/pan animations on each background image
2. **Parallax Depth Layers** - Multiple overlay layers moving at different speeds
3. **Content Entrance Animations** - Staggered Framer Motion animations for text elements

---

## Technical Implementation

### 1. Ken Burns Effect on Background Images

Add a subtle scale and position animation to each slide as it becomes active:

```text
┌─────────────────────────────────────────┐
│  Image starts at scale(1.05)            │
│  Slowly zooms to scale(1.15) over 6s    │
│  Slight pan from center to edge         │
│  Creates cinematic "breathing" effect   │
└─────────────────────────────────────────┘
```

**Implementation:**
- Add CSS keyframe animations for zoom effect
- Each slide gets a unique animation direction (zoom-in, zoom-out, pan-left, pan-right)
- Animation runs only while slide is active
- Use `will-change: transform` for GPU acceleration

### 2. Parallax Depth Layers

Add floating gradient orbs and subtle particle effects that create depth:

```text
┌─────────────────────────────────────────┐
│  Layer 0: Background image (Ken Burns) │
│  Layer 1: Floating gradient orbs       │
│  Layer 2: Overlay gradients            │
│  Layer 3: Subtle particle dust         │
│  Layer 4: Content (highest z-index)    │
└─────────────────────────────────────────┘
```

**Implementation:**
- Add 2-3 floating gradient circles with slow drift animation
- Use `blur-3xl` for soft glow effect
- Animate with CSS transforms (translateX, translateY)
- Opacity pulse on 8-10 second cycle

### 3. Content Entrance Animations

Use Framer Motion for staggered content reveal:

| Element | Animation | Delay |
|---------|-----------|-------|
| Badge | Fade up + scale | 0.1s |
| Headline | Fade up | 0.2s |
| Industry tags | Stagger fade up | 0.3s-0.5s |
| Subheadline | Fade up | 0.5s |
| Company count | Fade up + scale | 0.6s |
| CTA buttons | Fade up | 0.7s |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/shared/HeroBackground.tsx` | Add Ken Burns keyframes, parallax layers, floating orbs |
| `src/features/landing/components/sections/HeroSection.tsx` | Add Framer Motion entrance animations to content |
| `tailwind.config.ts` | Add new keyframe animations for Ken Burns and float effects |

---

## Detailed Changes

### HeroBackground.tsx Enhancements

**New Props:**
```typescript
interface HeroBackgroundProps {
  // ... existing props
  enableKenBurns?: boolean;     // Enable zoom/pan effect (default: true for slideshow)
  enableParallaxOrbs?: boolean; // Enable floating depth elements (default: true)
}
```

**Ken Burns Keyframes:**
```css
@keyframes ken-burns-zoom-in {
  0% { transform: scale(1.0); }
  100% { transform: scale(1.08); }
}

@keyframes ken-burns-zoom-out {
  0% { transform: scale(1.08); }
  100% { transform: scale(1.0); }
}

@keyframes ken-burns-pan-left {
  0% { transform: scale(1.05) translateX(0%); }
  100% { transform: scale(1.05) translateX(-2%); }
}

@keyframes ken-burns-pan-right {
  0% { transform: scale(1.05) translateX(0%); }
  100% { transform: scale(1.05) translateX(2%); }
}
```

**Floating Orb Depth Elements:**
```tsx
{/* Parallax floating orbs for depth */}
<div className="absolute top-1/4 right-1/4 w-96 h-96 
  bg-primary/10 rounded-full blur-3xl 
  animate-float-slow pointer-events-none" 
/>
<div className="absolute bottom-1/3 left-1/5 w-64 h-64 
  bg-accent/10 rounded-full blur-3xl 
  animate-float-slower pointer-events-none" 
/>
```

### HeroSection.tsx Animations

**Import Framer Motion:**
```typescript
import { motion } from 'framer-motion';
```

**Stagger Container:**
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};
```

**Animated Content Wrapper:**
```tsx
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  className="relative z-10 max-w-5xl mx-auto..."
>
  <motion.span variants={itemVariants}>
    {/* Badge */}
  </motion.span>
  <motion.h1 variants={itemVariants}>
    {/* Headline */}
  </motion.h1>
  {/* etc. */}
</motion.div>
```

### Tailwind Config Additions

```typescript
keyframes: {
  // Ken Burns effects
  'ken-burns-zoom-in': {
    '0%': { transform: 'scale(1.0)' },
    '100%': { transform: 'scale(1.08)' }
  },
  'ken-burns-zoom-out': {
    '0%': { transform: 'scale(1.08)' },
    '100%': { transform: 'scale(1.0)' }
  },
  // Floating depth elements
  'float-slow': {
    '0%, 100%': { transform: 'translateY(0) translateX(0)' },
    '50%': { transform: 'translateY(-20px) translateX(10px)' }
  },
  'float-slower': {
    '0%, 100%': { transform: 'translateY(0) translateX(0)' },
    '50%': { transform: 'translateY(15px) translateX(-15px)' }
  }
},
animation: {
  'ken-burns-in': 'ken-burns-zoom-in 6s ease-out forwards',
  'ken-burns-out': 'ken-burns-zoom-out 6s ease-out forwards',
  'float-slow': 'float-slow 12s ease-in-out infinite',
  'float-slower': 'float-slower 15s ease-in-out infinite'
}
```

---

## Visual Result

The enhanced hero will feature:

- **Ken Burns zoom** on each background image (matches 6s slideshow interval)
- **Soft floating orbs** that drift slowly, creating depth perception
- **Staggered content reveal** on initial load
- **Smooth crossfades** between slides with synchronized zoom effects
- **Performance optimized** with GPU-accelerated transforms and `will-change`

All animations respect `prefers-reduced-motion` via the `motion-safe:` Tailwind prefix.
