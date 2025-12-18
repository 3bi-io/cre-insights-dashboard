# Changelog

All notable changes to ATS.me will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Coming Soon
- Enhanced email templates with Resend integration
- Advanced calendar features with timezone support
- Additional languages (Chinese, Japanese, Arabic)
- Native mobile apps (iOS & Android with Capacitor)
- Video interview integration
- Advanced reporting dashboard
- Custom workflow builder

## [1.1.0] - 2025-12-18

### 🎙️ AI Voice Recruitment

#### ElevenLabs Integration
- **Voice Agents** - Conversational AI for automated applicant screening
- **Outbound Calls** - Automatic follow-up calls on application submission
- **Inbound Agents** - Handle incoming applicant inquiries 24/7
- **Voice Apply** - Complete applications via voice conversation
- **Call Transcripts** - Full conversation history with AI analysis
- **Phone Number Management** - Configure agent phone numbers

#### Voice Agent Features
- Real-time WebRTC voice streaming
- Natural conversation flow with interruption handling
- Context-aware responses based on job requirements
- Automatic transcript generation and storage

### 🔗 Webhook Enhancements

#### Source Filtering
- **Application Source Filters** - Trigger webhooks by application source
- **Event Types** - Configure specific events (created, updated, status_changed)
- **Source Options** - Direct Application, ElevenLabs, Facebook Lead Gen, etc.

#### Bulk Export
- **Bulk Webhook Export** - Send all matching applications to webhook endpoint
- **Rate Limiting** - 5 requests per hour per user
- **Audit Logging** - Complete export history

### 📋 Application Improvements

#### Enhanced Form
- **State Dropdown** - US state selection instead of free text
- **Phone Formatting** - Real-time phone number formatting
- **Progress Indicator** - Visual progress through form sections
- **Dynamic Context** - Job and organization info throughout form

#### URL Parameter Tracking
- Campaign tracking (ad_id, campaign_id, adset_id)
- Referral source capture
- UTM parameter support

### 🔍 Job Detail Pages

- **Canonical URLs** - /jobs/:id as authoritative job page
- **Dynamic XML Feeds** - Google Jobs, Indeed, Universal feed formats
- **Related Jobs** - Similar positions on detail pages
- **SEO Optimization** - Structured data for job postings

### 🎨 Landing Page Updates

- **Voice-First Messaging** - AI Voice Recruitment as primary differentiator
- **Updated Stats** - < 3 min callbacks, 24/7 availability
- **How It Works Section** - Visual flow of candidate journey
- **Contact Form** - Functional form with database storage
- **OG Image** - Professional social sharing image

### 🔒 Security Improvements

- **Rate Limiting** - Public edge function protection
- **Input Validation** - Zod schemas on webhook receivers
- **RLS Policy Fixes** - Organization-scoped client visibility

### 🛠️ Admin Improvements

- **Super Admin Visibility** - Cross-organization application access
- **Consolidated Admin Pages** - Unified navigation structure
- **Voice Agent Dashboard** - ElevenLabs configuration and monitoring

## [1.0.0] - 2025-01-15

### 🎉 Production Release

The first production-ready release of ATS.me, a modern AI-powered Applicant Tracking System.

### Added - Phase 12: Advanced AI Features

#### AI-Powered Chatbot
- **Streaming AI Assistant** using Lovable AI Gateway with Google Gemini 2.5 Flash
- Real-time token-by-token streaming responses
- Floating chatbot button with expandable interface
- Context-aware recruitment guidance
- Rate limit and payment error handling
- Professional UI with message history
- Keyboard shortcuts (Enter to send)

#### Edge Functions
- `ai-chat` - Streaming chat endpoint with SSE support
- Proper CORS configuration
- Comprehensive error handling (429, 402, 500)
- Detailed logging for debugging

### Added - Phase 11: Post-Launch & Scaling

#### Email Integration
- Email edge function: `send-application-email`
- Beautiful HTML email templates (5 types):
  - Application received
  - Status update
  - Interview invitation
  - Job offer
  - Rejection notification
- Email service utility with helper functions
- Mobile-optimized responsive layouts
- Ready for Resend API integration

#### Internationalization (i18n)
- Multi-language support (English, Spanish, French, German)
- Automatic browser language detection
- Language selector component with flags
- Persistent language preferences
- Complete translation coverage for all features
- i18next integration with React

#### Mobile App Setup
- Capacitor configuration for iOS and Android
- Hot-reload development mode
- Splash screen configuration
- Native app ready for deployment
- App store submission preparation

#### Performance Optimizations
- Debounce and throttle utilities
- Memoization helpers
- Lazy loading system
- Batch API processing
- Virtual scrolling support
- Web Workers integration
- Resource preloading
- Connection quality detection
- Cache management system
- Memory usage tracking

### Added - Phase 10: Documentation & Deployment

