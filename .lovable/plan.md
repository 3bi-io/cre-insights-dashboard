
# Remove Global Geo-Restriction — Keep Only US Sanctions/Watch List Countries Blocked

## Advisory: What Is Changing & Why

The current system uses an **allow-list** approach — only countries explicitly listed (Americas + Spain + Armenia) can access the platform, and everyone else is blocked by default. You've asked to flip this to a **block-list** approach — everyone can access **except** countries on the US sanctions/watch list (OFAC-designated programs).

---

## US Sanctions Watch List (OFAC) — Countries to Keep Blocked

Based on current OFAC comprehensive and critical embargo programs, the following countries will remain blocked:

| Country | ISO Code | Sanction Level |
|---|---|---|
| Russia | RU | Critical / Hybrid Embargo |
| Iran | IR | Full Embargo |
| Cuba | CU | Full Embargo |
| North Korea | KP | Full Embargo |
| Syria | SY | Full Embargo |
| Belarus | BY | Highly Restrictive |

**Regional territories also blocked:**
- Crimea, Donetsk People's Republic, Luhansk People's Republic — these are sub-national territories within Ukraine under Russian occupation; geo-IP databases may return `UA` for these, so they cannot be precisely blocked by country code alone. A note will be added in comments.

**Not blocking (list-based only, no country embargo):**
- Yemen (`YE`), Sudan (`SD`), Zimbabwe (`ZW`) — these use SDN (Specially Designated Nationals) targeted lists against specific individuals/entities, not country-wide bans. Blocking these entire countries is not required.
- Venezuela (`VE`) — currently on the original allow-list; sanctions target the government, not general commercial activity. Will remain accessible.
- Afghanistan (`AF`) — targeted against Taliban entities, not a blanket country ban.

---

## What Changes

### 1. `supabase/functions/_shared/geo-blocking.ts`

Switch from allow-list to **block-list** logic:

- **Remove** the large `ALLOWED_COUNTRY_CODES` set
- **Add** a small `BLOCKED_COUNTRY_CODES` set with: `RU`, `IR`, `CU`, `KP`, `SY`, `BY`
- **Change** `isCountryAllowed()` → `isCountryBlocked()` — returns `true` if the country is on the block list
- **Update** `checkGeoAccess()`:
  - If geo lookup fails → **fail open** (allow access) instead of fail-closed, since we're no longer PII-restricting by region — only blocking sanctions countries
  - If country code is unknown → **allow access** (open world policy)
  - If country is in the block list → **deny**
  - All other countries → **allow**
- **Update** `getAllowedRegionsDescription()` message to reflect new policy

### 2. `supabase/functions/geo-check/index.ts`

- Update the response messaging to reflect the new open-world policy
- The Lovable preview bypass remains unchanged

### 3. `src/contexts/GeoBlockingContext.tsx`

- Change the **fail-closed** error handling to **fail-open** — if the geo-check edge function errors, allow the user through (since the default is now "allow all except sanctions countries")
- Update log messages to reflect new policy

### 4. `src/pages/RegionBlocked.tsx`

- Update the copy to reflect that the restriction is due to **US sanctions compliance** rather than a regional data-protection policy
- Update the contact email section to reflect the sanctions reason

---

## Behavior Comparison

```text
BEFORE (Allow-List):
  Unknown country → BLOCKED
  EU country → BLOCKED
  Asia/Pacific → BLOCKED
  Russia → BLOCKED (was already on allow-list exclusion)
  Iran → BLOCKED
  Cuba → BLOCKED (was in the allow-list!)

AFTER (Block-List):
  Unknown country → ALLOWED
  EU country → ALLOWED
  Asia/Pacific → ALLOWED
  Russia → BLOCKED
  Iran → BLOCKED
  North Korea → BLOCKED
  Syria → BLOCKED
  Belarus → BLOCKED
  Cuba → BLOCKED (was previously ALLOWED — this tightens that)
```

> **Note on Cuba:** Cuba was actually in the original `ALLOWED_COUNTRY_CODES` list, but it is under a US Full Embargo. The new policy correctly blocks it.

---

## Important Notes

1. **Fail-open vs fail-closed:** Since the new policy is "allow the world, block a small list," failing open on geo-lookup errors is correct and consistent. Previously, failing closed protected against accidentally granting access to non-Americas regions. That concern no longer applies.

2. **Venezuela remains accessible** — OFAC sanctions target the Venezuelan government/specific entities, not all commercial activity. General License provisions allow normal business transactions.

3. **Session cache** will be cleared automatically after the existing 30-minute TTL. Users who visited before this change and cached an "allowed" result will stay allowed. Users cached as "blocked" who are now in allowed countries will need to wait up to 30 minutes or clear session storage.

4. **Crimea/DNR/LNR** — These territories cannot be reliably blocked by country code because IP databases return `UA` (Ukraine). A comment will document this limitation.

5. **This is not legal advice.** The OFAC list changes frequently. You should periodically review [https://ofac.treasury.gov/sanctions-programs-and-country-information](https://ofac.treasury.gov/sanctions-programs-and-country-information) to keep the block list current.

---

## Files to Change

- `supabase/functions/_shared/geo-blocking.ts` — Core logic flip (allow-list → block-list)
- `supabase/functions/geo-check/index.ts` — Update messaging
- `src/contexts/GeoBlockingContext.tsx` — Fail-open on error
- `src/pages/RegionBlocked.tsx` — Update blocked-page copy
