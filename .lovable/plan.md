

# Source and Set Admiral Merchants Logo

## What This Does
Downloads the official Admiral Merchants logo from their website (ammf.com), uploads it to the `client-logos` Supabase storage bucket, and updates the client record so the logo appears throughout the ATS — job cards, applicant views, the client logo marquee, and the public jobs page.

## Current State
- **Client record**: `Admiral Merchants` (ID: `53d7dd20-d743-4d34-93e9-eb7175c39da1`) exists with `logo_url: null`
- **Logo source**: Official logo at `https://admiral.ammf.com/wps/PA_AdmiralHomepage/Images/admiral.jpg` — navy blue background, gold star, white text "Admiral Merchants - A Tradition of Integrity"
- **Infrastructure**: `client-logos` storage bucket already exists; `ClientLogoUpload` component handles the upload/DB update pattern

## Steps

1. **Download the logo** from Admiral's official website using a script
2. **Upload to Supabase** `client-logos` bucket as `53d7dd20-...-{timestamp}.jpg`
3. **Update the `clients` table** — set `logo_url` to the public URL for client ID `53d7dd20-d743-4d34-93e9-eb7175c39da1`
4. **Verify** the logo renders by querying the updated record

## Technical Detail
This is a data operation — no code changes needed. The existing `CompanyLogo`, `ClientCard`, and `ClientLogoMarquee` components will automatically pick up the new `logo_url` value. The script will use the Supabase JS client or REST API to upload the file and update the row, mirroring the same pattern used by `ClientLogoUpload.tsx`.

