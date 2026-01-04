/**
 * Features Page Component
 * Mobile-first detailed features showcase for the ATS platform
 */

import React from 'react';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Brain,
  Zap,
  Shield,
  BarChart3,
  Users,
  Globe,
  Clock,
  CheckCircle,
  MessageSquare,
  FileText,
  Search,
  Workflow,
  Target,
  TrendingUp,
  Settings,
  Database,
  Smartphone
} from 'lucide-react';

const FeaturesPage = () => {
  const coreFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Candidate Matching",
      description: "Our advanced machine learning algorithms analyze resumes, job requirements, and historical hiring data to identify the best-fit candidates automatically.",
      features: [
        "Smart resume parsing and data extraction",
        "Predictive candidate scoring",
        "Bias-free screening recommendations",
        "Skills gap analysis and suggestions"
      ]
    },
    {
      icon: Zap,
      title: "Automated Workflow Management",
      description: "Streamline your entire hiring process with intelligent automation that adapts to your organization's unique requirements.",
      features: [
        "Customizable workflow templates",
        "Automated candidate communications",
        "Interview scheduling automation",
        "Approval process management"
      ]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics Dashboard",
      description: "Get deep insights into your recruitment performance with comprehensive analytics and real-time reporting.",
      features: [
        "Real-time hiring metrics",
        "Custom report builder",
        "Predictive analytics",
        "ROI tracking and optimization"
      ]
    },
    {
      icon: Users,
      title: "Team Collaboration Tools",
      description: "Keep your entire hiring team aligned with powerful collaboration features designed for modern recruitment.",
      features: [
        "Shared candidate pools",
        "Collaborative interview feedback",
        "Team performance tracking",
        "Role-based access control"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: Globe,
      title: "Multi-Platform Job Distribution",
      description: "Post jobs to multiple job boards and platforms with one click"
    },
    {
      icon: MessageSquare,
      title: "Integrated Communication Hub",
      description: "Centralized messaging system for all candidate interactions"
    },
    {
      icon: FileText,
      title: "Document Management System",
      description: "Secure storage and organization of all hiring documents"
    },
    {
      icon: Search,
      title: "Advanced Candidate Search",
      description: "Powerful search and filtering capabilities across your talent pool"
    },
    {
      icon: Workflow,
      title: "Custom Pipeline Builder",
      description: "Create tailored hiring pipelines for different roles and departments"
    },
    {
      icon: Target,
      title: "Goal Setting & Tracking",
      description: "Set and monitor hiring goals with automated progress tracking"
    },
    {
      icon: Clock,
      title: "Time-to-Hire Optimization",
      description: "Identify bottlenecks and optimize your hiring timeline"
    },
    {
      icon: TrendingUp,
      title: "Performance Benchmarking",
      description: "Compare your metrics against industry standards"
    },
    {
      icon: Settings,
      title: "Custom Integrations",
      description: "Connect with your existing HR tools and systems"
    },
    {
      icon: Database,
      title: "Talent Pool Management",
      description: "Build and nurture relationships with potential candidates"
    },
    {
      icon: Shield,
      title: "Compliance Management",
      description: "Built-in GDPR, EEO, and industry compliance tools"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Full functionality on any device, anywhere"
    }
  ];

  // Updated integrations list - removed competitor ATS names
  const integrations = [
    "Slack", "Microsoft Teams", "Google Workspace", "LinkedIn", "Indeed", 
    "Glassdoor", "ZipRecruiter", "Tenstreet", "BambooHR", "Workday"
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Features | AI Screening, Voice Apply & Integrations"
        description="Explore ATS.me's powerful features: Voice Apply (faster applications), Tenstreet sync, AI-powered screening, job board distribution, predictive analytics, automated workflows."
        keywords="ATS features, Voice Apply technology, AI screening, job board integration, Tenstreet integration, recruitment automation"
        canonical="https://ats.me/features"
      />
      {/* Hero Section */}
      <section className="relative py-10 md:py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-primary/5 bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 lg:left-20 w-48 lg:w-72 h-48 lg:h-72 bg-primary/10 rounded-full blur-2xl lg:blur-3xl motion-safe:animate-pulse"></div>
        <div className="absolute bottom-20 right-10 lg:right-20 w-64 lg:w-96 h-64 lg:h-96 bg-accent/10 rounded-full blur-2xl lg:blur-3xl motion-safe:animate-pulse delay-1000"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 md:mb-6 bg-primary/10 text-primary border-primary/20">
            ✨ Feature-Rich Platform
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 md:mb-6 px-2">
            Powerful Features for
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Modern Recruiting</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto px-4">
            Discover all the tools and capabilities that make ATS Intel the most comprehensive 
            applicant tracking system for forward-thinking organizations.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90 min-h-[48px] text-base">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Core Features - Mobile: Stacked, Desktop: Alternating */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-foreground mb-3 md:mb-4">
              Core Platform Features
            </h2>
            <p className="text-base md:text-xl text-muted-foreground">
              The foundation of intelligent recruitment
            </p>
          </div>

          <div className="space-y-10 md:space-y-16">
            {coreFeatures.map((feature, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-center">
                {/* On mobile: Icon always on top. On desktop: Alternate */}
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
                <div className={`order-2 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'} hidden md:block`}>
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-16 lg:h-24 w-16 lg:w-24 text-primary/60" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-foreground mb-3 md:mb-4">
              Everything You Need & More
            </h2>
            <p className="text-base md:text-xl text-muted-foreground">
              Comprehensive tools for every aspect of your hiring process
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-muted hover:border-primary/20">
                <CardHeader className="pb-2 md:pb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                    <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base md:text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm md:text-base">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section - Horizontal scroll on mobile */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-foreground mb-3 md:mb-4">
            Seamless Integrations
          </h2>
          <p className="text-base md:text-xl text-muted-foreground mb-8 md:mb-12">
            Connect with the tools you already use and love
          </p>
          
          {/* Mobile: Horizontal scroll, Desktop: Grid */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-2">
            <div className="flex md:grid md:grid-cols-5 gap-3 md:gap-4 min-w-max md:min-w-0">
              {integrations.map((integration, index) => (
                <div 
                  key={index} 
                  className="p-3 md:p-4 border border-muted rounded-lg hover:border-primary/20 transition-colors whitespace-nowrap"
                >
                  <span className="text-xs md:text-sm font-medium text-muted-foreground">{integration}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 md:mt-12">
            <p className="text-muted-foreground mb-4 text-sm md:text-base">Need a custom integration?</p>
            <Link to="/contact">
              <Button variant="outline" className="min-h-[44px]">
                Contact Our Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-white mb-3 md:mb-4">
            Experience All Features Risk-Free
          </h2>
          <p className="text-base md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
            Get started and see how ATS Intel can transform your hiring process.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 py-3 text-base md:text-lg bg-white text-primary hover:bg-white/90 min-h-[48px]">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-3 text-base md:text-lg border-white text-white hover:bg-white/10 min-h-[48px]">
                View Pricing Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
