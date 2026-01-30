/**
 * Features Page Component
 * Best-in-class product showcase with Social Beacon as flagship feature
 */

import React from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Import shared components and content from landing feature
import { 
  SectionWrapper, 
  SectionHeader, 
  IconFeatureCard,
  FeaturedProductCard,
  socialBeaconContent,
  featuresContent
} from '@/features/landing';

const FeaturesPage = () => {
  const integrations = [
    "Tenstreet", "Indeed", "Glassdoor", "ZipRecruiter", "Adzuna", "Talroo",
    "LinkedIn", "Slack", "Microsoft Teams", "Google Workspace",
    "BambooHR", "Workday", "ADP", "Paylocity"
  ];

  // Enhanced structured data with Social Beacon
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ATS.me",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "50"
    },
    "featureList": [
      "Social Beacon - AI-Powered Social Recruitment",
      "Multi-Platform Social Distribution (X, Facebook, Instagram, LinkedIn, WhatsApp, TikTok, Reddit)",
      "AI Ad Creative Studio",
      "Instant AI Callbacks",
      "24/7 AI Voice Agents",
      "Visual Kanban Pipeline",
      "Talent Pool Management",
      "Voice Apply Technology",
      "Automated Workflow Management",
      "Advanced Analytics Dashboard",
      "100+ Job Board Integrations"
    ],
    "description": "AI-powered applicant tracking system with Social Beacon for social recruitment, Voice Apply technology, automated candidate screening, and instant callback features.",
    "url": "https://ats.me/features"
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Features | Social Beacon, AI Screening & Voice Apply"
        description="Discover ATS.me's Social Beacon for AI-powered social recruitment across 7 platforms, Voice Apply technology, instant AI callbacks, and 100+ job board integrations."
        keywords="Social Beacon, AI recruitment, social media hiring, Voice Apply, ATS features, AI screening, job board integration"
        canonical="https://ats.me/features"
      />
      <StructuredData data={softwareAppSchema} />

      {/* Page Hero Section */}
      <section className="relative py-10 md:py-16 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-primary/5 bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 lg:left-20 w-48 lg:w-72 h-48 lg:h-72 bg-primary/10 rounded-full blur-2xl lg:blur-3xl motion-safe:animate-pulse" />
        <div className="absolute bottom-20 right-10 lg:right-20 w-64 lg:w-96 h-64 lg:h-96 bg-accent/10 rounded-full blur-2xl lg:blur-3xl motion-safe:animate-pulse delay-1000" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 md:mb-6 bg-primary/10 text-primary border-primary/20">
            ✨ Feature-Rich Platform
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 md:mb-6 px-2">
            Powerful Features for
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Modern Recruiting</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto px-4">
            From AI-powered social recruitment to voice automation — discover all the tools 
            that make ATS.me the most comprehensive hiring platform.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90 min-h-[48px] text-base">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Social Beacon - Featured Product Hero */}
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

      {/* Core AI Features Section - Detailed Cards */}
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
              {/* Content - alternating layout on desktop */}
              <div className={`order-1 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                  <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-lg">
                  {feature.description}
                </p>
                <div className="space-y-2 md:space-y-3">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 md:space-x-3">
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm md:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Visual - hidden on mobile */}
              <div className={`order-2 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'} hidden md:block`}>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center shadow-inner">
                  <feature.icon className="h-16 lg:h-24 w-16 lg:w-24 text-primary/60" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Platform Capabilities - Compact Grid */}
      <SectionWrapper variant="muted" id="capabilities">
        <SectionHeader
          title="Everything You Need & More"
          description="Comprehensive tools for every aspect of your hiring process"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {featuresContent.secondaryFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <IconFeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Integrations Section */}
      <SectionWrapper id="integrations">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-foreground mb-3 md:mb-4">
            Seamless Integrations
          </h2>
          <p className="text-base md:text-xl text-muted-foreground">
            Connect with the tools you already use and love
          </p>
        </div>
        
        {/* Integration chips - horizontal scroll on mobile, grid on desktop */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-2">
          <div className="flex md:grid md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4 min-w-max md:min-w-0 justify-center">
            {integrations.map((integration, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                viewport={{ once: true }}
                className="p-3 md:p-4 border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all duration-200 bg-background whitespace-nowrap text-center"
              >
                <span className="text-xs md:text-sm font-medium text-muted-foreground">{integration}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="mt-10 md:mt-12 text-center">
          <p className="text-muted-foreground mb-4 text-sm md:text-base">Need a custom integration?</p>
          <Link to="/contact">
            <Button variant="outline" className="min-h-[48px]">
              Contact Our Team
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </SectionWrapper>

      {/* Final CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-primary-foreground mb-3 md:mb-4">
            Experience All Features Risk-Free
          </h2>
          <p className="text-base md:text-xl text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto">
            Get started today and see how ATS.me can transform your hiring process 
            with AI-powered social recruitment and voice automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link to="/auth">
              <Button 
                size="lg" 
                variant="secondary" 
                className="w-full sm:w-auto px-8 py-3 text-base md:text-lg bg-background text-primary hover:bg-background/90 min-h-[52px]"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto px-8 py-3 text-base md:text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 min-h-[52px]"
              >
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
