

## Diagnosis: No Data in `scheduled_callbacks` Table

The Scheduling Analytics dashboard is working correctly — the issue is that the `scheduled_callbacks` table has **0 rows**. This is confirmed via a direct database query (bypassing RLS). The RLS policies are properly configured for admin access.

No callbacks have been booked yet because the Nylas OAuth redirect URI is still broken, meaning no recruiter calendars are connected, and the AI agent cannot book slots.

### Options

There are two paths forward:

**Option A: Seed sample data for testing/demo purposes**
Insert realistic demo rows into `scheduled_callbacks` so you can validate the dashboard visually while waiting for Nylas to be fixed. This would include a mix of statuses (pending, completed, no_show, cancelled) spread across the last 30 days with different recruiter IDs and time slots.

**Option B: Wait for Nylas fix**
Once you update the `NYLAS_REDIRECT_URI` in both Supabase secrets and the Nylas Dashboard, recruiters can connect calendars, the AI agent can book callbacks, and real data will flow into this dashboard automatically.

### Recommendation

Seed ~20-30 demo callbacks so you can validate charts, KPIs, recruiter utilization, and peak hours rendering. This will be done via a single SQL INSERT into `scheduled_callbacks` with realistic test data. No code changes needed — just a database insert.

