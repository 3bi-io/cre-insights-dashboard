/**
 * Landing Page Component
 * Main public homepage with hero section and key features
 */

import React, { lazy, Suspense } from 'react';

import { SEO } from '@/components/SEO';
import { StructuredData, buildWebSiteSchema } from '@/components/StructuredData';
import { SITE_URL, SITE_NAME, DEFAULT_LOGO } from '@/config/siteConfig';

const buildOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": SITE_NAME,
  "url": SITE_URL,
  "logo": DEFAULT_LOGO,
  "sameAs": [
    "https://www.linkedin.com/company/108142287/",
    "https://x.com/applyai_jobs",
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Anniston",
    "addressRegion": "AL",
    "addressCountry": "US",
  },
});

const buildSoftwareAppSchema = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Apply AI",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "299",
    "priceCurrency": "USD"
  },
  "description": "AI-powered recruitment platform with Voice Apply technology, Tenstreet integration, predictive analytics, and 100+ job board distribution."
});
import HeroSection from '@/features/landing/components/sections/HeroSection';
import { LoadingSkeleton } from '@/features/landing/components/shared/LoadingSkeleton';

// Lazy load sections below the fold for better performance
const ClientLogoMarquee = lazy(() => import('@/features/landing/components/shared/ClientLogoMarquee'));
const HowItWorksSection = lazy(() => import('@/features/landing/components/sections/HowItWorksSection'));
const FeaturesSection = lazy(() => import('@/features/landing/components/sections/FeaturesSection'));
const IntegrationsSection = lazy(() => import('@/features/landing/components/sections/IntegrationsSection'));

const TrustSection = lazy(() => import('@/features/landing/components/sections/TrustSection'));
const FAQSection = lazy(() => import('@/features/landing/components/sections/FAQSection'));
const IndustryShowcaseSection = lazy(() => import('@/features/landing/components/sections/IndustryShowcaseSection'));

const LandingPage = () => {
  return (
    <main className="min-h-screen">
      
      <SEO
        title="AI Voice Recruitment Platform | Kanban Pipeline & Talent Pools | Apply AI"
        description="Hire faster with AI voice technology, visual Kanban pipeline, and talent pool management. Automated callbacks within minutes, 24/7 AI voice agents, complete activity tracking."
        keywords="AI recruitment, automated callbacks, voice apply, AI voice agents, Apply AI, Tenstreet integration, recruitment automation, kanban pipeline, talent pools, activity tracking"
        canonical="https://applyai.jobs/"
      />
      <StructuredData data={[buildWebSiteSchema(), buildOrganizationSchema()]} />
      
      {/* Hero */}
      <HeroSection />

      {/* Trusted by Industry Leaders */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <ClientLogoMarquee />
      </Suspense>

      {/* How It Works */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <HowItWorksSection />
      </Suspense>

      {/* What People Say */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <TrustSection />
      </Suspense>

      {/* Enterprise-Grade Platform */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <FeaturesSection />
      </Suspense>

      {/* 100+ Integrations */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <IntegrationsSection />
      </Suspense>

      {/* Frequently Asked Questions */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <FAQSection />
      </Suspense>

      {/* Built for Your Industry - inline section */}
      <Suspense fallback={<LoadingSkeleton variant="section" />}>
        <IndustryShowcaseSection />
      </Suspense>
    </main>
  );
};

export default LandingPage;
