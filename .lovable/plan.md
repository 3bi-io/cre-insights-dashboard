

## Support Multiple Tracking Link IDs for Double Nickel

### Problem
Double Nickel uses tracking link IDs to pull jobs into their platform. Currently the system stores a single `trackingLinkId` in the connection credentials. Clients can have many tracking links (one per job posting, region, or campaign), and we need to support all of them.

### Approach

**Frontend: Multi-value tracking link input**

In the `DynamicCredentialsForm`, add support for a new field type `tags` (or `multi-string`). When the Double Nickel credential schema declares `tracking_link_ids` with `type: "tags"`, the form renders a tag-style input where users can:
- Type a tracking link ID and press Enter to add it
- See all added IDs as removable chips/badges
- Add as many as needed

The values are stored as a JSON array string in the credentials object (e.g., `tracking_link_ids: '["abc123","def456","ghi789"]'`).

**Database: Update credential schema**

Update the Double Nickel `ats_systems` row's `credential_schema` to replace the single `trackingLinkId` field with a new `tracking_link_ids` field of type `tags`. Keep backward compatibility by still reading the old `trackingLinkId` if present.

**Backend: Adapter resolution**

Update `buildDoubleNickelPayload` in `rest-json-adapter.ts` to:
1. Parse `tracking_link_ids` from credentials (JSON array string)
2. Fall back to legacy single `trackingLinkId` if the array is not present
3. When submitting an application, use the first tracking link by default, or match by job metadata if a mapping exists

### Files to change

| File | Change |
|------|--------|
| `src/features/ats/components/DynamicCredentialsForm.tsx` | Add `tags` field type with add/remove chip UI |
| `src/services/atsConnectionsService.ts` | Add `'tags'` to the `CredentialFieldSchema.type` union |
| `supabase/functions/_shared/ats-adapters/rest-json-adapter.ts` | Update `buildDoubleNickelPayload` to parse array of tracking link IDs |
| DB: `ats_systems` row for `doublenickel` | Update `credential_schema` JSON to use new `tracking_link_ids` tags field |

### UI mockup

```text
┌─────────────────────────────────────────┐
│ Tracking Link IDs                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ abc123 ✕│ │ def456 ✕│ │ ghi789 ✕│    │
│ └─────────┘ └─────────┘ └─────────┘    │
│ ┌─────────────────────────────────────┐ │
│ │ Type and press Enter to add...      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Backend logic

```text
credentials.tracking_link_ids = '["link1","link2","link3"]'

buildDoubleNickelPayload():
  1. Parse tracking_link_ids array from creds
  2. If empty, fall back to creds.trackingLinkId (legacy)
  3. Use first link as default, or match to job if mapping exists
  4. Set trackingLinkId in payload
```

### Backward compatibility
- Existing connections with a single `trackingLinkId` continue to work unchanged
- The adapter checks both the new array and the legacy single value
- No data migration required -- old credentials are read as-is

