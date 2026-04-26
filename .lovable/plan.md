## Edge Function Type-Check Refactor

A full Deno type-check (`deno check` against `supabase/functions/deno.json`) currently reports **145 errors** across **40 files**. They cluster into a small number of mechanical patterns plus three files with real structural problems. This plan fixes them all without changing runtime behavior.

### Error breakdown

| Code | Count | Meaning |
|---|---|---|
| TS2339 | 31 | Property doesn't exist (mainly `safeParse.error` on success branch + `AuthResult.error/status` on success branch) |
| TS2304 | 25 | Cannot find name (`EdgeRuntime`, `createClient`, `supabaseUrl`, `getReplyTo`, `fullCall`, `supabaseServiceKey`) |
| TS2322 | 23 | Type mismatch (mostly `submit-application` org/client lookups and `ParsedJob → Record<string,unknown>`) |
| TS2300 | 21 | Duplicate identifier (whole import blocks duplicated in `tenstreet-explorer` and `tenstreet-xchange`) |
| TS2345 | 16 | Argument type mismatch (`parseInt(unknown)`, `string\|null` passed where `string` expected) |
| TS2561 | 10 | `replyTo` should be `reply_to` in Resend SDK v2 |
| TS2352 | 6 | Bad type assertions in `submit-application` |
| TS2551 | 4 | `.catch()` on Postgrest builders (same class of issue we already fixed in `admin-check`) |
| TS2353 | 3 | Unknown property `lastmod` in sitemap object literal |
| Other | 6 | TS2367 / TS2305 / TS2554 / TS2440 — single-site fixes |

### Hot files
- `submit-application/index.ts` — 44 errors (org/client `.single()` typing, ATS handler signature, `EdgeRuntime`)
- `tenstreet-explorer/index.ts` — 29 errors (entire import block duplicated)
- `tenstreet-xchange/index.ts` — 13 errors (entire import block duplicated)
- `elevenlabs-outbound-call/index.ts` — 9 errors (out-of-scope `fullCall` reference, missing `supabaseServiceKey`/`supabaseUrl`)
- `_shared/hayes-client-handler.ts` — 6 errors (parseInt on unknown, EdgeRuntime, applicationId widening)

### Fix strategy

**1. Resend SDK property name (10 sites)**
Switch every `replyTo:` to `reply_to:` (matches `npm:resend@2.0.0` `CreateEmailOptions`). Files: `contact-form`, `send-invite-email`, `send-screening-request`, `send-application-email`, `newsletter-subscribe`, `send-welcome-email`, `send-test-emails`, `send-magic-link`, `auth-email-templates`.

**2. Add Deno EdgeRuntime + Resend helper types (1 ambient .d.ts)**
Create `supabase/functions/_shared/runtime.d.ts` declaring:
```text
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };
```
This clears all 6 `EdgeRuntime` TS2304 errors without touching individual files.

**3. Add missing top-level imports / consts (TS2304)**
- `domain-configuration/index.ts`: add `import { createClient } from 'npm:@supabase/supabase-js@2.50.0'`.
- `inbound-applications/index.ts` and `job-group-xml-feed/index.ts`: hoist `supabaseUrl`/`supabaseServiceKey` to module scope (already used inside helpers but never declared in scope).
- `send-screening-request/index.ts`: define `supabaseUrl` from `Deno.env.get('SUPABASE_URL')`.
- `social-oauth-callback/index.ts`: same.
- `get-shared-conversation/index.ts`: same.
- `send-test-emails/index.ts`: import or define `getReplyTo` (currently imported from email-config but not exported there) — verify actual source.

**4. Zod safeParse narrowing (5 sites — TS2339 on `.error.issues`)**
Convert
```text
const result = Schema.safeParse(raw);
if (!result.success) { use result.error.issues }
```
the failing files (`ai-chat`, `contact-form`, `send-sms`, `submit-application`) are already shaped correctly — the type-check fails only because the schema infers all fields as optional. Add an explicit guard:
```text
if (!result.success) {
  const issues = (result as z.SafeParseError<unknown>).error.issues;
  ...
}
```
Cleaner: bind the union once with a discriminated check:
```text
if (!result.success) {
  const { error } = result; // TS narrows to SafeParseError
  ...
}
```

