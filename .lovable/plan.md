

# Add Google Places Autocomplete to Address Forms

## Overview

Integrate the Google Places Autocomplete API into both address input fields across the application. When a user starts typing an address, a dropdown of suggestions appears. Selecting a suggestion auto-fills the address, city, state, and ZIP fields.

## Affected Forms

1. **Quick Apply** (`/apply`) -- `PersonalInfoSection.tsx` with fields: address, city, state, zip
2. **Detailed Apply** (`/detailed-apply`) -- `DetailedContactSection.tsx` with fields: address1, address2, city, state, zipCode

## Implementation

### 1. Store Google Maps API Key as a Supabase Secret

- Add `GOOGLE_MAPS_API_KEY` as a Supabase secret
- Create a small edge function `get-google-maps-key` that returns the API key to the frontend (so the key isn't hardcoded in client code)

### 2. Create a Reusable Hook: `src/hooks/useGooglePlacesAutocomplete.ts`

- Loads the Google Maps JavaScript SDK dynamically (only once) using the API key fetched from the edge function
- Attaches a `google.maps.places.Autocomplete` instance to a given input ref
- Restricts results to US addresses (`componentRestrictions: { country: 'us' }`)
- On `place_changed`, parses the address components and returns structured data:

```text
{
  address: "123 Main St",
  city: "Dallas",
  state: "TX",
  zip: "75201"
}
```

- Cleans up the Autocomplete instance on unmount

### 3. Create a Reusable Component: `src/components/shared/AddressAutocompleteInput.tsx`

- Wraps the existing `Input` component with the autocomplete hook
- Props: `value`, `onChange`, `onPlaceSelect(address, city, state, zip)`, plus standard input props
- Renders the same `h-14 text-base rounded-xl border-2` styling
- Shows a subtle Google attribution as required by their TOS

### 4. Update `PersonalInfoSection.tsx`

- Replace the plain address `<Input>` with `<AddressAutocompleteInput>`
- On place selection, call `onInputChange` for address, city, state, and zip
- Existing ZIP auto-lookup continues to work as a fallback if Places isn't used

### 5. Update `DetailedContactSection.tsx`

- Replace the `address1` `<Input>` with `<AddressAutocompleteInput>`
- On place selection, call `onInputChange` for address1, city, state, and zipCode
- `address2` remains a plain input (apt/suite number)

### 6. Edge Function: `supabase/functions/get-google-maps-key/index.ts`

- Reads `GOOGLE_MAPS_API_KEY` from environment
- Returns `{ apiKey: "..." }` with CORS headers
- This keeps the API key out of client-side source code

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/get-google-maps-key/index.ts` | Create -- returns API key |
| `src/hooks/useGooglePlacesAutocomplete.ts` | Create -- loads SDK, manages Autocomplete |
| `src/components/shared/AddressAutocompleteInput.tsx` | Create -- reusable autocomplete input |
| `src/components/apply/PersonalInfoSection.tsx` | Edit -- use AddressAutocompleteInput |
| `src/components/apply/detailed/DetailedContactSection.tsx` | Edit -- use AddressAutocompleteInput |

## Prerequisites

You will need a Google Cloud project with the **Places API** and **Maps JavaScript API** enabled, and an API key with those APIs allowed. I'll prompt you to provide the key as a Supabase secret during implementation.

