

## Review: Zephel AI Scheduling Program vs. Current Platform State

### What You Already Have (Built and Running)

Your platform already implements a significant portion of what the Zephel document proposes. Here is a mapping of the proposal against your existing infrastructure:

| Zephel Proposal | Your Current State | Gap |
|---|---|---|
| Agentic AI core for outbound calls | **Built.** `elevenlabs-outbound-call` edge function with full queue processing, retry logic, status reconciliation | None |
| After-hours calling | **Built.** `trigger_application_insert_outbound_call` DB trigger queues calls immediately on application submission, 24/7 | None |
| Data verification (CDL, experience) | **Built.** `buildDynamicVariables()` injects applicant CDL class, endorsements, experience, location, drug test status, TWIC, hazmat into ElevenLabs agent context | None |
| Business hours awareness | **Built.** `organization_call_settings` table + `is_within_business_hours()` and `get_next_business_hours_start()` DB functions + UI in `CallScheduleSettings.tsx` | Agent prompt uses this but scheduling doesn't gate on it |
| Auto-retry on no-answer/busy | **Built.** 3-attempt retry with 15/30min delays, completion guard to prevent redundant calls | None |
| Status reconciliation | **Built.** `sync_initiated` mode reconciles with ElevenLabs API, 30-min force-timeout | None |
| Client/org-specific agent routing | **Built.** 3-tier priority: client-specific → org-level → platform default | None |
| Human oversight dashboard | **Built.** `OutboundCallHistory` component + ElevenLabs Admin page with call logs, conversation transcripts | None |
| SMS confirmation after call | **Partial.** `send-sms` edge function exists but not auto-triggered post-scheduling | Gap |
| **Calendar integration (Nylas/Cronofy)** | **Not built.** No calendar API integration exists | **Major gap** |
| **Recruiter availability mapping** | **Not built.** No recruiter calendar concept | **Major gap** |
| **Slot booking / hold logic** | **Not built.** | **Major gap** |
| **Morning digest email** | **Not built.** | Gap |
| **Callback scheduling by AI** | **Not built.** AI can screen but cannot book a specific time slot on a recruiter's calendar | **Major gap** |

### Assessment

Your platform is **Phase 1 complete** per the Zephel framework. The "Foundational Agentic Core" is production-grade with queue processing, retries, reconciliation, and multi-tenant agent routing. The Zephel document's Python pseudocode for verification gates and availability queries describes functionality your edge function already performs natively in TypeScript/Deno.

**What's actually new and valuable in the proposal is Phase 2: Calendar Integration.** Everything else (verification logic, after-hours calling, retry strategies, human oversight) is already implemented and running.

### Recommended Next Steps (What to Actually Build)

#### 1. Calendar Integration Layer (the real gap)
This requires a third-party calendar API (Cronofy or Nylas). The implementation would be:
- A new `calendar-integration` edge function that proxies to Cronofy/Nylas
- A `recruiter_calendar_connections` table storing OAuth grants per recruiter
- A UI for recruiters to connect their Google/Outlook calendar
- Availability query logic callable by the voice agent as a "tool"

**Decision needed:** This requires selecting and paying for Cronofy or Nylas, obtaining API credentials, and having recruiters OAuth-connect their calendars. This is a product/business decision, not just code.

#### 2. Voice Agent "Schedule Callback" Tool
Once calendar integration exists, the ElevenLabs agent needs a webhook/tool that the AI can call mid-conversation to:
- Query recruiter availability
- Place a temporary hold
- Confirm the booking

ElevenLabs Conversational AI supports "tools" (function calling during conversation) which would invoke your edge function.

#### 3. Post-Call SMS Confirmation
Wire the existing `send-sms` edge function to auto-fire after a call transitions to `completed` with a scheduled callback. This is a small addition to the reconciliation logic.

#### 4. Morning Digest
A cron-triggered edge function that queries today's AI-scheduled callbacks and emails each recruiter. Straightforward once calendar data exists.

### Recommendation

Do not build any of the Python pseudocode from the Zephel document -- it duplicates what you already have in production TypeScript. Instead, focus on the **one thing you don't have**: calendar API integration. That requires a business decision on provider (Cronofy vs Nylas) and budget before any code is written.

Would you like to proceed with evaluating Cronofy vs Nylas integration, or focus on a different priority?

