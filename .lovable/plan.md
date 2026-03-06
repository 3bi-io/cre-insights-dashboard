

## Source and Implement AspenView Logo

### Current State
- **Client** `Aspenview Technology Partners` (ID: `82513316-...`) has `logo_url: null`
- **Organization** `Aspen Analytics` (ID: `9335c64c-...`) has `logo_url: null`
- The AspenView logo SVG is available at: `https://aspenview.com/wp-content/uploads/2025/05/logo_aspen_view_technology_partners.svg`
- Existing client logos follow the pattern of being stored in `public/logos/` and referenced via `https://applyai.jobs/logos/`

### What Needs To Happen

**1. Download and host the AspenView logo locally**
- Save the SVG logo from `aspenview.com` to `public/logos/aspenview-technology-partners.svg`
- This follows the existing stable hosting pattern at `https://applyai.jobs/logos/`

**2. Update Client record** (data operation)
```sql
UPDATE clients 
SET logo_url = 'https://applyai.jobs/logos/aspenview-technology-partners.svg',
    city = 'San Juan', 
    state = 'PR'
WHERE id = '82513316-7df2-4bf0-83d8-6c511c83ddfb';
```

**3. Update Organization record** (data operation)
```sql
UPDATE organizations 
SET logo_url = 'https://applyai.jobs/logos/aspenview-technology-partners.svg'
WHERE id = '9335c64c-b793-4578-bf51-63d0c3b5d66d';
```

### Impact (no code changes needed)
Once the `logo_url` fields are populated, all existing components automatically pick it up:
- `/clients` page — `ClientCard` renders the logo via `LogoAvatar`
- `/jobs` page — job cards show client logo
- `/apply` page — application form header displays client logo
- Email headers — `send-application-email` passes `clientLogoUrl` from DB
- Dashboard sidebar — org logo via `useAuth` → `organization.logo_url`
- Branding panel — `OrganizationBrandingPanel` displays current logo

### Files
- **Create** `public/logos/aspenview-technology-partners.svg` (downloaded from aspenview.com)
- **Data updates** to `clients` and `organizations` tables (2 UPDATE statements)

