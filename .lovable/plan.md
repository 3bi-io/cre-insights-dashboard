

# Update Sysco Logo

## What's Changing

Replace the current `public/logos/sysco-logo.png` with the official Sysco wordmark logo (transparent PNG) sourced from verified branding resources.

## Source

The official Sysco full-size logo (transparent PNG) from companieslogo.com:
`https://companieslogo.com/img/orig/SYY_BIG-3ab23a28.png?t=1720244494`

This is the standard blue/green "Sysco" wordmark used on sysco.com and across their corporate materials.

## Steps

1. **Download and overwrite** `public/logos/sysco-logo.png` with the sourced logo image
2. **No database change needed** -- the client record already points to `https://applyai.jobs/logos/sysco-logo.png` (set in the previous migration)
3. **Publish** to make the updated asset live at the production URL

## Files Modified

| File | Change |
|------|--------|
| `public/logos/sysco-logo.png` | Replace with official Sysco wordmark PNG |

## Note

The logo will appear correctly in the test preview immediately, but will only show on the published site (`applyai.jobs`) after you hit Publish.

