

# Replace Hero Map Component with Recorded Video Loop

## Summary
Replace the live `JobMap` component in the homepage hero with a screen-recorded MP4 video of the actual `/map` page, playing as a silent autoplay loop. This eliminates the heavy Leaflet/clustering overhead on the landing page, removes visual noise from cluster labels, and delivers a polished, cinematic product preview as the hero backdrop.

## Approach

### Step 1: Record the /map page as video
Use browser automation to capture a sequence of screenshots from the live `/map` page at different zoom levels and states (overview, zoom into clusters, pan across US). Then use ffmpeg to stitch these into a smooth looping MP4 with crossfade transitions (~15-20 seconds, 1920x1080).

### Step 2: Optimize and deploy the video
- Compress with h264/crf 28 for web delivery (~2-5MB target)
- Generate a poster frame (first frame as JPEG) for instant visual while video loads
- Place both in `public/videos/`

### Step 3: Rewrite HeroSection
Replace the `MapProvider` + `JobMap` + `Suspense` block with a simple `<video>` element:

```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  poster="/videos/hero-map-poster.jpg"
  className="absolute inset-0 w-full h-full object-cover"
>
  <source src="/videos/hero-map.mp4" type="video/mp4" />
</video>
```

Remove imports: `JobMap`, `MapProvider`, `useJobMapData`, `MapLocation`, `Suspense`, `lazy`.

Keep: Framer Motion animations, headline, CTAs, trust signals (company/job counts still fetched live), gradient overlays.

### Step 4: Clean up unused hero dependencies
- Remove `useCallback` import (no longer needed for `handleLocationSelect`)
- Remove `Loader2` import (unused)
- Simplify the component significantly

## Files to Modify

| File | Changes |
|---|---|
| `public/videos/hero-map.mp4` | **New** — recorded video of /map page |
| `public/videos/hero-map-poster.jpg` | **New** — poster frame for instant load |
| `src/features/landing/components/sections/HeroSection.tsx` | Replace map backdrop with `<video>` element, remove map-related imports |

## Benefits
- **Performance**: Removes Leaflet, marker clustering, Supabase location query, and MapProvider from the landing page critical path
- **Visual quality**: Pre-recorded video can be curated to show the best angles and transitions without runtime rendering issues
- **Reliability**: No more cluster label bleed-through, loading states, or map tile failures on the homepage
- **Mobile**: Native `<video>` with `playsInline` works cleanly on iOS/Android with zero scroll conflict

## Mobile Behavior
- `playsInline` + `muted` + `autoPlay` ensures autoplay works on iOS Safari
- `object-cover` maintains full-bleed coverage at all aspect ratios
- Video file is small enough (~3-5MB) for mobile networks
- Poster image shows immediately while video loads

