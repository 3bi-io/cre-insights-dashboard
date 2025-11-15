# Phase 2: Security Hardening Implementation

## Completion Status
🔄 **IN PROGRESS** - Started 2025-11-15

## Overview
Systematic security hardening including Supabase linter fixes, PII audit logging migration, and rate limiting for public endpoints.

---

## ✅ Fixed Issues

### 1. Function Search Path Mutable (Partial Fix)
**Status**: 2 of 4 functions fixed

**Fixed Functions**:
- ✅ `public.normalize_phone_number()` - Added `SET search_path = 'public'`
- ✅ `public.classify_traffic_source()` - Added `SET search_path = 'public'`

**Security Impact**: Prevents search path manipulation attacks where attackers could hijack function behavior by creating malicious schemas.

**Migration**: `supabase/migrations/20251115235740_*.sql`

---

## 🚨 CRITICAL ISSUES - Requires Immediate Action

### ERROR 1: Security Definer View
**Severity**: CRITICAL  
**Status**: ⚠️ NEEDS INVESTIGATION

**Description**:
A view is defined with `SECURITY DEFINER`, which bypasses RLS policies and uses the view creator's permissions instead of the querying user's permissions. This is a **major security vulnerability**.

**Risk**:
- Users can bypass RLS restrictions
- Unauthorized data access
- Privilege escalation attacks

**Action Required**:
1. Identify which view has SECURITY DEFINER
2. Evaluate if it's intentional or accidental
3. Options:
   - Remove SECURITY DEFINER if not needed
   - Add proper RLS checks within the view definition
   - Replace with a SECURITY DEFINER function that has proper access controls

**Resources**:
- [Supabase Docs: Security Definer View](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)

---

### WARN 2-3: Function Search Path Mutable (2 Remaining)
**Severity**: HIGH  
**Status**: ⚠️ NEEDS INVESTIGATION

**Description**:
Two more functions are missing `SET search_path = 'public'` declaration. This makes them vulnerable to search path manipulation attacks.

**Action Required**:
1. Identify remaining functions without search_path:
   ```sql
   SELECT 
     n.nspname as schema_name,
     p.proname as function_name,
     pg_get_functiondef(p.oid) as definition
   FROM pg_proc p
   JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'public'
     AND p.prosecdef = true
     AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%';
   ```

2. Add `SET search_path = 'public'` to each:
   ```sql
   CREATE OR REPLACE FUNCTION public.function_name(...)
   RETURNS ...
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = 'public'  -- ← ADD THIS
   AS $function$
   ...
   $function$;
   ```

**Already Fixed**:
- ✅ `normalize_phone_number`
- ✅ `classify_traffic_source`

---

## ⚠️ MEDIUM PRIORITY - Requires Manual Configuration

These issues require configuration changes in the Supabase Dashboard (cannot be fixed via migrations):

### WARN 4: Extension in Public Schema
**Severity**: MEDIUM  
**Status**: 📋 DOCUMENTED

**Description**:
Extensions are installed in the `public` schema, which can cause naming conflicts and privilege issues.

**Recommended Fix** (Low Priority):
```sql
-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extensions (requires careful testing)
-- Example for pg_stat_statements:
DROP EXTENSION IF EXISTS pg_stat_statements;
CREATE EXTENSION pg_stat_statements SCHEMA extensions;
```

**Risk**: Low - Mainly causes namespace pollution, not a direct security threat.

**Action**: Document for future cleanup sprint.

---

### WARN 5: Auth OTP Long Expiry ⚡ ACTION REQUIRED
**Severity**: MEDIUM  
**Status**: ⚠️ USER ACTION REQUIRED

**Description**:
OTP tokens expire after too long, increasing the risk of token hijacking and replay attacks.

**Current Settings**: Unknown (needs Dashboard check)  
**Recommended Settings**:
- Email OTP: **15 minutes**
- Phone OTP: **10 minutes**
- Magic Links: **1 hour**

**How to Fix**:
1. Navigate to [Supabase Auth Settings](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/auth/providers)
2. Click "Email" provider
3. Update OTP expiry to **15 minutes** (900 seconds)
4. Click "SMS" provider (if enabled)
5. Update OTP expiry to **10 minutes** (600 seconds)
6. Click "Magic Link" settings
7. Update expiry to **1 hour** (3600 seconds)
8. Save all changes

**Security Impact**:
- ❌ Before: Long-lived tokens can be intercepted and used hours later
- ✅ After: Tokens expire quickly, reducing attack window

---

### WARN 6: Leaked Password Protection Disabled ⚡ ACTION REQUIRED
**Severity**: HIGH  
**Status**: ⚠️ USER ACTION REQUIRED

