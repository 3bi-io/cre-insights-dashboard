

# Fix Voice Apply CTA and Apply Routing

## Audit Results

### Voice Apply — Current vs Expected

| Client | Org | Expected | Current | Status |
|---|---|---|---|---|
| Aspenview | Aspen Analytics | Enabled | Client agent ✅ | OK |
| Danny Herman | Hayes | Enabled | Client agent ✅ | OK |
| Day & Ross | Hayes | Enabled | Client agent ✅ | OK |
| James Burg | Hayes | Enabled | Client agent ✅ | OK |
| Pemberton | Hayes | Enabled | Client agent ✅ | OK |
| Novco | Hayes | Enabled | Org fallback ✅ | Fragile |
| R.E. Garrison | Hayes | Enabled | Org fallback ✅ | Fragile |
| Sysco | CR England | Enabled | Org fallback ✅ | Fragile |
| **Dollar Tree** | CR England | **Disabled** | Org fallback ❌ | **BUG** |
| **Family Dollar** | CR England | **Disabled** | Org fallback ❌ | **BUG** |
| **Kroger** | CR England | **Disabled** | Org fallback ❌ | **BUG** |
| **Hayes AI Recruiting** | Hayes | **Disabled** | Org fallback ❌ | **BUG** |
| Hub Group | (no agents) | Disabled | ✅ | OK |
| Werner | (no agents) | Disabled | ✅ | OK |
| TMC | (no agents) | Disabled | ✅ | OK |

**Root cause**: The org-level fallback in both `useJobDetails.tsx` and `usePaginatedPublicJobs.tsx` enables voice for ALL clients under an org if any org-level agent exists — including clients that should not have voice.

### Apply Routing — All Correct
- **Aspenview**: External (rippling.com) ✅
- **Hub Group, TMC, Werner**: External (cdljobnow.com) ✅
- **All others**: Internal `/apply` (via applyai.jobs/ats.me URLs or null apply_url → defaults to `/apply?job_id=`) ✅

No apply routing changes needed.

---

## Fix Plan

### Step 1: Database — Create client-specific voice agent records

Insert inbound agent records for the 3 clients that currently rely on org-level fallback but should keep voice enabled:

- **R.E. Garrison** (`be8b645e`) → Hayes org, reuse Hayes inbound agent ID (`agent_3901k96k46dhecxbzhr85tmwrph7`)
- **Novco** (`4a9ef1df`) → Hayes org, reuse Hayes inbound agent ID
- **Sysco** (`e2619f0a`) → CR England org, reuse CR England inbound agent ID (`agent_2601k9d75z14f508v87nx8mmwv78`)

### Step 2: Code — Remove org-level fallback

**`src/hooks/useJobDetails.tsx`** (lines 91-101): Remove the "Fallback to org-level agent" block. Only check client-specific agents.

**`src/hooks/usePaginatedPublicJobs.tsx`** (lines 194-199): Stop adding org-only keys to the agent set. Only add `orgId:clientId` keys, so only client-specific agents trigger voice.

### Result

After these changes, voice is strictly opt-in per client via the `voice_agents` table. No org-level fallback means Dollar Tree, Family Dollar, Kroger, and Hayes AI Recruiting correctly show no voice CTA.

