

## Two Issues to Fix

### Issue 1: "Connect Calendar" Button Text Invisible in Light Mode

Looking at the email HTML (line 484), the button uses `color: #ffffff` (white text) on a blue gradient background — that's correct and should be visible. However, the screenshot you shared shows the button area is blank, which means the button itself is likely not rendering.

The issue is that some email clients strip `<a>` tags with `background: linear-gradient(...)`. Linear gradients are not universally supported in email clients (notably Outlook and some mobile clients). The fix is to use a solid `background-color` as the primary style with the gradient as a progressive enhancement.

**Fix in `supabase/functions/calendar-integration/index.ts` (line 484):**
- Replace `background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)` with `background-color: #2563eb; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`
- This ensures a solid blue fallback when gradients aren't supported

### Issue 2: Only Google Calendar Option — Microsoft Not Available

The `redeem_calendar_invite` handler (line 571-578) does **not** pass a `provider` parameter in the Nylas OAuth URL. This means Nylas should show all configured providers (Google, Microsoft, iCloud). However, if **only Google is configured as a Connector in the Nylas Dashboard**, that's the only option users will see.

**This is a Nylas Dashboard configuration issue, not a code issue.** The fix is:
1. Go to the **Nylas Dashboard** → **Connectors**
2. Add a **Microsoft** connector (requires Azure AD app registration with appropriate permissions)
3. Once configured, Nylas hosted auth will automatically show both Google and Microsoft as options

No code change is needed for this — the OAuth URL already omits the `provider` param, which lets Nylas show all available connectors.

### Files to Update
- **`supabase/functions/calendar-integration/index.ts`** — Fix button styling on line 484 for email client compatibility

### Action Required (External)
- **Nylas Dashboard** — Add Microsoft connector so recruiters can connect Outlook/Teams calendars

