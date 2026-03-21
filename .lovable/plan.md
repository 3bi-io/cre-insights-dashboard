

# Configure Twilio Secrets

## What
Add three Twilio environment secrets to the Supabase project so the existing centralized `twilio-client.ts` utility can function.

## Secrets to Add

| Secret Name | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | `AC6e7c280b093f2758a2356535952d2a0c` |
| `TWILIO_AUTH_TOKEN` | `75f414c50967436bcf7b533e04c15a84` |
| `TWILIO_PHONE_NUMBER` | `+12566002580` |

## Steps
1. Add all three secrets using the `add_secret` tool
2. Verify they appear in the project's secret list

## No code changes needed
The shared `twilio-client.ts` and all consuming edge functions (`send-sms`, `sms-webhook`, `sms-auth`, `elevenlabs-outbound-call`) already reference these exact variable names.

