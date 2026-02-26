

## Refactor Industry Showcase Modal -- Mobile-First UX Fixes

### Issues Found

**Critical (Mobile):**
1. Only 3 of 5 industry cards visible on mobile (375px). "Skilled Trades" and "General" are completely hidden off-screen with no visual indicator that scrolling is possible.
2. No scroll affordance on the horizontal card row -- users have no idea more options exist.
3. Footer lacks `pb-[env(safe-area-inset-bottom)]` for modern Android/iOS gesture navigation.

**Minor (All Devices):**
4. Card minimum width (`min-w-[5.5rem]`) is too wide for 5 cards on small screens but too narrow to show labels comfortably -- needs optimization.
5. The `scrollbar-hide` class hides native scrollbar but provides no alternative affordance.

### Proposed Changes

**File: `src/features/landing/components/IndustryShowcaseModal.tsx`**

1. **Add scroll fade indicators on mobile** -- Add a gradient fade on the right edge of the industry card row to signal more content is available. Use a `::after` pseudo-element or a positioned gradient overlay div that fades out when scrolled to the end.

2. **Reduce card min-width for mobile** -- Change `min-w-[5.5rem]` to `min-w-[4.5rem]` so more cards are partially visible, hinting at scrollability. Reduce icon container from `h-10 w-10` to `h-8 w-8` on mobile.

3. **Add scroll dots/pagination indicator** -- Below the card row on mobile, add small dot indicators (5 dots, active one highlighted) to show there are more options. This is a standard mobile pattern for horizontal carousels.

4. **Safe area padding on footer** -- Add `pb-[env(safe-area-inset-bottom)]` to the footer section for mobile drawer to prevent overlap with gesture navigation bars.

5. **Improve mobile detail panel spacing** -- Reduce vertical padding in the detail panel on mobile (`p-3` instead of `p-5`) to fit more content above the fold.

6. **Stack detail panel columns on mobile** -- The grid already does `grid-cols-1 sm:grid-cols-2` which is correct, but ensure the "What's Included" badges wrap more compactly with smaller text on mobile.

**File: `src/components/ui/responsive-modal.tsx`**

7. **Add safe-area bottom padding to drawer footer path** -- Ensure the `ResponsiveModalFooter` mobile path includes safe-area inset padding.

### Technical Details

- The scroll fade overlay uses `pointer-events-none` so it doesn't block card taps
- Dot indicators track scroll position via an `onScroll` handler on the card container ref
- Card sizing uses responsive classes: `min-w-[4.5rem] sm:min-w-0` (mobile gets smaller min-width, desktop uses grid auto-sizing)
- Safe area padding uses the existing pattern from `DrawerContent`: `pb-[env(safe-area-inset-bottom)]`

### No Changes Needed
- `useShowcaseModal.ts` -- trigger logic is solid
- `industryTemplates.config.ts` -- data is fine
- Desktop and tablet views -- already working well

