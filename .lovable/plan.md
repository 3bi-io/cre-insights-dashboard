

## Comprehensive Hero Animation Optimization -- Trades & Trucking

### Problem Statement
The current WeldingSparks and TruckWheelSpin animations were built functional-first but lack mobile optimization, GPU acceleration, responsive sizing, and accessibility polish. Both use fixed pixel sizes that don't scale across devices, create unnecessary DOM elements on mobile, and miss opportunities for compositor-only animations.

### Optimization Strategy

All changes follow a **mobile-first, performance-first** philosophy:
- Animate only `transform` and `opacity` (compositor-only, GPU-accelerated)
- Reduce particle count on mobile to preserve battery and frame rate
- Scale all overlay sizes responsively using viewport-relative units
- Respect `prefers-reduced-motion` at the component level (not just CSS)
- Add `will-change: transform` only where actively animating
- Use `contain: strict` on overlay containers for paint isolation

---

### 1. WeldingSparks -- Trades Hero Optimization

**Current issues:**
- 28 particles rendered on all devices (excessive on mobile)
- Fixed pixel sizes (3px, 2px, 1.5px) don't scale with viewport
- `box-shadow` on every particle triggers paint on every frame
- No responsive source-point adjustment for different aspect ratios
- Glow points use `animate-pulse` (layout-triggering on some browsers)

**Refactored approach:**

| Aspect | Before | After |
|--------|--------|-------|
| Particle count | 28 always | 12 on mobile, 28 on desktop (via `useIsMobile`) |
| Sizing | Fixed px | `clamp()` or vw-based scaling |
| Glow effect | `box-shadow` per particle | Single radial-gradient glow at source only |
| Source positions | Fixed % | Responsive positions adjusted for mobile crop |
| GPU hints | None | `will-change: transform; contain: layout style` |
| Reduced motion | CSS-only fallback | Component returns static glow only (no particles) |

**Key changes to `WeldingSparks.tsx`:**
- Import `useIsMobile` hook to conditionally reduce particle count
- Remove per-particle `box-shadow`; use `background: radial-gradient(...)` for the particle dot itself (paint-free)
- Add responsive source positions: on mobile, the image crops differently so torch positions shift
- Wrap particle generation in `useMemo` for stable references
- Add `useReducedMotion` check: if true, render only the static glow indicators (no animated sparks)
- Scale particle size with `Math.max(size, window.innerWidth * 0.005)` pattern

**CSS changes in `index.css`:**
- Update `spark-fly` keyframe to use only `transform` and `opacity` (already correct)
- Add `will-change: transform, opacity` to spark container class

---

### 2. TruckWheelSpin -- Trucking Hero Optimization

**Current issues:**
- Fixed 48px wheel size doesn't scale (invisible on 4K, too large on small phones)
- `conic-gradient` repaints on rotation (not compositor-only)
- Road blur uses `translateX` on a full-width element (expensive)
- Ground shadow uses `filter: blur(3px)` which triggers paint per frame
- No mobile position adjustment for different image crops

**Refactored approach:**

| Aspect | Before | After |
|--------|--------|-------|
| Wheel size | 48px fixed | `clamp(28px, 4vw, 64px)` responsive |
| Rotation target | Entire gradient div | Rotate a container with `transform: rotate()` only |
| Road blur | Full-width translateX | Narrower strip with opacity pulse instead |
| Ground shadow | `filter: blur()` per frame | Static pre-blurred shadow (no animation) |
| Positions | Fixed 25%/65% | Responsive: adjusted left positions on mobile |
| Reduced motion | CSS `motion-safe` only | Component-level check returns null |

**Key changes to `TruckWheelSpin.tsx`:**
- Make `Wheel` component accept responsive `size` via `clamp()` CSS value instead of fixed number
- Restructure wheel layers: outer container rotates (transform-only), inner gradients are static children
- This moves the conic-gradient paint to initial render only; subsequent frames only animate `transform: rotate()`
- Replace road-blur `translateX` with a simpler opacity-based shimmer (compositor-only)
- Remove animated `filter: blur()` from ground shadow -- make it a static element
- Add `useIsMobile` for position fine-tuning
- Add `useReducedMotion` early return

**CSS changes in `index.css`:**
- `wheel-roll` keyframe stays the same (already transform-only)
- Replace `road-blur` translateX keyframe with opacity-based shimmer:
  ```css
  @keyframes road-shimmer {
    0%, 100% { opacity: 0.03; }
    50% { opacity: 0.08; }
  }
  ```

---

### 3. HeroBackground -- Container Optimization

**Changes to `HeroBackground.tsx`:**
- Add `contain: layout style` to the overlay content wrapper for paint isolation
- Ensure `overlayContent` div has explicit `z-[3]` wrapper with `pointer-events-none` (currently relies on child components)
- Add `will-change: opacity` to image elements during slide transitions, remove after transition completes (avoid permanent `will-change`)

---

### 4. Shared Accessibility & Performance Utilities

**New: `useReducedMotion` hook** (small utility):
- Returns `true` if `prefers-reduced-motion: reduce` is active
- Used by both WeldingSparks and TruckWheelSpin to skip all animations at the component level
- More efficient than rendering 28 invisible particles with `animation-duration: 0.01ms`

---

### 5. Landing Page HeroSection Integration

**Changes to `HeroSection.tsx`:**
- Add TruckWheelSpin overlay for the transport slide (index 3 = healthcareHero currently, need to verify slide order)
- Currently only WeldingSparks activates on slide 2 (tradesHero); if transport-hero is added to the slideshow in the future, the wheel animation should activate on that slide
- No changes needed now since trucking is only on `/companies`, but the `overlayContent` pattern supports multiple conditional overlays

---

### 6. ClientsHero Mobile Optimization

**Changes to `ClientsHero.tsx`:**
- Pass `objectPosition="center 60%"` to HeroBackground so the truck (and wheels) remain visible on mobile crops
- This ensures wheel overlays stay aligned with the truck even when the image is cropped vertically on small screens

---

### Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/shared/WeldingSparks.tsx` | Refactor | Responsive particles, GPU optimization, reduced-motion support |
| `src/components/shared/TruckWheelSpin.tsx` | Refactor | Responsive sizing, compositor-only rotation, static shadows |
| `src/hooks/useReducedMotion.ts` | New | Shared hook for `prefers-reduced-motion` detection |
| `src/index.css` | Edit | Replace `road-blur` with `road-shimmer`, add GPU hints |
| `src/components/shared/HeroBackground.tsx` | Edit | Paint isolation on overlay container |
| `src/components/public/clients/ClientsHero.tsx` | Edit | Add `objectPosition` for mobile crop alignment |

### Performance Impact
- Mobile: ~60% fewer animated DOM nodes (28 to 12 sparks)
- All devices: Compositor-only animations (no paint/layout per frame)
- Battery: Reduced GPU workload from eliminating per-frame `box-shadow` and `filter: blur`
- Accessibility: Full `prefers-reduced-motion` compliance at component level

