

## Industry Showcase Modal -- Advisory & Implementation Plan

### Concept

Replace the old single-purpose Founders Pass popup with a **"Platform Showcase" modal** that highlights Apply AI's multi-industry capabilities. This serves as both a lead-generation tool and a trust signal, showing visitors that the platform is purpose-built for their specific vertical.

### UX Design Approach

**Trigger Strategy:**
- Timed trigger (e.g., 8-10 seconds after landing page load, once per session)
- Optional exit-intent trigger on desktop
- Stored in `sessionStorage` so it only fires once per visit

**Modal Layout (Desktop = Dialog, Mobile = Drawer via ResponsiveModal):**

```text
+--------------------------------------------------+
|  [X]                                             |
|                                                   |
|  "Built for Your Industry"                        |
|  One platform, purpose-built for how you hire.    |
|                                                   |
|  +----------+  +----------+  +----------+         |
|  | [Truck]  |  |[Heart]   |  | [Shield] |         |
|  | Transport|  | Health   |  | Cyber    |         |
|  |          |  |          |  |          |         |
|  +----------+  +----------+  +----------+         |
|  +----------+  +----------+                       |
|  | [Wrench] |  |[Building]|                       |
|  | Trades   |  | General  |                       |
|  +----------+  +----------+                       |
|                                                   |
|  --- Selected detail panel ---                    |
|  Transportation                                   |
|  CDL-focused job boards, Tenstreet integration,   |
|  AI voice screening for drivers                   |
|                                                   |
|  [Explore Transportation] [Book a Demo]           |
+--------------------------------------------------+
```

**Interaction Flow:**
1. Modal opens with animated entrance (Framer Motion `fadeUp`)
2. Industry cards are clickable -- selecting one reveals a detail panel below with key features, terminology badges, and a tailored CTA
3. Default selection: Transportation (primary vertical)
4. Two CTAs: "Explore [Industry]" navigates to relevant content; "Book a Demo" links to contact/demo page

### Technical Implementation

**New Files:**
- `src/features/landing/components/IndustryShowcaseModal.tsx` -- Main modal component
- `src/features/landing/hooks/useShowcaseModal.ts` -- Trigger logic (timer + sessionStorage guard)

**Reuses Existing:**
- `ResponsiveModal` from `src/components/ui/responsive-modal.tsx` (Dialog on desktop, Drawer on mobile)
- `INDUSTRY_VERTICAL_OPTIONS` and `INDUSTRY_TEMPLATES` from the config (already has icons, descriptions, features, AI context)
- `IndustryVertical` type system
- Framer Motion for animations (already a dependency)
- Lucide icons already mapped (`Truck`, `HeartPulse`, `Shield`, `Wrench`, `Building`)

**Integration Point:**
- Render `IndustryShowcaseModal` inside `LandingPage.tsx` with a `Suspense` boundary
- The hook manages open state, so the modal auto-triggers based on timer/session logic

**Key Differences from Old Founders Pass Popup:**
| Aspect | Old Popup | New Modal |
|--------|-----------|-----------|
| Purpose | Single promo (pricing) | Platform capability showcase |
| Content | Static copy | Dynamic, interactive industry cards |
| Engagement | Passive read | Click-to-explore with detail panel |
| Responsiveness | Unknown (deleted) | Drawer on mobile via ResponsiveModal |
| Trigger | Unknown | Timed + session-guarded |
| Data source | Hardcoded | Driven by `industryTemplates.config` |

### Considerations

- **Performance**: Lazy-load the modal component so it doesn't block initial page render
- **Accessibility**: Focus trap, ESC to close, proper ARIA labels on industry cards
- **Analytics**: Track which industry card users click to inform sales outreach
- **Dismissal UX**: "Don't show again" option stored in localStorage for repeat visitors
- **Future extensibility**: The same modal pattern could be reused on feature pages or triggered by specific UTM parameters to show the relevant industry pre-selected
