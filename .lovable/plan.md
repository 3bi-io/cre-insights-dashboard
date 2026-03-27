

## Fix: Remove "Sign In" from public header & confirm Apply AI branding

### What's happening

The screenshot shows the **old** ATS.ME branding and a "Sign In" button on the homepage. After investigating the codebase:

1. **Branding is already correct in code** — the `Brand` component renders "Aᴘᴘʟʏ Aɪ", `index.html` references "Apply AI" everywhere, and `hero.content.ts` uses "Interview Everyone". The ATS.ME screenshot appears to be from the **published site** (`ats-me.lovable.app`) which hasn't been republished with the latest code.

2. **"Sign In" is still in the Header** — `Header.tsx` has `showAuth={true}` by default, rendering "Sign In" and "Get Started Free" buttons on all public pages (lines 169-188, plus mobile drawer lines 239-248).

### Changes

**`src/components/common/Header.tsx`**
- Change `showAuth` default from `true` to `false` — this removes "Sign In" and "Get Started Free" from both desktop and mobile nav on all public pages
- The auth buttons are still available when explicitly passed `showAuth={true}` for admin/internal layouts if needed

**After code changes**
- Click **Publish → Update** to push the latest code to the published site, replacing the stale ATS.ME version

### What this fixes
- No more "Sign In" / "Get Started Free" buttons on the public homepage
- Once republished, the published site will show "Apply AI" branding matching the current codebase