#### Comprehensive Documentation
- README.md - Project overview and quick start
- DEPLOYMENT.md - Multi-platform deployment guide
- API_DOCUMENTATION.md - Complete API reference
- USER_GUIDE.md - End-user documentation
- ADMIN_GUIDE.md - Administrator guide
- CONTRIBUTING.md - Developer guidelines
- TROUBLESHOOTING.md - Common issues and solutions
- CHANGELOG.md - Version history

### Added - Phase 9: Testing & QA

#### Testing Infrastructure
- Vitest for unit and component testing
- Playwright for E2E testing
- Test utilities and helpers
- Sample tests for core components
- Multi-browser testing configuration
- ~80% code coverage target

### Added - Phase 8: Monitoring & Error Tracking

#### Monitoring Tools
- Sentry integration for error tracking
- Google Analytics 4 integration
- Performance monitoring
- Session replay
- Custom event tracking
- Page view tracking
- Error logging system

### Added - Phase 7: PWA & Offline Support

#### Progressive Web App
- Vite PWA plugin configuration
- Service worker with Workbox
- Offline fallback page
- Install prompt component
- Dedicated install page
- Background sync
- Automatic updates
- App manifest with branding

### Added - Phase 6: Security & Compliance

#### Security Features
- Row-Level Security (RLS) on all tables
- Security headers configuration
- XSS protection
- CSRF protection
- Input validation
- Rate limiting
- Audit logging
- Session management

### Added - Phase 5: Performance & Optimization

#### Optimization Features
- Code splitting by route
- Lazy loading for components
- Tree shaking
- Minification with Terser
- Image optimization
- Font optimization
- Service worker caching
- Bundle size optimization (<500KB)

### Added - Phase 4: Advanced Features

#### Interview Management
- Schedule interviews
- Multiple interview types
- Calendar integration
- Interviewer assignment
- Feedback collection
- Rescheduling support

#### Analytics & Reporting
- Performance metrics dashboard
- Predictive analytics
- Comparative analysis
- Bias detection
- Model insights
- Custom reports
- Multi-format export (PDF, CSV, JSON, Excel)

#### Team Collaboration
- Role-based access control
- Team member invitations
- Reviewer assignment
- Comments and @mentions
- Activity tracking

### Added - Phase 3: AI Features

#### AI-Powered Candidate Scoring
- Automatic candidate analysis
- Multi-factor scoring
- Confidence levels
- Strength identification
- Concern detection
- Personalized recommendations
- Reanalysis capability

#### Candidate Ranking
- Automatic ranking by score
- Match percentage calculation
- Sortable rankings
- Bulk actions

### Added - Phase 2: Core Features

#### Job Management
- Create, edit, delete job postings
- Job status management
- Custom requirements
- Shareable job URLs
- Application forms

#### Application Management
- Application submission
- Resume upload
- Cover letter support
- Custom questions
- Status workflow
- Timeline tracking
- Notes and comments

### Added - Phase 1: Foundation

#### User Authentication
- Email/password authentication
- Email verification
- Password reset
- Session management
- Profile management

## Technical Stack

### Frontend
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Tailwind CSS 3.4.1
- Radix UI components
- React Query (TanStack Query)
- React Router 6
- React Hook Form with Zod
- i18next for internationalization

### Backend
- Supabase (Backend-as-a-Service)
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions
  - Real-time subscriptions

### AI & Analytics
- Lovable AI Gateway (Google Gemini 2.5 Flash)
- Recharts for visualization
- Custom scoring algorithms

### Performance & Monitoring
- Vite PWA Plugin
- Workbox
- Sentry
- Google Analytics 4
- Custom performance monitoring

### Development & Testing
- Vitest
- Playwright
- ESLint
- Git hooks

## Infrastructure

- **Hosting**: Lovable, Vercel, Netlify, AWS Amplify, or self-hosted
- **Database**: Supabase PostgreSQL
- **CDN**: Global edge network
- **Email**: Ready for Resend integration

## Performance Metrics

- **Lighthouse Score**: 95+ (Performance)
- **Core Web Vitals**:
  - FCP: < 1.5s
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1
- **Bundle Size**: ~450KB initial (gzipped)

## Security Features

- HTTPS enforcement
- Security headers
- XSS protection
- CSRF protection
- Content Security Policy
- Row Level Security
- Rate limiting
- Audit logging

## Known Issues

None at this time. Please report issues on GitHub.

## Contributors

- Development Team at ATS.me
- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Powered by [Supabase](https://supabase.com)

---

**Legend:**
- 🎉 Major milestone
- ✨ New feature
- 🐛 Bug fix
- 💥 Breaking change
- 📝 Documentation
- 🔒 Security
- ⚡ Performance
- ♿ Accessibility

For support, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

For contributing, see [CONTRIBUTING.md](./CONTRIBUTING.md)
