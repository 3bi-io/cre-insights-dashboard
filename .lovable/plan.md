

# Founders Pass Popup Modal for Landing Page

## Overview
Create a timed popup modal on the homepage (`/`) that promotes the Founders Pass offer. The modal appears after a short delay, is dismissible, and remembers if the user has already seen/dismissed it (via localStorage) so it doesn't annoy repeat visitors.

## Behavior
- Appears **5 seconds** after the landing page loads
- Dismissible via close button or clicking outside
- Once dismissed, a localStorage flag (`founders-pass-popup-dismissed`) prevents it from showing again for **7 days**
- Includes a primary CTA ("Claim Your Founders Pass") linking to `/founders-pass` and a secondary dismiss option
- Uses existing Radix Dialog component for accessibility

## Design
- Gradient accent header with the "Limited Time Offer" badge
- Headline: "Founders Pass"
- Tagline: "Pay only when it works. $0 to start."
- Three compact pricing pills ($1 Per Apply, $1 ATS Delivery, $1 Voice Agent)
- Key bullet points from the included benefits
- Primary CTA button + "Maybe later" dismiss link
- Framer Motion entrance animation (scale + fade)

---

## Technical Details

### New File: `src/features/landing/components/FoundersPassPopup.tsx`
- Uses `Dialog` from `@/components/ui/dialog`
- Uses `framer-motion` for entrance animation
- Uses `useNavigate` for CTA navigation
- Reads/writes `localStorage` key `founders-pass-popup-dismissed` with a timestamp
- `useEffect` with `setTimeout(5000)` to trigger open state
- Content sourced from `foundersPassContent` in `foundersPass.content.ts`

### Modified File: `src/pages/public/LandingPage.tsx`
- Import and render `<FoundersPassPopup />` inside the `<main>` element
- No lazy loading needed since it's a lightweight dialog component with its own delay logic

