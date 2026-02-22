

# Fix: Scroll to Top on Route Navigation

## Problem

When navigating between pages via links, the scroll position persists from the previous page. This happens because:

1. There is **no scroll restoration logic** anywhere in the app
2. The scrollable container is the `<main>` element (which has `overflow-y-auto`), not the `window` -- so even `window.scrollTo(0,0)` would not help
3. This affects both the **PublicLayout** and the **admin Layout**

## Solution

Create a single `ScrollToTop` component that listens for route changes and scrolls the nearest scrollable parent to the top.

### New File: `src/components/shared/ScrollToTop.tsx`

A small component that:
- Uses `useLocation()` to detect route changes (reacts to `location.pathname`)
- On change, finds the scrollable `<main id="main-content">` element via `document.getElementById`
- Scrolls it to `scrollTop = 0`
- Also calls `window.scrollTo(0, 0)` as a fallback for any edge cases

### Modified File: `src/components/public/PublicLayout.tsx`

- Import and render `<ScrollToTop />` inside the layout, before the `<main>` tag

### Modified File: `src/components/Layout.tsx`

- Import and render `<ScrollToTop />` inside `LayoutContent`, before the main content area

## Technical Details

```text
ScrollToTop component (pseudocode):
  useLocation() -> pathname
  useEffect([pathname]):
    document.getElementById('main-content')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
```

This is a lightweight, zero-dependency fix that follows the existing pattern of both layouts sharing an `id="main-content"` on their `<main>` element.

