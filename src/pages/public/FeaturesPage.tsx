/**
 * Features Page Component
 * Best-in-class product showcase with comparison table, scroll-spy nav, and Social Beacon
 */

import React, { useRef } from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData, buildFAQSchema } from '@/components/StructuredData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { HeroBackground } from '@/components/shared';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import socialHero from '@/assets/hero/social-hero.png';

import { 
  SectionWrapper, 
  SectionHeader, 
  IconFeatureCard,
  FeaturedProductCard,
  socialBeaconContent,
  featuresContent
} from '@/features/landing';

const sections = [
  { id: 'social-beacon', label: 'Social Beacon' },
  { id: 'core-features', label: 'Core AI' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'integrations', label: 'Integrations' },
];

const comparisonData = [
  { feature: 'AI Voice Interviews', atsme: true, traditional: false },
  { feature: 'Social Beacon Distribution', atsme: true, traditional: false },
  { feature: 'Instant AI Callbacks', atsme: true, traditional: false },
  { feature: '24/7 Candidate Engagement', atsme: true, traditional: false },
  { feature: 'Visual Kanban Pipeline', atsme: true, traditional: true },
  { feature: 'Multi-Platform Job Posting', atsme: true, traditional: true },
  { feature: 'Resume Parsing', atsme: true, traditional: true },
  { feature: 'Predictive Analytics', atsme: true, traditional: false },
  { feature: 'Automated Compliance', atsme: true, traditional: false },
  { feature: 'Voice Apply Technology', atsme: true, traditional: false },
];

const featureFaqs = [
  { question: "How does Voice Apply work?", answer: "Candidates call a dedicated number and complete an AI-guided interview. The system transcribes, scores, and routes qualified candidates automatically." },
  { question: "What social platforms does Social Beacon support?", answer: "Social Beacon distributes to X/Twitter, Facebook, Instagram, LinkedIn, WhatsApp, TikTok, and Reddit with AI-optimized creative for each platform." },
  { question: "Can ATS.me integrate with my existing ATS?", answer: "Yes, we support Tenstreet, DriverReach, and 100+ other systems with bi-directional sync." },
];

