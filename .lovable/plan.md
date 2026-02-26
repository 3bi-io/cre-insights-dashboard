

## Remove Duplicate Application Restriction

### Problem
The `submit-application` edge function blocks users from reapplying to the same job within 30 days, returning a 409 error. This prevents legitimate reapplications and applying to multiple positions.

### Changes

**1. Edge Function: `supabase/functions/submit-application/index.ts`**

Remove the duplicate application check entirely:

- **Delete** the `checkDuplicateApplication` function (lines 646-682) -- the entire function that queries for existing applications by email + job listing within 30 days
- **Delete** the call site and 409 response block (lines 857-881) -- the code that calls `checkDuplicateApplication` and returns the rejection response

**2. Frontend: `src/hooks/useApplicationForm.ts`**

- Remove the special 409 handling (lines ~175-178) since the server will no longer return that status code

**3. Frontend: `src/hooks/useEmbedApplicationForm.ts`**

- Remove the special 409 handling (lines ~206-210) for the same reason

### What stays the same
- No database constraints need to change (there's no unique constraint on email + job listing)
- The application form, thank-you page, and outbound call triggers are unaffected
- All other validation (required fields, phone format, etc.) remains intact

### Impact
- Users can apply to the same job multiple times
- Users can apply to different jobs without any cooldown period
- The edge function will simply insert a new application each time

