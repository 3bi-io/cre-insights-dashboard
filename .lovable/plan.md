

# Fix TMC Transportation Logo

## Problem
The TMC Transportation logo file at `public/logos/tmc-transportation.png` is blank/white (0 visible content). The previous download captured an empty image. The database correctly references `https://applyai.jobs/logos/tmc-transportation.png` but it renders as nothing.

## Root Cause
The original download source likely served a redirect, CAPTCHA, or empty response. The file was saved but contains no actual logo data.

## Fix

### Step 1: Download TMC logo from a reliable source
Use `lov-exec` to download the TMC Transportation logo from their official website or a logo repository. The logo is an orange "TMC" wordmark with "An Employee-Owned Company" tagline, visible in the header at `tmctrans.com`. Candidate sources:
- Direct from tmctrans.com header image element
- From seeklogo.com PNG export (2000x590px version)
- From logo.wine or similar aggregator

### Step 2: Overwrite the existing file
Replace `public/logos/tmc-transportation.png` with the valid logo file. No database migration needed -- the `logo_url` already points to the correct path.

### Step 3: Verify rendering
Confirm the logo displays in the admin client dashboard and public job cards.

## Files Changed
- **Replaced**: `public/logos/tmc-transportation.png` (blank -> actual TMC logo)

No database or code changes required.

