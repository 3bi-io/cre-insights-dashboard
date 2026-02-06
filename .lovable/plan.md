

# Industry Template System Implementation Plan

## Executive Summary

This plan adds a new **Industry Vertical Template** feature that allows organizations to select an industry type (Transportation, Healthcare, Cyber, or Trades) during creation or via settings. This selection automatically configures:
- Default job board platforms relevant to that industry
- Industry-specific AI prompts and voice agent configurations
- Pre-enabled features appropriate for the vertical
- Customized terminology and branding hints

---

## Current State Analysis

### What Exists Today
- **Organization settings**: JSONB `settings` column stores feature toggles
- **Platform access**: `organization_platform_access` table manages job board enablement
- **Feature management**: `organization_features` table controls AI/integration access
- **Hero industry tags**: Marketing badges showing "Transportation, Cyber, Trades, Healthcare" (static display only)
- **AI settings**: `industry_focus` field exists in `ai_settings` table (user-level, not org-level)

### Gap Identified
No organization-level industry vertical field exists. Platform and feature defaults are not tied to industry selection.

---

## Implementation Overview

```text
+---------------------------+
|   Organization Creation   |
|   or Settings Update      |
+-------------+-------------+
              |
              v
+---------------------------+
|  Industry Vertical Select |
|  (Transportation, Health- |
|   care, Cyber, Trades)    |
+-------------+-------------+
              |
              v
+---------------------------+
|   Apply Industry Template |
|   - Platform Presets      |
|   - Feature Presets       |
|   - AI Configuration      |
+---------------------------+
```

---

## Phase 1: Database Schema Changes

### 1.1 Add Industry Vertical Column

Add a new column to the `organizations` table:

```sql
ALTER TABLE organizations 
ADD COLUMN industry_vertical TEXT DEFAULT 'transportation';
```

Valid values: `transportation`, `healthcare`, `cyber`, `trades`, `general`

### 1.2 Create Industry Templates Reference Table (Optional Enhancement)

For extensibility, create a reference table storing template configurations:

```sql
CREATE TABLE industry_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  default_platforms JSONB DEFAULT '[]',
  default_features JSONB DEFAULT '[]',
  ai_prompt_hints JSONB DEFAULT '{}',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Seed with initial templates for each industry.

---

## Phase 2: TypeScript Type Definitions

### 2.1 New Type File: `industryTemplates.types.ts`

```typescript
export type IndustryVertical = 
  | 'transportation' 
  | 'healthcare' 
  | 'cyber' 
  | 'trades' 
  | 'general';

