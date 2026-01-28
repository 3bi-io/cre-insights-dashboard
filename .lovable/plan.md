
# LinkedIn Social Beacon Fix Plan

## Issues Identified

### Issue 1: Credential Status Detection is Broken
**Location**: `src/features/social-engagement/components/admin/PlatformCredentialsManager.tsx`

The `getConfiguredSecrets` function (lines 30-36) only returns secrets if a database record exists with `auto_engage_enabled` or `ad_creative_enabled` set to true. Since LinkedIn was just added and has no database record, it always shows "Not Configured" even though `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are actually configured in Supabase.

**Current broken logic:**
```typescript
const getConfiguredSecrets = (platform: string): string[] => {
  const config = getConfigByPlatform(platform as any);
  if (config?.auto_engage_enabled || config?.ad_creative_enabled) {
    return SOCIAL_BEACONS[platform]?.requiredSecrets || [];
  }
  return []; // Always empty for new platforms!
};
```

### Issue 2: LinkedIn OAuth Uses Deprecated API Endpoint
**Location**: `supabase/functions/social-oauth-callback/index.ts` (lines 253-265)

LinkedIn has migrated to OpenID Connect and deprecated the `v2/me` endpoint. The current code:
```typescript
const userResponse = await fetch('https://api.linkedin.com/v2/me', {
  headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
});
```

This endpoint no longer works for new LinkedIn apps. The correct endpoint is:
```
https://api.linkedin.com/v2/userinfo
```

And returns different field names:
- `sub` instead of `id`
- `name` instead of `localizedFirstName`/`localizedLastName`

### Issue 3: Configure/Test Buttons Don't Actually Work
**Location**: `src/features/social-engagement/components/admin/PlatformCredentialsManager.tsx`

- **Configure** (line 38-42): Just shows a toast message with instructions
- **Test** (line 45-57): Only runs a fake `setTimeout` simulation, no actual API call

### Issue 4: No Edge Function to Verify Secrets
There's no edge function to check if platform secrets are actually configured, so the UI has no way to determine real connection status.

---

## Implementation Plan

### Phase 1: Create Secret Verification Edge Function
Create `supabase/functions/verify-platform-secrets/index.ts`:

```typescript
// Check if required platform secrets exist in environment
// Returns: { platform: string, hasAllSecrets: boolean, configuredSecrets: string[], missingSecrets: string[] }
```

This edge function will:
1. Accept a platform name
2. Check environment variables for each required secret
3. Return which secrets exist (without exposing values)

### Phase 2: Fix Credential Status Detection
Update `PlatformCredentialsManager.tsx`:

1. Add state for verified secrets
2. Call the verification edge function on mount/refresh
3. Update `configuredSecrets` prop to use real verification data

```typescript
// New approach
const [verifiedSecrets, setVerifiedSecrets] = useState<Record<string, string[]>>({});

useEffect(() => {
  const verifySecrets = async () => {
    for (const platform of platforms) {
      const { data } = await supabase.functions.invoke('verify-platform-secrets', {
        body: { platform: platform.platform }
      });
      if (data?.configuredSecrets) {
        setVerifiedSecrets(prev => ({
          ...prev,
          [platform.platform]: data.configuredSecrets
        }));
      }
    }
  };
  verifySecrets();
}, []);
```

### Phase 3: Fix LinkedIn OAuth Callback
Update `supabase/functions/social-oauth-callback/index.ts`:

Replace the deprecated API call:
```typescript
// OLD (broken):
const userResponse = await fetch('https://api.linkedin.com/v2/me', ...);
const userData = await userResponse.json();
platformUserId = userData.id;
platformUsername = `${userData.localizedFirstName} ${userData.localizedLastName}`;

// NEW (OpenID Connect):
const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', ...);
const userData = await userResponse.json();
platformUserId = userData.sub;
platformUsername = userData.name;
```

### Phase 4: Implement Real Test Functionality
Update `handleTest` in `PlatformCredentialsManager.tsx`:

1. Call an edge function that actually tests the API connection
2. For LinkedIn: Make a test API call using the stored access token
3. Return success/failure with descriptive message

### Phase 5: Improve Configure Button
Options:
1. Show a dialog with current secret status and link to Supabase
2. For platforms with OAuth, trigger the OAuth flow directly
3. Show step-by-step instructions specific to each platform

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/verify-platform-secrets/index.ts` | NEW - Edge function to verify secrets exist |
| `supabase/functions/social-oauth-callback/index.ts` | Fix LinkedIn to use `/v2/userinfo` endpoint |
| `src/features/social-engagement/components/admin/PlatformCredentialsManager.tsx` | Use real secret verification, improve test/configure |
| `src/features/social-engagement/hooks/useSocialBeaconConfig.ts` | Add secret verification query |

---

## Technical Details

### verify-platform-secrets Edge Function Schema

**Request:**
```typescript
{
  platform: 'linkedin' | 'facebook' | 'instagram' | 'x' | ...
}
```

**Response:**
```typescript
{
  success: true,
  platform: 'linkedin',
  hasAllSecrets: true,
  configuredSecrets: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
  missingSecrets: []
}
```

### LinkedIn userinfo Response Format
```json
{
  "sub": "abc123",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://...",
  "email": "john@example.com",
  "email_verified": true
}
```

---

## Expected Outcome

After implementation:
1. LinkedIn card will show "Connected" if both secrets are configured
2. "Configure" will open a dialog with clear instructions or trigger OAuth
3. "Test" will actually verify the API connection works
4. OAuth flow will successfully fetch user profile and store connection

