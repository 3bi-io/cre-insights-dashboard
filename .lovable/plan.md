
# LinkedIn Social Beacon - Complete Fix Plan

## Root Cause Analysis

### Issue 1: Database CHECK Constraint Blocking LinkedIn
**Severity**: Critical - This is the main blocker

The `social_beacon_configurations` table has a CHECK constraint:
```sql
CHECK ((platform = ANY (ARRAY['x'::text, 'facebook'::text, 'instagram'::text, 'whatsapp'::text, 'tiktok'::text, 'reddit'::text])))
```

LinkedIn is NOT in this list, so any attempt to upsert a LinkedIn configuration (toggle feature, save settings) will fail with a constraint violation error.

### Issue 2: Secret Name Mismatch in Configuration
**Severity**: Medium

The frontend configuration (`socialBeacons.config.ts`) defines:
```typescript
x: {
  requiredSecrets: ['TWITTER_CONSUMER_KEY', 'TWITTER_CONSUMER_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_TOKEN_SECRET']
}
```

But the edge function `verify-platform-secrets` checks:
```typescript
x: ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET']
```

This mismatch means the credential status shown in the UI may not reflect reality for X/Twitter.

### Issue 3: Missing LinkedIn in Analytics Mock Data
**Severity**: Low

The `SocialAnalyticsPanel` has hardcoded mock data that doesn't include LinkedIn, so it won't appear in the analytics section.

---

## Implementation Plan

### Phase 1: Update Database CHECK Constraint (Required)
**File**: Database Migration

Alter the CHECK constraint to include 'linkedin':

```sql
ALTER TABLE social_beacon_configurations 
DROP CONSTRAINT social_beacon_configurations_platform_check;

ALTER TABLE social_beacon_configurations 
ADD CONSTRAINT social_beacon_configurations_platform_check 
CHECK (platform = ANY (ARRAY['x', 'facebook', 'instagram', 'whatsapp', 'tiktok', 'reddit', 'linkedin']));
```

### Phase 2: Fix Secret Name Consistency
**File**: `src/features/social-engagement/config/socialBeacons.config.ts`

Update X (Twitter) configuration to match what the edge function expects:

```typescript
// Current (mismatched):
requiredSecrets: ['TWITTER_CONSUMER_KEY', 'TWITTER_CONSUMER_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_TOKEN_SECRET']

// Updated (matches edge function):
requiredSecrets: ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET']
```

OR update the edge function to match the frontend - depends on which secrets you have configured. Since the edge function uses `TWITTER_CLIENT_ID`, we should align to that.

### Phase 3: Add LinkedIn to Analytics Panel
**File**: `src/features/social-engagement/components/admin/SocialAnalyticsPanel.tsx`

Add LinkedIn to the mock analytics data:

```typescript
byPlatform: {
  x: { engagements: 456, impressions: 18500, trend: 'up' },
  facebook: { engagements: 389, impressions: 15200, trend: 'up' },
  instagram: { engagements: 312, impressions: 8900, trend: 'down' },
  tiktok: { engagements: 90, impressions: 2630, trend: 'up' },
  linkedin: { engagements: 234, impressions: 12400, trend: 'up' }, // Add this
}
```

### Phase 4: Verify OAuth Scopes Alignment
**File**: `src/features/social-engagement/components/admin/OAuthConfigPanel.tsx`

The current LinkedIn scopes include deprecated `r_liteprofile`. Update to modern OpenID Connect scopes:

```typescript
// Current:
linkedin: ['r_liteprofile', 'r_organization_social', 'w_organization_social', 'rw_organization_admin']

// Updated:
linkedin: ['openid', 'profile', 'email', 'w_member_social', 'r_organization_social', 'w_organization_social', 'rw_organization_admin']
```

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| Database Migration | Add 'linkedin' to platform CHECK constraint | Critical |
| `src/features/social-engagement/config/socialBeacons.config.ts` | Fix X/Twitter secret names to match edge function | High |
| `src/features/social-engagement/components/admin/SocialAnalyticsPanel.tsx` | Add LinkedIn mock data | Medium |
| `src/features/social-engagement/components/admin/OAuthConfigPanel.tsx` | Update LinkedIn OAuth scopes to modern endpoints | Medium |

---

## Technical Details

### Why the 404/Error Occurs
When you click the Ad Creative toggle for LinkedIn:
1. `PlatformCredentialCard` calls `onToggleAdCreative(enabled)`
2. `PlatformCredentialsManager` calls `toggleFeature.mutate({ platform: 'linkedin', feature: 'ad_creative_enabled', enabled })`
3. `useSocialBeaconConfig.toggleFeature` attempts to upsert to `social_beacon_configurations`
4. PostgreSQL rejects the insert due to CHECK constraint violation
5. The Supabase client returns an error, which the mutation handles with "Failed to update feature"

### After the Fix
1. Database accepts 'linkedin' as a valid platform value
2. LinkedIn configuration can be created/updated
3. Toggle switches work correctly
4. LinkedIn appears in all tabs (Credentials, OAuth Setup, Ad Creative, Settings, Analytics)

---

## Expected Outcome

After implementing these changes:
- LinkedIn toggle switches will function correctly
- LinkedIn secrets will show as "Connected" (since `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are already configured)
- LinkedIn will appear in the Analytics panel
- OAuth scopes displayed will match what the edge function actually requests
- Full LinkedIn beacon functionality will be operational
