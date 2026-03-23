# Environment Variables Documentation

Complete guide to all environment variables used in Apply AI.

## 📋 Required Variables

These variables MUST be set for the application to function.

### Frontend Environment Variables

Located in `.env` file (not committed to Git):

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://auwhcdpppldjlcaxzsme.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

**How to get these values:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme)
2. Navigate to Settings → API
3. Copy the values:
   - `URL` → `VITE_SUPABASE_URL`
   - `anon` key → `VITE_SUPABASE_ANON_KEY`
   - `anon` key → `VITE_SUPABASE_PUBLISHABLE_KEY` (same as anon key)

## 🔧 Optional Variables

These variables enhance functionality but are not required for basic operation.

### Monitoring & Analytics

```bash
# Sentry Error Tracking (Optional but recommended for production)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Google Analytics 4 (Optional but recommended for production)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Sentry Setup:**
1. Sign up at [sentry.io](https://sentry.io)
2. Create new project for React
3. Copy the DSN from project settings
4. Paste into `VITE_SENTRY_DSN`

**Google Analytics Setup:**
1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get Measurement ID from property settings
3. Paste into `VITE_GA_MEASUREMENT_ID`

## 🔐 Supabase Secrets

These secrets are stored in Supabase and used by Edge Functions.

### Access Secrets

Go to: [Supabase Dashboard → Settings → Edge Functions](https://supabase.com/dashboard/project/auwhcdpppldjlcaxzsme/settings/functions)

### AI Features (Auto-Provisioned)

```bash
# Lovable AI Gateway (Automatically configured)
LOVABLE_API_KEY=auto_generated_by_lovable
```

**Note:** This is automatically provisioned when you enable Lovable AI. You don't need to set it manually.

### Email Integration (Optional)

```bash
# Resend Email Service (Optional - for production email sending)
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Resend Setup:**
1. Sign up at [resend.com](https://resend.com)
2. Verify your email domain at [resend.com/domains](https://resend.com/domains)
3. Create API key at [resend.com/api-keys](https://resend.com/api-keys)
4. Add secret in Supabase:
   ```bash
   supabase secrets set RESEND_API_KEY=your_key
   ```

### Other Integration Secrets

The following secrets are already configured in your Supabase project:

- `INDEED_CLIENT_ID` - Indeed integration
- `INDEED_CLIENT_SECRET` - Indeed integration
- `CRAIGSLIST_USERNAME` - Craigslist integration
- `CRAIGSLIST_PASSWORD` - Craigslist integration
- `CRAIGSLIST_ACCOUNT_ID` - Craigslist integration
- `META_APP_ID` - Facebook/Meta integration
- `META_APP_SECRET` - Facebook/Meta integration
- `META_ACCESS_TOKEN` - Facebook/Meta integration
- `GOOGLE_SERVICE_ACCOUNT_JSON` - Google services
- `ELEVENLABS_API_KEY` - ElevenLabs voice AI
- `OPENAI_API_KEY` - OpenAI integration
- `ANTHROPIC_API_KEY` - Anthropic Claude integration
- `TWILIO_ACCOUNT_SID` - Twilio SMS
- `TWILIO_AUTH_TOKEN` - Twilio SMS
- `TWILIO_PHONE_NUMBER` - Twilio SMS
- `X_ACCESS_TOKEN` - Twitter/X integration
- `X_ACCESS_TOKEN_SECRET` - Twitter/X integration
- `X_API_SECRET` - Twitter/X integration
- `SUPABASE_URL` - Internal Supabase URL
- `SUPABASE_ANON_KEY` - Internal anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Internal service role key
- `SUPABASE_PUBLISHABLE_KEY` - Internal publishable key
- `SUPABASE_DB_URL` - Internal database URL

## 📝 Environment Variable Reference

### Variable Naming Convention

- **Frontend variables:** Prefixed with `VITE_` (accessible in client-side code)
- **Backend secrets:** No prefix (only accessible in Edge Functions)

### Security Best Practices

1. **Never commit `.env` files** to Git
2. **Use different values** for development and production
3. **Rotate secrets regularly** (every 90 days)
4. **Use service role keys** only in Edge Functions
5. **Never expose service role keys** to the frontend

## 🔄 Setting Up Environments

### Development Environment

1. **Create `.env.local` file** (not committed):
   ```bash
   cp .env.example .env.local
   ```

2. **Add development values:**
   ```bash
   VITE_SUPABASE_URL=https://auwhcdpppldjlcaxzsme.supabase.co
   VITE_SUPABASE_ANON_KEY=your_dev_anon_key
   VITE_SUPABASE_PUBLISHABLE_KEY=your_dev_publishable_key
   # Optional - for local testing
   VITE_SENTRY_DSN=
   VITE_GA_MEASUREMENT_ID=
   ```

### Production Environment

**Lovable Platform:**
- Environment variables are automatically configured
- Access via Lovable dashboard if needed

**Vercel:**
1. Go to Vercel project settings
2. Navigate to Environment Variables
3. Add each variable with production values
4. Select "Production" environment

**Netlify:**
1. Go to Netlify site settings
2. Navigate to Build & Deploy → Environment
3. Add each variable with production values

**Self-Hosted:**
- Set environment variables in your hosting platform
- Or use `.env.production` file (not committed)

## 🧪 Testing Environment Variables

### Verify Frontend Variables

```typescript
// In your React component
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Sentry DSN:', import.meta.env.VITE_SENTRY_DSN);
console.log('GA ID:', import.meta.env.VITE_GA_MEASUREMENT_ID);
```

### Verify Supabase Secrets

```bash
# List all secrets
supabase secrets list

# Test specific secret in Edge Function
# In your edge function:
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
console.log("API Key exists:", !!LOVABLE_API_KEY);
```

## 🐛 Troubleshooting

### Common Issues

**Issue: "Supabase client not initialized"**
- **Solution:** Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

**Issue: "LOVABLE_API_KEY is not configured"**
- **Solution:** Enable Lovable AI in your project settings

**Issue: "Rate limit exceeded" in AI chatbot**
- **Solution:** Add credits to Lovable AI workspace

**Issue: "Failed to send email"**
- **Solution:** Add and verify `RESEND_API_KEY` secret

**Issue: Sentry not receiving errors**
- **Solution:** Verify `VITE_SENTRY_DSN` is set correctly

**Issue: GA4 not tracking pageviews**
- **Solution:** Verify `VITE_GA_MEASUREMENT_ID` is set correctly

### Debugging Steps

1. **Check if variable is set:**
   ```bash
   echo $VITE_SUPABASE_URL
   ```

2. **Verify in browser console:**
   ```javascript
   console.log(import.meta.env)
   ```

3. **Test Supabase connection:**
   ```typescript
   import { supabase } from '@/integrations/supabase/client';
   const { data, error } = await supabase.from('profiles').select('*').limit(1);
   console.log('Connection test:', { data, error });
   ```

4. **Check Edge Function logs:**
   ```bash
   supabase functions logs ai-chat
   ```

## 📚 Related Documentation

- [Deployment Guide](./DEPLOYMENT.md) - How to deploy to production
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 🔒 Security Notes

### What to Keep Secret

**HIGH RISK (Never expose):**
- `SUPABASE_SERVICE_ROLE_KEY`
- API keys for third-party services
- Database connection strings
- Private keys

**LOW RISK (Can be public):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_GA_MEASUREMENT_ID`

### Environment Variable Security Checklist

- [ ] `.env` files added to `.gitignore`
- [ ] No secrets in Git history
- [ ] Production secrets different from development
- [ ] Secrets rotated regularly
- [ ] Service role key never exposed to frontend
- [ ] API keys have appropriate permissions (least privilege)
- [ ] Unused secrets removed
- [ ] Team members only have access to necessary secrets

---

**Last Updated:** January 15, 2025
**Version:** 1.0.0

For questions or issues, refer to [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
