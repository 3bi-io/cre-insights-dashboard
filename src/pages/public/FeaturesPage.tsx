/**
 * Features Page Component
 * Detailed features showcase for the ATS platform
 */

import React from 'react';
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
      description: "Post jobs to 100+ job boards and platforms with one click"
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

  const integrations = [
    "Slack", "Microsoft Teams", "Google Workspace", "LinkedIn", "Indeed", 
    "Glassdoor", "AngelList", "Workday", "BambooHR", "Greenhouse", 
    "Lever", "SmartRecruiters"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            ✨ Feature-Rich Platform
          </Badge>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Modern Recruiting</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover all the tools and capabilities that make ATS INTEL the most comprehensive 
            applicant tracking system for forward-thinking organizations.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              Core Platform Features
            </h2>
            <p className="text-xl text-muted-foreground">
              The foundation of intelligent recruitment
            </p>
          </div>

          <div className="space-y-16">
            {coreFeatures.map((feature, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 text-lg">
                    {feature.description}
                  </p>
                  <div className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`relative ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-24 w-24 text-primary/60" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              Everything You Need & More
            </h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive tools for every aspect of your hiring process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-muted hover:border-primary/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            Seamless Integrations
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Connect with the tools you already use and love
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {integrations.map((integration, index) => (
              <div key={index} className="p-4 border border-muted rounded-lg hover:border-primary/20 transition-colors">
                <span className="text-sm font-medium text-muted-foreground">{integration}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-12">
            <p className="text-muted-foreground mb-4">Need a custom integration?</p>
            <Link to="/contact">
              <Button variant="outline">
                Contact Our Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-white mb-4">
            Experience All Features Risk-Free
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start your 14-day free trial and see how ATS INTEL can transform your hiring process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg bg-white text-primary hover:bg-white/90">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white/10">
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