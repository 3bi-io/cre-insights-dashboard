

## Analysis: Broken "Full Application" Link

### Root Cause Found

There are **two distinct issues** causing the link to not work for applicants:

---

### Issue 1: RLS Blocks Anonymous Pre-fill (SMS Link Flow)

When an applicant receives an SMS with a link like:
```
https://applyai.jobs/apply/detailed?job_id=xxx&app_id=yyy
```

The `useDetailedApplicationForm` hook (line 284) tries to fetch the existing application data from the `applications` table using the **anonymous Supabase client**:

```typescript
const { data, error } = await supabase
  .from('applications')
  .select('first_name, last_name, ...')
  .eq('id', appIdFromUrl)
  .single();
```

However, **all RLS policies on `applications` require `authenticated` role**. There is no `anon` SELECT policy. The query silently fails, returning no data — so the form loads completely empty with no pre-fill, making it appear "broken" or pointless to the applicant.

### Issue 2: Thank You Page Button Relies on Ephemeral Router State

The "Complete Your Full Application" button on `/thank-you` uses `navigate()` with React Router `state`:

```typescript
navigate(`/apply/detailed${searchParams}`, {
  state: { prefill: { ...formData, applicationId } }
});
```

This **only works during the same browser session**. If the applicant:
- Closes the tab and reopens it later
- Shares the URL
- Bookmarks it
- Gets the link via email or SMS

...the `location.state` is `null`, so no pre-fill data is available. Combined with Issue 1, the form is completely blank.

### Issue 3: Confirmation Email Has No Link to Detailed App

The `application_received` email template contains no CTA or link to the detailed application form. The only way to reach it is through the ephemeral Thank You page button or the SMS flow (which is blocked by RLS).

---

### Proposed Fix

#### 1. Create a public edge function for application pre-fill
A new edge function `get-application-prefill` that accepts an `app_id` and returns only the safe, non-sensitive fields needed for pre-fill (name, email, phone, city, state, zip, CDL info). This bypasses RLS by using the service role key server-side while only exposing limited data.

#### 2. Update `useDetailedApplicationForm` to call the edge function
Replace the direct Supabase client query (which is blocked by RLS) with a call to the new edge function.

#### 3. Add detailed application link to confirmation email
Include a "Complete Your Full Application" CTA button in the `application_received` email template, linking to `/apply/detailed?job_id=xxx&app_id=yyy`.

#### 4. (Optional) Add link validation
Add a lightweight token or hash to the `app_id` URL parameter to prevent enumeration attacks (e.g., `app_id=uuid&token=hmac_hash`).

---

### Technical Details

**New edge function: `get-application-prefill`**
- Input: `{ app_id: string }`
- Output: Limited fields only (first_name, last_name, email, phone, city, state, zip, cdl, cdl_class, cdl_endorsements, exp, over_21, veteran)
- Uses service role to bypass RLS
- Rate-limited by app_id to prevent abuse

**Email template change** (`send-application-email/index.ts`):
- Add a CTA button after the "What's Next?" section
- URL format: `https://applyai.jobs/apply/detailed?job_id={jobListingId}&app_id={applicationId}`
- Requires passing `applicationId` and `jobListingId` to the email function

**Hook update** (`useDetailedApplicationForm.ts`, lines 282-322):
- Replace `supabase.from('applications').select(...)` with `fetch` to the new edge function

