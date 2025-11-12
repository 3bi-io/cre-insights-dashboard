# Deployment Guide

Complete guide for deploying ATS.me to various platforms.

## Table of Contents

1. [Lovable Platform](#lovable-platform-default)
2. [Vercel](#vercel)
3. [Netlify](#netlify)
4. [AWS (S3 + CloudFront)](#aws-s3--cloudfront)
5. [DigitalOcean](#digitalocean)
6. [Docker](#docker)
7. [Environment Variables](#environment-variables)
8. [Custom Domain](#custom-domain)
9. [Database](#database)
10. [Edge Functions](#edge-functions)
11. [CI/CD](#cicd)
12. [Monitoring](#monitoring)

---

## Lovable Platform (Default)

The simplest deployment option with automatic builds and deployments.

### Prerequisites
- Lovable account
- Project synced to GitHub (optional but recommended)

### Deployment Steps

1. **Build Automatically**
   - Every code change triggers automatic build
   - Build completes in ~2-3 minutes
   - No configuration needed

2. **Publish**
   - Click **Publish** button in Lovable editor (top right)
   - Frontend changes require clicking "Update" in publish dialog
   - Backend changes (edge functions, migrations) deploy automatically

3. **Access Your App**
   - Default URL: `https://your-project.lovable.app`
   - Production-ready with SSL certificate
   - Global CDN included

### Features
- ✅ Automatic builds on push
- ✅ Zero-downtime deployments
- ✅ SSL certificates (automatic)
- ✅ Global CDN
- ✅ Preview deployments
- ✅ Rollback support

### Custom Domain

1. Go to **Project Settings → Domains**
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `ats.me`)
4. Update DNS records as instructed:
   ```
   Type: CNAME
   Name: @  (or www)
   Value: [provided by Lovable]
   ```
5. Wait for DNS propagation (5 minutes to 48 hours)
6. SSL certificate issued automatically

---

## Vercel

Perfect for serverless deployment with automatic edge functions.

### Prerequisites
- Vercel account
- Project on GitHub

### Deployment Steps

1. **Connect GitHub Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Link project
   vercel link
   ```

2. **Configure Build Settings**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "installCommand": "npm install"
   }
   ```

3. **Environment Variables**
   - Go to **Project Settings → Environment Variables**
   - Add required variables:
     ```
     NODE_ENV=production
     VITE_SENTRY_DSN=your-sentry-dsn
     ```

4. **Deploy**
   ```bash
   # Production deployment
   vercel --prod
   
   # Or push to main branch for automatic deployment
   git push origin main
   ```

### Configuration

**Build & Development Settings**:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Development Command: `npm run dev`

**Functions**: Edge functions not supported natively - use Vercel Serverless Functions as alternative.

---

## Netlify

Great for static site hosting with form handling.

### Prerequisites
- Netlify account
- Project on GitHub

### Deployment Steps

1. **Connect Repository**
   - Go to https://app.netlify.com
   - Click **New site from Git**
   - Choose **GitHub**
   - Select your repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **Create netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   
   [build.environment]
     NODE_VERSION = "18"
   ```

4. **Environment Variables**
   - Go to **Site settings → Environment variables**
   - Add variables:
     ```
     NODE_ENV=production
     VITE_SENTRY_DSN=your-sentry-dsn
     ```

5. **Deploy**
   ```bash
   # Install Netlify CLI
   npm i -g netlify-cli
   
   # Login
   netlify login
   
   # Deploy
   netlify deploy --prod
   ```

### Features
- ✅ Automatic deployments
- ✅ Deploy previews
- ✅ Form handling
- ✅ Split testing
- ✅ Analytics
- ✅ Edge functions (limited)

---

## AWS (S3 + CloudFront)

Highly scalable deployment using AWS services.

### Prerequisites
- AWS account
- AWS CLI configured
- Domain in Route 53 (optional)

### Deployment Steps

1. **Create S3 Bucket**
   ```bash
   # Create bucket
   aws s3 mb s3://ats-me-production
   
   # Enable static website hosting
   aws s3 website s3://ats-me-production \
     --index-document index.html \
     --error-document index.html
   ```

2. **Configure Bucket Policy**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::ats-me-production/*"
     }]
   }
   ```

3. **Build and Upload**
   ```bash
   # Build
   npm run build
   
   # Upload to S3
   aws s3 sync dist/ s3://ats-me-production \
     --delete \
     --cache-control "public, max-age=31536000"
   
   # Update index.html cache
   aws s3 cp dist/index.html s3://ats-me-production/index.html \
     --cache-control "public, max-age=0, must-revalidate"
   ```

4. **Create CloudFront Distribution**
   ```bash
   aws cloudfront create-distribution \
     --origin-domain-name ats-me-production.s3.amazonaws.com \
     --default-root-object index.html
   ```

5. **Configure Custom Error Pages**
   - Error Code: 403
   - Response Page: /index.html
   - Response Code: 200

### Deployment Script

```bash
#!/bin/bash
# deploy.sh

# Build
echo "Building..."
npm run build

# Upload to S3
echo "Uploading to S3..."
aws s3 sync dist/ s3://ats-me-production \
  --delete \
  --cache-control "public, max-age=31536000"

# Update index.html
aws s3 cp dist/index.html s3://ats-me-production/index.html \
  --cache-control "public, max-age=0, must-revalidate" \
  --metadata-directive REPLACE

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

---

## DigitalOcean

Simple VPS deployment with App Platform.

### Prerequisites
- DigitalOcean account
- Project on GitHub

### Deployment Steps

1. **Create App**
   - Go to **Apps → Create App**
   - Connect GitHub repository
   - Select branch (main)

2. **Configure**
   - Name: `ats-me`
   - Region: Closest to users
   - Instance size: Basic ($5/month)

3. **Build Settings**
   ```yaml
   # .do/app.yaml
   name: ats-me
   region: nyc
   
   static_sites:
   - name: frontend
     github:
       repo: your-org/ats-me
       branch: main
       deploy_on_push: true
     build_command: npm run build
     output_dir: dist
     routes:
     - path: /
     environment_slug: node-js
   ```

4. **Environment Variables**
   Add in App Platform settings:
   ```
   NODE_ENV=production
   VITE_SENTRY_DSN=your-sentry-dsn
   ```

5. **Deploy**
   - Click **Deploy**
   - Or push to main branch

---

## Docker

Containerized deployment for any platform.

### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### Build and Run

```bash
# Build image
docker build -t ats-me:latest .

# Run container
docker run -d \
  -p 80:80 \
  --name ats-me \
  ats-me:latest

# Or use docker-compose
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

---

## Environment Variables

### Production Variables

```env
# Sentry (Optional)
VITE_SENTRY_DSN=https://...@sentry.io/...

# Analytics (Optional)
VITE_GA4_ID=G-XXXXXXXXXX
```

### Setting Variables

**Vercel**:
```bash
vercel env add VITE_SENTRY_DSN
```

**Netlify**:
```bash
netlify env:set VITE_SENTRY_DSN "your-value"
```

**AWS**:
Add to build environment or use AWS Systems Manager Parameter Store.

---

## Custom Domain

### DNS Configuration

For `ats.me`:

**Root Domain (@)**:
```
Type: A (or CNAME to www)
Name: @
Value: [hosting provider IP or CNAME]
TTL: 3600
```

**WWW Subdomain**:
```
Type: CNAME
Name: www
Value: [hosting provider domain]
TTL: 3600
```

### SSL Certificate

Most platforms provide automatic SSL:
- **Lovable**: Automatic
- **Vercel**: Automatic
- **Netlify**: Automatic
- **AWS**: Use ACM (AWS Certificate Manager)

---

## Database

### Supabase Configuration

The app is pre-configured with Supabase project credentials:
- Project: `auwhcdpppldjlcaxzsme`
- URL: `https://auwhcdpppldjlcaxzsme.supabase.co`
- Anon Key: Already in code

**No additional database setup needed!**

### Migrations

Migrations are applied automatically via Lovable or can be run manually:

```bash
# Apply migrations (if using Supabase CLI)
supabase db push
```

---

## Edge Functions

### Deploy Supabase Functions

Edge functions deploy automatically in Lovable. For manual deployment:

```bash
# Install Supabase CLI
npm i -g supabase

# Login
supabase login

# Link project
supabase link --project-ref auwhcdpppldjlcaxzsme

# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy generate-sitemap
```

---

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
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
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      
      # Deploy to Vercel
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Monitoring

### Set Up Sentry

1. Create Sentry project at https://sentry.io
2. Get DSN from project settings
3. Add to environment variables:
   ```
   VITE_SENTRY_DSN=https://...@sentry.io/...
   ```
4. App automatically sends errors to Sentry

### Performance Monitoring

- **Lighthouse CI**: Run on every deployment
- **Web Vitals**: Tracked via Sentry
- **Supabase Analytics**: Database query performance

---

## Troubleshooting

### Build Failures

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+

# Check TypeScript errors
npm run type-check
```

### Deployment Issues

1. **404 on refresh**: Configure SPA fallback (see platform-specific guides)
2. **Environment variables not working**: Ensure variables start with `VITE_`
3. **Build timeout**: Increase build timeout in platform settings

### Performance Issues

1. **Slow initial load**: Check bundle size with `npm run build`
2. **Slow API calls**: Check Supabase instance size
3. **High bandwidth**: Enable gzip compression

---

## Checklist

Before deploying to production:

- [ ] Run full test suite (`npm run test && npm run test:e2e`)
- [ ] Check TypeScript compilation (`npm run type-check`)
- [ ] Test production build locally (`npm run build && npm run preview`)
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Enable SSL certificate
- [ ] Configure error monitoring (Sentry)
- [ ] Set up analytics (GA4)
- [ ] Test on multiple devices/browsers
- [ ] Check Lighthouse scores (>90 performance)
- [ ] Verify SEO meta tags
- [ ] Test sitemap.xml and robots.txt
- [ ] Set up automated backups (Supabase)
- [ ] Document deployment process
- [ ] Create rollback plan

---

**Need Help?**
- Lovable Support: https://docs.lovable.dev
- Supabase Support: https://supabase.com/docs
- Community Discord: [Join](https://discord.gg/atsme)
