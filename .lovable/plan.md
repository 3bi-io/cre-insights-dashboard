

# Enhance Trades Hero Welding Sparks

## What We're Doing
Using AI image generation to edit the `trades-hero.png` hero slideshow image so the welding torches produce realistic, vibrant sparks -- adding visual drama and authenticity to the trades industry slide.

## Approach
1. **Edit the image** using the Gemini image editing API (`google/gemini-2.5-flash-image`) with a prompt instructing it to enhance the welding sparks to look photorealistic -- brighter, more scattered, with natural light bloom and orange/white hot metal particles.
2. **Replace the existing file** at `src/assets/hero/trades-hero.png` with the enhanced version.
3. **No code changes needed** -- the `HeroSection` component already imports and displays `trades-hero.png` in the slideshow rotation.

## Technical Details
- **File**: `src/assets/hero/trades-hero.png`
- **Method**: Gemini image edit API with the current image as input
- **Prompt**: Focus on making welding sparks realistic -- bright white-hot core, orange/yellow scatter, natural motion blur, light bloom on surrounding surfaces
- **Risk**: Low -- if the result isn't satisfactory, the original can be restored. No code changes involved.

