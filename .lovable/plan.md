

# Reassign William Caughron to Danny Herman Trucking

## Problem
William Caughron's application (ID: `d8012012-0f9a-4237-a4ec-84a0627d427b`) is currently routed to **Pemberton Truck Lines** but should be under **Danny Herman Trucking**.

| Field | Current | Correct |
|-------|---------|---------|
| **Client** | Pemberton Truck Lines (`67cadf11...`) | Danny Herman Trucking (`1d54e463...`) |
| **Job Listing** | Pemberton "General Application" (`9e845a00...`) | Danny Herman "General Application" (`6a86d135...`) |

## Fix
A single data update to reassign the application to Danny Herman's "General Application" listing, with an admin note documenting the change:

```sql
UPDATE applications 
SET job_listing_id = '6a86d135-aeab-401b-bc00-50f923f81eb5',
    notes = COALESCE(notes || E'\n', '') || '[Admin] Reassigned from Pemberton to Danny Herman Trucking - 2026-02-12'
WHERE id = 'd8012012-0f9a-4237-a4ec-84a0627d427b';
```

## Scope
- One database UPDATE statement (no schema or code changes)
- No migration needed -- this is a data correction

