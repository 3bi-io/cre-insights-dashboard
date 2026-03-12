

## Update NYLAS_REDIRECT_URI Secret

The `NYLAS_REDIRECT_URI` secret already exists in Supabase. It just needs its value updated.

### Steps

1. **Update the secret** `NYLAS_REDIRECT_URI` to `https://applyai.jobs/calendar/callback`
2. **Verify** the edge function `agent-scheduling` references this secret correctly for OAuth callback handling

No code changes required — this is a single secret value update.