**5. AuthResult narrowing in `_shared/serverAuth.ts` (3 sites)**
Same pattern — destructure inside the `if (!success)` block so TS narrows the union:
```text
const authResult = await verifyAuth(request);
if (!authResult.success) {
  const { error, status } = authResult;
  return new Response(JSON.stringify({ success: false, error }), { status, ... });
}
```

**6. Postgrest `.catch()` (4 sites — TS2551)**
Same fix pattern already applied to `admin-check`: replace
```text
supabase.from(...).insert(...).catch(...)
```
with
```text
try { await supabase.from(...).insert(...); } catch (err) { logger.error(...); }
```
Files: `inbound-applications`, `job-group-xml-feed`, `cdl-jobcast-inbound`, `chatbot-analytics`.

**7. Duplicate import blocks (21 sites — TS2300/TS2440)**
In `tenstreet-explorer/index.ts` (lines 30–46) and `tenstreet-xchange/index.ts` the entire import block is pasted twice. Delete the duplicate block. This single edit clears all 21 TS2300 + 1 TS2440 errors.

### Targeted per-file fixes

**`_shared/hayes-client-handler.ts`** (6 errors)
- Line 340/341: cast before parseInt — `parseInt(String(data.months))`.
- Line 376: covered by EdgeRuntime ambient (#2).
- Line 377/382: `application.id` is typed `unknown` because `.single()` schema isn't inferred — assert the row type: `const application = data as { id: string }`.

**`submit-application/index.ts`** (44 errors, but mostly two patterns)
- ~12 errors are the same org/client `.single()` widening — add small typed interfaces for the inline lookups (`{ id: string; name: string; logo_url: string | null }`).
- `autoPostToATS(...)` signature mismatch — widen the helper's `applicationData` param to `Record<string, unknown>` in `_shared/ats-handler.ts` so callers don't need a cast.
- `EdgeRuntime` (3 sites) — covered by ambient.
- `safeParse.error` (4 sites) — covered by #4.
- `.catch` on impression query (1 site) — covered by #6.

**`tenstreet-explorer/index.ts` & `tenstreet-xchange/index.ts`**
- Delete duplicated import block at top. (Single change clears both files entirely except for any remaining adapter calls — re-run type-check to confirm.)

**`elevenlabs-outbound-call/index.ts`** (9 errors)
- The block referencing `fullCall.*` lost its outer scope — the variable is assigned inside an earlier `try` and used after. Move the SMS-followup block inside the same scope, or hoist `let fullCall: CallRow | null = null` before the `try`.
- Add `const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''` near the top.

**`generate-sitemap/index.ts`** (3 × TS2353)
- `lastmod` property is being added to an interface that doesn't allow it — extend the local `SitemapEntry` interface with `lastmod?: string`.

**`craigslist-integration/index.ts`** (3 errors)
- Schema marks `title` as optional but `CraigslistJobData` requires it. Tighten the Zod schema (`.required({ title: true })`) or default-fill before the cast.

**`background-check/index.ts`** (3 errors — TS2367/TS2339)
- `testResult.status === 'success'` compares against impossible literal — fix the union on `TestConnectionResult` (add `'success' | 'failed'` instead of returning a different object shape from one branch).

**`auth-email-templates/index.ts`** (3 errors)
- `getReplyTo` import + `replyTo`→`reply_to` (covered by #1 / #3).

**Single-site fixes** (the remaining ~10 files with 1–2 errors)
- `meta-spend-analytics`: `getClientsAnalytics()` is being called with an arg it doesn't accept — drop the arg or add the param.
- `x-engagement-webhook`: one TS2367 about `status === 'replied'` — widen union.
- Misc `lastmod`, `.split('T')` on possibly-undefined dates — add `?? ''` fallbacks.

### Validation
After edits, re-run:
```text
DENO_DIR=/tmp/deno-cache deno check --config supabase/functions/deno.json supabase/functions/*/index.ts
```
Target: **0 errors**. Then deploy the 4 already-modified functions (`admin-check`, `admin-update-password`, `anthropic-chat`, `ai-chat`) plus the larger refactored ones (`submit-application`, `tenstreet-explorer`, `tenstreet-xchange`, `elevenlabs-outbound-call`) to confirm runtime parity.

### Out of scope
- No business-logic changes.
- No schema changes.
- No removal of additional functions (the cleanup pass is already complete from the prior round).
- The `deno.json` strictness flags stay as-is — the goal is to make code pass under those settings, not to weaken them further.
