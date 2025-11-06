/**
 * Landing Page Component
 * Main public homepage with hero section and key features
 */

import React from 'react';
import { SEO } from '@/components/SEO';
import HeroSection from '@/components/landing/HeroSection';
import StatsSection from '@/components/landing/StatsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import IntegrationsSection from '@/components/landing/IntegrationsSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import OnboardingSection from '@/components/landing/OnboardingSection';
import SupportSection from '@/components/landing/SupportSection';
import TrustSection from '@/components/landing/TrustSection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';

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
      <FeaturesSection />
      <IntegrationsSection />
      <BenefitsSection />
      <OnboardingSection />
      <SupportSection />
      <TrustSection />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default LandingPage;