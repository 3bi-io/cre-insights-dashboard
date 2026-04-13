

## Plan: Test Pemberton Outbound Agent

### What We Know
- **Pemberton Outbound Agent**: `17891613-458e-432e-a328-f26f3305a0ee` (agent_id: `agent_0101kfp6waxpezy8r56ewhx8eqya`, phone: `phnum_5501k910q8qzfnmbmznw6zqx3p8j`)
- **Twilio secrets**: Manually updated by user
- **Pemberton phone number**: Re-added in ElevenLabs
- **Recent applicant**: Lucy Hulon (`8662f8c2-78ee-46c2-ba3a-9072a25c8250`, phone: `+19106510751`) — most recent Pemberton applicant, still pending

### Steps

1. **Insert a test outbound call record** for Lucy Hulon queued to the Pemberton outbound agent, with `status = 'queued'` and `scheduled_at = now()`.

2. **Invoke the `elevenlabs-outbound-call` edge function** with `process_queue: true` to pick up and execute the queued call.

3. **Check the result** — verify the response shows success (call_sid, conversation_id) rather than the previous Error 20003.

4. **If it fails**, check edge function logs for the specific error to diagnose whether it's still a credential issue or something else.

### Technical Details
- The function uses `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` from secrets (updated by user)
- The phone number ID `phnum_5501k910q8qzfnmbmznw6zqx3p8j` was re-imported by user in ElevenLabs
- Only one call will be queued to limit blast radius

