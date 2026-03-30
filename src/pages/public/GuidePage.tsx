import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { StructuredData, buildBreadcrumbSchema } from '@/components/StructuredData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Briefcase, Mic, Settings, ArrowRight,
  Zap, Globe, BarChart3, Users, FileText
} from 'lucide-react';
import { SITE_URL } from '@/config/siteConfig';
import { PublicPageHero } from '@/components/shared';
import guideHero from '@/assets/hero/trust-hero.png';

const guides = [
  {
    icon: Zap,
    title: 'Getting Started',
    description: 'Set up your account, create your first job listing, and start receiving applications in under 15 minutes.',
    link: '/features',
    badge: 'Start Here',
    category: 'Basics',
  },
  {
    icon: Briefcase,
    title: 'Creating & Managing Jobs',
    description: 'Learn how to create compelling job listings, manage multiple locations, and optimize for maximum visibility.',
    link: '/jobs',
    category: 'Jobs',
  },
  {
    icon: Mic,
    title: 'Voice Apply Setup',
    description: 'Configure AI voice agents to screen candidates automatically with natural conversations.',
    link: '/demo',
    badge: 'Popular',
    category: 'AI Features',
  },
  {
    icon: Globe,
    title: 'Job Board Syndication',
    description: 'Distribute your listings to Indeed, LinkedIn, Jooble, and 13+ free job boards automatically.',
    link: '/features',
    category: 'Distribution',
  },
  {
    icon: Settings,
    title: 'ATS Integrations',
    description: 'Connect Tenstreet, DriverReach, and other applicant tracking systems for seamless data flow.',
    link: '/contact',
    category: 'Integrations',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    description: 'Track application sources, conversion rates, and hiring funnel performance with real-time dashboards.',
    link: '/features',
    category: 'Analytics',
  },
  {
    icon: Users,
    title: 'Team & Organization Setup',
    description: 'Add recruiters, assign roles, manage clients, and configure multi-location hiring workflows.',
    link: '/contact',
    category: 'Admin',
  },
  {
    icon: FileText,
    title: 'API & Developer Guide',
    description: 'Embed apply forms, set up webhooks, and integrate Apply AI into your existing tech stack.',
    link: '/api-docs',
    category: 'Developer',
  },
];

const GuidePage = () => {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Guide', url: `${SITE_URL}/guide` },
  ]);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I get started with Apply AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sign up for a free account, create your first job listing, and start receiving applications in under 15 minutes. Our platform guides you through every step."
        }
      },
      {
        "@type": "Question",
        "name": "How does job board syndication work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply AI automatically distributes your job listings to 16+ free job boards including Indeed, LinkedIn, Jooble, and more. Listings are refreshed every 24 days to maintain visibility."
        }
      },
      {
        "@type": "Question",
        "name": "What is Voice Apply?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Voice Apply is our AI-powered voice agent that screens candidates through natural phone conversations, verifying qualifications and collecting information automatically."
        }
      },
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Platform Guide — How-To Tutorials & Resources"
        description="Step-by-step guides for Apply AI: job posting, Voice Apply setup, ATS integrations, job board syndication, analytics, and more. Get started in minutes."
        keywords="Apply AI guide, recruitment how-to, job posting guide, voice apply tutorial, ATS integration guide, job board syndication"
        canonical={`${SITE_URL}/guide`}
        ogImage={`${SITE_URL}/og-image.png`}
      />
      <StructuredData data={[breadcrumbSchema, faqSchema]} />

      <PublicPageHero
        title="Platform Guide"
        subtitle="Everything you need to hire faster — from first setup to advanced integrations."
        backgroundImage={guideHero}
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Card key={guide.title} className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
                    <guide.icon className="w-5 h-5" />
                  </div>
                  {guide.badge && (
                    <Badge variant="secondary" className="text-xs shrink-0">{guide.badge}</Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{guide.title}</CardTitle>
                <CardDescription className="text-sm">{guide.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="ghost" size="sm" className="group-hover:text-primary transition-colors p-0 h-auto">
                  <Link to={guide.link}>
                    Learn more <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Need personalized help?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Our team can walk you through setup, integrations, and best practices tailored to your hiring needs.
          </p>
          <Button asChild size="lg">
            <Link to="/contact">Contact Us <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuidePage;
