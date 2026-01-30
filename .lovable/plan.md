

# Refactor /features Page with Social Beacon as Main Featured Offering

## Executive Summary

Transform the `/features` page into a best-in-class product showcase that positions **Social Beacon** as the flagship feature, while establishing a modern, conversion-optimized layout that drives user adoption.

## Current State Analysis

The existing `/features` page (`src/pages/public/FeaturesPage.tsx`):
- Uses inline feature arrays (not reusable)
- No featured/hero product section
- Flat card grid layout (all features equal weight)
- Missing Social Beacon entirely
- Doesn't leverage the shared component library from `src/features/landing/`

## Proposed Architecture

### Design Principles

1. **Hero Feature Pattern** - One flagship feature with full showcase treatment
2. **Tiered Feature Hierarchy** - Primary, Secondary, Additional categories
3. **Social Proof Integration** - Stats and testimonials woven throughout
4. **Clear Visual Hierarchy** - Guide user attention to key conversion points
5. **Content/Component Separation** - Following existing landing pattern

### New Page Structure

```text
┌─────────────────────────────────────────────────┐
│          Page Hero (Feature-Rich Badge)          │
├─────────────────────────────────────────────────┤
│   🌟 SOCIAL BEACON - HERO FEATURE SHOWCASE 🌟    │
│   Full-width, immersive feature presentation     │
│   - Platform icons (X, FB, IG, LinkedIn, etc)   │
│   - Key stats (7 platforms, AI-powered, etc)    │
│   - CTA: "Connect Your Channels"                │
├─────────────────────────────────────────────────┤
│        CORE AI FEATURES (6 cards, 2x3)          │
│   Voice Callbacks | AI Agents | Kanban | etc    │
├─────────────────────────────────────────────────┤
│       PLATFORM CAPABILITIES (9 cards, 3x3)      │
│   Workflows | Security | Analytics | etc         │
├─────────────────────────────────────────────────┤
│            INTEGRATIONS (Scrollable)             │
├─────────────────────────────────────────────────┤
│               CTA SECTION                        │
└─────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Create Social Beacon Content File

**New File: `src/features/landing/content/socialBeacon.content.ts`**

```typescript
// Social Beacon feature content for landing pages
import { 
  Twitter, Facebook, Instagram, MessageCircle, 
  Video, MessageSquare, Linkedin, Sparkles, 
  Clock, Globe, TrendingUp, Zap
} from 'lucide-react';

