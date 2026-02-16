
# Enhance Founders Pass Modal CTA

## Changes

Upgrade the bottom CTA section of the popup modal to be more visually compelling and conversion-focused:

1. **Primary CTA Button**: Add a pulsing glow effect, an arrow icon (ArrowRight), and a gradient background to draw attention.
2. **Urgency line**: Add the `foundersPassContent.urgency` text above the button as a small urgency nudge.
3. **Secondary CTA**: Replace plain "Maybe later" with a styled link to the "Talk to Us" contact page (using `foundersPassContent.cta.secondary` / `secondaryPath`), keeping a subtle "Maybe later" dismiss below it.
4. **Footer trust line**: Add the `foundersPassContent.footer` ("No contracts - Cancel anytime - GDPR compliant") at the very bottom for trust reinforcement.

## Technical Details

### Modified File: `src/features/landing/components/FoundersPassPopup.tsx`

- Import `ArrowRight` from `lucide-react`
- Replace the Actions section (lines 112-123) with:
  - Urgency text from `foundersPassContent.urgency`
  - Primary button with `ArrowRight` icon, animated glow via Tailwind `animate-pulse` shadow, and gradient styling
  - A secondary "Talk to Us" link button navigating to `foundersPassContent.cta.secondaryPath`
  - Subtle "Maybe later" dismiss text
  - Trust footer text from `foundersPassContent.footer`
