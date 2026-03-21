

# Matthew Pineau Tenstreet Sync Failure — Root Cause Analysis & Fix Plan

## Findings

### 1. Data Quality Issue: Name Field Corruption
The application has **corrupted name data**:
- `first_name` = "Matthew Pineau" (should be just "Matthew")
- `last_name` = "Matthew Pineau" (should be just "Pineau")
- `full_name` = "Matthew Pineau Matthew Pineau"

The full name was stored in both `first_name` and `last_name` fields, likely due to a Facebook Lead Ads parsing issue where the full name was placed into both fields.

### 2. Tenstreet Rejection
The `ats_sync_logs` entry shows:
- **Status**: `failed`
- **Error**: `Request rejected: <?xml version="1.0" encoding="UTF-8"?><TenstreetResponse>...CompanyPostedToId>1680394</CompanyPostedToId>...` (truncated at 218 chars — the full rejection reason is cut off)
- **ATS Connection**: James Burg Trucking Company (company ID 1680394, client ID 601)
- **Duration**: 191ms — the request reached Tenstreet and was actively rejected

The error message is truncated in the database, so we can't see the exact rejection reason. However, the XML payload was sent with `GivenName=Matthew Pineau` and `FamilyName=Matthew Pineau` which could trigger Tenstreet's validation.

### 3. Routing Was Correct
The application belongs to `job_listing_id: 71711702` → `client_id: b2a29507` (James Burg Trucking Company) → `organization_id: 84214b48` (Hayes Recruiting Solutions). The ATS connection `89b01bd3` correctly maps to this client. Routing is not the issue.

## Fix Plan

### Step 1: Fix Matthew Pineau's application data
Run a database migration to correct the name fields:
- `first_name` → "Matthew"
- `last_name` → "Pineau"
- `full_name` → "Matthew Pineau"

### Step 2: Increase error_message column length in ats_sync_logs
The `error_message` column truncated the Tenstreet XML response at 218 chars, hiding the actual rejection reason. Change the column to `TEXT` type (if it's `VARCHAR`) or ensure the code stores the full error (up to at least 2000 chars).

### Step 3: Re-trigger Tenstreet sync for the application
Use the `ats-integration` edge function to manually re-post the corrected application to Tenstreet. This will:
- Send the corrected first/last name
- Log the new attempt in `ats_sync_logs`
- Update `tenstreet_sync_status` on success

### Step 4: Add name-parsing guard in submit-application
Add a defensive check in the application submission flow: if `first_name` contains a space and `last_name` is identical to `first_name`, split the value into proper first/last name fields. This prevents the same issue for future Facebook leads.

## Technical Details

- **Application ID**: `18867281-ca05-42f3-9cef-9972bb440101`
- **ATS Connection ID**: `89b01bd3-2533-47ad-89ea-196c12f5c136`
- **Tenstreet Company ID**: `1680394` (James Burg Trucking)
- **Tenstreet Client ID**: `601`
- **Source**: Facebook (campaign `6967682745257`)

