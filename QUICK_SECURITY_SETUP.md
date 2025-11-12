# Quick Security Setup (15 Minutes)

Complete these 3 critical tasks to maximize security.

---

## ✅ Task 1: Enable Leaked Password Protection (5 min)

[Open Auth Settings →](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/auth/providers)

1. Scroll to **"Password Settings"**
2. Enable **"Leaked Password Protection"**
3. Set **"Minimum Password Strength"** to **"Strong"**
4. Click **Save**

**Why:** Prevents users from using compromised passwords from data breaches.

---

## ✅ Task 2: Reduce OTP Expiry Times (3 min)

[Open Auth Settings →](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/auth/providers)

1. Scroll to **"OTP Expiry Settings"**
2. Set **"Email OTP Expiry"** to **900** seconds (15 min)
3. Set **"SMS OTP Expiry"** to **300** seconds (5 min)
4. Click **Save**

**Current:** 3600s (60 min) - TOO LONG  
**Recommended:** Email 900s, SMS 300s  
**Why:** Shorter OTP windows reduce interception attack risk.

---

## ✅ Task 3: Verify Security (7 min)

[Open SQL Editor →](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/sql/new)

Run this verification query:

```sql
-- Verify Meta tables have organization_id
SELECT 
  table_name,
  COUNT(*) FILTER (WHERE column_name = 'organization_id') as has_org_id
FROM information_schema.columns
WHERE table_name LIKE 'meta_%'
GROUP BY table_name
ORDER BY table_name;
```

**Expected:** Each Meta table should show `has_org_id = 1`

---

## 🎯 Success Criteria

✅ Leaked password protection enabled  
✅ OTP expiry reduced to 15min (email) and 5min (SMS)  
✅ Meta tables have organization scoping  
✅ RLS policies enforcing organization boundaries  

**Security Status:** 🟢 **VERY LOW RISK**

---

## 📋 Optional: Schedule Postgres Upgrade

**When:** Next 2 weeks during low-traffic period  
**Time:** 30-60 minutes with downtime  
**Priority:** MEDIUM

1. [Create Backup](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/database/backups)
2. [Schedule Upgrade](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/settings/database)
3. Test all functionality post-upgrade

---

**Need more details?** See [SECURITY_STATUS.md](./SECURITY_STATUS.md)
