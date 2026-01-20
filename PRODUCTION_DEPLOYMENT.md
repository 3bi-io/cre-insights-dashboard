# ATS.me Production Deployment Guide

## Pre-Deployment Checklist

### 1. Manual Supabase Actions Required

**⚠️ CRITICAL - Complete these in Supabase Dashboard:**

- [ ] **Enable Leaked Password Protection**
  - Navigate to: Authentication → Providers → Email
  - Enable "Leaked password protection"
  
- [ ] **Upgrade Postgres Version**
  - Navigate to: Database → Settings
  - Check for available Postgres updates

### 2. Security Verification

The following security measures have been implemented:

- ✅ `public_organization_info` view restricts public data exposure
- ✅ Security views use `security_invoker = on`
- ✅ Role hierarchy: super_admin > admin > moderator > recruiter > user
- ✅ Auto-organization creation for new org signups (no hardcoded fallback)
- ✅ RLS policies for organization_usage table
- ✅ Rate limiting on ElevenLabs voice agent

### 3. Feature Tiers (Prepared for Monetization)

| Tier | Jobs | Applications/mo | AI Screenings | Voice Minutes |
|------|------|-----------------|---------------|---------------|
| Free | 5 | 100 | 50 | 30 |
| Pro | Unlimited | Unlimited | Unlimited | Unlimited |
| Enterprise | Custom | Custom | Custom | Custom |

Usage is tracked in `organization_usage` table with monthly periods.

## Deployment Steps

### 1. Run Database Migrations

```bash
supabase db push
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy --all
```

### 3. Verify Critical Paths

Run E2E tests:
```bash
npx playwright test
```

### 4. Monitor After Deployment

Check Supabase logs for:
- Auth errors
- Edge function failures
- Database query performance

## Rollback Procedure

If issues are detected:

1. Revert to previous migration:
   ```bash
   supabase db reset --linked
   ```

2. Redeploy previous function versions from git history

3. Monitor error rates in dashboard

## Performance Benchmarks

Target metrics:
- Lighthouse score > 90
- Time to first meaningful paint < 1.5s
- Edge function error rate < 0.1%
- Application submission success rate > 95%

## Architecture Summary

### Navigation Structure (Consolidated)
- Dashboard (standalone)
- Recruitment (Applications, Jobs, Clients, Routes, Talent, Voice Agents)
- Campaigns (Campaigns, Job Groups)
- Connections (ATS Command, Verifications, Ad Networks, Job Boards, Webhooks)
- AI & Voice (AI Assistant, AI Tools, Analytics, Impact, Visitor Analytics)
- Settings (General, Organization, AI Configuration, Support)
- Administration (super_admin only)

### Apply Flow
- Single progressive flow with 4 steps
- "Skip to Submit" option after completing essentials (Step 1)
- Voice Apply integration for hands-free applications

### Edge Functions (69 total)
All functions use shared utilities from `_shared/`:
- `createLogger()` for structured logging
- `successResponse()` / `errorResponse()` for consistent API responses
- `getCorsHeaders()` for CORS handling
- `RateLimiter` for abuse prevention

## Support

For issues during deployment, check:
1. Supabase Dashboard logs
2. Edge function logs via `supabase functions logs <function-name>`
3. Browser console for client-side errors

---

*Last Updated: January 2026*
*Refactoring Plan Version: 1.0*
