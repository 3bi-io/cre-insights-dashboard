

# Map Page (`/map`) Visibility and Styling Refactor

## Problems Identified

### 1. Overlapping and Cluttered Controls (All Devices)
- **Filters and zoom controls overlap at `top-20`** — the filter bar and the MapZoomControls both position near the top-right, causing visual collision on medium viewports.
- **Bottom-right area is crowded** — Theme switcher, layer controls (Heat/Pins) stack in `bottom-4 right-4`, overlapping with AI assistant panel and mobile view switcher in `bottom-4 left/center`.
- **MapStats component is imported but never rendered** on the page — stats data is only passed to the AI panel.

### 2. Mobile-Specific Issues
- **Display mode selector takes full width** below search, pushing map content down and consuming valuable screen real estate.
- **AI assistant bar overlaps the Map/List switcher** — both sit at the bottom, the AI bar at `bottom-16` and switcher at `bottom-4`, but they visually compete.
- **Theme switcher + layer controls overlap with the Map/List switcher** in the bottom-right corner.
- **Zoom controls are cut off** — the `+` button is missing from the mobile screenshot (scrolled out of view or hidden behind filter bar).
- **MobileJobListView has `pt-[88px]`** hardcoded padding that may not match actual filter bar height, creating dead space or overlap depending on filter count.

### 3. Tablet Edge Cases
- At the current viewport (1048px), the page is between tablet and desktop breakpoints. Filter dropdowns and display mode selector wrap awkwardly.

### 4. Display Mode Inconsistencies
- Switching between Standard/Density/Detail doesn't adjust the UI chrome visibility. In Density mode (macro view), filters and controls should be less prominent. In Detail mode, they should remain accessible.
- The display mode selector style (frosted glass pill) doesn't visually match the filter controls above it — inconsistent border radius and background treatment.

### 5. Visual Hierarchy and Spacing
- Filter bar uses `top-20` (80px from top) which was originally meant to clear the header, but the map container already starts at `top-16` (64px from the header). This creates a 16px gap between map top and filter bar — wasted space.
- No visual grouping of related controls (zoom + layer + theme are all separate floating elements).

---

## Plan

### Step 1: Consolidate Bottom Controls Layout
Create a unified bottom control bar strategy:
- **Desktop**: Left side = AI assistant. Right side = vertically stacked group (theme switcher + layer controls). Stats integrated into the AI collapsed bar.
- **Mobile**: Bottom center = Map/List switcher. AI assistant moves to a FAB-style button in the bottom-left. Theme + layer controls move to the top-right (near zoom). Remove MapStats as a separate element — fold key stats into the AI collapsed bar (already done).

### Step 2: Fix Filter Bar Positioning
- Change filter bar from `top-20` to `top-3` (relative to the map container which already starts below the header).
- On mobile, make the filter bar sticky at the top of the map area with consistent padding.
- Remove the hardcoded `pt-[88px]` from `MobileJobListView` — use a dynamic spacer or CSS calc based on actual filter height.

### Step 3: Reorganize Right-Side Controls
Combine zoom controls, theme switcher, and layer controls into a single vertically stacked panel on the right side:

```text
Desktop right side:        Mobile right side:
┌─────┐                    ┌─────┐
│  +  │                    │  +  │
│  -  │                    │  -  │
│  ⌂  │                    │  ⌂  │
├─────┤                    ├─────┤
│ ☀ ◻ ☾│                   │ ☀◻☾ │
├─────┤                    ├─────┤
│ 🔥  │                    │ 🔥  │
│ 📍  │                    │ 📍  │
└─────┘                    └─────┘
```

This eliminates the scattered floating controls and creates one clear control stack.

### Step 4: Simplify Mobile Display Mode
- Move the display mode selector into the mobile filter popover (alongside company/category filters) instead of rendering it as a full-width row.
- On desktop/tablet, keep it inline with filters but ensure it wraps cleanly.

### Step 5: Fix Mobile AI Assistant Positioning
- When collapsed, position the AI bar just above the Map/List switcher with proper spacing (`bottom-[4.5rem]`).
- When expanded, use a bottom sheet / drawer pattern consistent with the JobListPanel instead of absolute positioning that fights other elements.

### Step 6: Adjust Map Container Offsets
- Change map container from `top-16` to `top-0` since the parent already accounts for the header with `h-[calc(100dvh-4rem)]`.
- Update filter positioning accordingly — filters overlay the map at `top-3` with proper z-indexing.

### Step 7: Dark/Light Theme Consistency
- Ensure all floating controls use consistent glass morphism treatment: `bg-background/90 backdrop-blur-md border-border/50 shadow-lg`.
- Standardize border-radius across all floating elements to `rounded-lg`.

---

## Files to Modify

| File | Changes |
|---|---|
| `src/pages/public/JobMapPage.tsx` | Restructure control layout, remove `top-16` offset from map container, consolidate right-side controls, move display mode into mobile popover |
| `src/components/map/MapFilters.tsx` | Update positioning from `top-20` to `top-3`, embed display mode selector in mobile popover, fix responsive wrapping |
| `src/components/map/MapControls.tsx` | Merge `MapZoomControls` positioning into the consolidated right-side stack, remove hardcoded absolute positioning so parent controls layout |
| `src/components/map/MapAIAssistantPanel.tsx` | Fix mobile collapsed position to avoid overlapping Map/List switcher, consistent spacing |
| `src/components/map/MobileJobListView.tsx` | Replace hardcoded `pt-[88px]` with proper spacing that adapts to filter height |
| `src/components/map/MapThemeSwitcher.tsx` | Minor: remove absolute positioning so it can be composed into the control stack |
| `src/components/map/JobMap.tsx` | Remove `MapZoomControls` from inside `MapContainer` (move to page-level control stack) |
| `src/components/map/constants.ts` | Add consistent spacing constants for control positions |

