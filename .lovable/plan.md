
# LinkedIn Beacon Integration Plan

## Current State Analysis

### Existing Infrastructure
The platform has a robust Social Beacon system supporting X (Twitter), Facebook, Instagram, WhatsApp, TikTok, and Reddit. The system includes:
- **OAuth flow**: Edge functions `social-oauth-init` and `social-oauth-callback` already have LinkedIn OAuth support
- **Database tables**: `social_platform_connections` and `social_beacon_configurations` for storing credentials and settings
- **UI components**: `SuperAdminSocialBeacons` dashboard with credential management, OAuth setup, and analytics
- **LinkedIn Apply Route**: `/in/apply/:jobId` already exists for tracking LinkedIn-sourced applicants

### What's Missing for LinkedIn
1. **Edge function secrets**: `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are not configured
2. **Beacon config**: LinkedIn is not included in the `SocialBeaconPlatform` type or `SOCIAL_BEACONS` configuration
3. **UI integration**: LinkedIn doesn't appear in the platform credentials manager
4. **No active connections**: Database shows no LinkedIn entries in either configuration table

## Implementation Plan

### Phase 1: Add LinkedIn API Credentials (Secrets)
Add two secrets to Supabase Edge Functions:
- `LINKEDIN_CLIENT_ID` - Your LinkedIn app Client ID
- `LINKEDIN_CLIENT_SECRET` - Your LinkedIn app Client Secret

### Phase 2: Update Beacon Configuration
Modify `src/features/social-engagement/config/socialBeacons.config.ts`:

```typescript
// Add to SocialBeaconPlatform type
export type SocialBeaconPlatform = 
  | 'x' 
  | 'facebook' 
  | 'instagram' 
  | 'whatsapp' 
  | 'tiktok' 
  | 'reddit'
  | 'linkedin';  // NEW

// Add to SOCIAL_BEACONS configuration
linkedin: {
  platform: 'linkedin',
  name: 'LinkedIn',
  description: 'LinkedIn Marketing API for professional job recruitment',
  icon: Linkedin,
  color: 'hsl(201, 100%, 35%)',
  bgColor: 'hsl(201, 100%, 35%, 0.1)',
  authType: 'oauth2',
  requiredSecrets: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
  optionalSecrets: ['LINKEDIN_ORGANIZATION_ID'],
  webhookSupported: false,
  autoEngageSupported: false,
  adCreativeSupported: true,
  apiDocUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
  characterLimit: 3000,
  mediaFormats: ['image/jpeg', 'image/png', 'video/mp4'],
},
```

### Phase 3: Update OAuth Config Panel
Update `src/features/social-engagement/components/admin/OAuthConfigPanel.tsx`:
- Add LinkedIn scopes to the helper function

```typescript
linkedin: ['r_liteprofile', 'r_organization_social', 'w_organization_social', 'rw_organization_admin'],
```

### Phase 4: Update Edge Function OAuth Scopes (if needed)
The `social-oauth-init` edge function already has LinkedIn configuration with these scopes:
- `r_liteprofile`
- `r_organization_social`  
- `w_organization_social`
- `rw_organization_admin`

These may need updating for the LinkedIn Marketing API v2 to include:
- `r_ads` (read ad accounts)
- `r_ads_reporting` (ad analytics)
- `w_member_social` (post on behalf of members)

## Technical Details

### LinkedIn App Requirements
Before connecting, you need a LinkedIn Developer App with:
1. **Products enabled**: Marketing Developer Platform, Sign In with LinkedIn
2. **OAuth 2.0 redirect URL**: `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/social-oauth-callback`
3. **Required permissions**: Posting, Company Pages, Analytics

### Files to Modify
| File | Change |
|------|--------|
| `src/features/social-engagement/config/socialBeacons.config.ts` | Add LinkedIn to platform type and config |
| `src/features/social-engagement/components/admin/OAuthConfigPanel.tsx` | Add LinkedIn scopes display |
| `supabase/functions/social-oauth-init/index.ts` | Update scopes if needed for Marketing API |
| Edge Function Secrets | Add `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |

### OAuth Flow
1. User clicks "Connect LinkedIn" in Social Beacons dashboard
2. `social-oauth-init` generates authorization URL with Client ID
3. User authorizes app on LinkedIn
4. LinkedIn redirects to `social-oauth-callback` with code
5. Edge function exchanges code for access token
6. Connection stored in `social_platform_connections` table
7. User can enable auto-posting and ad creative features

## Next Steps
Once you approve this plan:
1. I'll prompt you to add the `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` secrets
2. Update the beacon configuration to include LinkedIn
3. Test the OAuth flow end-to-end

Would you like to proceed?
