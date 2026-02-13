

# Fix James Burg Feed Configuration

## Problem
The James Burg Trucking feed URL has two incorrect values, causing it to return zero jobs:
- **User code**: `James-Burg-Trucking-1770928232` (missing "Company")
- **Board**: `AIRecruiter` (should be `ATSme`)

**Correct URL**: `https://cdljobcast.com/client/recruiting/getfeeds?user=James-Burg-Trucking-Company-1770928232&board=ATSme`

This URL was verified and returns multiple job listings.

## Changes

### 1. supabase/functions/_shared/hayes-client-handler.ts (lines 431-432)
- Change `feedUserCode` from `'James-Burg-Trucking-1770928232'` to `'James-Burg-Trucking-Company-1770928232'`
- Change `feedBoard` from `'AIRecruiter'` to `'ATSme'`

### 2. supabase/functions/sync-cdl-feeds/index.ts (line 40)
- Update feed URL from `...user=James-Burg-Trucking-1770928232&board=AIRecruiter` to `...user=James-Burg-Trucking-Company-1770928232&board=ATSme`

### 3. Deploy edge functions
- Redeploy `sync-cdl-feeds` and `hayes-jamesburg-inbound`
- Trigger a manual sync to pull in all available James Burg jobs immediately

## Expected Outcome
Jobs from the CDL Job Cast feed will begin syncing automatically every 5 minutes. The initial sync should pull in all currently available James Burg job listings.

