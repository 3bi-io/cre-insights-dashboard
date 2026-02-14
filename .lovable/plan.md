

## Fix WeldingSparks Visibility and Positioning

### Problem
The welding sparks are nearly invisible on the trades hero slide. From the live screenshot, the particles (1.5-3px) with `radial-gradient(circle, currentColor 40%, transparent 70%)` backgrounds are too small and too transparent to see against the dark hero overlay. The source positions also need recalibration based on the actual image.

### Root Causes
1. **Particle size too small**: 1.5-3px particles with gradient fade are effectively invisible
2. **Gradient background kills visibility**: `radial-gradient` fading to transparent makes tiny dots disappear
3. **Source positions slightly off**: The arc points in the image are lower than the current 82%/88% coordinates
4. **Glow indicators too small**: 16-24px glows are lost under the dark overlay

### Fix Summary

**Recalibrate source positions** to match actual torch arc points visible in the image:
- Left welder arc: move from `15%, 82%` to `4%, 91%` (closer to left edge, lower)
- Right welder arc: move from `78%, 88%` to `76%, 93%` (slightly left, lower)

**Increase particle sizes** from 1.5-3px to 4-8px so they are actually visible against the dark background.

**Replace invisible gradient backgrounds** with solid `backgroundColor` on each spark dot, keeping the color classes for variety but making particles opaque enough to see.

**Increase glow indicator sizes** from 16-24px to 30-40px with brighter radial gradients so the welding source points glow convincingly through the overlay.

**Increase spark travel distance** (`dx`/`dy` multipliers) so particles spray further and are visible longer before fading out.

### Technical Details

**File: `src/components/shared/WeldingSparks.tsx`**

| Change | Before | After |
|--------|--------|-------|
| Left source position (desktop) | `x: '15%', y: '82%'` | `x: '4%', y: '91%'` |
| Right source position (desktop) | `x: '78%', y: '88%'` | `x: '76%', y: '93%'` |
| Left source position (mobile) | `x: '12%', y: '80%'` | `x: '2%', y: '89%'` |
| Right source position (mobile) | `x: '82%', y: '86%'` | `x: '78%', y: '91%'` |
| Particle base sizes | 1.5, 2, 3 | 4, 6, 8 |
| Spark background | `radial-gradient(currentColor 40%, transparent 70%)` | Solid `backgroundColor` using bright spark colors |
| Travel distance multiplier | `40 + (i%7)*15` dx, `30 + (i%5)*12` dy | `60 + (i%7)*20` dx, `50 + (i%5)*18` dy |
| Glow indicator size (desktop) | 20px, 24px | 36px, 40px |
| Glow indicator size (mobile) | 16px, 18px | 28px, 32px |
| Glow brightness | `rgba(180,220,255,0.8)` | `rgba(200,230,255,0.95)` with wider spread |

**File: `src/index.css`** -- no changes needed (keyframes are fine)

### Files Changed
| File | Change |
|------|--------|
| `src/components/shared/WeldingSparks.tsx` | Recalibrate positions, increase sizes, fix backgrounds, enlarge glows |

