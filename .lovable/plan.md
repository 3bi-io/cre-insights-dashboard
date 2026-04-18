

## Why ZipRecruiter pixels aren't firing on Thank You

### Root cause

`ClientZipRecruiterPixels` only renders when **both** `clientId` AND `source` (containing "ziprecruiter") are present. Today, `clientId` is almost never present on `/thank-you` because:

1. **Quick Apply (`useApplicationForm`)** — passes `clientId: formData.client_id`, but `formData.client_id` is only populated from the URL params `?client_id=...`. Real apply URLs (e.g., `https://applyai.jobs/apply?job_id=af46fa7f...&utm_source=cdl_jobcast`) carry `job_id`, not `client_id`. So `clientId` arrives as empty string → pixel skipped.
2. **Detailed Apply (`useDetailedApplicationForm`)** — same: pulls `client_id` from `searchParams`. Same gap.
3. **Embed Apply (`EmbedApply`)** — passes `submissionResult.clientId`, but the `submit-application` edge function response does **not return `clientId`** (only `applicationId`, `organizationId`, `organizationName`, `hasVoiceAgent`).

Verified against the 3 test apps from `ziprecruiterintegrations2024@gmail.com` (Apr 17, 21:56–22:03 UTC):

| Client | source | utm_source | clientId at /thank-you |
|---|---|---|---|
| Pemberton | `ZipRecruiter` | null | ❌ empty (no URL param) |
| Danny Herman | `Direct Application` | null | ❌ empty (no URL param) |
| James Burg | `Direct Application` | null | ❌ empty (no URL param) |

So even Pemberton (which had the right `source`) failed because `clientId` was blank. The other two failed on both counts.

### Secondary issue: source check is too narrow

`ClientZipRecruiterPixels` requires `source` to contain `"ziprecruiter"`. The Danny Herman & James Burg test apps were classified as `Direct Application` (because the integration tester didn't pass any UTM/referrer signal). Per the user's request, these pixels should fire **on the post-conversion page regardless of source**, since ZipRecruiter only counts the conversion when their pixel actually loads on the thank-you page.

### Fix — 3 small changes

1. **Return `clientId` from `submit-application`** edge function alongside `organizationId` (both success branches: new app + 409-update). One-line addition.

2. **Quick & Detailed forms** — pass `clientId: data.clientId` (from response) into `/thank-you` navigation state, with the URL `client_id` only as a fallback.

3. **`ClientZipRecruiterPixels`** — drop the `source.includes('ziprecruiter')` gate. Render purely based on `clientId` matching the allow-list. The component is already only mounted on `/thank-you` (post-conversion page) and only fires for the 3 mapped client UUIDs (Danny Herman, Pemberton, James Burg), so this is exactly what ZipRecruiter requires ("on a page you display to users after they convert"). Remove the unused `source` prop and its callsites.

### Files touched

- `supabase/functions/submit-application/index.ts` — add `clientId` to both `successResponse` payloads (lines ~1158 and ~1251).
- `src/hooks/useApplicationForm.ts` — `clientId: data.clientId || formData.client_id`.
- `src/hooks/useDetailedApplicationForm.ts` — `clientId: data.clientId || searchParams.get('client_id') || ''`.
- `src/pages/EmbedApply.tsx` — already uses `submissionResult.clientId`; will work once edge function returns it (verify the embed submission hook plumbs `data.clientId` into `submissionResult`).
- `src/components/tracking/ClientZipRecruiterPixels.tsx` — remove source gate, fire whenever `clientId` is in the allow-list.
- `src/pages/ThankYou.tsx` & `src/components/apply/EmbedThankYou.tsx` — drop the now-unused `source` prop on `<ClientZipRecruiterPixels>`.

### What does NOT change

- ChurchZipRecruiterPixel (org-level + source check) and AdmiralMerchantsJobCastPixel — unchanged.
- Pixels still only render on `/thank-you` and `/embed/apply` post-submit (never on `/apply`).
- Allow-list of 3 client UUIDs unchanged.

### Verification

After deploy, resubmit the 3 test applications. On the Thank You page DevTools → Network, expect exactly one request to `track.ziprecruiter.com/conversion?enc_account_id=...` with the matching `enc_account_id` per client (`d1e4d672`, `8e21fb39`, `d21c34cc`).

