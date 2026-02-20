/**
 * Features Page Component
 * Best-in-class product showcase with comparison table, scroll-spy nav, and AI voice narrative
 */

import React from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData, buildFAQSchema } from '@/components/StructuredData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, X, Check, Mic, Phone, Bot, Zap } from 'lucide-react';
import featuresHeroBg from '@/assets/hero/features-hero-bg.jpg';
import { motion } from 'framer-motion';
import { useScrollSpy } from '@/hooks/useScrollSpy';

import { 
  SectionWrapper, 
  SectionHeader, 
  IconFeatureCard,
  featuresContent
} from '@/features/landing';

const sections = [
  { id: 'core-features', label: 'Core AI' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'integrations', label: 'Integrations' },
];

const comparisonData = [
  { feature: 'Voice Apply Technology', atsme: true, traditional: false },
  { feature: 'Instant AI Callbacks', atsme: true, traditional: false },
  { feature: '24/7 Candidate Engagement', atsme: true, traditional: false },
  { feature: 'AI Voice Interviews', atsme: true, traditional: false },
  { feature: 'Social Beacon Distribution', atsme: true, traditional: false },
  { feature: 'Predictive Analytics', atsme: true, traditional: false },
  { feature: 'Visual Kanban Pipeline', atsme: true, traditional: true },
  { feature: 'Multi-Platform Job Posting', atsme: true, traditional: true },
  { feature: 'Resume Parsing', atsme: true, traditional: true },
  { feature: 'Automated Compliance', atsme: true, traditional: false },
];

const featureFaqs = [
  { question: "How does Voice Apply work?", answer: "Candidates call a dedicated number and complete an AI-guided interview. The system transcribes, scores, and routes qualified candidates automatically." },
  { question: "What social platforms does Social Beacon support?", answer: "Social Beacon distributes to X/Twitter, Facebook, Instagram, LinkedIn, WhatsApp, TikTok, and Reddit with AI-optimized creative for each platform." },
  { question: "Can Apply AI integrate with my existing ATS?", answer: "Yes, we support Tenstreet, DriverReach, and 100+ other systems with bi-directional sync." },
];

const coreStats = [
  { icon: Mic, value: '80%', label: 'Faster Applications', sub: 'Voice Apply' },
  { icon: Phone, value: '< 3 min', label: 'Callback Time', sub: 'Instant AI' },
  { icon: Bot, value: '24/7', label: 'AI Coverage', sub: 'Always On' },
  { icon: Zap, value: '95%', label: 'Completion Rate', sub: 'AI Screening' },
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
    "name": "Apply AI",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50" },
    "featureList": [
      "Voice Apply Technology",
      "Instant AI Callbacks",
      "24/7 AI Voice Agents",
      "Social Beacon - AI-Powered Social Recruitment",
      "Multi-Platform Social Distribution",
      "AI Ad Creative Studio",
      "Visual Kanban Pipeline",
    ],
    "description": "AI-powered applicant tracking system with Voice Apply technology, instant AI callbacks, 24/7 voice agents, and social recruitment automation.",
    "url": "https://applyai.jobs/features"
  };

  const faqSchema = buildFAQSchema(featureFaqs);

  return (
    <div className="min-h-screen">
      <SEO
        title="Features | Voice Apply, AI Callbacks & Smart Recruiting"
        description="Explore Apply AI's Voice Apply technology, instant AI callbacks, 24/7 AI voice agents, and social recruitment automation — the fastest way to hire."
        keywords="Voice Apply, AI callbacks, AI recruitment, voice screening, ATS features, AI voice agents, social beacon, job board integration"
        canonical="https://applyai.jobs/features"
        ogImage="https://applyai.jobs/og-features.png"
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

      {/* Page Hero — full-bleed background */}
      <section className="relative overflow-hidden min-h-[560px] md:min-h-[640px] flex items-center">
        {/* Background image */}
        <img
          src={featuresHeroBg}
          alt="AI recruitment platform hero — professional recruiter with AI voice technology"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
        />
        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/20" />
        {/* Subtle bottom fade to page background */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <Badge className="mb-5 bg-white/15 text-white border-white/25 text-sm px-4 py-1.5 backdrop-blur-sm">
              ✨ AI-Powered Platform
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold tracking-tight text-white mb-4 leading-tight">
              The AI Recruitment Platform{' '}
              <span className="text-primary">Built for Speed</span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 mb-3 font-medium">
              Voice Apply. Instant Callbacks. 24/7 AI Agents.
            </p>
            <p className="text-base text-white/70 mb-8 max-w-xl">
              From application to offer in record time — AI-driven recruitment that finds and screens candidates while you focus on what matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto px-8 min-h-[52px] text-base">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 min-h-[52px] text-base bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {coreStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-center mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mr-2">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-2xl md:text-3xl font-bold text-foreground font-playfair">{stat.value}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
                      <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm md:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`order-2 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'} hidden md:block`}>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center shadow-inner border border-primary/10">
                  <feature.icon className="h-16 lg:h-24 w-16 lg:w-24 text-primary/40" />
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
        <SectionHeader
          title="Apply AI vs Traditional ATS"
          description="See what you get that traditional ATS platforms simply can't offer"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Card className="overflow-hidden shadow-lg border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                    <th className="text-center p-4 font-semibold text-primary">
                      <Badge className="bg-primary text-primary-foreground">Apply AI</Badge>
                    </th>
                    <th className="text-center p-4 font-semibold text-muted-foreground">Traditional ATS</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground font-medium">{row.feature}</td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-emerald-500 mx-auto" />
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
            Experience AI-powered voice recruitment, instant callbacks, and smart hiring automation — all in one platform.
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
