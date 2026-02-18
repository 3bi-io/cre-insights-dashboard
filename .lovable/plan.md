

# Add JBTC Logo to James Burg Trucking Client Account

## What This Does

Upload the provided JBTC logo image to Supabase Storage and update the James Burg Trucking Company client record (`b2a29507-32a6-4f5e-85d6-a7e6ffac3c52`) with the public URL. The logo will then appear automatically across:

- Admin clients dashboard table
- Public `/clients` page cards
- Any job listings associated with James Burg Trucking

## Steps

### 1. Copy the uploaded logo into the project

Save `user-uploads://jbtclogo.webp` to `src/assets/clients/jbtclogo.webp` so it can be uploaded to storage.

### 2. Upload to Supabase Storage

Upload the file to the `organization-logos` bucket at path `james-burg/logo.webp` (following the existing `{slug}/logo-{timestamp}.{ext}` convention used by `OrganizationLogoUpload`).

### 3. Update the client database record

Set `logo_url` on the `clients` table for all rows matching the James Burg Trucking Company name/ID so the logo renders everywhere the `logo_url` field is referenced.

---

## No Code Changes

No component or hook changes are needed -- the existing `ClientsTable`, `ClientsOverviewDashboard`, and public `ClientsPage` already conditionally render `logo_url` when present.

