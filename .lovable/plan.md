

## Update Sharing URLs from ats.me to applyai.jobs

### Findings

After reviewing all sharing components across the codebase, two files still reference `ats.me` in share/link URLs:

| File | Line(s) | Current Value | Fix |
|------|---------|--------------|-----|
| `src/components/blog/BlogShareButtons.tsx` | 25 | `https://ats.me/blog/${slug}` | Use `SITE_URL` from siteConfig |
| `src/pages/VoiceAgentDemo.tsx` | 38 | `canonical="https://ats.me/demo"` | Use `SITE_URL` constant |
| `src/pages/VoiceAgentDemo.tsx` | 39 | `ogImage="https://ats.me/og-voice-demo.png"` | Use `SITE_URL` constant |
| `src/pages/VoiceAgentDemo.tsx` | 51 | `"Back to ATS.me"` | Change to `"Back to Apply AI"` |

**Already correct** (no changes needed):
- `JobDetailsPage.tsx` -- uses `https://applyai.jobs/jobs/${job.id}`
- `ShareConversationDialog.tsx` -- uses `window.location.origin` (dynamic, correct)
- `ExportMenu.tsx` -- uses `window.location.origin` (dynamic, correct)

### Changes

**1. `src/components/blog/BlogShareButtons.tsx`**
- Import `SITE_URL` from `@/config/siteConfig`
- Change line 25 from `https://ats.me/blog/${slug}` to `` `${SITE_URL}/blog/${slug}` ``

**2. `src/pages/VoiceAgentDemo.tsx`**
- Import `SITE_URL`, `SITE_NAME` from `@/config/siteConfig`
- Update canonical to `` `${SITE_URL}/demo` ``
- Update ogImage to `` `${SITE_URL}/og-voice-demo.png` ``
- Update button text from "Back to ATS.me" to `` `Back to ${SITE_NAME}` ``

