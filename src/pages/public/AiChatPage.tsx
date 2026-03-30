import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { StructuredData, buildBreadcrumbSchema } from '@/components/StructuredData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, Mic, Brain, Zap, Shield, 
  ArrowRight, CheckCircle, Bot
} from 'lucide-react';
import { SITE_URL } from '@/config/siteConfig';
import { PublicPageHero } from '@/components/shared';
import guideHero from '@/assets/hero/trust-hero.png';

const features = [
  {
    icon: Mic,
    title: 'AI Voice Screening',
    description: 'Natural phone conversations that verify qualifications, collect information, and screen candidates — 24/7, in minutes instead of days.',
  },
  {
    icon: Brain,
    title: 'Smart Candidate Matching',
    description: 'AI analyzes resumes and applications to score and rank candidates based on job requirements, experience, and cultural fit.',
  },
  {
    icon: MessageCircle,
    title: 'Automated Follow-Ups',
    description: "Intelligent follow-up sequences via voice and SMS to re-engage candidates who don't answer or need callbacks.",
  },
  {
    icon: Zap,
    title: 'Instant Application Processing',
    description: 'Applications are parsed, enriched, and routed to your pipeline in real-time — no manual data entry required.',
  },
  {
    icon: Shield,
    title: 'Compliance & Privacy',
    description: 'Built-in bias reduction, audit logging, EEOC compliance tools, and configurable data retention policies.',
  },
  {
    icon: Bot,
    title: 'Multi-Platform AI Assistant',
    description: 'An AI assistant that helps recruiters draft job descriptions, analyze hiring metrics, and optimize campaigns.',
  },
];

const AiChatPage = () => {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'AI Chat', url: `${SITE_URL}/ai-chat` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI-Powered Recruitment Tools — Voice Agents, Screening & Chat"
        description="Explore Apply AI's intelligent hiring tools: AI voice screening, automated candidate matching, smart follow-ups, and a recruiter AI assistant. Hire faster with less effort."
        keywords="AI recruitment, AI voice screening, AI candidate matching, automated hiring, AI recruiter assistant, AI chat, recruitment automation"
        canonical={`${SITE_URL}/ai-chat`}
        ogImage={`${SITE_URL}/og-image.png`}
      />
      <StructuredData data={[breadcrumbSchema]} />

      <PublicPageHero
        title="AI-Powered Hiring"
        subtitle="From voice screening to smart matching — AI handles the heavy lifting so you can focus on the human side of hiring."
        backgroundImage={guideHero}
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 hover:border-primary/30 transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
                  <feature.icon className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg mt-3">{feature.title}</CardTitle>
                <CardDescription className="text-sm">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-card border border-border rounded-2xl p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">See AI in Action</h2>
            <p className="text-muted-foreground mb-6">
              Listen to real AI voice screening calls, explore the recruiter dashboard, and see how automation transforms your hiring workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/demo">
                  Try the Demo <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contact">
                  Talk to Our Team
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Why AI-Powered Recruitment?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              'Screen candidates 24/7 without recruiter availability',
              'Reduce time-to-hire from weeks to days',
              'Eliminate manual data entry and repetitive tasks',
              'Consistent, unbiased candidate evaluation',
              'Scale hiring without scaling headcount',
              'Real-time analytics on every hiring touchpoint',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;