**Description**:
Users can set passwords that have been leaked in data breaches (e.g., "password123", "qwerty"), making accounts vulnerable to credential stuffing attacks.

**How to Fix**:
1. Navigate to [Auth Password Settings](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/auth/policies)
2. Find "Password Strength" section
3. **Enable** "Leaked Password Protection"
4. **Enable** "Password Strength Requirements":
   - ✅ Minimum length: 8 characters
   - ✅ Require at least one uppercase letter
   - ✅ Require at least one number
   - ✅ Require at least one special character
5. Save changes

**Security Impact**:
- ❌ Before: Users can use "password" or "123456" as their password
- ✅ After: System blocks known compromised passwords from HaveIBeenPwned database

**Resources**:
- [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

### WARN 7: Outdated Postgres Version ⚡ ACTION REQUIRED
**Severity**: HIGH  
**Status**: ⚠️ USER ACTION REQUIRED

**Description**:
The PostgreSQL database is running an older version with known security vulnerabilities. Security patches are available in newer versions.

**How to Fix**:
1. ⚠️ **IMPORTANT**: Create a full database backup first!
   - Navigate to [Database Settings](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/settings/database)
   - Click "Download Backup" or use pg_dump

2. Schedule a maintenance window (recommend off-peak hours)

3. Upgrade PostgreSQL:
   - Navigate to [Database Settings](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/settings/database)
   - Find "PostgreSQL Version" section
   - Click "Upgrade to Latest" button
   - Confirm upgrade

4. Test application after upgrade:
   - Verify all database functions work
   - Check RLS policies are enforced
   - Test edge functions
   - Monitor error logs for 24 hours

**Downtime**: Approximately 5-15 minutes depending on database size

**Resources**:
- [Supabase Upgrading Guide](https://supabase.com/docs/guides/platform/upgrading)

---

## 🔄 Next Steps: PII Audit Logging Migration

### Status: Backend Complete, Frontend Pending

**Completed** (from Phase 1):
- ✅ Database RPC functions created (`get_applications_list_with_audit`, etc.)
- ✅ `useAuditedApplicationAccess` hook created
- ✅ `AUDIT_REASONS` constants defined
- ✅ `ApplicationsService.ts` updated to use audited RPC

**Remaining Work**:
1. **Update Frontend Components** (35+ files):
   - Replace direct `ApplicationsService` calls with `useAuditedApplicationAccess`
   - Add proper audit reasons to all PII access
   - Update components in:
     - `src/components/applications/*.tsx` (20 files)
     - `src/pages/*.tsx` (5 files)
     - `src/features/applications/**/*.tsx` (10 files)

2. **Testing**:
   - Verify audit logs are created for every PII access
   - Test all CRUD operations work through audited RPC
   - Ensure proper error messages for insufficient permissions

3. **Compliance Verification**:
   - Generate sample audit reports
   - Verify logs contain required information:
     - User ID
     - Organization ID
     - Access reason (business justification)
     - Timestamp
     - PII fields accessed

---

## 🔐 Next Steps: Rate Limiting for Public Endpoints

**Public Endpoints Requiring Rate Limiting**:
1. `generate-sitemap` - Public sitemap generation
2. `tenstreet-extractcomplete` - Webhook endpoint
3. `client-webhook` - Client integration webhook
4. `universal-xml-feed` - Public XML feed
5. `job-feed-xml` - Public job feed
6. `submit-application` - Public application submission
7. `meta-leads-cron` - Cron job (special handling)
8. `meta-sync-cron` - Cron job (special handling)
9. `trucking-platform-integration` - Integration endpoint
10. `inbound-applications` - Public application webhook
11. `generate-hayes-applications` - Application generator
12. `tenstreet-webhook` - Webhook endpoint

**Implementation Plan**:
1. Create centralized rate limiter utility in `supabase/functions/_shared/`
2. Use existing `rate_limits` table and `check_rate_limit()` function
3. Add rate limiting to each public endpoint:
   ```typescript
   // Example implementation
   import { checkRateLimit } from '../_shared/rate-limiter.ts';
   
   const identifier = req.headers.get('x-forwarded-for') || 'unknown';
   const rateLimitResult = await checkRateLimit(identifier, 'endpoint-name', 100, 60);
   
   if (!rateLimitResult.allowed) {
     return new Response(
       JSON.stringify({ 
         error: 'Rate limit exceeded', 
         retry_after: rateLimitResult.retry_after 
       }),
       { 
         status: 429, 
         headers: { 
           'Retry-After': String(rateLimitResult.retry_after),
           ...corsHeaders 
         } 
       }
     );
   }
   ```

4. Configure appropriate limits per endpoint:
   - Webhooks: 1000 req/hour
   - Public feeds: 100 req/hour
   - Application submission: 10 req/hour per IP
   - Sitemap: 60 req/hour

---

## Success Metrics

| Metric | Before | Target | Current Status |
|--------|--------|--------|----------------|
| **Database Security** |
| Security Definer Views | 1 | 0 | ⚠️ Not Fixed |
| Functions w/o search_path | 4 | 0 | 🔄 2 Fixed |
| Extensions in public | Yes | No | 📋 Documented |
| **Auth Security** |
| OTP Expiry | Unknown | 15 min | ⚠️ Manual |
| Leaked Password Check | Disabled | Enabled | ⚠️ Manual |
| Postgres Version | Old | Latest | ⚠️ Manual |
| **PII Protection** |
| Audit Log Coverage | 0% | 100% | 🔄 Backend Only |
| Audited Endpoints | 0 | 35+ | 🔄 In Progress |
| **Rate Limiting** |
| Protected Endpoints | 0/11 | 11/11 | ⏳ Not Started |
| Abuse Prevention | None | Active | ⏳ Not Started |

---

## Risk Assessment

### CRITICAL Risks (Fix Immediately)
1. **Security Definer View**: Bypasses RLS, allows privilege escalation
2. **2 Functions w/o search_path**: Vulnerable to search path attacks
3. **Leaked Password Protection**: Users can use compromised passwords
4. **Outdated Postgres**: Known security vulnerabilities

### HIGH Risks (Fix This Week)
1. **Long OTP Expiry**: Increased token hijacking risk
2. **No Rate Limiting**: Endpoints vulnerable to abuse and DDoS
3. **PII Audit Incomplete**: FCRA/GDPR compliance gap

### MEDIUM Risks (Monitor)
1. **Extensions in Public**: Namespace pollution, potential conflicts

---

## Compliance Impact

### FCRA (Fair Credit Reporting Act)
- ⚠️ **Current Status**: NON-COMPLIANT
- **Issue**: Incomplete PII audit logging
- **Required**: Full audit trail of all background check data access
- **Penalty**: Up to $1,000 per violation + criminal charges
- **Target Compliance**: End of Phase 2

### GDPR (General Data Protection Regulation)
- ⚠️ **Current Status**: PARTIAL COMPLIANCE
- **Issue**: Audit logging backend complete, frontend integration pending
- **Required**: Article 30 - Records of processing activities
- **Penalty**: €20M or 4% of global revenue
- **Target Compliance**: End of Phase 2

### CCPA (California Consumer Privacy Act)
- ⚠️ **Current Status**: PARTIAL COMPLIANCE
- **Issue**: Cannot produce complete "who accessed my data" reports
- **Required**: Full audit trails for consumer data access
- **Penalty**: Up to $7,500 per violation
- **Target Compliance**: End of Phase 2

---

## Testing Checklist

### Database Security
- [ ] Run linter after each fix, verify issue count decreases
- [ ] Test all functions work after adding search_path
- [ ] Verify RLS policies still enforce correctly
- [ ] Test security definer view after fix

### Auth Security (Manual Dashboard Changes)
- [ ] Test OTP expiry - verify codes expire at new timeframe
- [ ] Test leaked password protection - try "password123"
- [ ] Monitor application after Postgres upgrade
- [ ] Check all auth flows still work

### PII Audit Logging
- [ ] Test application list view - verify non-PII log created
- [ ] Test application detail view - verify PII access logged
- [ ] Test application creation - verify audit log created
- [ ] Test application update - verify sensitive field tracking
- [ ] Generate audit report - verify all required fields present
- [ ] Test access control - verify non-admins can't access PII

### Rate Limiting
- [ ] Test normal usage - should not hit limits
- [ ] Test rapid requests - should trigger rate limit
- [ ] Verify 429 response has correct Retry-After header
- [ ] Test rate limit reset after window expires
- [ ] Monitor legitimate traffic not blocked

---

## Rollback Plan

### Database Migrations
1. Identify migration to revert
2. Run: `supabase migration down <migration-id>`
3. Test application functionality
4. Monitor for errors

### Manual Dashboard Changes
1. **OTP Expiry**: Change back to previous values
2. **Leaked Password Protection**: Can safely disable if issues
3. **Postgres Upgrade**: Requires full database restore from backup (30-60 min downtime)

---

## Next Phase Preview: Phase 3 - Code Quality

After completing Phase 2 security hardening:
1. Enable strict TypeScript (`noImplicitAny`, `strictNullChecks`)
2. Fix 1,120 `any` type usages
3. Standardize edge function patterns
4. Remove remaining 148 console.log statements

---

**Phase 2 Status**: 🔄 IN PROGRESS  
**Critical Blockers**: 3 (Security Definer View, 2 Functions, PII Migration)  
**Estimated Completion**: 2-3 days  
**Next Review**: After critical issues resolved
