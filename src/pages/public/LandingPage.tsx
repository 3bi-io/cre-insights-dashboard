/**
 * Landing Page Component
 * Main public homepage with hero section and key features
 */

import React, { lazy, Suspense } from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData, buildWebSiteSchema } from '@/components/StructuredData';
import HeroSection from '@/features/landing/components/sections/HeroSection';
import StatsSection from '@/features/landing/components/sections/StatsSection';
import { LoadingSkeleton } from '@/features/landing/components/shared/LoadingSkeleton';

// Lazy load sections below the fold for better performance
const HowItWorksSection = lazy(() => import('@/features/landing/components/sections/HowItWorksSection'));
const FeaturesSection = lazy(() => import('@/features/landing/components/sections/FeaturesSection'));
const IntegrationsSection = lazy(() => import('@/features/landing/components/sections/IntegrationsSection'));
const BenefitsSection = lazy(() => import('@/features/landing/components/sections/BenefitsSection'));
const OnboardingSection = lazy(() => import('@/features/landing/components/sections/OnboardingSection'));
const SupportSection = lazy(() => import('@/features/landing/components/sections/SupportSection'));
const TrustSection = lazy(() => import('@/features/landing/components/sections/TrustSection'));
const FAQSection = lazy(() => import('@/features/landing/components/sections/FAQSection'));
const CTASection = lazy(() => import('@/features/landing/components/sections/CTASection'));

const LandingPage = () => {
  return (
    <main className="min-h-screen">
      <SEO
        title="AI Voice Recruitment Platform | Instant Automated Callbacks | ATS.me"
        description="Hire faster with AI voice technology. Candidates receive automated callbacks within minutes. 24/7 AI voice agents, Voice Apply technology, 100+ job board integrations. Join 50+ pilot companies."
        keywords="AI recruitment, automated callbacks, voice apply, AI voice agents, ATS software, Tenstreet integration, recruitment automation, instant callback"
        canonical="https://ats.me/"
      />
      <StructuredData data={buildWebSiteSchema()} />
      
      {/* Above the fold - loaded immediately */}
      <HeroSection />
      <StatsSection />
      
      {/* How It Works - key differentiator */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <HowItWorksSection />
      </Suspense>
      
      {/* Below the fold - lazy loaded with skeleton placeholders */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <FeaturesSection />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <IntegrationsSection />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <BenefitsSection />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <OnboardingSection />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <SupportSection />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <TrustSection />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <FAQSection />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <CTASection />
      </Suspense>
    </main>
  );
};

export default LandingPage;
