

# Source and Update Logos for Werner Enterprises & TMC Transportation

## Current State
- **Werner Enterprises** (`feb3479f`): `logo_url` is NULL
- **TMC Transportation** (`50657f4d`): `logo_url` is NULL
- **Hub Group** already has a logo at `https://applyai.jobs/logos/hubgroup-logo.png`

## Logo Sources Identified
- **Werner Enterprises**: Official yellow/gold wordmark logo from their website (original at `werner.com`). Will download the PNG version and save locally.
- **TMC Transportation**: Official orange "TMC" logo with "An Employee-Owned Company" tagline from `tmctrans.com`. Will download and save locally.

## Plan

### Step 1: Download and save logo files
Using `lov-exec`, download both logos to `public/logos/`:
- `public/logos/werner-enterprises.png` -- Werner's yellow wordmark on transparent background
- `public/logos/tmc-transportation.png` -- TMC's orange logo on transparent background

Source URLs:
- Werner: `https://download.logo.wine/logo/Werner_Enterprises/Werner_Enterprises-Logo.wine.png`
- TMC: Extract from tmctrans.com header (the logo img element)

### Step 2: Update client records in database
Run a SQL migration to set `logo_url` for both clients:
```sql
UPDATE clients SET logo_url = 'https://applyai.jobs/logos/werner-enterprises.png'
WHERE id = 'feb3479f-4116-42a5-bb6a-811406c1c99a';

UPDATE clients SET logo_url = 'https://applyai.jobs/logos/tmc-transportation.png'
WHERE id = '50657f4d-c47b-4104-a307-b82d5fa4a1df';
```

### Step 3: Verify rendering
Confirm both logos display correctly in the admin client list and public job cards using the existing `CompanyLogo` / `LogoAvatar` components. No component changes needed -- the existing infrastructure handles logo display automatically once `logo_url` is populated.

## Files Changed
- **New**: `public/logos/werner-enterprises.png`
- **New**: `public/logos/tmc-transportation.png`
- **New**: SQL migration to update `logo_url` on both client records

