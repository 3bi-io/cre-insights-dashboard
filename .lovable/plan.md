

## Remove Hero Image Animation (Ken Burns Effect)

### Problem

The Ken Burns zoom/pan animation on the homepage hero slideshow is broken and needs to be removed entirely.

### Changes

#### 1. Default `enableKenBurns` to `false` in HeroBackground

**File:** `src/components/shared/HeroBackground.tsx`

- Change the default value of `enableKenBurns` from `true` to `false` (line 86)
- This ensures no hero across the site gets the animation unless explicitly opted in

#### 2. Remove `enableKenBurns` from the homepage HeroSection

**File:** `src/features/landing/components/sections/HeroSection.tsx`

- Remove the `enableKenBurns={true}` prop (line 102) so the homepage hero displays static images with simple crossfade transitions only

#### 3. Clean up Ken Burns animation definitions

**File:** `src/components/shared/HeroBackground.tsx`

- Remove the `kenBurnsVariants` array (lines 65-71)
- Remove the `kenBurnsClass` logic (lines 173-175)
- Remove the `kenBurnsClass` and `will-change-transform` from the image className (lines 192-193)
- Remove the `enableKenBurns` prop from the component interface and destructuring

**File:** `tailwind.config.ts`

- Remove the 4 `ken-burns-*` keyframe definitions (lines 236-252)
- Remove the 4 `ken-burns-*` animation definitions (lines 289-292)

### Result

All hero images will display as static backgrounds with smooth crossfade transitions for slideshows -- no zoom or pan effects. This is a clean removal with no functional side effects since no other component uses these animations.

