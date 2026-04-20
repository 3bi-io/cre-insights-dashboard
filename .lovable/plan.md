

## Fix: Admiral Merchants applications not visible in Hayes client portal

### Root cause

The Hayes recruiter user account (`cody@3bi.io`, role: `client`) is only assigned to **Pemberton Truck Lines** in the `user_client_assignments` table. There is **no assignment row linking any portal user to Admiral Merchants** (`53d7dd20-d743-4d34-93e9-eb7175c39da1`).

The client portal (`useClientPortalData`) reads `user_client_assignments` for the logged-in user and only fetches applications/jobs for those client IDs. So even though Admiral apps are landing correctly in the database (verified — 2 apps in last 7 days, properly attached to Admiral job listings), the Hayes portal account literally has no permission row to see them.

### Verified state

| Check | Result |
|---|---|
| Admiral client record | ✅ exists, status `active`, org Hayes Recruiting Solutions |
| Admiral active job listings | ✅ 421 active, not hidden |
| Admiral applications (30d) | 2 apps (Indeed + ElevenLabs sources) — landing correctly |
| Hayes client-portal users assigned to Admiral | ❌ **0** |
| Hayes client-portal users assigned to other Hayes carriers | Pemberton (cody@3bi.io), Danny Herman (cody@3bi.ai) |

### Fix — 1 database row

Insert a `user_client_assignments` row linking the Hayes recruiter portal account to Admiral Merchants:

```sql
INSERT INTO public.user_client_assignments (user_id, client_id)
VALUES ('c259635f-fc7c-4a4e-8a45-29bcbcbd66bc', '53d7dd20-d743-4d34-93e9-eb7175c39da1')
ON CONFLICT DO NOTHING;
```

(`c259635f…` = `cody@3bi.io`, the `client`-role Hayes portal user already assigned to Pemberton.)

### Question before applying

Two portal accounts could plausibly own Admiral visibility — please confirm which one(s) the Hayes team uses for Admiral:

- **`cody@3bi.io`** — `client` role, currently sees Pemberton only.
- **`cody@3bi.ai`** — `admin` role, currently assigned to Danny Herman. (Admins typically see everything via role, but the assignment row is what scopes the client-portal view.)
- **`truckinjimmyhayes@gmail.com`** — `admin` role, no assignments yet.

Default plan: assign **all three** to Admiral so every Hayes operator account can see Admiral apps in the portal. If you want a different set, say which.

### Secondary observation (not part of this fix, flagging only)

Admiral has 421 active jobs but only 2 apps in 30 days. After visibility is fixed, if app volume is still surprisingly low we should investigate the apply-URL routing (CDL Job Cast feed UTM `utm_source=cdl_jobcast`) and whether Indeed/syndication is actually surfacing these listings. Out of scope for this ticket — handle separately if needed.

### Files / artifacts

- New migration: insert into `user_client_assignments` for the chosen user(s) × Admiral.
- No code changes — the portal queries already work; they just have no rows to return.

### Verification

1. After insert, log in as the assigned Hayes user → `/client-portal` → Admiral Merchants should appear in the client list.
2. Open Admiral → expect to see the 2 recent applications (Garey Ferguson SR — Indeed; Brandon Pesta — ElevenLabs).

