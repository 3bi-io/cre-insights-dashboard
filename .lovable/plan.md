

# Refactor "Trusted by Industry Leaders" Logo Marquee

## Current Issues

Based on the screenshot and code review:

1. **Logos are nearly invisible** -- `opacity-60` combined with `grayscale` makes logos look washed out and hard to see
2. **Logos are too small** -- fixed at `h-12 w-32` (mobile) / `h-14 w-40` (desktop), which is tiny for brand recognition
3. **Fade edges mismatch** -- gradient fades use `from-background` but the section background is `bg-muted/20`, creating a visible mismatch
4. **No visual polish** -- the section feels sparse with minimal spacing and no subtle design accents
5. **Animation speed** -- 30s for a small set of logos may feel too slow or leave visible gaps

## Changes

### File: `src/features/landing/components/shared/ClientLogoMarquee.tsx`

**Visual improvements:**
- Increase logo container size to `h-16 w-40` / `h-20 w-48` for better visibility
- Raise default opacity from `0.6` to `0.7` so logos are clearly visible in grayscale
- Triple the array (instead of double) to eliminate any gaps during scroll
- Match fade-edge gradient to the section's actual background (`from-muted/20` or use a wrapper approach)
- Add `will-change-transform` to the scrolling container for smoother GPU-accelerated animation

**Structural cleanup:**
- Adjust animation duration dynamically based on client count for consistent scroll speed
- Add `aria-label` to the section for accessibility

### File: `src/index.css`

- No changes needed -- the existing `@keyframes marquee` and `.animate-marquee` class are correct

## Summary of Visual Result

- Logos will be larger, clearly visible, and smoothly scrolling
- Grayscale effect retained but at higher opacity so brands are recognizable
- Hover still reveals full color at 100% opacity
- Fade edges will blend seamlessly with the section background

