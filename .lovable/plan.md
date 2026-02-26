

# Fix: Replace Remaining `ats.me` References with `applyai.jobs` + Review Google Sign-In

## Google Sign-In Review

Google Sign-In is implemented correctly using `supabase.auth.signInWithOAuth({ provider: 'google' })` with PKCE flow. The redirect URLs use `window.location.origin` (dynamic), so they'll work on any domain. **No code changes needed for Google auth itself**, but you should verify in your **Supabase Dashboard** (Authentication > URL Configuration) that:
- **Site URL** is set to `https://applyai.jobs`
- **Redirect URLs** include `https://applyai.jobs/**` (and remove any `ats.me` entries)
- In **Google Cloud Console**, the OAuth client has `https://applyai.jobs` in Authorized JavaScript Origins and the Supabase callback URL in Authorized Redirect URIs

## `ats.me` to `applyai.jobs` Migration

There are ~25 files still referencing `ats.me`. These fall into categories:

### Frontend Files (9 files)
| File | What to change |
|------|---------------|
| `src/components/Footer.tsx` | `support@ats.me` -> `support@applyai.jobs` |
| `src/pages/Apply.tsx` | Hardcoded `https://ats.me/` breadcrumb and canonical URLs -> use `SITE_URL` from siteConfig |
| `src/pages/Support.tsx` | `ATS.me` brand name -> `Apply AI`, `support@ats.me` -> `support@applyai.jobs` |
| `src/pages/RegionBlocked.tsx` | `compliance@ats.me` -> `compliance@applyai.jobs` |
| `src/pages/Onboarding.tsx` | `Welcome to ATS.me` -> `Welcome to Apply AI` |
| `src/pages/BrandAssets.tsx` | `ATS.me logos` -> `Apply AI logos` |
| `src/pages/public/ContactPage.tsx` | `ATS.me` -> `Apply AI`, `support@ats.me` -> `support@applyai.jobs` |
| `src/components/apply/SimulationCompleteScreen.tsx` | `ATS.me` -> `Apply AI` |
| `src/features/landing/components/sections/CTASection.tsx` | `Without ATS.me` / `With ATS.me` -> `Without Apply AI` / `With Apply AI` |
| `src/components/landing/TestimonialsSection.tsx` | `ATS.me` -> `Apply AI` |
| `src/utils/resourcesPdfGenerator.ts` | `ATS.me Feature Guide` / `ATS.me` -> `Apply AI` |

### i18n Locale Files (3 files)
| File | What to change |
|------|---------------|
| `src/i18n/locales/fr.json` | `"name": "ATS.me"` -> `"name": "Apply AI"` |
| `src/i18n/locales/de.json` | `"name": "ATS.me"` -> `"name": "Apply AI"` |
| `src/i18n/locales/es.json` | `"name": "ATS.me"` -> `"name": "Apply AI"` |

### Edge Functions (7 files)
| File | What to change |
|------|---------------|
| `supabase/functions/cdl-jobcast-inbound/index.ts` | `https://ats.me/apply` -> `https://applyai.jobs/apply` |
| `supabase/functions/ats-integration/index.ts` | `https://ats.me/j/` and `https://ats.me/apply` -> `https://applyai.jobs/...` |
| `supabase/functions/whatsapp-webhook/index.ts` | `https://ats.me/` -> `https://applyai.jobs/` |
| `supabase/functions/meta-engagement-webhook/index.ts` | `https://ats.me/` -> `https://applyai.jobs/` |
| `supabase/functions/google-jobs-xml/index.ts` | Fallback URL `https://ats.me` -> `https://applyai.jobs` |
| `supabase/functions/ai-chat/index.ts` | System prompt `ATS.me` -> `Apply AI` |
| `supabase/functions/_shared/hayes-client-handler.ts` | `https://ats.me/apply/` -> `https://applyai.jobs/apply/` |
| `supabase/functions/_shared/ats-adapters/xml-post-adapter.ts` | Fallback source `ATS.me` -> `Apply AI` |
| `supabase/functions/generate-logo/index.ts` | Multiple prompt strings (cosmetic, low priority) |

## Implementation Approach

1. Update all frontend files -- replace hardcoded `ats.me` URLs with `SITE_URL` from siteConfig where possible, or with `applyai.jobs` directly
2. Update all edge function URLs from `ats.me` to `applyai.jobs`
3. Update brand name references from `ATS.me` to `Apply AI`
4. Update i18n locale files
5. Redeploy affected edge functions

## Out of Scope (Manual Steps)
- Supabase Dashboard: Update Site URL and Redirect URLs under Authentication > URL Configuration
- Google Cloud Console: Update Authorized JavaScript Origins to include `applyai.jobs`

