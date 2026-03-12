

## Problem

The seed data timestamps are stored in **UTC** (`+00`), but the business timezone is `America/Chicago` (CDT = UTC-5). So `09:00 UTC` renders as **4:00 AM CDT** and `11:00 UTC` renders as **6:00 AM CDT** in the browser. The dates also shift — a `Mar 13 09:00 UTC` becomes `Mar 13 4:00 AM` local, which is technically correct but looks wrong because no one schedules callbacks at 4 AM.

Additionally, today's callbacks (Mar 12 at `14:00 UTC` / `15:00 UTC` = 9-10 AM CDT) may have already passed depending on when you loaded the page, pushing them to the "Past" tab.

## Fix

Re-seed with corrected UTC offsets so the times land within business hours in CDT:

| Desired CDT Time | Correct UTC Value |
|---|---|
| 9:00 AM CDT | 14:00:00+00 |
| 10:00 AM CDT | 15:00:00+00 |
| 11:00 AM CDT | 16:00:00+00 |
| 1:00 PM CDT | 18:00:00+00 |
| 2:00 PM CDT | 19:00:00+00 |
| 3:00 PM CDT | 20:00:00+00 |

### Steps

1. **Delete existing seed data** — remove the 25 seeded rows (identifiable by the fake phone numbers `+1555123400x`).
2. **Re-insert with correct UTC offsets** — all `scheduled_start`/`scheduled_end` values adjusted so they fall within 9 AM – 4:30 PM CDT. Today's upcoming callbacks will use afternoon CDT times so they appear in "Upcoming."
3. **No code changes needed** — the dashboard component correctly renders times in the browser's local timezone. The issue is purely the seed data.

