

# Super Admin Social Beacon Distribution Management

## Executive Summary

Build a comprehensive Super Administrator interface for managing social media platform configurations and job ad distribution across **X (Twitter), Facebook, Instagram, WhatsApp, TikTok, and Reddit**. This will include credential management, OAuth configuration, ad creative generation, and platform-specific settings—all following enterprise-grade security patterns.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     Super Admin Social Beacons Hub                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   X/Twitter │  │  Facebook   │  │  Instagram  │  │  WhatsApp   │     │
│  │   ────────  │  │  ────────   │  │  ────────   │  │  ────────   │     │
│  │  OAuth 2.0  │  │   OAuth +   │  │  Meta Graph │  │  Business   │     │
│  │   + PKCE    │  │  Page Token │  │     API     │  │    API      │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐  │
│  │   TikTok    │  │   Reddit    │  │       Ad Creative Studio        │  │
│  │   ────────  │  │  ────────   │  │       ────────────────          │  │
│  │  Business   │  │  OAuth 2.0  │  │   AI-Powered Job Ad Generator   │  │
│  │    API      │  │     API     │  │   - Job Type Selection          │  │
│  └─────────────┘  └─────────────┘  │   - Benefits Multi-Select       │  │
│                                     │   - Preview + Export            │  │
│                                     └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Extend Platform Types and Configuration

**File: `src/features/organizations/types/platforms.types.ts`**

Add new social beacon platform keys:

```typescript
export type SocialBeaconPlatform =
  | 'x'           // Twitter/X
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'tiktok'
  | 'reddit';

export interface SocialBeaconConfig {
  platform: SocialBeaconPlatform;
  name: string;
  description: string;
  icon: React.ComponentType;
  color: string;
  bgColor: string;
  authType: 'oauth2' | 'oauth2_pkce' | 'api_key' | 'business_api';
  requiredSecrets: string[];
  optionalSecrets?: string[];
  webhookSupported: boolean;
  autoEngageSupported: boolean;
  adCreativeSupported: boolean;
  apiDocUrl?: string;
}
```

**File: `src/features/social-engagement/config/socialBeacons.config.ts`** (New)

Define complete platform configurations:

```typescript
export const SOCIAL_BEACONS: Record<SocialBeaconPlatform, SocialBeaconConfig> = {
  x: {
    platform: 'x',
    name: 'X (Twitter)',
    description: 'X/Twitter Ads API for job promotion and recruitment marketing',
    authType: 'oauth2_pkce',
    requiredSecrets: ['TWITTER_CONSUMER_KEY', 'TWITTER_CONSUMER_SECRET', 
                      'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_TOKEN_SECRET'],
    webhookSupported: true,
    autoEngageSupported: true,
    adCreativeSupported: true,
  },
  facebook: {
    platform: 'facebook',
    name: 'Facebook',
    description: 'Meta Business Suite for Facebook job ads and page engagement',
    authType: 'oauth2',
    requiredSecrets: ['META_APP_ID', 'META_APP_SECRET', 'META_ACCESS_TOKEN'],
    webhookSupported: true,
    autoEngageSupported: true,
    adCreativeSupported: true,
  },
  instagram: {
    platform: 'instagram',
    name: 'Instagram',
    description: 'Instagram Business for visual job marketing',
    authType: 'oauth2',
    requiredSecrets: ['META_APP_ID', 'META_APP_SECRET'],
    webhookSupported: true,
    autoEngageSupported: true,
    adCreativeSupported: true,
  },
  whatsapp: {
    platform: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'WhatsApp Business API for candidate communication',
    authType: 'business_api',
    requiredSecrets: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN'],
    webhookSupported: true,
    autoEngageSupported: true,
    adCreativeSupported: false,
  },
  tiktok: {
    platform: 'tiktok',
    name: 'TikTok',
    description: 'TikTok for Business API for video job ads',
    authType: 'oauth2',
    requiredSecrets: ['TIKTOK_APP_ID', 'TIKTOK_APP_SECRET'],
    webhookSupported: false,
    autoEngageSupported: false,
    adCreativeSupported: true,
  },
  reddit: {
    platform: 'reddit',
    name: 'Reddit',
    description: 'Reddit Ads API for community-targeted job promotion',
    authType: 'oauth2',
    requiredSecrets: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'],
    webhookSupported: false,
    autoEngageSupported: false,
    adCreativeSupported: true,
  },
};
```

