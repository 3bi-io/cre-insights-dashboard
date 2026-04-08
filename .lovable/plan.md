

# Visual UX Upgrade + Display Mode System for /map

## Overview

Enhance the map page from functional to premium product quality by adding a user-facing Display Mode system (Standard / Density / Detail), upgrading the visual shell (header, stats, filters, controls), improving CARTO tile selection, and refining marker/cluster/popup styling — all without regressing existing features.

## What Already Works (preserved as-is)
- Confidence badges (exact/state/country), clustering, auto-fit bounds, exact-only toggle
- Filtered coverage stats, mobile map/list switcher, international marker distinction
- Search, company/category filters, heat map toggle, marker toggle, reset view

---

## Step 1: Display Mode System

**New file**: `src/components/map/DisplayModeSelector.tsx`

Create a segmented control with three modes:

| Mode | Behavior |
|------|----------|
| **Standard** | Current balanced default. No changes to clustering, markers, or popups. |
| **Density** | Tighter cluster radius (40→30), auto-enables heat map, quieter/smaller popups, reduces stat/filter chrome opacity. Optimized for "where are the jobs concentrated?" |
| **Detail** | Larger individual markers, richer popup content (salary, category, confidence badge inline), wider cluster spread radius, disables clustering at zoom ≥10. Optimized for "which specific jobs are here?" |

The mode is stored as state in `JobMapPage.tsx` and passed down. Existing heat-map and marker toggles remain but become subordinate — Density mode auto-enables heat map (user can still toggle it off manually).

**New type** added to `constants.ts`:
```typescript
export type DisplayMode = 'standard' | 'density' | 'detail';
```

## Step 2: CARTO Tile Upgrade

**File**: `src/components/map/constants.ts`

Add two additional tile variants for a cleaner look:

```text
LIGHT_NOLABELS: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
DARK_NOLABELS:  'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
VOYAGER:        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
```

- **Standard mode**: Use `voyager` (warm, readable, premium feel with subtle labels)
- **Density mode**: Use `light_nolabels` / `dark_nolabels` (minimal background, heat map pops)
- **Detail mode**: Use `light_all` / `dark_all` (full labels for street-level browsing)

All free CARTO CDN tiles — no API key required. Theme-aware (light/dark auto-switches).

## Step 3: Visual Shell Redesign

### Header Bar (new component in `JobMapPage.tsx`)
- Add a compact floating header strip at the top of the map (below navbar) showing:
  - "Job Locations Map" title with subtle text, not a heavy heading
  - Active filter pills (e.g., "Company: Admiral Merchants" as dismissible chips)
  - Result count: "847 jobs · 234 locations · 72% mapped"
- Glassmorphism card style: `bg-background/90 backdrop-blur-md border-border/50 shadow-sm`

### Stats Redesign (`MapStats.tsx`)
- Convert from a single row to compact **metric pills** integrated into the header strip
- Each pill: icon + number + label (e.g., `🟢 612 exact · 🟡 189 state · 🔵 46 country`)
- On mobile: collapse into a single summary pill that expands on tap (keep current pattern but style better)

### Filter Bar (`MapFilters.tsx`)
- Group search + filters into a single cohesive toolbar card
- Add the Display Mode selector inline on desktop (right-aligned in the filter bar)
- On mobile: display mode becomes a compact 3-segment pill below the search
- Clearer active states: filled background on active filters, not just border changes

### Layer Controls (`MapControls.tsx`)
- Merge heat map + marker toggles with display mode awareness
- In Density mode, heat map toggle shows as "on" with a subtle indicator
- Add a small label under each toggle icon on desktop for clarity

## Step 4: Marker & Cluster Visual Refinement

### Markers (`JobMarker.tsx`)
- **Standard**: Current sizing (unchanged)
- **Density**: Slightly smaller markers (0.85x scale), reduced box-shadow, more transparent
- **Detail**: Slightly larger markers (1.1x scale), add a subtle count label below the circle for single-digit counts, bolder confidence ring

### Clusters (`JobMap.tsx` cluster styles)
- Upgrade cluster gradient colors to be softer and more branded
- Add a subtle ring/glow effect on clusters in Detail mode
- In Density mode, clusters are more prominent (1.1x scale) to emphasize concentration

### Popups (`JobMarker.tsx` popup section)
- **Standard**: Current popup (unchanged)
- **Density**: Compact popup — just location name, job count, and "View Jobs" button
- **Detail**: Enhanced popup — add salary range if available, full confidence badge, top 2 categories as pills, posted date

## Step 5: Transitions & Polish

- Add CSS `transition: all 0.2s ease` on mode-dependent style changes (marker size, cluster size, tile opacity)
- Tile layer transitions use Leaflet's built-in fade
- Filter bar and stats animate height/opacity changes with `transition-all duration-200`

## Step 6: Mobile Adjustments

- Display mode selector: compact 3-button pill at the bottom, next to the map/list switcher
- Or: integrate as a secondary row in the mobile filter popover
- Stats remain collapsible but styled as a single-line summary
- All touch targets remain ≥44px

## Files Changed

1. `src/components/map/constants.ts` — Add `DisplayMode` type, new tile URLs
2. `src/components/map/DisplayModeSelector.tsx` — **New** — segmented control component
3. `src/components/map/JobMap.tsx` — Accept `displayMode` prop, switch tile URL and cluster config
4. `src/components/map/JobMarker.tsx` — Accept `displayMode`, adjust marker size and popup content
5. `src/components/map/MapFilters.tsx` — Integrate display mode selector, restyle filter bar
6. `src/components/map/MapStats.tsx` — Restyle as metric pills, integrate into header
7. `src/components/map/MapControls.tsx` — Display mode awareness for layer toggles
8. `src/pages/public/JobMapPage.tsx` — Add `displayMode` state, new header strip, pass mode to children
9. `src/components/map/index.ts` — Export new component

## Technical Notes

- No new dependencies needed
- CARTO tiles are free public CDN — no API key, no secret needed
- Display mode is client-side state only (no persistence needed)
- All existing accessibility patterns preserved (aria-labels, keyboard nav, focus states)
- Cluster config changes per mode are applied via `useMemo` on the `maxClusterRadius` and `iconCreateFunction` props