export interface IndustryTemplateConfig {
  vertical: IndustryVertical;
  displayName: string;
  description: string;
  icon: string;
  defaultPlatforms: string[];
  defaultFeatures: string[];
  aiPromptHints: {
    industryContext: string;
    terminology: string[];
    screeningFocus: string[];
  };
}
```

### 2.2 Update Organization Interface

Add `industry_vertical` to the `Organization` type in `src/types/common.types.ts`.

---

## Phase 3: Industry Template Configuration

### 3.1 New Config File: `industryTemplates.config.ts`

Define pre-built configurations for each vertical:

| Vertical | Default Platforms | Default Features | AI Context |
|----------|------------------|------------------|------------|
| **Transportation** | Google Jobs, Indeed, Truck Driver Jobs 411, NewJobs4You, RoadWarriors | Voice Agent, Tenstreet, ElevenLabs | CDL requirements, DOT compliance, route experience |
| **Healthcare** | Google Jobs, Indeed, Glassdoor | Voice Agent, Background Check, Advanced Analytics | Licensure verification, HIPAA awareness, shift flexibility |
| **Cyber** | Google Jobs, Indeed, LinkedIn (future) | OpenAI, Anthropic, Advanced Analytics | Security clearances, certifications, remote capability |
| **Trades** | Google Jobs, Indeed, Craigslist | Voice Agent, Background Check | Apprenticeship status, tool ownership, union membership |
| **General** | Google Jobs, Indeed | Basic features | General screening |

---

## Phase 4: UI Components

### 4.1 Industry Selector Component

Create `IndustryVerticalSelector.tsx`:
- Card-based selector with icons for each industry
- Visual feedback for selected industry
- Description of what gets configured

### 4.2 Update Create Organization Dialog

Modify `CreateOrganizationDialog.tsx`:
- Add industry selector step
- Pass selected vertical to organization creation

### 4.3 Update Edit Organization Dialog

Modify `EditOrganizationDialog.tsx`:
- Add industry vertical field (changeable by super_admin)
- Show current template settings

### 4.4 Organization Settings Tab

Add "Industry Template" section to `OrganizationSettings.tsx`:
- Display current industry vertical
- Option to "Reset to Template Defaults" (re-applies platform/feature presets)

---

## Phase 5: Backend Logic

### 5.1 Update Organization Creation RPC

Modify `create_organization` database function:
- Accept `_industry_vertical` parameter
- After org creation, auto-insert default platform access records
- Auto-insert default feature records based on template

### 5.2 Apply Template Function

Create new RPC `apply_industry_template`:

```sql
CREATE FUNCTION apply_industry_template(
  _org_id UUID, 
  _vertical TEXT,
  _reset_existing BOOLEAN DEFAULT false
) RETURNS void
```

This function:
1. If `_reset_existing`, clears current platform/feature settings
2. Inserts platform access records for the template
3. Inserts feature records for the template
4. Updates AI settings defaults if applicable

### 5.3 Update Organization Service

Modify `OrganizationService.ts`:
- Add `applyIndustryTemplate()` method
- Update `createOrganization()` to accept and use industry vertical

---

## Phase 6: Integration Points

### 6.1 Voice Agent Configuration

When industry vertical is set:
- Store industry context in organization settings
- Voice agent prompts reference `settings.industry_context` for screening questions

### 6.2 AI Screening Prompts

The `aiService.ts` already supports `industryFocus`. Connect this to:
- Pull from organization's `industry_vertical`
- Use template-defined `aiPromptHints` for context

### 6.3 Job Form Defaults

Optionally pre-populate job creation forms:
- Default job categories based on industry
- Suggested requirements/qualifications

---

## Technical Details

### File Changes Summary

| File | Change Type | Purpose |
|------|-------------|---------|
| `src/features/organizations/types/industryTemplates.types.ts` | New | Type definitions |
| `src/features/organizations/config/industryTemplates.config.ts` | New | Template configurations |
| `src/features/organizations/components/IndustryVerticalSelector.tsx` | New | Selection UI component |
| `src/types/common.types.ts` | Modify | Add `industry_vertical` to Organization |
| `src/components/admin/CreateOrganizationDialog.tsx` | Modify | Add industry selection step |
| `src/components/admin/EditOrganizationDialog.tsx` | Modify | Add industry field |
| `src/components/organizations/OrganizationSettings.tsx` | Modify | Add industry template tab |
| `src/features/admin/services/organizationService.ts` | Modify | Add template application logic |

### Database Changes Summary

| Object | Type | Purpose |
|--------|------|---------|
| `organizations.industry_vertical` | Column | Store selected vertical |
| `industry_templates` | Table (optional) | Store template configurations |
| `apply_industry_template()` | Function | Apply template defaults to org |
| `create_organization()` | Function (modify) | Accept and use industry parameter |

---

## Implementation Sequence

1. **Database Migration**: Add `industry_vertical` column to organizations
2. **Type Definitions**: Create TypeScript types for industry templates
3. **Configuration File**: Define template presets for all 4 industries
4. **Selector Component**: Build the visual industry picker
5. **Dialog Updates**: Integrate selector into create/edit flows
6. **Backend Function**: Create `apply_industry_template` RPC
7. **Service Layer**: Connect frontend to backend template application
8. **Settings UI**: Add template management to organization settings
9. **Testing**: Verify template application and platform/feature defaults

---

## Notes

- Existing organizations will default to `transportation` (current implicit vertical)
- Industry change does NOT auto-reset settings (optional "Reset to Defaults" action)
- Super admins can override any template-set defaults manually
- Templates are starting points, not restrictions