---

### Phase 2: Create Super Admin Social Beacons Page

**File: `src/features/social-engagement/pages/SuperAdminSocialBeacons.tsx`** (New)

Main page with tabs for:
- **Platform Credentials** - Manage API keys and secrets for all platforms
- **OAuth Configuration** - Configure OAuth endpoints and callback URLs
- **Ad Creative Studio** - AI-powered job ad generator (matching reference image)
- **Global Settings** - Default response templates, auto-engage rules
- **Analytics** - Cross-platform performance metrics

```typescript
export function SuperAdminSocialBeacons() {
  return (
    <PageLayout
      title="Social Beacons"
      description="Super administrator configuration for social media distribution"
    >
      <Tabs defaultValue="credentials">
        <TabsList>
          <TabsTrigger value="credentials">Platform Credentials</TabsTrigger>
          <TabsTrigger value="oauth">OAuth Setup</TabsTrigger>
          <TabsTrigger value="creative">Ad Creative Studio</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credentials">
          <PlatformCredentialsManager />
        </TabsContent>
        {/* ... other tabs */}
      </Tabs>
    </PageLayout>
  );
}
```

---

### Phase 3: Platform Credentials Manager Component

**File: `src/features/social-engagement/components/admin/PlatformCredentialsManager.tsx`** (New)

A grid of credential cards for each platform with:
- Connection status indicator
- Required secrets checklist with configuration status
- Test connection button
- Last sync timestamp
- Quick actions (configure, test, disable)

```typescript
export function PlatformCredentialsManager() {
  const { secrets, isLoading } = useSecretsStatus();
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.values(SOCIAL_BEACONS).map(platform => (
        <PlatformCredentialCard
          key={platform.platform}
          config={platform}
          configuredSecrets={secrets}
          onConfigure={() => handleConfigure(platform)}
          onTest={() => handleTest(platform)}
        />
      ))}
    </div>
  );
}
```

Each card displays:
- Platform icon and name
- Auth type badge (OAuth 2.0, API Key, etc.)
- Secrets status (✓ configured / ✗ missing)
- Feature availability (Webhooks, Auto-Engage, Ad Creative)

---

### Phase 4: Ad Creative Studio (Reference Image Implementation)

**File: `src/features/social-engagement/components/admin/AdCreativeStudio.tsx`** (New)

Implements the UI from the reference image:

```typescript
interface AdCreativeConfig {
  jobType: 'long_haul' | 'regional' | 'local' | 'dedicated' | 'team';
  benefits: string[];
  headline: string;
  body: string;
  hashtags: string[];
  mediaType: 'ai_image' | 'ai_video' | 'upload';
  aspectRatio: '16:9' | '1:1' | '9:16' | '4:5';
}

const BENEFIT_OPTIONS = [
  { id: 'sign_on_bonus', label: '$5k Sign-on Bonus', icon: DollarSign },
  { id: 'home_weekly', label: 'Home Weekly', icon: Home },
  { id: 'new_equipment', label: 'New Equipment', icon: Truck },
  { id: 'full_benefits', label: 'Full Benefits', icon: Heart },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: PawPrint },
  { id: 'no_touch_freight', label: 'No Touch Freight', icon: Package },
  { id: 'paid_orientation', label: 'Paid Orientation', icon: GraduationCap },
  { id: 'safety_bonuses', label: 'Safety Bonuses', icon: Shield },
];

export function AdCreativeStudio() {
  const [config, setConfig] = useState<AdCreativeConfig>(defaultConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<GeneratedAd | null>(null);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateAdCreative(config);
    setPreview(result);
    setIsGenerating(false);
  };
  
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuration Panel */}
      <Card className="p-6 space-y-6 bg-slate-900 border-slate-700">
        <div>
          <Label>Job Type</Label>
          <Select value={config.jobType} onValueChange={...}>
            <SelectItem value="long_haul">Long Haul</SelectItem>
            <SelectItem value="regional">Regional</SelectItem>
            {/* ... */}
          </Select>
        </div>
        
        <div>
          <Label>Key Benefits (Select all that apply)</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {BENEFIT_OPTIONS.map(benefit => (
              <BenefitToggle
                key={benefit.id}
                benefit={benefit}
                selected={config.benefits.includes(benefit.id)}
                onToggle={() => toggleBenefit(benefit.id)}
              />
            ))}
          </div>
        </div>
        
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Concept
        </Button>
      </Card>
      
      {/* Preview Panel */}
      <Card className="p-6 bg-slate-900 border-slate-700">
        <h3 className="text-sm text-muted-foreground mb-4 text-center">
          AD PREVIEW
        </h3>
        <AdPreviewCard preview={preview} />
      </Card>
    </div>
  );
}
```

