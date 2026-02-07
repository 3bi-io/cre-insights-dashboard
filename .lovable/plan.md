
# Branded Audio Showcase Page

## Overview

Create an immersive, full-screen audio showcase page at `/audio/:id` that delivers a premium visual experience without navigation. The page will feature animated sound wave visualizations, an audio player with elegant controls, and ATS.me branding -- all optimized for mobile-first interaction.

---

## Design Vision

The page should feel like a high-end music streaming app's "now playing" screen:
- Full viewport coverage with no scroll
- Dark, atmospheric background with subtle gradient animation
- Central play/pause control with animated sound wave visualization
- Minimalist branding positioned at the bottom
- Smooth transitions and micro-interactions
- Safe-area-aware for notched devices

---

## Visual Architecture

```text
+------------------------------------------+
|                                          |
|        (subtle animated gradient)        |
|                                          |
|                                          |
|              +--------+                  |
|              | ▶︎ / ❚❚ |  <-- Large      |
|              +--------+     play button  |
|                                          |
|      |||||||  ||| ||  ||||||||||         |
|      Sound wave visualization            |
|                                          |
|                                          |
|   ─────●───────────────────────          |
|   0:45                          3:22     |
|                                          |
|                                          |
|              [🔊 volume]                 |
|                                          |
|                                          |
|         ─────────────────────            |
|              ATS.me logo                 |
|                                          |
+------------------------------------------+
```

---

## Files to Create

### 1. Audio Showcase Page Component
**Path**: `src/pages/public/AudioShowcasePage.tsx`

Full-screen page featuring:
- Dynamic viewport height (`100dvh`) for mobile keyboard/toolbar stability
- Animated gradient background using CSS keyframes
- Central circular play/pause button (80x80px mobile, 120x120px desktop)
- Canvas-based audio waveform visualization synced to audio playback
- Custom progress slider with minimal styling
- Current time / duration display
- Volume toggle (mute/unmute) for simplicity on mobile
- ATS.me logo at bottom with safe-area bottom padding

### 2. Audio Waveform Visualizer Hook
**Path**: `src/hooks/useAudioVisualizer.ts`

Custom hook that:
- Uses Web Audio API (`AudioContext`, `AnalyserNode`)
- Captures real-time frequency data from playing audio
- Returns frequency bar heights for rendering
- Handles cleanup on unmount
- Falls back gracefully if AudioContext not supported

### 3. Waveform Canvas Component
**Path**: `src/components/audio/WaveformVisualizer.tsx`

Renders animated waveform:
- Canvas-based for smooth 60fps animation
- Responsive sizing (full width, 120px height)
- Uses `useAudioVisualizer` hook data
- Gradient-filled bars (primary to accent color)
- Subtle glow effect on bars
- Shows static idle state when paused

### 4. Route Registration
**Path**: Update `src/components/routing/AppRoutes.tsx`

Add standalone route outside of `PublicLayout`:
```
/audio/:id
```

The page will initially use a hardcoded audio URL from `public/audio/` until a database-driven approach is needed.

---

## Audio File Handling

The uploaded file (`Audio_for_conversation_conv_3901kgtmahche7nshf9fmfa7de4a.mp3`) will be:
1. Copied to `public/audio/showcase-conversation.mp3` for static hosting
2. Referenced in the showcase page component

---

## Animation Specifications

### Background Gradient Animation
CSS keyframe with 3-color gradient shift:
```css
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```
Colors: Deep slate → Primary blue → Secondary purple

### Play Button Pulse
When playing: subtle `pulse-glow` animation from the existing design system.

### Waveform Bars
- 32-64 frequency bars depending on viewport width
- Height animated based on real-time audio frequency data
- Smooth CSS transitions on height changes
- Rounded tops for modern aesthetic

### Progress Slider
Custom styling:
- Thin track (4px height)
- Gradient fill for played portion
- Large thumb (24px) for touch friendliness
- Glow effect on active state

---

## Mobile-First Considerations

1. **Dynamic Viewport**: Use `100dvh` to prevent layout jump when mobile browser chrome hides
2. **Safe Areas**: Bottom padding using `pb-[env(safe-area-inset-bottom)]`
3. **Touch Targets**: Play button 80x80px minimum (exceeds WCAG 44px)
4. **Simplified Controls**: Volume toggle instead of slider on mobile
5. **No Scroll**: `overflow-hidden` on container
6. **Orientation Lock**: Works in both portrait and landscape

---

## Technical Implementation

### Audio Context Setup
```typescript
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 128; // 64 frequency bins
```

### Frequency Visualization
```typescript
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);
// Map to bar heights
```

### Responsive Waveform Sizing
```typescript
const barCount = isMobile ? 32 : 64;
const barWidth = canvasWidth / barCount - gap;
```

---

## Component Structure

```text
AudioShowcasePage
├── Background Gradient Layer (div with animated gradient)
├── Content Container (centered, max-w-lg)
│   ├── Play/Pause Button (circular, animated)
│   ├── WaveformVisualizer (canvas component)
│   ├── Progress Section
│   │   ├── Custom Slider
│   │   └── Time Display (current / duration)
│   ├── Volume Toggle Button
│   └── Branding Footer (logo + powered by)
└── Audio Element (hidden, ref-controlled)
```

---

## Accessibility

- Play/pause button with `aria-label` and screen reader text
- Progress slider with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Reduced motion support: disable waveform animation when `prefers-reduced-motion: reduce`
- High contrast mode: ensure controls visible
- Keyboard navigation: Space to toggle play, arrows to seek

---

## Dependencies Used

All from existing project:
- `framer-motion` for micro-animations (already installed)
- `useResponsiveLayout` for breakpoint detection
- `cn` utility for conditional classes
- Radix Slider from UI library
- Tailwind animations from design system

---

## CSS Additions

Add to `src/index.css`:
```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.audio-showcase-bg {
  background: linear-gradient(-45deg, #0f172a, #1e3a8a, #4c1d95, #0f172a);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}
```

---

## Files Summary

| File | Purpose |
|------|---------|
| `public/audio/showcase-conversation.mp3` | Uploaded audio file (copied from user upload) |
| `src/pages/public/AudioShowcasePage.tsx` | Main full-screen showcase page |
| `src/hooks/useAudioVisualizer.ts` | Web Audio API hook for frequency data |
| `src/components/audio/WaveformVisualizer.tsx` | Canvas-based waveform visualization |
| `src/components/routing/AppRoutes.tsx` | Add route `/audio/:id` |
| `src/index.css` | Add gradient-shift keyframe animation |

---

## Route Access

The page will be accessible at:
```
/audio/showcase
```

No navigation, no header, no footer -- just the pure audio experience.
