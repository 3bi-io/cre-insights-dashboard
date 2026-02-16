

# Refactor Founders Pass Popup -- Best-in-Class, Every Visit, Mobile-First

## What Changes

### 1. Show on Every Visit (Remove localStorage Persistence)
The current modal checks `localStorage` and hides for 7 days after dismissal. This will be **completely removed** so the modal opens on every homepage visit, for every user, on every device. The 5-second delay will be kept to avoid interrupting the initial page load experience.

### 2. Mobile-First Layout Refinements
- Reduce horizontal padding from `px-6` to `px-4` on small screens (`sm:px-6` for larger)
- Set `max-w-[92vw] sm:max-w-md` on DialogContent so the modal never overflows on narrow screens
- Make pricing pills stack vertically on small screens (`flex-col sm:flex-row`) so they don't wrap awkwardly
- Increase CTA button touch target size for mobile
- Ensure proper safe-area bottom padding (`pb-[env(safe-area-inset-bottom)]`) for devices with gesture bars

### 3. Visual Polish
- Smoother entrance animation: slide-up + fade instead of scale, with a subtle spring curve
- Add a subtle backdrop blur to the overlay for a premium feel
- Slightly larger header text on desktop (`sm:text-3xl`)
- Improve spacing and rhythm between sections for better scannability

## Behavior Confirmation
- The modal **will open on every homepage visit** -- no persistence, no cookies, no localStorage checks
- Works identically on mobile, tablet, and desktop
- Dismissible via close button, clicking outside, or "Maybe later"
- Dismissing only closes it for the current session (component state only)

---

## Technical Details

### Modified File: `src/features/landing/components/FoundersPassPopup.tsx`

**Removals:**
- Delete `STORAGE_KEY`, `DISMISS_DURATION_MS` constants
- Delete `isDismissed()` function
- Remove `localStorage` read in `useEffect` (the `if (isDismissed()) return` guard)
- Remove `localStorage.setItem` call in `handleDismiss`

**Updates:**
- `handleDismiss` simply calls `setOpen(false)`
- `useEffect` unconditionally sets the 5-second timer
- `DialogContent` class: `max-w-[92vw] sm:max-w-md` for mobile safety
- Header/body padding: `px-4 sm:px-6`
- Pricing pills container: `flex-col sm:flex-row`
- Motion animation: change from `scale: 0.95` to `y: 24, opacity: 0` for a slide-up entrance
- Add `pb-[env(safe-area-inset-bottom)]` to the bottom actions area
- CTA button: add `text-base py-3` for a larger mobile touch target

No new files needed. No changes to content file or LandingPage.tsx.