---

### Phase 5: Database Schema Updates

**New table: `social_beacon_configurations`**

```sql
CREATE TABLE social_beacon_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('x', 'facebook', 'instagram', 'whatsapp', 'tiktok', 'reddit')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- NULL organization_id = global/super-admin config
  
  -- OAuth Configuration
  oauth_client_id TEXT,
  oauth_redirect_uri TEXT,
  oauth_scopes TEXT[],
  
  -- Webhook Configuration  
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_verified_at TIMESTAMPTZ,
  
  -- Feature Flags
  auto_engage_enabled BOOLEAN DEFAULT false,
  ad_creative_enabled BOOLEAN DEFAULT false,
  
  -- Platform-specific settings stored as JSONB
  settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(platform, organization_id)
);

-- RLS: Only super_admin can manage global configs (org_id IS NULL)
ALTER TABLE social_beacon_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage global configs"
  ON social_beacon_configurations
  FOR ALL
  USING (
    organization_id IS NULL AND public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Org admins manage their configs"
  ON social_beacon_configurations
  FOR ALL
  USING (
    organization_id IS NOT NULL 
    AND organization_id IN (
      SELECT organization_id FROM user_organization_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

**New table: `generated_ad_creatives`**

```sql
CREATE TABLE generated_ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  
  -- Configuration used to generate
  job_type TEXT NOT NULL,
  benefits TEXT[] NOT NULL,
  
  -- Generated content
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  hashtags TEXT[],
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('ai_image', 'ai_video', 'upload')),
  aspect_ratio TEXT DEFAULT '16:9',
  
  -- Distribution tracking
  platforms_published TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Phase 6: Edge Functions for New Platforms

**File: `supabase/functions/tiktok-oauth-init/index.ts`** (New)

TikTok OAuth 2.0 initialization:

```typescript
const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize';
const SCOPES = ['user.info.basic', 'video.list', 'video.publish'];

// Generate OAuth URL with PKCE and redirect to TikTok
```

**File: `supabase/functions/reddit-oauth-init/index.ts`** (New)

Reddit OAuth 2.0 initialization:

```typescript
const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const SCOPES = ['identity', 'submit', 'read'];

// Generate OAuth URL and redirect to Reddit
```

**File: `supabase/functions/generate-ad-creative/index.ts`** (New)

AI-powered ad creative generation using existing Anthropic/Grok:

```typescript
// Generate headline, body, and hashtags based on job type and benefits
// Return structured content for preview
// Optionally trigger image generation via existing generate-logo or new endpoint
```

---

### Phase 7: Update social-oauth-init/callback

**File: `supabase/functions/social-oauth-init/index.ts`** (Modified)

Add TikTok and Reddit to OAUTH_CONFIGS:

```typescript
const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  // ... existing facebook, instagram, twitter, linkedin ...
  
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    scopes: ['user.info.basic', 'video.list', 'video.publish'],
    clientIdEnv: 'TIKTOK_APP_ID',
  },
  reddit: {
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    scopes: ['identity', 'submit', 'read'],
    clientIdEnv: 'REDDIT_CLIENT_ID',
  },
};
```

