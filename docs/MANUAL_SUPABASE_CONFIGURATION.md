# Manual Supabase Configuration Required

This document outlines configuration changes that must be made through the Supabase Dashboard (cannot be done via code).

## 🚨 Critical Security Fixes (Do Immediately)

### 1. Enable Leaked Password Protection
**Risk:** Users can currently set passwords that have been exposed in data breaches.

**Steps:**
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll to **Password Protection**
4. Enable **"Block passwords from data breaches"**
5. Click **Save**

**Expected Impact:** Prevents users from using compromised passwords

---

### 2. Upgrade PostgreSQL Version
**Risk:** Running outdated Postgres version with known security vulnerabilities.

**Steps:**
1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Infrastructure** → **Database**
3. Check current Postgres version
4. If version < 15.0, click **Upgrade Database**
5. Follow the upgrade wizard
6. **⚠️ WARNING:** This will cause ~5-15 minutes of downtime

**Expected Impact:** Latest security patches and performance improvements

---

### 3. Configure OTP Expiry Time
**Risk:** Long OTP expiry (default 24 hours) increases attack window.

**Steps:**
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Find **"OTP Expiry Duration"**
4. Change from **86400 seconds (24 hours)** to **3600 seconds (1 hour)**
5. Click **Save**

**Expected Impact:** Reduces risk of OTP token theft/replay attacks

---

## ⚠️ Important Security Improvements

### 4. Move Extensions Out of Public Schema
**Risk:** Extensions in public schema can expose security vulnerabilities.

**Current State:**
- Extensions are currently in the `public` schema (default Supabase behavior)

**Manual Migration Required:**
```sql
-- Run in Supabase SQL Editor:

-- 1. Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Move each extension to extensions schema
-- (Replace 'extension_name' with actual extension names)
ALTER EXTENSION "pg_stat_statements" SET SCHEMA extensions;
ALTER EXTENSION "pgcrypto" SET SCHEMA extensions;
ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
-- Add more as needed based on your installed extensions

-- 3. Grant usage
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 4. Update function search paths to include extensions
-- (This ensures functions can still find extension functions)
ALTER DATABASE postgres SET search_path TO public, extensions;
```

**Steps:**
1. Go to Supabase Dashboard → **SQL Editor**
2. Copy and paste the SQL above
3. Click **Run**
4. Verify no errors
5. Test application functionality

**Expected Impact:** Isolates extensions from user schemas, reducing attack surface

---

## 📋 Database Function Security (In Progress)

### 5. Add SET search_path to All Functions
**Status:** ✅ Migration file created: `supabase/migrations/20250124000000_add_search_path_to_functions.sql`

**Manual Steps:**
1. Review the migration file
2. Apply it via Supabase Dashboard → **SQL Editor**
3. Follow instructions in the migration to update each function

**Expected Impact:** Prevents privilege escalation via function search path manipulation

---

## ✅ Verification Checklist

After completing the above steps, verify:

- [ ] Run Supabase Linter again (should show 0 warnings)
- [ ] Test user signup with a common password (should be rejected)
- [ ] Test login with OTP (should expire after 1 hour)
- [ ] Check Postgres version (should be ≥ 15.0)
- [ ] Verify extensions are in `extensions` schema:
  ```sql
  SELECT schemaname, extname 
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  ORDER BY schemaname, extname;
  ```
- [ ] Test all database functions (ensure they still work)
- [ ] Check application functionality (ensure no breaking changes)

---

## 🔄 Rollback Instructions

If issues arise after any configuration change:

### Rollback Password Protection:
1. Go to **Authentication** → **Email**
2. Disable **"Block passwords from data breaches"**
3. Click **Save**

### Rollback OTP Expiry:
1. Go to **Authentication** → **Email**
2. Change OTP expiry back to **86400 seconds**
3. Click **Save**

### Rollback Extension Schema:
```sql
-- Move extensions back to public
ALTER EXTENSION "extension_name" SET SCHEMA public;
```

### Rollback Postgres Upgrade:
⚠️ **Cannot rollback** - Database upgrades are one-way. Ensure you have a backup before upgrading!

---

## 📊 Expected Results

After completing all manual configurations:

✅ Supabase Linter: **0 security warnings**
✅ Password Security: **Breached passwords blocked**
✅ OTP Security: **1-hour expiry (reduced from 24 hours)**
✅ Database Security: **Latest Postgres version with security patches**
✅ Function Security: **All functions have protected search paths**
✅ Extension Security: **Extensions isolated from public schema**

---

## 🆘 Support

If you encounter issues with any of these configurations:

1. Check Supabase Discord: https://discord.supabase.com
2. Review Supabase Docs: https://supabase.com/docs
3. Open support ticket in Supabase Dashboard

---

## 📅 Maintenance Schedule

**Recommended frequency for security reviews:**

- **Weekly:** Review audit logs for suspicious activity
- **Monthly:** Check for new Supabase security advisories
- **Quarterly:** Run full security audit (Supabase Linter + manual review)
- **Annually:** Review and update all RLS policies

---

*Last Updated: 2025-01-24*
*Applies to: Supabase Project auwhcdpppldjlcaxzsme*
