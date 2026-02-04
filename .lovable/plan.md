
# Update Email Templates: Organization Name → Client Name

## Overview

Change all applicant-facing email templates to display the **Client Name** instead of the **Organization Name**, maintaining privacy about the recruiting organization while showing the brand the applicant is applying to work for.

## Context

Currently, emails to applicants show the recruiting organization (e.g., "Hayes Recruiting Solutions") when they should show the client company (e.g., "Pemberton Truck Lines Inc", "Danny Herman Trucking"). This aligns with the existing privacy model implemented on public job pages.

**Example:**
- **Before**: "Thank you for applying for the CDL Driver position at Hayes Recruiting Solutions"
- **After**: "Thank you for applying for the CDL Driver position at Pemberton Truck Lines Inc"

## Email Types & Changes

| Email Type | Current Name | New Name | Reason |
|------------|--------------|----------|--------|
| Application Received | Organization Name | Client Name | Applicant-facing |
| Status Update | Organization Name | Client Name | Applicant-facing |
| Interview Invitation | Organization Name | Client Name | Applicant-facing |
| Job Offer | Organization Name | Client Name | Applicant-facing |
| Rejection | Organization Name | Client Name | Applicant-facing |
| Screening Request | Organization Name | Client Name | Applicant-facing |
| **Welcome Email** | Organization Name | **No Change** | Internal admin users |
| **Invite Email** | Organization Name | **No Change** | Internal admin users |

## Implementation Details

### File 1: `supabase/functions/submit-application/index.ts`

**Changes:**
1. Update the `resolveOrganizationAndJob` function to also fetch client name from job listings
2. Rename return value from `organizationName` to `clientName` 
3. Update the query to include client data: `clients(id, name)`
4. Pass `clientName` to the confirmation email

**Before (line ~415):**
```typescript
.select('organization_id, external_job_id, title, organizations(id, name, slug)')
```

**After:**
```typescript
.select('organization_id, external_job_id, title, client_id, organizations(id, name, slug), clients(id, name)')
```

**Updated return type:**
```typescript
{ organizationId, organizationName, clientName, externalJobId, jobTitle }
```

**Updated email call (~line 521):**
```typescript
companyName: clientName || organizationName,  // Use client name for applicant emails
```

### File 2: `supabase/functions/send-screening-request/index.ts`

**Changes:**
Update the application query to include client data and use client name.

**Before (line ~289):**
```typescript
.select('*, job_listings(title, organization_id, organizations(name))')
...
const organizationName = application.job_listings?.organizations?.name || 'Organization';
```

**After:**
```typescript
.select('*, job_listings(title, organization_id, client_id, organizations(name), clients(name))')
...
const clientName = application.job_listings?.clients?.name || 
                   application.job_listings?.organizations?.name || 
                   'Company';
```

Then use `clientName` instead of `organizationName` in the email template generation.

### File 3: `supabase/functions/_shared/email-config.ts`

**Changes:**
Update preheader templates to use more generic naming.

**Before (line ~294):**
```typescript
employment_application: (orgName: string) => 
  `Please complete your employment application for ${orgName}.`,
```

**After:**
```typescript
employment_application: (companyName: string) => 
  `Please complete your employment application for ${companyName}.`,
```

### File 4: `src/utils/emailService.ts`

**Changes:**
Add `companyName` parameter to the interface and helper functions.

**Before:**
```typescript
export interface SendEmailParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  type: ...
}
```

**After:**
```typescript
export interface SendEmailParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName?: string;  // Client name for branded emails
  type: ...
}
```

Update helper functions to accept and pass through `companyName`:
```typescript
export const sendApplicationReceivedEmail = async (
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  companyName?: string  // New parameter
) => {
  return sendApplicationEmail({
    to: candidateEmail,
    candidateName,
    jobTitle,
    companyName: companyName || 'Company',
    type: 'application_received',
  });
};
```

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/submit-application/index.ts` | MODIFY | Fetch and use client name for emails |
| `supabase/functions/send-screening-request/index.ts` | MODIFY | Fetch and use client name for screening emails |
| `supabase/functions/_shared/email-config.ts` | MODIFY | Update parameter naming in templates |
| `src/utils/emailService.ts` | MODIFY | Add companyName parameter support |

## Fallback Logic

When determining the company name for emails:
1. **First**: Use `clients.name` if job has a client assigned
2. **Second**: Use `organizations.name` as fallback
3. **Third**: Use generic "Company" as last resort

This ensures:
- Jobs with clients show client branding (e.g., "Danny Herman Trucking")
- Jobs without clients fall back to organization name (e.g., "CR England")
- Missing data shows a generic fallback

## Testing Considerations

After implementation:
1. Submit a test application for a job with a client assigned
2. Verify the confirmation email shows the client name, not org name
3. Trigger a screening request and verify the client name appears
4. Test a job without a client to verify fallback to organization name
