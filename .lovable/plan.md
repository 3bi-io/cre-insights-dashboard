

## Allow Spain and Armenia Access

Add Spain (ES) and Armenia (AM) to the geo-blocking allowed country codes list.

### Changes

**File: `supabase/functions/_shared/geo-blocking.ts`**

Add two new country codes to the `ALLOWED_COUNTRY_CODES` set:
- `ES` -- Spain
- `AM` -- Armenia

These will be added in a new "Europe (Exceptions)" section after the South America block for clarity.

**File: `supabase/functions/_shared/geo-blocking.ts`** (description update)

Update the `getAllowedRegionsDescription()` function to mention Spain and Armenia alongside North/South America.

### Deployment

The `geo-check` edge function will need to be redeployed for the changes to take effect.

