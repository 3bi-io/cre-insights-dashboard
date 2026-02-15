

## Update Contact Page Location to "Remote First"

Replace the current physical office address on the Contact page with a "Remote First" designation to reflect that there is no physical location.

### Changes

**File: `src/pages/public/ContactPage.tsx`**
- Replace the office address text (currently showing a physical address like "123 Business Ave...") with "Remote First" or "Remote First — No Physical Office"
- Update the `MapPin` icon label accordingly
- Remove the embedded OpenStreetMap iframe since there is no physical location to display
- Optionally replace the map area with a simple visual element or remove it entirely

### Technical Details
- Single file change: `src/pages/public/ContactPage.tsx`
- Remove the `<iframe>` map embed
- Update address/location strings to read "Remote First"
- No dependency or routing changes required

