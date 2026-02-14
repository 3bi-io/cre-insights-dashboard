

## Rolling Truck Wheels Animation

### Overview
Create a `TruckWheelSpin` component that overlays animated spinning wheel elements on the transport-hero trucking image, giving the illusion that the truck is driving. This follows the same pattern as the `WeldingSparks` component -- a purely visual CSS overlay positioned to align with the truck wheels in the background image.

### Approach

The transport-hero image shows a truck. We will overlay circular elements at the wheel positions that continuously rotate, creating a realistic rolling effect. The animation will be subtle and steady to avoid looking cartoonish.

### Implementation Steps

**1. Create `src/components/shared/TruckWheelSpin.tsx`**
- New component following the `WeldingSparks` pattern (absolute positioned overlay, `pointer-events-none`, `aria-hidden`)
- Takes an `active` prop (always true on the Clients page, or conditional if added to a slideshow later)
- Renders 2-3 circular overlays positioned at each visible wheel location on the transport-hero image
- Each wheel overlay will be a semi-transparent circle with radial spoke/tread marks that rotate via CSS animation
- Includes a subtle motion blur haze near the ground/tires for road movement feel

**2. Add CSS keyframes to `src/index.css`**
- `@keyframes wheel-roll` -- continuous 360-degree rotation at a steady speed (~3 seconds per revolution)
- `@keyframes road-blur` -- subtle horizontal shimmer near ground level to sell the movement illusion

**3. Integrate into `ClientsHero.tsx`**
- Import `TruckWheelSpin` and render it via the `overlayContent` prop on `HeroBackground`
- Always active since the Clients page only has one static background image

### Wheel Overlay Design
Each wheel will consist of:
- An outer ring with a dark tire-colored border and slight radial tread pattern (created via CSS `conic-gradient`)
- A rotating inner element with spoke lines (also via CSS gradients) to make the spin visible
- Slight shadow beneath each wheel position for grounding
- A horizontal streaked blur strip near the bottom edge of the image to simulate road movement

### Technical Details

```text
+----------------------------------------------+
|            transport-hero.png                 |
|                                               |
|      [truck body]                             |
|                                               |
|    (wheel-1)              (wheel-2)           |
|     ~25%, 88%              ~65%, 88%          |
|                                               |
|  ~~~ road blur strip across bottom ~~~        |
+----------------------------------------------+
```

- Wheel positions will be calibrated from the actual image (approximate: left wheel at 25%/88%, right wheel at 65%/88%)
- Rotation speed: `animation: wheel-roll 2.5s linear infinite` for steady, realistic RPM
- The tread pattern uses a repeating `conic-gradient` so that rotation is clearly visible even through the overlay
- Motion-safe media query respected: `motion-safe:animate-...`

### Files Changed
| File | Change |
|------|--------|
| `src/components/shared/TruckWheelSpin.tsx` | New component |
| `src/index.css` | Add `wheel-roll` and `road-blur` keyframes |
| `src/components/public/clients/ClientsHero.tsx` | Add `overlayContent` prop with `TruckWheelSpin` |
| `src/components/shared/index.ts` | Export new component |

