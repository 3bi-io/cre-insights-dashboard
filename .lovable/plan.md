

## Plan: Add ZipRecruiter Tracking Pixels for Danny Herman, Pemberton, and James Burg

### Summary
Add ZipRecruiter conversion pixels that fire on the thank-you page for three Hayes clients, only when the traffic source is ZipRecruiter (matching the Church Transportation pattern).

### Client Details
| Client | Client ID | ZipRecruiter Account ID |
|--------|-----------|------------------------|
| Danny Herman Trucking | `1d54e463-4d7f-4a05-8189-3e33d0586dea` | `d1e4d672` |
| Pemberton Truck Lines | `67cadf11-8cce-41c6-8e19-7d2bb0be3b03` | `8e21fb39` |
| James Burg Trucking | `b2a29507-32a6-4f5e-85d6-a7e6ffac3c52` | `d21c34cc` |

### What Changes

**1. Create `ClientZipRecruiterPixels` component**

New file: `src/components/tracking/ClientZipRecruiterPixels.tsx`

- Takes `clientId` and `source` as props
- Contains a map of client IDs to ZipRecruiter `enc_account_id` values
- Renders only when the client matches AND source includes "ziprecruiter"
- Single component handles all three clients (avoids 3 separate files)

**2. Add pixel to both thank-you pages**

- `src/pages/ThankYou.tsx` — render `ClientZipRecruiterPixels` with `clientId` and `source`
- `src/components/apply/EmbedThankYou.tsx` — render `ClientZipRecruiterPixels` with `clientId` and `source`

**3. Clean up existing `ZipRecruiterPixel.tsx`**

The existing generic `ZipRecruiterPixel.tsx` uses Pemberton's same account ID (`8e21fb39`) with no client/source gating. It will be removed since the new component supersedes it.

### Files Modified
| File | Change |
|------|--------|
| `src/components/tracking/ClientZipRecruiterPixels.tsx` | New — unified ZipRecruiter pixel component |
| `src/pages/ThankYou.tsx` | Add new pixel component |
| `src/components/apply/EmbedThankYou.tsx` | Add new pixel component |
| `src/components/tracking/ZipRecruiterPixel.tsx` | Remove (superseded) |

