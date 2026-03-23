# Deployment Guide

This guide covers deploying Apply AI to production using various platforms.

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] API keys and secrets configured
- [ ] DNS records configured (if using custom domain)

### 2. Build Optimization
- [ ] Run production build locally (`npm run build`)
- [ ] Check bundle size analysis (`dist/stats.html`)
- [ ] Test PWA functionality
- [ ] Verify all routes work
- [ ] Test authentication flow

### 3. Security Review
- [ ] RLS policies enabled on all tables
- [ ] Edge function secrets configured
- [ ] CORS settings reviewed
- [ ] Rate limiting implemented
- [ ] Security headers configured

## 🚀 Deployment Options

### Option 1: Lovable (Recommended for Quick Deployment)

Lovable provides one-click deployment with automatic HTTPS and global CDN.

1. **Connect to GitHub**
   - Click GitHub → Connect to GitHub
   - Authorize Lovable GitHub App
   - Select repository

2. **Deploy**
   - Click Publish button (top right on desktop)
   - Wait for deployment to complete
   - Your app will be live at `yoursite.lovable.app`

3. **Custom Domain** (Paid plans only)
   - Go to Project → Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed
   - Wait for SSL certificate provisioning

**Pros:**
- One-click deployment
- Automatic HTTPS
- Global CDN
- Zero configuration

**Cons:**
- Requires paid plan for custom domains
- Less control over deployment pipeline

### Option 2: Vercel

Vercel offers excellent performance and DX for React applications.

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Configure Environment Variables**
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Add required variables:
     - `VITE_SENTRY_DSN` (optional)
     - `VITE_GA_MEASUREMENT_ID` (optional)

4. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Custom Domain**
   - Go to Domains → Add Domain
   - Follow DNS configuration instructions

**Pros:**
- Excellent performance
- Automatic deployments from Git
- Edge network
- Great DX

**Cons:**
- Additional cost for team features

### Option 3: Netlify

Netlify provides simple deployment with built-in CI/CD.

1. **Create `netlify.toml`**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

2. **Deploy**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

3. **Configure Environment Variables**
   - Go to Site Settings → Build & Deploy → Environment
   - Add environment variables

4. **Custom Domain**
   - Go to Domain Management → Add Custom Domain
   - Configure DNS records

**Pros:**
- Simple deployment
- Generous free tier
- Built-in forms and functions

**Cons:**
- Limited build minutes on free tier

### Option 4: AWS Amplify

AWS Amplify provides full-stack deployment with AWS integration.

1. **Install Amplify CLI**
```bash
npm install -g @aws-amplify/cli
amplify configure
```

2. **Initialize Amplify**
```bash
amplify init
```

3. **Add Hosting**
```bash
amplify add hosting
# Select: Hosting with Amplify Console
```

4. **Deploy**
```bash
amplify publish
```

5. **Configure Environment Variables**
   - Go to Amplify Console → App Settings → Environment Variables
   - Add required variables

**Pros:**
- Deep AWS integration
- Powerful backend capabilities
- Scalable infrastructure

**Cons:**
- More complex setup
- AWS knowledge required

### Option 5: Self-Hosted (Docker)

For maximum control, deploy using Docker.

1. **Create `Dockerfile`**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **Create `nginx.conf`**
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **Build and Run**
```bash
# Build image
docker build -t apply-ai .

# Run container
docker run -d -p 80:80 --name apply-ai apply-ai
```

4. **Docker Compose** (with reverse proxy)
```yaml
version: '3.8'

services:
  app:
    build: .
    restart: always
    expose:
      - 80
    environment:
      - VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
      - VITE_GA_MEASUREMENT_ID=${VITE_GA_MEASUREMENT_ID}

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
```

**Pros:**
- Complete control
- Can run anywhere
- Cost-effective at scale

**Cons:**
- Requires infrastructure management
- SSL certificate management
- DevOps expertise needed

## 🗄️ Supabase Configuration

### 1. Database Setup

1. **Apply Migrations**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

2. **Verify RLS Policies**
```bash
# Check for RLS warnings
supabase db lint
```

### 2. Edge Functions

1. **Deploy Functions**
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name
```

2. **Configure Secrets**
```bash
# Set secrets
supabase secrets set LOVABLE_API_KEY=your-key
supabase secrets set OTHER_SECRET=value
```

### 3. Storage Buckets

Ensure storage buckets are created with proper policies:
```sql
-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);
```

### 4. Authentication

Configure authentication providers in Supabase Dashboard:
- Email/Password
- Magic Links
- Google OAuth (optional)
- Other providers as needed

## 🔐 Security Hardening

### 1. Enable Security Headers

Add to your hosting platform or nginx config:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://auwhcdpppldjlcaxzsme.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://auwhcdpppldjlcaxzsme.supabase.co wss://auwhcdpppldjlcaxzsme.supabase.co;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 2. Configure CORS

In Supabase Dashboard → Settings → API:
- Set allowed origins to your production domain(s)
- Remove development URLs

### 3. Rate Limiting

Implement rate limiting on edge functions:
```typescript
// In edge function
import { createRateLimiter } from './utils/rateLimiter';

const limiter = createRateLimiter({
  window: '1m',
  max: 10
});

// Check rate limit
if (!await limiter.check(userId)) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### 4. API Key Rotation

Schedule regular rotation of:
- Supabase service keys
- Third-party API keys
- JWT secrets

## 📊 Monitoring Setup

### 1. Sentry

1. **Create Sentry Project**
   - Go to https://sentry.io
   - Create new project for React
   - Copy DSN

2. **Configure Environment Variable**
```bash
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

3. **Verify Installation**
   - Trigger a test error in production
   - Check Sentry dashboard for the error

### 2. Google Analytics

1. **Create GA4 Property**
   - Go to https://analytics.google.com
   - Create new GA4 property
   - Copy Measurement ID

2. **Configure Environment Variable**
```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. **Verify Tracking**
   - Visit your site
   - Check GA4 Realtime report

### 3. Supabase Monitoring

- Enable Supabase Logs in Dashboard
- Set up alerts for:
  - High error rates
  - Slow queries
  - Storage usage
  - Bandwidth usage

## 🧪 Post-Deployment Testing

### 1. Smoke Tests
- [ ] Homepage loads
- [ ] Authentication works
- [ ] Core features functional
- [ ] PWA installs correctly
- [ ] Offline mode works

### 2. Performance Tests
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Largest Contentful Paint < 2.5s

### 3. Security Tests
- [ ] HTTPS enabled
- [ ] Security headers present
- [ ] XSS protection active
- [ ] CSRF protection working
- [ ] RLS policies enforced

### 4. Browser Testing
Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: vercel/actions@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 📈 Scaling Considerations

### Database Optimization
- Enable connection pooling
- Add database indexes
- Implement query caching
- Consider read replicas for high traffic

### CDN Configuration
- Enable edge caching
- Configure cache headers
- Optimize asset delivery
- Use image CDN for media

### Performance Monitoring
- Set up performance budgets
- Monitor Core Web Vitals
- Track user metrics
- Implement error budgets

## 🆘 Rollback Procedure

If deployment fails:

1. **Immediate Rollback**
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Lovable
# Use History view to restore previous version
```

2. **Database Rollback**
```bash
# Revert last migration
supabase db reset --version previous
```

3. **Communication**
- Notify users via status page
- Post incident report
- Document learnings

## 📝 Deployment Checklist

Use this checklist for every deployment:

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Monitoring tools active
- [ ] Rollback procedure tested
- [ ] Team notified
- [ ] Documentation updated
- [ ] Change log updated

---

For issues or questions, refer to [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
