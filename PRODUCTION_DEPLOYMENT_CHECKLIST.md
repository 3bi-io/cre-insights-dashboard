# Production Deployment Checklist

Use this checklist to ensure a smooth production deployment of ATS.me.

## 📋 Pre-Deployment Checklist

### 1. Code Quality & Testing

- [ ] All tests passing locally
  ```bash
  npm run test
  npm run test:e2e
  ```
- [ ] No console errors in development
- [ ] No TypeScript errors
  ```bash
  npm run type-check
  ```
- [ ] Linting passes
  ```bash
  npm run lint
  ```
- [ ] Build succeeds without errors
  ```bash
  npm run build
  ```
- [ ] Bundle size analyzed and acceptable (< 1MB total)
- [ ] Code review completed
- [ ] All Phase 1-12 features tested manually

### 2. Environment Configuration

#### Required Environment Variables
- [ ] `VITE_SUPABASE_URL` configured
- [ ] `VITE_SUPABASE_ANON_KEY` configured
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` configured

#### Optional (Recommended for Production)
- [ ] `VITE_SENTRY_DSN` configured for error tracking
- [ ] `VITE_GA_MEASUREMENT_ID` configured for analytics

#### Supabase Secrets
- [ ] `LOVABLE_API_KEY` (auto-provisioned, verify it exists)
- [ ] `RESEND_API_KEY` (if using email features)
- [ ] Other integration secrets as needed

### 3. Database Setup

- [ ] All migrations run successfully
  ```bash
  supabase db push
  ```
- [ ] Database schema verified
- [ ] RLS policies enabled on all tables
- [ ] Security scan completed
  ```bash
  supabase db lint
  ```
- [ ] Test data cleaned up (if any)
- [ ] Production data seeded (if needed)

### 4. Edge Functions

- [ ] All edge functions deployed
  ```bash
  supabase functions deploy
  ```
- [ ] Edge function secrets configured
- [ ] Edge function logs checked for errors
- [ ] Test edge functions manually:
  - [ ] `ai-chat` - Test chatbot functionality
  - [ ] `send-application-email` - Test email sending
  - [ ] Other critical functions

### 5. Security Review

- [ ] All RLS policies reviewed and tested
- [ ] No exposed secrets in code
- [ ] CORS properly configured
- [ ] Rate limiting tested
- [ ] Authentication flow tested
- [ ] Role-based access control verified
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF protection enabled

### 6. Performance Optimization

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals acceptable:
  - [ ] FCP < 1.5s
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Images optimized
- [ ] Fonts optimized
- [ ] Code splitting verified
- [ ] Lazy loading implemented
- [ ] Service worker caching configured

### 7. PWA Configuration

- [ ] PWA manifest configured
- [ ] Icons generated (512x512, 192x192)
- [ ] Service worker registered
- [ ] Offline fallback page tested
- [ ] Install prompt tested on mobile
- [ ] App installs successfully on:
  - [ ] iOS (Safari)
  - [ ] Android (Chrome)
  - [ ] Desktop (Chrome/Edge)

### 8. Internationalization

- [ ] i18n initialized in main.tsx
- [ ] All 4 languages tested (EN, ES, FR, DE)
- [ ] Language selector accessible
- [ ] Translations complete
- [ ] Language persistence tested
- [ ] Browser language detection works

### 9. AI Features

- [ ] Lovable AI Gateway working
- [ ] Chatbot responds correctly
- [ ] Streaming messages work
- [ ] Rate limit handling tested
- [ ] Payment required errors handled gracefully
- [ ] AI scoring functionality tested

### 10. Email Integration

- [ ] Email templates reviewed
- [ ] Email service tested (or marked for post-deploy)
- [ ] RESEND_API_KEY configured (if using)
- [ ] Test emails sent successfully
- [ ] Email domain verified (if using custom domain)

## 🚀 Deployment Steps

### Option 1: Lovable Platform (Recommended)

1. **Pre-Deploy**
   - [ ] Commit all changes to Git
   - [ ] Push to GitHub (if connected)
   - [ ] Review staging environment

2. **Deploy**
   - [ ] Click "Publish" button in Lovable
   - [ ] Wait for deployment to complete (~2-5 minutes)
   - [ ] Verify deployment success message

3. **Post-Deploy Verification**
   - [ ] Visit production URL
   - [ ] Test authentication
   - [ ] Test core features
   - [ ] Check console for errors
   - [ ] Verify database connection

### Option 2: Vercel

1. **Setup**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Configure**
   - [ ] Add environment variables in Vercel dashboard
   - [ ] Configure build settings:
     - Build command: `npm run build`
     - Output directory: `dist`

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Verify**
   - [ ] Check deployment logs
   - [ ] Test production site
   - [ ] Configure custom domain (if applicable)

### Option 3: Netlify

1. **Setup**
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. **Configure**
   - [ ] Create `netlify.toml` (already exists)
   - [ ] Add environment variables in Netlify dashboard

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Verify**
   - [ ] Check deployment logs
   - [ ] Test production site
   - [ ] Configure custom domain (if applicable)

## ✅ Post-Deployment Verification

### Immediate Testing (First 30 minutes)

- [ ] Homepage loads successfully
- [ ] User can sign up
- [ ] User can log in
- [ ] Job listings display
- [ ] Application submission works
- [ ] AI chatbot responds
- [ ] Language switcher works
- [ ] PWA install prompt appears (mobile)
- [ ] No console errors
- [ ] No network errors

### Smoke Tests (First Hour)

- [ ] Create test job posting
- [ ] Submit test application
- [ ] Test AI scoring
- [ ] Test interview scheduling
- [ ] Test email notifications (if enabled)
- [ ] Test analytics dashboard
- [ ] Test team collaboration features
- [ ] Test mobile responsiveness
- [ ] Test offline functionality (PWA)

### Performance Tests (First 2 Hours)

- [ ] Run Lighthouse audit
- [ ] Check page load times
- [ ] Monitor error rates in Sentry
- [ ] Check analytics in GA4
- [ ] Verify database performance
- [ ] Check edge function logs

### Security Tests (First Day)

- [ ] Attempt unauthorized access
- [ ] Test rate limiting
- [ ] Verify RLS policies
- [ ] Check for exposed secrets
- [ ] Test CORS configuration
- [ ] Verify authentication flows

## 📊 Monitoring Setup

### Sentry (Error Tracking)

- [ ] Verify Sentry is receiving events
- [ ] Set up alert rules:
  - [ ] High error rate (> 10 errors/minute)
  - [ ] New error types
  - [ ] Performance degradation
- [ ] Configure issue assignment
- [ ] Set up Slack/email notifications

### Google Analytics (User Analytics)

- [ ] Verify GA4 is receiving pageviews
- [ ] Set up conversion tracking:
  - [ ] User sign up
  - [ ] Job posting created
  - [ ] Application submitted
  - [ ] Chatbot used
- [ ] Create custom dashboards
- [ ] Set up automated reports

### Supabase Monitoring

- [ ] Enable Supabase logs
- [ ] Set up alerts for:
  - [ ] High database load
  - [ ] Slow queries (> 1s)
  - [ ] Failed authentication attempts
  - [ ] Storage limit warnings
- [ ] Monitor edge function performance

## 🔄 Rollback Plan

If critical issues are discovered:

1. **Immediate Actions**
   - [ ] Stop deployment if in progress
   - [ ] Document the issue
   - [ ] Notify team

2. **Rollback Options**
   
   **Lovable:**
   - [ ] Use History view to revert to previous version
   - [ ] Click "Restore" on last working version
   
   **Vercel:**
   ```bash
   vercel rollback
   ```
   
   **Netlify:**
   ```bash
   netlify rollback
   ```

3. **Post-Rollback**
   - [ ] Verify rollback successful
   - [ ] Communicate status to users
   - [ ] Create incident report
   - [ ] Fix issues in development
   - [ ] Re-deploy with fixes

## 📝 Communication

### Before Deployment

- [ ] Notify team of deployment schedule
- [ ] Create maintenance window (if needed)
- [ ] Prepare status page update

### During Deployment

- [ ] Update status page: "Deployment in progress"
- [ ] Monitor deployment progress
- [ ] Be ready to rollback if needed

### After Deployment

- [ ] Update status page: "All systems operational"
- [ ] Send deployment summary to team:
  - Features deployed
  - Known issues
  - Next steps
- [ ] Update CHANGELOG.md
- [ ] Tag release in Git

## 🎯 Success Criteria

Deployment is successful when:

- [ ] All smoke tests pass
- [ ] No critical errors in Sentry (first hour)
- [ ] Error rate < 1%
- [ ] Page load time < 3s (95th percentile)
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals all green
- [ ] User can complete critical flows:
  - Sign up → Create job → Receive application
- [ ] No security vulnerabilities detected
- [ ] Team confirms everything working

## 📞 Emergency Contacts

**Technical Issues:**
- Lead Developer: [Contact Info]
- DevOps Lead: [Contact Info]

**Service Issues:**
- Supabase Support: support@supabase.com
- Lovable Support: support@lovable.dev
- Sentry Support: support@sentry.io

**On-Call Rotation:**
- Week 1: [Name]
- Week 2: [Name]

## 📚 Additional Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Supabase Dashboard](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme)
- [Sentry Dashboard](https://sentry.io)
- [GA4 Dashboard](https://analytics.google.com)

---

**Last Updated:** January 15, 2025
**Version:** 1.0.0
**Deployment Count:** Production launch

**Notes:**
- This checklist should be reviewed and updated after each deployment
- Add any project-specific checks as needed
- Keep emergency contact information current
