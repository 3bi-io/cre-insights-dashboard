

## Fix: `ats-integration` edge function crash

### Problem
Line 44 references `supabaseUrl` which is never defined, causing a `ReferenceError` on every request. The function also still uses the legacy `serve()` import.

### Changes

**`supabase/functions/ats-integration/index.ts`**

1. Remove `serve` import from `deno.land/std` (line 1)
2. Replace `serve(async (req) => {` with `Deno.serve(async (req) => {` (line 23)
3. Fix line 44: replace `supabaseUrl` with `Deno.env.get('SUPABASE_URL')!`

That is the entire fix. The function will deploy automatically after the edit.

