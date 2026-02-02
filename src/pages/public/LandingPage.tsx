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
// HowItWorksSection is now integrated into HeroSection
const FeaturesSection = lazy(() => import('@/features/landing/components/sections/FeaturesSection'));
const IntegrationsSection = lazy(() => import('@/features/landing/components/sections/IntegrationsSection'));

const TrustSection = lazy(() => import('@/features/landing/components/sections/TrustSection'));
const FAQSection = lazy(() => import('@/features/landing/components/sections/FAQSection'));
const CTASection = lazy(() => import('@/features/landing/components/sections/CTASection'));

const LandingPage = () => {
  return (
    <main className="min-h-screen">
      <SEO
        title="AI Voice Recruitment Platform | Kanban Pipeline & Talent Pools | ATS.me"
        description="Hire faster with AI voice technology, visual Kanban pipeline, and talent pool management. Automated callbacks within minutes, 24/7 AI voice agents, complete activity tracking. Trusted by 50+ companies."
        keywords="AI recruitment, automated callbacks, voice apply, AI voice agents, ATS software, Tenstreet integration, recruitment automation, kanban pipeline, talent pools, activity tracking"
        canonical="https://ats.me/"
      />
      <StructuredData data={buildWebSiteSchema()} />
      
      {/* Above the fold - loaded immediately */}
      <HeroSection />
      <StatsSection />
      
      {/* HowItWorks is now part of HeroSection */}
      
      {/* Below the fold - lazy loaded with skeleton placeholders */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <FeaturesSection />
      </Suspense>
      
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <IntegrationsSection />
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