export const socialBeaconContent = {
  badge: "Featured Technology",
  title: "Social Beacon",
  subtitle: "AI-Powered Social Recruitment",
  description: "Transform your social media presence into a 24/7 recruitment engine. Connect once, reach everywhere.",
  
  platforms: [
    { name: 'X (Twitter)', icon: Twitter, color: 'hsl(var(--foreground))' },
    { name: 'Facebook', icon: Facebook, color: '#1877F2' },
    { name: 'Instagram', icon: Instagram, color: '#E4405F' },
    { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
    { name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
    { name: 'TikTok', icon: Video, color: '#000000' },
    { name: 'Reddit', icon: MessageSquare, color: '#FF4500' },
  ],
  
  stats: [
    { value: '7', label: 'Platforms Supported' },
    { value: '24/7', label: 'AI Engagement' },
    { value: '< 30s', label: 'Response Time' },
    { value: '95%', label: 'Automation Rate' },
  ],
  
  capabilities: [
    {
      icon: Sparkles,
      title: 'AI Ad Creative Studio',
      description: 'Generate compelling job ads with AI-powered headlines, copy, and hashtags tailored to each platform.'
    },
    {
      icon: Clock,
      title: 'Instant Auto-Responses',
      description: 'AI classifies incoming messages and delivers context-aware responses in under 30 seconds.'
    },
    {
      icon: Globe,
      title: 'Multi-Platform Distribution',
      description: 'Post once, distribute everywhere. One-click publishing across all connected channels.'
    },
    {
      icon: TrendingUp,
      title: 'Engagement Analytics',
      description: 'Track reach, engagement, and conversion rates across all platforms in real-time.'
    },
  ],
  
  cta: {
    primary: 'Connect Your Channels',
    secondary: 'See Demo',
    path: '/auth'
  }
};
```

### 2. Create Social Beacon Hero Component

**New File: `src/features/landing/components/shared/FeaturedProductCard.tsx`**

A reusable component for showcasing flagship features with:
- Gradient background with subtle animation
- Platform icon grid
- Stat row
- Capability highlights
- Prominent CTA

### 3. Update Features Content

**Modify: `src/features/landing/content/features.content.ts`**

Reorganize features into tiered categories:

```typescript
export const featuresContent = {
  title: 'Everything You Need to Hire Better',
  description: '...',
  
  // Primary features (AI-powered, high-impact)
  primaryFeatures: [
    { icon: Phone, title: "Instant AI Callbacks", ... },
    { icon: Bot, title: "24/7 AI Voice Agents", ... },
    { icon: Kanban, title: "Visual Kanban Pipeline", ... },
    { icon: Database, title: "Talent Pool Management", ... },
    { icon: Mic, title: "Voice Apply Technology", ... },
    { icon: BarChart3, title: "AI-Powered Analytics", ... },
  ],
  
  // Secondary features (platform capabilities)
  secondaryFeatures: [
    { icon: History, title: "Activity Timeline", ... },
    { icon: MessageSquare, title: "Communication Hub", ... },
    { icon: Zap, title: "Automated Workflows", ... },
    { icon: Shield, title: "Enterprise Security", ... },
    { icon: Users, title: "Team Collaboration", ... },
    { icon: Globe, title: "Multi-Platform Distribution", ... },
    { icon: Sparkles, title: "AI Writing Assistant", ... },
    { icon: TrendingUp, title: "Performance Insights", ... },
    { icon: Smartphone, title: "Mobile-First Design", ... },
  ],
};
```

### 4. Update Features Section Component

**Modify: `src/features/landing/components/sections/FeaturesSection.tsx`**

Add tiered rendering with improved visual hierarchy.

### 5. Refactor FeaturesPage

**Modify: `src/pages/public/FeaturesPage.tsx`**

Major refactor to:
- Import shared components from `@/features/landing`
- Add Social Beacon hero section after page hero
- Use tiered feature sections
- Leverage `SectionWrapper` and `IconFeatureCard` components
- Add platform connection CTAs

## Files to Create

| File | Purpose |
|------|---------|
| `src/features/landing/content/socialBeacon.content.ts` | Social Beacon content and configuration |
| `src/features/landing/components/shared/FeaturedProductCard.tsx` | Hero feature showcase component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/features/landing/content/features.content.ts` | Add tiered feature structure |
| `src/features/landing/content/types.ts` | Add FeaturedProduct interface |
| `src/features/landing/index.ts` | Export new components |
| `src/pages/public/FeaturesPage.tsx` | Complete refactor with Social Beacon hero |

## Visual Design Specifications

### Social Beacon Hero Section

- **Background**: Gradient from `primary/5` to `accent/5` with subtle grid pattern
- **Platform Icons**: Horizontal row with color-coded icons, hover animations
- **Stats Grid**: 4 columns (desktop), 2x2 (mobile) with large numbers
- **Capabilities**: 2x2 grid with icon-led cards
- **CTA**: Primary button with arrow, secondary ghost button

### Feature Cards

- **Primary Features**: Larger cards with feature list bullets
- **Secondary Features**: Compact cards (current `IconFeatureCard` style)
- **Hover Effects**: Shadow elevation + border color transition

### Mobile Optimization

- Platform icons: Horizontal scroll on mobile
- Stats: 2x2 grid
- Feature cards: Single column stack
- Touch targets: Minimum 48px

## Expected Outcomes

1. **Social Beacon Prominence**: Featured as the flagship product
2. **Clear Value Hierarchy**: Users understand which features matter most
3. **Improved Conversion**: Strategic CTA placement drives signups
4. **Component Reuse**: Shared components reduce duplication
5. **Maintainability**: Content separated from presentation
6. **Mobile Excellence**: Optimized for all device sizes

## SEO Enhancements

- Update structured data to include Social Beacon as primary feature
- Add `featureList` for social media platforms
- Enhanced meta description mentioning social recruitment

