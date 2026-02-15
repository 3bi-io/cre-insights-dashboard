

## Founders Pass Landing Page

A new public page at `/founders-pass` presenting the limited-time, performance-based pricing offer. This page is purely informational and conversion-focused — no billing logic, just a clear breakdown and CTA to sign up.

### Page Structure

**1. Hero Banner**
- "Founders Pass" headline with a "Limited Time" badge
- Tagline: "Pay only when it works. $0 to start."
- Primary CTA: "Claim Your Founders Pass" (links to `/auth?plan=founders`)
- Secondary CTA: "Talk to Us" (links to `/contact?subject=founders-pass`)

**2. Pricing Breakdown (3-column card layout)**

| Service | Cost | Description |
|---------|------|-------------|
| Per Apply | $1 | Every application received on your jobs |
| ATS Delivery | $1 | Comprehensive workflow delivery to your internal ATS |
| Voice Agent (Optional) | $1 | AI outbound follow-up and fulfillment calls |

- Footer note: "All in, $3 per apply for the best end-to-end solution available today."
- Explicit callout: applies are billed per submission, not filtered by qualification criteria, since what counts as "qualified" varies by client and role.

**3. What's Included (zero-cost onboarding section)**
- Free signup
- Free onboarding
- Bring your own publishers/vendors — ATS.me supports inbound and outbound traffic from any third-party source
- No marketing spend required (optional marketing services available)
- No contracts, cancel anytime

**4. How It Works (3-step visual)**
1. Sign up free and onboard your company
2. Post your jobs — they go live across your chosen channels
3. Pay $1-$3 per apply as candidates come in

**5. CTA Footer**
- Urgency messaging: "Founders Pass is a limited-time offer for early adopters"
- Final CTA button

### Technical Details

**New files:**
- `src/pages/public/FoundersPassPage.tsx` — page component following existing public page patterns (SEO component, StructuredData, motion animations)
- `src/features/landing/content/foundersPass.content.ts` — all copy/content centralized

**Modified files:**
- `src/components/routing/AppRoutes.tsx` — add `/founders-pass` route under PublicLayout
- `src/config/publicNavigationConfig.ts` — optionally add nav link (or keep it unlisted, accessible by direct URL only)
- `src/features/landing/components/sections/CTASection.tsx` — update CTA text from "Start Free Trial" to reference Founders Pass; update footer copy to remove "No contracts" placeholder stats
- `src/features/landing/content/cta.content.ts` — update stats and CTA labels to reflect Founders Pass pricing
- `src/features/landing/content/hero.content.ts` — remove the `socialProof.companies: "Trusted by 50+ companies"` fake claim (already removed from UI but still in content file)
- `src/utils/sitemapGenerator.ts` — add `/founders-pass` entry

**No database or edge function changes.** This is a frontend-only, content-driven page. Usage-based billing metering would be a separate future task.
