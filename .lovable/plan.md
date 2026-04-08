

# Fix Map Page Crashes — Two Bugs

## Problem Summary
The /map page crashes with two distinct errors:
1. **Infinite render loop** in `MapAnnouncements` — "Maximum update depth exceeded"
2. **react-leaflet Context.Consumer crash** — "render2 is not a function"

---

## Bug 1: MapAnnouncements Infinite Loop

**Root cause**: The `useEffect` on line 74 includes `prevState` in its dependency array (line 128), but calls `setPrevState()` inside the effect (line 117). Since `prevState` is an object, every `setPrevState` creates a new reference, which triggers the effect again — infinite loop.

**Fix**: Replace the `useState`/`useEffect` pattern with `useRef` for tracking previous values. Store previous values in a ref (which doesn't trigger re-renders), and compare against the ref inside the effect. Update the ref at the end of the effect without causing a re-render.

```text
Before:  const [prevState, setPrevState] = useState({...});
After:   const prevStateRef = useRef({...});
         // Inside effect: compare against prevStateRef.current
         // At end: prevStateRef.current = { ... };
```

Remove `prevState` from the dependency array entirely.

---

## Bug 2: react-leaflet-cluster Context.Consumer Incompatibility

**Root cause**: `react-leaflet-cluster@4.0.0` internally renders a `<Context.Consumer>` (the legacy React context API). React 18.x deprecated direct `<Context>` rendering and requires `<Context.Consumer>` to receive a function child. The cluster library's internals don't comply, causing "render2 is not a function".

**Fix**: Downgrade `react-leaflet-cluster` from `^4.0.0` to a compatible version (`2.1.0` is the stable release for react-leaflet v4/v5 with React 18), OR replace it with `react-leaflet-markercluster` which is actively maintained. The simplest fix is to pin `react-leaflet-cluster` to version `2.1.0`.

If downgrading doesn't resolve it (version 2.x may target react-leaflet v3), the alternative is to implement a thin custom `MarkerClusterGroup` wrapper using `leaflet.markercluster` directly with react-leaflet's `createPathComponent` API — bypassing the broken library entirely.

---

## Implementation Steps

1. **Fix MapAnnouncements** — Replace `useState` for `prevState` with `useRef`. Remove `prevState` from the `useEffect` dependency array. Single file: `src/components/map/MapAnnouncements.tsx`.

2. **Fix react-leaflet-cluster** — First attempt: downgrade to `2.1.0`. If that fails due to API differences, create a custom `MarkerClusterGroup` wrapper (~30 lines) using `leaflet.markercluster` directly, and remove the `react-leaflet-cluster` dependency. File: `src/components/map/JobMap.tsx` + `package.json`.

## Impact
- Fixes the crash on the /map page
- No feature changes — purely bug fixes

