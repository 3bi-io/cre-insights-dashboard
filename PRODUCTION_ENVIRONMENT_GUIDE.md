# Production Environment Configuration Guide

## 🚀 **Production Deployment Checklist**

> **UPDATE - October 31, 2024:** Geographic location restrictions have been removed. Super admin access is now available from any location worldwide. All other security controls remain in place.

This guide ensures your ATS.me application is properly configured for production deployment.

---

## 📋 **Required Environment Variables**

### **Supabase Configuration**
All Supabase configuration is automatically handled through Lovable Cloud integration:
- ✅ `SUPABASE_URL` - Auto-configured
- ✅ `SUPABASE_PUBLISHABLE_KEY` - Auto-configured  
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured (Edge Functions only)

### **Optional: Analytics & Monitoring**

#### Google Analytics (Optional)
```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
**Required:** Only if you want to track user behavior and application usage
**How to get:** Create property at [Google Analytics](https://analytics.google.com/)

#### Sentry Error Tracking (Optional)
```bash
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```
**Required:** Only if you want comprehensive error monitoring
**How to get:** Create project at [Sentry.io](https://sentry.io/)

---

## 🔐 **Supabase Secrets Configuration**

The following secrets are managed through Supabase and are already configured:

### **Required for Platform Integrations:**
- ✅ `META_ACCESS_TOKEN` - Facebook/Meta ads integration
- ✅ `META_APP_ID` - Facebook/Meta app configuration  
- ✅ `META_APP_SECRET` - Facebook/Meta app secret
- ✅ `TWILIO_ACCOUNT_SID` - SMS authentication
- ✅ `TWILIO_AUTH_TOKEN` - Twilio authentication
- ✅ `TWILIO_PHONE_NUMBER` - SMS sender number

### **Required for AI Features:**
- ✅ `OPENAI_API_KEY` - OpenAI GPT integration
- ✅ `ANTHROPIC_API_KEY` - Claude AI integration
- ✅ `ELEVENLABS_API_KEY` - Voice agent integration

### **Required for Job Board Integrations:**
- ✅ `INDEED_CLIENT_ID` - Indeed API access
- ✅ `INDEED_CLIENT_SECRET` - Indeed authentication
- ✅ `GOOGLE_SERVICE_ACCOUNT_JSON` - Google Jobs integration
- ✅ `CRAIGSLIST_USERNAME` - Craigslist posting
- ✅ `CRAIGSLIST_PASSWORD` - Craigslist authentication
- ✅ `CRAIGSLIST_ACCOUNT_ID` - Craigslist account ID

### **Social Media & Communication:**
- ✅ `X_ACCESS_TOKEN` - X/Twitter integration
- ✅ `X_ACCESS_TOKEN_SECRET` - X/Twitter authentication
- ✅ `X_API_SECRET` - X/Twitter API secret

**Note:** All these secrets are stored securely in Supabase and are accessible only to Edge Functions.

---

## ⚙️ **Production Configuration Status**

### ✅ **Build Configuration (Complete)**
- **Console Logging:** Disabled in production builds
- **Development Tools:** Removed from production
- **Code Minification:** Enabled with Terser
- **Tree Shaking:** Enabled
- **Source Maps:** Enabled for debugging
- **Bundle Analysis:** Available via visualizer

### ✅ **Security Configuration (Phase 1 & 2 Complete)**
- **RLS Policies:** Enabled on all tables
- **Storage Policies:** Organization-scoped
- **Edge Functions:** Server-side authentication
- **Audit Logging:** Comprehensive tracking
- **Input Validation:** Centralized validation utilities
- **Rate Limiting:** Implemented on critical endpoints

### ✅ **Error Handling (Production-Ready)**
- **Error Service:** Production mode defaults
- **Console Logging:** Only in development
- **Remote Logging:** Enabled in production
- **Error Rate Limiting:** 5 seconds between same errors
- **Max Errors Per Session:** 50

### ✅ **Analytics Configuration (Production-Ready)**
- **Google Analytics:** Only runs in production mode
- **Sentry:** Only runs in production mode
- **Feature Tracking:** Enabled
- **Performance Monitoring:** Enabled

---

## 🚨 **Critical User Actions Required**

### **IMMEDIATE** (Before Production Launch):

1. **Enable Leaked Password Protection**
   - Go to: [Supabase Dashboard](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/auth/providers) → Authentication → Password Protection
   - Enable: "Leaked Password Protection"
   - Why: Prevents users from using compromised passwords

2. **Reduce OTP Expiry Time**
   - Go to: [Supabase Dashboard](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/auth/providers) → Authentication → Email Settings
   - Change OTP expiry from current value to: **5-10 minutes**
   - Why: Reduces security window for intercepted OTPs

3. **Configure Google Analytics** (Optional)
   - Create GA4 property
   - Add `VITE_GA_MEASUREMENT_ID` to environment variables
   - Why: Track user behavior and application metrics

4. **Configure Sentry** (Optional)
   - Create Sentry project
   - Add `VITE_SENTRY_DSN` to environment variables
   - Why: Production error monitoring and alerting

### **SHORT-TERM** (Within 1 Week):

5. **Schedule Postgres Upgrade**
   - Contact: [Supabase Support](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/settings/general)
   - Why: Security patches available for Postgres
   - Action: Schedule upgrade to latest stable version

6. **Review Audit Logs**
   - Go to: Application → Audit Logs page
   - Review: Security events during migration period
   - Why: Verify no suspicious activity during deployment

7. **Test Security Features**
   - Test: Super admin geographic restrictions
   - Test: RLS policies with different user roles
   - Test: Storage access controls
   - Why: Verify security measures are working correctly

---

## 🔗 **Useful Resources**

### **Supabase Dashboard Links**
- [Project Dashboard](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme)
- [Authentication Settings](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/auth/providers)
- [Database Settings](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/database/tables)
- [Edge Functions](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/functions)
- [Edge Functions Secrets](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/settings/functions)
- [Storage Buckets](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/storage/buckets)

### **Documentation**
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Password Protection Guide](https://supabase.com/docs/guides/auth/password-security)
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Postgres Upgrade Guide](https://supabase.com/docs/guides/platform/upgrading)

### **Monitoring & Analytics**
- [Google Analytics Setup](https://analytics.google.com/)
- [Sentry Error Tracking](https://sentry.io/)
- [Performance Monitoring](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/logs/edge-functions)

---

## 📊 **Production Readiness Checklist**

### **Phase 1: Critical Security** ✅ COMPLETE
- [x] Geographic access control (admin location check)
- [x] Organization public access fixed
- [x] SECURITY DEFINER functions secured
- [x] Applications PII column security
- [x] Audit logs immutability

### **Phase 2: High-Priority Security** ✅ COMPLETE
- [x] Storage bucket security (organization-scoped)
- [x] Console logging removed from production
- [x] Shared validation utilities created
- [x] Shared authentication utilities created
- [x] Server-side role validation on edge functions

### **Phase 3: Production Hardening** ✅ COMPLETE
- [x] Development references removed
- [x] Production-only configuration
- [x] Error service defaults to production mode
- [x] Analytics/Sentry production-only
- [x] Build optimization enabled

### **User Actions**
- [ ] Enable leaked password protection
- [ ] Reduce OTP expiry to 5-10 minutes
- [ ] Schedule Postgres upgrade
- [ ] Configure Google Analytics (optional)
- [ ] Configure Sentry (optional)
- [ ] Test security features
- [ ] Review audit logs

---

## 🏗️ **Build & Deployment**

### **Production Build**
```bash
npm run build
```

This command:
- Removes all console statements
- Minifies and optimizes code
- Generates production-ready bundles
- Creates bundle analysis (dist/stats.html)
- Optimizes images
- Generates PWA assets

### **Preview Production Build**
```bash
npm run preview
```

### **Deployment**
1. Click "Publish" button in Lovable interface
2. Your app will be deployed to your custom domain or Lovable subdomain
3. Edge functions are automatically deployed
4. Environment variables are automatically configured

---

## 🔒 **Security Reminders**

### **NEVER Commit These Files:**
- ❌ `.env` files (there are none in Lovable projects)
- ❌ API keys or secrets in code
- ❌ Database credentials
- ❌ Service account JSON files

### **ALWAYS:**
- ✅ Use Supabase Secrets for sensitive data
- ✅ Test RLS policies before production
- ✅ Review audit logs regularly
- ✅ Keep dependencies updated
- ✅ Monitor error rates via Sentry
- ✅ Review analytics for unusual patterns

---

## 📞 **Support**

### **Need Help?**
- **Supabase Support:** [Dashboard](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/settings/general)
- **Lovable Documentation:** [docs.lovable.dev](https://docs.lovable.dev/)
- **Security Issues:** Report immediately via audit logs

### **Monitoring**
- **Application Health:** Check Supabase Dashboard
- **Error Rates:** Review Sentry dashboard (if configured)
- **User Analytics:** Review Google Analytics (if configured)
- **Security Events:** Check audit_logs table

---

**Last Updated:** October 31, 2024  
**Version:** 1.0  
**Status:** ✅ PRODUCTION READY
