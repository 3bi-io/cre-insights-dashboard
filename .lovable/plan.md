

## Add Client Logos to Email Templates

### Overview
Most clients already have `logo_url` set in the database. The main work is:
1. Fix a few inconsistent logo URLs (use stable `applyai.jobs/logos/` paths)
2. Update the email pipeline to pass the client's logo URL through to the email template
3. Render the client logo in the email header alongside or instead of the platform logo

### Current State
All clients except "Unassigned" already have logo URLs. Two use external URLs where local copies exist:

| Client | Current logo_url | Fix |
|--------|-----------------|-----|
| Day and Ross | External seeklogo.com URL | Update to `https://applyai.jobs/logos/day-and-ross.jpeg` |
| Novco, Inc. | External cloudfront URL | Update to `https://applyai.jobs/logos/novco.png` |
| Hayes AI Recruiting | Relative path `/images/...` | No local logo file exists -- skip or leave as-is |

### Changes

**1. Fix Logo URLs (Data Update)**
- Update `Day and Ross` logo_url to `https://applyai.jobs/logos/day-and-ross.jpeg`
- Update `Novco, Inc.` logo_url to `https://applyai.jobs/logos/novco.png`

**2. Email Pipeline: Pass `clientLogoUrl`**
- **`supabase/functions/submit-application/index.ts`**: When sending the confirmation email, also look up the client's `logo_url` from the job listing's client record and pass it as `clientLogoUrl` in the request body to `send-application-email`.

**3. Email Template: Render Client Logo**
- **`supabase/functions/send-application-email/index.ts`**: Accept optional `clientLogoUrl` in `EmailRequest`. When present, display the client logo in the email header (centered, above the title) instead of the default Apply AI logo.
- **`supabase/functions/_shared/email-config.ts`**: Update `getEmailHeader()` to accept an optional `clientLogoUrl` parameter. When provided, render the client logo; otherwise fall back to the Apply AI platform logo.

**4. Frontend Email Service**
- **`src/utils/emailService.ts`**: Add optional `clientLogoUrl` to `SendEmailParams` so status update, interview, offer, and rejection emails can also include the client logo when triggered from the dashboard.

### Technical Details

```text
Email flow with client logo:

submit-application
  -> resolves client from job_listing
  -> reads client.logo_url
  -> calls send-application-email with { clientLogoUrl: "https://applyai.jobs/logos/hubgroup-logo.png" }

send-application-email
  -> passes clientLogoUrl to getEmailHeader()
  -> getEmailHeader renders client logo if provided, else Apply AI logo
```

### Files to Modify
| File | Change |
|------|--------|
| `supabase/functions/submit-application/index.ts` | Pass `clientLogoUrl` to email call |
| `supabase/functions/send-application-email/index.ts` | Accept + use `clientLogoUrl` |
| `supabase/functions/_shared/email-config.ts` | Update `getEmailHeader()` to support client logo |
| `src/utils/emailService.ts` | Add optional `clientLogoUrl` param |

### Data Updates
- UPDATE `clients` SET `logo_url` for Day and Ross and Novco to use stable applyai.jobs paths