---

### Phase 8: Update SocialPlatform Type

**File: `src/features/social-engagement/hooks/useSocialConnections.ts`** (Modified)

```typescript
export type SocialPlatform = 
  | 'facebook' 
  | 'instagram' 
  | 'whatsapp' 
  | 'twitter' 
  | 'linkedin'
  | 'tiktok'   // NEW
  | 'reddit';  // NEW
```

---

### Phase 9: Routing and Navigation

**File: `src/App.tsx`** (Modified)

Add new route:

```typescript
<Route 
  path="/admin/social-beacons" 
  element={
    <RoleGuard requiredRole="super_admin">
      <SuperAdminSocialBeacons />
    </RoleGuard>
  } 
/>
```

**Update Super Admin Dashboard Settings Tab:**

Add link to Social Beacons in the Settings tab of the Super Admin Dashboard.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/features/social-engagement/config/socialBeacons.config.ts` | Platform configuration definitions |
| `src/features/social-engagement/pages/SuperAdminSocialBeacons.tsx` | Main admin page |
| `src/features/social-engagement/components/admin/PlatformCredentialsManager.tsx` | Credentials management grid |
| `src/features/social-engagement/components/admin/PlatformCredentialCard.tsx` | Individual platform card |
| `src/features/social-engagement/components/admin/AdCreativeStudio.tsx` | AI ad generator (reference image) |
| `src/features/social-engagement/components/admin/AdPreviewCard.tsx` | Social ad preview component |
| `src/features/social-engagement/components/admin/BenefitToggle.tsx` | Selectable benefit chip |
| `src/features/social-engagement/components/admin/OAuthConfigPanel.tsx` | OAuth settings panel |
| `src/features/social-engagement/components/admin/GlobalSettingsPanel.tsx` | Default templates/rules |
| `src/features/social-engagement/hooks/useAdCreative.ts` | Hook for ad generation |
| `src/features/social-engagement/hooks/useSecretsStatus.ts` | Hook to check configured secrets |
| `supabase/functions/generate-ad-creative/index.ts` | AI ad content generation |

## Files to Modify

| File | Changes |
|------|---------|
| `src/features/social-engagement/hooks/useSocialConnections.ts` | Add tiktok, reddit to SocialPlatform type |
| `src/features/social-engagement/hooks/useSocialOAuth.ts` | Support new platforms |
| `src/features/social-engagement/components/PlatformConnectionCard.tsx` | Add TikTok/Reddit icons |
| `src/features/social-engagement/components/SocialOAuthDialog.tsx` | Add TikTok/Reddit info |
| `supabase/functions/social-oauth-init/index.ts` | Add TikTok/Reddit OAuth configs |
| `supabase/functions/social-oauth-callback/index.ts` | Handle TikTok/Reddit callbacks |
| `src/features/dashboard/components/tabs/SettingsTab.tsx` | Add Social Beacons link |
| `src/App.tsx` | Add /admin/social-beacons route |

---

## Required Secrets (User Must Add Manually)

| Platform | Secrets Required |
|----------|-----------------|
| X (Twitter) | TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET |
| TikTok | TIKTOK_APP_ID, TIKTOK_APP_SECRET |
| Reddit | REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET |
| Meta (FB/IG) | Already configured: META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN |
| WhatsApp | WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN |

---

## Security Considerations

1. **Super Admin Only**: All credential management and global configuration locked to super_admin role via RLS
2. **Secrets Storage**: All API keys stored in Supabase secrets, never in codebase
3. **OAuth State Validation**: Existing CSRF protection with nonce and timestamp validation
4. **Webhook Verification**: Each platform uses signed webhook secrets
5. **Audit Logging**: All configuration changes logged to audit_logs table

---

## UI Design Notes

Following the reference image style:
- Dark theme with slate/gray backgrounds
- Cyan-to-blue gradient for primary actions
- Toggle chips for multi-select benefits
- Real-time preview panel showing social post mock-up
- Platform-appropriate preview styling (X card format shown)

