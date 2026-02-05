

## Fix: Pemberton Logo Not Saving

### Issue Identified

The Pemberton Truck Lines logo upload is failing silently. Investigation revealed:

| Check | Result |
|-------|--------|
| Storage bucket `client-logos` | Exists and is public ✓ |
| Storage objects | **Empty** - no files uploaded |
| Pemberton `logo_url` in database | `NULL` |
| Other client logos | Set via direct URL (not uploads) |

**Root Cause**: The `ClientLogoUpload` component is silently failing, likely due to RLS policies on the `clients` table preventing the UPDATE operation. The upload toast shows success even when the operation fails.

---

### Solution Options

#### Option A: Direct Database Update (Immediate Fix)
Set the Pemberton logo URL directly in the database. You'll need to provide the logo image URL (from an external CDN or hosted location).

#### Option B: Fix Upload Component Error Handling
Improve `ClientLogoUpload` to properly surface errors when:
1. Storage upload fails
2. Client record update fails

---

### Implementation

#### 1. Add Pemberton Logo via SQL
Run this in Supabase Cloud View > Run SQL:

```sql
UPDATE clients 
SET logo_url = 'YOUR_LOGO_URL_HERE'
WHERE id = '67cadf11-8cce-41c6-8e19-7d2bb0be3b03';
```

Replace `YOUR_LOGO_URL_HERE` with the actual logo URL (e.g., from a CDN like CloudFront).

#### 2. Fix ClientLogoUpload Error Handling

**File:** `src/features/clients/components/ClientLogoUpload.tsx`

Improve error handling to show meaningful messages when RLS blocks the update:

```typescript
// In handleFileUpload, after updating client record:
const { error: updateError } = await supabase
  .from('clients')
  .update({ logo_url: publicUrl })
  .eq('id', clientId);

if (updateError) {
  // Clean up uploaded file if DB update fails
  await supabase.storage.from('client-logos').remove([fileName]);
  throw new Error(`Database update failed: ${updateError.message}`);
}
```

Also add a check to verify the update actually occurred:

```typescript
// Verify the update was applied
const { data: verifyData } = await supabase
  .from('clients')
  .select('logo_url')
  .eq('id', clientId)
  .single();

if (verifyData?.logo_url !== publicUrl) {
  await supabase.storage.from('client-logos').remove([fileName]);
  throw new Error('Logo update was blocked. Check your permissions.');
}
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/features/clients/components/ClientLogoUpload.tsx` | Add error handling and verification |

---

### Recommended Approach

1. **Immediate**: Set the Pemberton logo URL directly via SQL (Option A)
2. **Long-term**: Improve the upload component's error handling (Option B)

If you have the Pemberton logo URL ready, share it and I'll create the SQL update statement.