const FeaturesPage = () => {
  const activeSection = useScrollSpy(sections.map(s => s.id), 120);

  const integrations = [
    "Tenstreet", "Indeed", "Glassdoor", "ZipRecruiter", "Adzuna", "Talroo",
    "LinkedIn", "Slack", "Microsoft Teams", "Google Workspace",
    "BambooHR", "Workday", "ADP", "Paylocity"
  ];

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ATS.me",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50" },
    "featureList": [
      "Social Beacon - AI-Powered Social Recruitment",
      "Multi-Platform Social Distribution",
      "AI Ad Creative Studio",
      "Instant AI Callbacks",
      "24/7 AI Voice Agents",
      "Visual Kanban Pipeline",
      "Voice Apply Technology",
    ],
    "description": "AI-powered applicant tracking system with Social Beacon, Voice Apply, and instant callback features.",
    "url": "https://ats.me/features"
  };

  const faqSchema = buildFAQSchema(featureFaqs);

  return (
    <div className="min-h-screen">
      <SEO
        title="Features | Social Beacon, AI Screening & Voice Apply"
        description="Discover ATS.me's Social Beacon for AI-powered social recruitment across 7 platforms, Voice Apply technology, instant AI callbacks, and 100+ job board integrations."
        keywords="Social Beacon, AI recruitment, social media hiring, Voice Apply, ATS features, AI screening, job board integration"
        canonical="https://ats.me/features"
        ogImage="https://ats.me/og-features.png"
      />
      <StructuredData data={[softwareAppSchema, faqSchema]} />

      {/* Scroll-Spy Sidebar (desktop only) */}
      <nav className="hidden xl:block fixed left-6 top-1/2 -translate-y-1/2 z-40 space-y-1">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`block text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
              activeSection === s.id
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* Page Hero */}
      <HeroBackground
        imageSrc={socialHero}
        imageAlt="Social network connections representing multi-platform recruitment"
        variant="compact"
        overlayVariant="dark"
        overlayOpacity={65}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <span className="inline-block text-xs sm:text-sm font-semibold text-black bg-white rounded-full px-4 py-1.5 mb-4 md:mb-6">
              ✨ Feature-Rich Platform
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 lg:mb-4 text-foreground">
              Powerful Features for
              <span className="text-white"> Modern Recruiting</span>
            </h1>
            <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2">
              AI-powered social recruitment & voice automation
            </span>
          </div>
        </div>
      </HeroBackground>

      {/* Social Beacon */}
      <div id="social-beacon">
        <FeaturedProductCard
          badge={socialBeaconContent.badge}
          title={socialBeaconContent.title}
          subtitle={socialBeaconContent.subtitle}
          description={socialBeaconContent.description}
          platforms={socialBeaconContent.platforms}
          stats={socialBeaconContent.stats}
          capabilities={socialBeaconContent.capabilities}
          cta={socialBeaconContent.cta}
        />
      </div>

      {/* Core AI Features */}
      <SectionWrapper id="core-features">
        <SectionHeader
          title="Core AI Features"
          description="The foundation of intelligent recruitment — AI-powered tools that work around the clock"
        />
        <div className="space-y-10 md:space-y-16">
          {featuresContent.primaryFeatures.map((feature, index) => (
            <motion.div 
              key={index} 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className={`order-1 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                  <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">{feature.title}</h3>
                <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-lg">{feature.description}</p>
                <div className="space-y-2 md:space-y-3">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 md:space-x-3">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm md:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`order-2 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'} hidden md:block`}>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center shadow-inner">
                  <feature.icon className="h-16 lg:h-24 w-16 lg:w-24 text-primary/60" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Capabilities Grid */}
      <SectionWrapper variant="muted" id="capabilities">
        <SectionHeader title="Everything You Need & More" description="Comprehensive tools for every aspect of your hiring process" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {featuresContent.secondaryFeatures.map((feature, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} viewport={{ once: true }}>
              <IconFeatureCard icon={feature.icon} title={feature.title} description={feature.description} />
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Comparison Table */}
      <SectionWrapper id="comparison">
        <SectionHeader title="ATS.me vs Traditional ATS" description="See why leading companies are switching to AI-powered recruitment" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                    <th className="text-center p-4 font-semibold text-primary">
                      <Badge className="bg-primary text-primary-foreground">ATS.me</Badge>
                    </th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Traditional ATS</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground font-medium">{row.feature}</td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        {row.traditional ? (
                          <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-destructive/50 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </SectionWrapper>

      {/* Integrations */}
      <SectionWrapper variant="muted" id="integrations">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-foreground mb-3 md:mb-4">Seamless Integrations</h2>
          <p className="text-base md:text-xl text-muted-foreground">Connect with the tools you already use and love</p>
        </div>
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-2">
          <div className="flex md:grid md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4 min-w-max md:min-w-0 justify-center">
            {integrations.map((integration, index) => (
              <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.03 }} viewport={{ once: true }}
                className="p-3 md:p-4 border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all duration-200 bg-background whitespace-nowrap text-center">
                <span className="text-xs md:text-sm font-medium text-muted-foreground">{integration}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-10 md:mt-12 text-center">
          <p className="text-muted-foreground mb-4 text-sm md:text-base">Need a custom integration?</p>
          <Link to="/contact">
            <Button variant="outline" className="min-h-[48px]">Contact Our Team <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </SectionWrapper>

      {/* Final CTA */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-primary-foreground mb-3 md:mb-4">
            Experience All Features Risk-Free
          </h2>
          <p className="text-base md:text-xl text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto">
            Get started today and see how ATS.me can transform your hiring process with AI-powered social recruitment and voice automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 py-3 text-base md:text-lg bg-background text-primary hover:bg-background/90 min-h-[52px]">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-3 text-base md:text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 min-h-[52px]">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
