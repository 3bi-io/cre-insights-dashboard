

## Re-send 3 Applications to Tenstreet (with Transcript Enrichment)

### Problem

The `ats-integration` edge function has `verify_jwt = true` in `config.toml`, which blocks calls without a valid JWT at the infrastructure level -- before the function code even runs. The function itself handles auth gracefully (optional user context), so this gate is unnecessarily restrictive and prevents programmatic re-sends.

### Plan

#### Step 1: Set `verify_jwt = false` for `ats-integration`

Update `supabase/config.toml` line 130:

```toml
[functions.ats-integration]
verify_jwt = false
```

The function already has its own auth handling (lines 36-45) -- it extracts the user from the Authorization header if present but doesn't fail without it. This is consistent with the project's other edge functions that use the same pattern.

#### Step 2: Deploy and re-send all 3 applications

After deployment, call the edge function for each application:

| Applicant | Application ID | Connection ID |
|---|---|---|
| Constantine Savalas | `352a24fa-538a-4bda-93e2-9a12cf4be80e` | `f987e55a-703e-4cc1-8370-b283c780f547` |
| William Caughron | `d8012012-0f9a-4237-a4ec-84a0627d427b` | `f987e55a-703e-4cc1-8370-b283c780f547` |
| Samuil Volosenco | `53201b0c-07cb-412e-9873-4f455374c75c` | `f987e55a-703e-4cc1-8370-b283c780f547` |

Each call will:
1. Find the outbound call (broadened filter -- any status with a conversation_id)
2. Auto-fetch transcript from ElevenLabs API if not cached locally
3. Store transcript in `elevenlabs_transcripts`
4. Update `outbound_calls.status` to `completed`
5. Append transcript as final CustomQuestion in the XML payload
6. POST to Tenstreet

#### Step 3: Verify results

Check `ats_sync_logs` for success/failure and review the response data from Tenstreet.

### Files Changed

| File | Change |
|---|---|
| `supabase/config.toml` | Line 130: `verify_jwt = false` for `ats-integration` |

