# ATS.me - AI-Powered Recruitment Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg)](https://vitejs.dev/)

Transform your recruitment process with AI-powered analytics, automated workflows, and intelligent candidate ranking. ATS.me is a modern, production-ready Applicant Tracking System built with cutting-edge technologies.

## ✨ Features

### 🎙️ AI Voice Recruitment
- **Instant AI Callbacks** - < 3 minute average response time to applicants
- **24/7 Voice Agents** - Always-on automated screening with ElevenLabs integration
- **Voice Apply** - Candidates complete applications via natural voice conversation
- **Automated Follow-ups** - Smart outbound calls triggered by application submission
- **Call Transcripts** - Complete conversation history and analysis

### 🎯 Core Functionality
- **Smart Candidate Ranking** - AI-powered scoring and ranking system
- **Application Management** - Comprehensive applicant tracking
- **Job Posting Management** - Create and manage job listings
- **Interview Scheduling** - Automated scheduling with calendar integration
- **Document Management** - Resume parsing and document storage
- **Team Collaboration** - Multi-user access with role-based permissions

### 📊 Analytics & Reporting
- **Performance Metrics** - Track recruitment KPIs
- **Custom Reports** - Generate detailed analytics
- **Data Visualization** - Interactive charts and graphs
- **Export Capabilities** - Export data in multiple formats
- **Real-time Dashboards** - Live recruitment metrics

### 🔒 Security & Compliance
- **Row-Level Security** - Supabase RLS policies
- **Data Encryption** - End-to-end encryption
- **GDPR Compliance** - Privacy-first design
- **Audit Logging** - Complete activity tracking
- **Role-Based Access** - Granular permissions

### 📱 Progressive Web App
- **Offline Support** - Work without internet connection
- **Install Prompt** - Install as native app
- **Background Sync** - Automatic data synchronization
- **Push Notifications** - Real-time updates
- **Responsive Design** - Works on all devices

### 🌍 Internationalization
- **Multi-Language Support** - English, Spanish, French, German
- **Automatic Detection** - Browser language detection
- **Persistent Preferences** - Saved language settings

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Supabase account
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd ats-me
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Set up Supabase**
- Create a new Supabase project at https://supabase.com
- Update the Supabase configuration in `src/integrations/supabase/client.ts`
- Run database migrations (see DEPLOYMENT.md)

4. **Configure environment variables**
```bash
# Optional: Add monitoring tools
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GA_MEASUREMENT_ID=your-ga-id
```

5. **Start development server**
```bash
npm run dev
# or
bun run dev
```

6. **Open your browser**
Navigate to `http://localhost:8080`

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[API Documentation](./API_DOCUMENTATION.md)** - Edge functions and API reference
- **[User Guide](./USER_GUIDE.md)** - End-user documentation
- **[Admin Guide](./ADMIN_GUIDE.md)** - Administrator documentation
- **[Contributing](./CONTRIBUTING.md)** - Development guidelines
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible components
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **i18next** - Internationalization

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions
  - Real-time subscriptions

### Voice & AI
- **ElevenLabs** - Conversational AI voice agents
- **Lovable AI Gateway** - AI model integration (Gemini 2.5 Flash)
- **Recharts** - Data visualization
- **Custom ML Models** - Candidate scoring algorithms

### Performance & Monitoring
- **Vite PWA** - Progressive Web App support
- **Sentry** - Error tracking
- **Google Analytics** - User analytics
- **Workbox** - Service worker caching

### Testing
- **Vitest** - Unit and component testing
- **Testing Library** - React testing utilities
- **Playwright** - End-to-end testing

## 🏗️ Project Structure

```
ats-me/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (shadcn)
│   │   ├── scoring/        # Candidate scoring components
│   │   ├── pwa/            # PWA-specific components
│   │   └── ai/             # AI chatbot components
│   ├── features/           # Feature-based modules
│   │   ├── ai-analytics/   # AI analytics feature
│   │   ├── applications/   # Application management
│   │   └── jobs/           # Job posting management
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   ├── i18n/               # Internationalization
│   └── tests/              # Test files
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── e2e/                    # End-to-end tests
└── public/                 # Static assets
```

## 🧪 Testing

### Unit & Component Tests
```bash
npm run test
# or with UI
npm run test:ui
```

### E2E Tests
```bash
npm run test:e2e
# or headed mode
npm run test:e2e:headed
```

### Test Coverage
```bash
npm run test:coverage
```

## 📦 Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

### Build Analysis
```bash
npm run build
# View bundle analysis in dist/stats.html
```

## 🔧 Configuration

### Tailwind Design System
All colors and design tokens are defined in:
- `src/index.css` - CSS variables and design tokens
- `tailwind.config.ts` - Tailwind configuration

### Performance Optimization
- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Automatic image compression
- **Tree Shaking** - Unused code elimination
- **Minification** - Terser optimization
- **Caching** - Service worker caching strategies

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Backend powered by [Supabase](https://supabase.com)

## 📞 Support

- **Documentation**: [docs.lovable.dev](https://docs.lovable.dev)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ats-me/issues)
- **Discord**: [Lovable Community](https://discord.gg/lovable)

## 🗺️ Roadmap

### ✅ Recently Completed
- AI Voice Recruitment (ElevenLabs integration)
- Webhook Source Filtering & Bulk Export
- Enhanced Job Detail Pages with canonical URLs
- Dynamic XML Feeds (Google Jobs, Indeed, Universal)
- Landing Page Voice-First Messaging
- Open Graph Image Optimization
- Super Admin Cross-Organization Visibility

### 🔜 Coming Soon
- Video Interview Integration
- Enhanced AI Matching Algorithm
- Native Mobile Apps (iOS & Android)
- Advanced Compliance Reporting
- Custom Branding Themes

---

Made with ❤️ by the ATS.me Team

**Lovable Project URL**: https://lovable.dev/projects/cf22d483-762d-45c7-a42c-85b40ce9290a
