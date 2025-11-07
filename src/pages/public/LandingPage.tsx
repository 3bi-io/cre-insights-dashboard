/**
 * Landing Page Component
 * Main public homepage with hero section and key features
 */

import React, { lazy, Suspense } from 'react';
import { SEO } from '@/components/SEO';
import HeroSection from '@/features/landing/components/sections/HeroSection';
import StatsSection from '@/features/landing/components/sections/StatsSection';

// Lazy load sections below the fold for better performance
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
    <div className="min-h-screen">
      <SEO
        title="ATS.me - AI-Powered Recruitment Platform | Join Our Pilot Program"
        description="Transform hiring with ATS.me's AI platform. Voice Apply technology, Tenstreet integration, 100+ job boards, predictive analytics. 50+ pilot companies, 50% off early adopter pricing."
        keywords="AI recruitment, ATS software, Voice Apply, Tenstreet, job board posting, recruitment analytics, pilot program, early adopter"
        canonical="https://ats.me/"
      />
      <HeroSection />
      <StatsSection />
      
      {/* Lazy load sections below the fold */}
      <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
        <FeaturesSection />
        <IntegrationsSection />
        <BenefitsSection />
        <OnboardingSection />
        <SupportSection />
        <TrustSection />
        <FAQSection />
        <CTASection />
      </Suspense>
    </div>
  );
};

export default LandingPage;