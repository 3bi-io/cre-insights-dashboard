

# Implement Pemberton Logo for Apply Pages

## Overview

This plan will:
1. Convert the uploaded TIFF image to a web-compatible PNG format and upload it to Supabase storage
2. Update the Pemberton client record with the logo URL
3. Extend the apply pages to display client logos in the header

## Current State

- **Pemberton Client ID**: `67cadf11-8cce-41c6-8e19-7d2bb0be3b03`
- **Current logo_url**: `null`
- **Uploaded file**: `user-uploads://IMG_5350.tiff` (TIFF format - not web-compatible)
- **`public_client_info` view**: Already includes `logo_url` column
- **`useApplyContext` hook**: Currently only fetches `name` from `public_client_info`
- **`ApplicationHeader`**: Uses `Building2` icon for client name, no logo display

---

## Implementation Steps

### Step 1: Convert and Upload Logo Image

Since TIFF is not web-compatible, we need to:
1. Copy the TIFF to the project as a temporary file
2. The image will need to be manually uploaded via the admin UI or converted to PNG/WebP

**Alternative approach**: Copy the image to `public/` folder and use it for Pemberton specifically, then update the database with the public URL after deployment.

**Recommended**: Use the existing `ClientLogoUpload` component in the admin UI to upload a converted PNG version, OR upload directly to Supabase storage.

### Step 2: Update `useApplyContext` to Fetch Logo URL

**File**: `src/hooks/useApplyContext.ts`

Add `logo_url` to the interface and fetch it from `public_client_info`:

```typescript
interface ApplyContext {
  jobTitle: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;  // NEW
  location: string | null;
  jobListingId: string | null;
  source: string | null;
  isLoading: boolean;
}

// In the fetch:
const { data: clientInfo } = await supabase
  .from('public_client_info')
  .select('name, logo_url')  // Add logo_url
  .eq('id', jobListing.client_id)
  .maybeSingle();

clientName = clientInfo?.name || null;
clientLogoUrl = clientInfo?.logo_url || null;  // NEW
```

### Step 3: Update `ApplicationHeader` to Display Logo

**File**: `src/components/apply/ApplicationHeader.tsx`

Add logo support to the header component:

```typescript
interface ApplicationHeaderProps {
  jobTitle?: string | null;
  clientName?: string | null;
  clientLogoUrl?: string | null;  // NEW
  location?: string | null;
  source?: string | null;
  isLoading?: boolean;
}

// In the component:
{clientName && (
  <div className="flex items-center gap-2">
    {clientLogoUrl ? (
      <img 
        src={clientLogoUrl} 
        alt={`${clientName} logo`}
        className="h-6 w-auto object-contain"
      />
    ) : (
      <Building2 className="h-4 w-4" aria-hidden="true" />
    )}
    <span>{clientName}</span>
  </div>
)}
```

### Step 4: Update Apply Pages to Pass Logo URL

**Files to update**:
- `src/pages/Apply.tsx` - Pass `clientLogoUrl` to `ApplicationHeader`
- `src/components/apply/detailed/DetailedApplicationForm.tsx` - Pass `clientLogoUrl` to `ApplicationHeader`
- `src/pages/EmbedApply.tsx` - If it uses job context, update similarly

### Step 5: Upload Pemberton Logo to Storage

The TIFF image needs to be converted to PNG and uploaded to the `client-logos` bucket:

1. Copy the TIFF to a temporary location
2. Convert to PNG (or the image may already be displayable as the browser might decode it)
3. Upload to Supabase storage bucket `client-logos`
4. Update the `clients` table with the public URL

**SQL to update after upload**:
```sql
UPDATE clients 
SET logo_url = 'https://[project].supabase.co/storage/v1/object/public/client-logos/67cadf11-...-pemberton.png'
WHERE id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03';
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useApplyContext.ts` | Add `clientLogoUrl` to interface and fetch `logo_url` from `public_client_info` |
| `src/components/apply/ApplicationHeader.tsx` | Add `clientLogoUrl` prop and render logo image when available |
| `src/pages/Apply.tsx` | Pass `clientLogoUrl` from context to `ApplicationHeader` |
| `src/components/apply/detailed/DetailedApplicationForm.tsx` | Pass `clientLogoUrl` from context to `ApplicationHeader` |
| Database | Update Pemberton client with logo URL after storage upload |

---

## Technical Approach for TIFF Image

Since TIFF is not directly supported in browsers, we have two options:

**Option A: Copy as-is and test**
- Copy the TIFF to `public/images/clients/pemberton-logo.tiff`
- Some browsers may decode it, but reliability is low

**Option B: Request PNG version (Recommended)**
- Ask user to provide a PNG, JPG, or WebP version of the logo
- Upload via the existing `ClientLogoUpload` admin component
- This ensures cross-browser compatibility

**Option C: Convert programmatically**
- Use canvas API or edge function to convert TIFF to PNG
- More complex but automates the process

---

## Expected Result

**Before**:
```
CDL A Truck Driver - Regional Southeast Runs
🏢 Pemberton Truck Lines Inc  📍 Hendersonville, TN
```

**After**:
```
CDL A Truck Driver - Regional Southeast Runs
[Pemberton Logo] Pemberton Truck Lines Inc  📍 Hendersonville, TN
```

---

## Note on TIFF Format

The uploaded file `IMG_5350.tiff` is in TIFF format, which has limited browser support:
- Safari: Full support
- Chrome/Firefox/Edge: Not natively supported

**Recommendation**: Before implementing, please provide the logo in PNG, JPG, SVG, or WebP format for best cross-browser compatibility. You can:
1. Convert the TIFF to PNG using an image editor
2. Re-upload the converted file
3. Or I can attempt to use the TIFF directly (Safari-only compatibility)

