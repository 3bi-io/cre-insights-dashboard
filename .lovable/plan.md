

## Plan: Fix Email Template Readability for Light/Dark Mode

### Problem
The emails use colors that become unreadable in light mode on some email clients. Looking at the screenshot and code, several issues are apparent:

1. **`contentStyles` has `background: white` but no explicit text color** -- the base `color: #333` is set on the body, but email clients in dark mode can override backgrounds without changing text colors (or vice versa), causing contrast issues.

2. **Info boxes use light text on light backgrounds** -- e.g., `color: #666` on `background: #f7f9fc`, `color: #475569` on `background: #f0f9ff`. These become invisible if email clients adjust backgrounds.

3. **Footer text uses very light grays** (`color: #999`, `color: #9ca3af`) that are hard to read on white.

4. **CTA button text color is `white`** via inline style, but the `buttonStyles` don't include `!important`-level reinforcement. Some email clients strip or override inline colors.

### Files to Change

**1. `supabase/functions/_shared/email-config.ts`** (shared styles used by all templates)

- **`baseEmailStyles`**: Add explicit `background-color: #ffffff` and strengthen `color: #333333`
- **`contentStyles`**: Add explicit `color: #333333` so text color is never inherited from a dark-mode override
- **`buttonStyles`**: Add explicit `color: #ffffff !important` pattern (use `color: white` inline -- email clients respect this)
- **`getEmailFooter()`**: Darken footer text from `#999`/`#9ca3af` to `#666666` for better contrast on white
- **`getUnsubscribeSection()`**: Darken text from `#9ca3af` to `#666666`

**2. `supabase/functions/send-application-email/index.ts`** (applicant-facing -- highest priority)

- Line 104: "What's Next?" box -- change `color: #666` to `color: #374151` (darker gray)
- Line 115: "Speed Up" CTA section -- change `color: #475569` to `color: #333333`
- Line 116: Ensure the "Complete Your Full Application" button has explicit `color: #ffffff`
- Lines 143-145: Status update callout -- change `color: #1e40af` to ensure contrast
- Line 238: Rejection encouragement text -- change `color: #6b7280` to `color: #374151`

**3. `supabase/functions/send-screening-request/index.ts`**

- Darken info text colors in callout boxes (e.g., `color: #166534` is fine, but `color: #6b7280` on expiry notices needs darkening to `#374151`)

**4. `supabase/functions/send-welcome-email/index.ts`**

- Line 103: Support link text `color: #6b7280` → `#374151`
- Callout boxes: strengthen text colors

**5. `supabase/functions/auth-email-templates/index.ts`**

- Darken secondary text in all auth templates from `color: #6b7280` → `#374151`
- Info box text: ensure minimum contrast ratio (e.g., `color: #92400e` on `#fef3c7` is fine, but `color: #1e40af` on `#f0f9ff` needs checking)

**6. `supabase/functions/send-invite-email/index.ts`**

- `color: #6b7280` → `#374151` for description text
- `color: #9ca3af` → `#666666` for ignore notice

**7. `supabase/functions/newsletter-subscribe/index.ts`**

- `color: #6b7280` → `#374151`

**8. `supabase/functions/contact-form/index.ts`**

- Admin notification only, lower priority but will fix for consistency

### Design Principles Applied

- Minimum contrast ratio of 4.5:1 for body text (WCAG AA)
- All `<body>` and content containers get explicit `background-color` AND `color` to prevent dark mode inversion mismatches
- All buttons get explicit `color: #ffffff` (not inherited)
- No text lighter than `#555555` on white backgrounds
- Info boxes with colored backgrounds keep their darker text colors (they already pass contrast)

### Deployment

After updating all files, deploy the following edge functions:
- `send-application-email`
- `send-screening-request`
- `send-welcome-email`
- `auth-email-templates`
- `send-invite-email`
- `newsletter-subscribe`
- `contact-form`

