

## Fix Danny Herman Logo for /apply Pages

### Problem

The Danny Herman Trucking client (ID: `1d54e463-4d7f-4a05-8189-3e33d0586dea`) has `logo_url` set to `https://d2r0eic16r3uxv.cloudfront.net/1635879404137815.png`, which is a white-on-transparent PNG -- completely invisible on the light-background /apply pages. The self-hosted `public/logos/danny-herman.png` has the same issue.

The correct colored logo (blue square, gold "DHT" letters) is visible on Danny Herman's official Tenstreet IntelliApp page at `https://intelliapp.driverapponline.com/company/logos/dannyherman.png`.

### Fix

#### Step 1: Replace the self-hosted logo file

Replace `public/logos/danny-herman.png` with the correct colored version sourced from the Tenstreet IntelliApp page. This gives us a reliable, self-hosted URL that won't break if Tenstreet changes their paths.

#### Step 2: Update the database

Run an UPDATE query on the `clients` table to change the `logo_url` for Danny Herman from the broken CloudFront URL to the self-hosted version:

```sql
UPDATE clients
SET logo_url = 'https://ats-me.lovable.app/logos/danny-herman.png'
WHERE id = '1d54e463-4d7f-4a05-8189-3e33d0586dea';
```

Also update the `public_client_info` view source if needed to ensure the new URL propagates to anonymous/candidate-facing pages.

#### Step 3: Verify

Load the Danny Herman /apply page to confirm the colored DHT logo appears correctly:
`/apply?organization_id=84214b48-7b51-45bc-ad7f-723bcf50466c&client_id=1d54e463-4d7f-4a05-8189-3e33d0586dea`

### Technical Notes

- The `public_client_info` view reads `logo_url` from the `clients` table, so updating the table is sufficient.
- The `ApplicationHeader` component uses `LogoAvatar` with `object-contain` and `p-2` padding, so the square DHT icon will render well in the app-icon style container.
- No code changes are needed -- this is a data/asset fix only.

