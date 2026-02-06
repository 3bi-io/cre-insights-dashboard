

## Upload Hayes AI Recruiting Logo

### What will be done

1. **Copy the uploaded logo** into the project at `public/images/hayes-ai-logo.png` so it is served as a static asset from the application.

2. **Update the database** via a SQL migration to set the `logo_url` on the Hayes AI Recruiting client record (`49dce1cb-4830-440d-8835-6ce59b552012`) to point to the hosted image path (`/images/hayes-ai-logo.png`).

3. **Update job listings** -- the existing job listing for this client will automatically pick up the logo through the `clients.logo_url` join already in place on the /jobs page and job detail pages.

### Result

- The Hayes AI Recruiting logo (truck/road graphic with "Hayes AI Recruiting" text) will appear on:
  - The /jobs listing page next to the CDL A Truck Driver job
  - The job detail page
  - The application form page
  - The Clients management table in the admin dashboard
- No code changes are needed -- the existing `CompanyLogo` and `LogoAvatar` components already read from `clients.logo_url`.

### Technical Details

**File operation:**
- `lov-copy user-uploads://hayes-ai-logo-7JibRqj1.png public/images/hayes-ai-logo.png`

**SQL Migration:**
```sql
UPDATE public.clients
SET logo_url = '/images/hayes-ai-logo.png', updated_at = now()
WHERE id = '49dce1cb-4830-440d-8835-6ce59b552012';
```

> Note: Using a relative path ensures the logo works in both preview and published environments. The existing components (CompanyLogo, LogoAvatar) already handle relative and absolute image URLs.

