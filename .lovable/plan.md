

# Replace Landing Page Hero with Interactive Map

## Summary
Remove the current image-slideshow hero section and replace it with an embedded interactive job map as the homepage hero. This makes the landing page immediately functional — visitors see real job locations on first load instead of a static marketing banner.

## Design

The map hero will be a contained section (roughly 70vh on desktop, 50vh on mobile) with an overlay containing the headline, CTAs, and trust signals. Below it, the existing landing page sections continue as normal.

```text
┌──────────────────────────────────────────┐
│  Header (sticky)                         │
├──────────────────────────────────────────┤
│                                          │
│   Interactive Map (background)           │
│   ┌────────────────────────────┐         │
│   │  Badge pill                │         │
│   │  "Interview Everyone"     │         │
│   │  Subheadline              │         │
│   │  [Search Jobs] [Book Demo]│         │
│   │  Trust pills              │         │
│   └────────────────────────────┘         │
│                                          │
├──────────────────────────────────────────┤
│  Client Logo Marquee                     │
│  How It Works                            │
│  ... rest of landing sections ...        │
└──────────────────────────────────────────┘
```

The map renders in a non-interactive (visual-only) mode behind the hero content — no filters, no controls, no AI panel. It serves as a dynamic, data-driven backdrop showing real job clusters across the US. A subtle dark gradient overlay ensures text readability.

## Files to Modify

| File | Changes |
|---|---|
| `src/features/landing/components/sections/HeroSection.tsx` | **Rewrite**: Replace `HeroBackground` + slideshow with an embedded `JobMap` component in visual-only mode. Keep the animated headline, CTAs, and trust signals as an absolute overlay. Map container set to `h-[70vh]` desktop / `h-[50vh]` mobile. Add dark gradient overlay for text contrast. |
| `src/components/map/JobMap.tsx` | **Minor**: Add a `interactive` prop (default `true`). When `false`, disable scroll zoom, drag, click events, zoom controls, and clustering popups — map becomes a pure visual backdrop. |
| `src/pages/public/LandingPage.tsx` | No structural changes — `HeroSection` import stays the same. |
| `src/features/landing/content/hero.content.ts` | No changes needed. |

## Implementation Details

### HeroSection rewrite
- Import `JobMap` (lazy) and `useJobMapData` with no filters to get all locations
- Wrap in `MapProvider` since `JobMap` needs map context
- Render `JobMap` with `interactive={false}` as background, absolutely positioned
- Overlay: reuse existing Framer Motion animations, headline, CTAs, trust pills
- Gradient overlay: `bg-gradient-to-b from-black/60 via-black/40 to-black/60`
- Remove all slideshow image imports (`voiceHero`, `cyberHero`, etc.), `HeroBackground`, and `WeldingSparks`

### JobMap `interactive` prop
- When `interactive={false}`: set `dragging={false}`, `scrollWheelZoom={false}`, `zoomControl={false}`, `doubleClickZoom={false}`, `touchZoom={false}`, `attributionControl={false}`
- Hide `MapZoomControls` when not interactive
- Disable marker click handlers (markers still render for visual effect)
- Keep clustering for visual density

### Performance
- The map data hook already has 5-minute stale time and daily refresh — no extra fetching needed
- `JobMap` is already lazy-loaded, so the hero will show a loading state briefly then reveal the map

