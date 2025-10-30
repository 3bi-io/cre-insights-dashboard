import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Zap, Shield, BarChart3, Users, Globe, Mic } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Mic,
      title: "Voice Apply Technology",
      description: "Revolutionary voice-powered application process that allows candidates to apply using natural speech, reducing application time by 80% and improving accessibility."
    },
    {
      icon: Brain,
      title: "AI-Powered Analytics",
      description: "Track cost-per-hire by source, predict time-to-hire trends, identify candidate drop-off points, and compare publisher ROI with real-time ML predictions."
    },
    {
      icon: Zap,
      title: "Automated Screening & Workflows",
      description: "Intelligent screening requests, automated background checks, and interview scheduling that reduce manual work by 95% while maintaining quality."
    },
    {
      icon: Shield,
      title: "Compliance & Security",
      description: "Enterprise-grade security with full GDPR and EEO compliance, automated audit trails, and role-based access controls for data protection."
    },
    {
      icon: BarChart3,
      title: "Advanced Reporting & Insights",
      description: "Real-time dashboards showing spend trends, platform performance, category breakdowns, and predictive analytics for hiring success rates."
    },
    {
      icon: Users,
      title: "Full Lifecycle Management",
      description: "Complete ATS covering job posting, applicant tracking, interview scheduling, offer management, and onboarding with seamless team collaboration."
    },
    {
      icon: Globe,
      title: "Multi-Channel Distribution",
      description: "Integrate with Tenstreet, Indeed, Glassdoor, Adzuna, Talroo, and 100+ job boards. Automatic posting and real-time application syncing."
    }
  ];

  return (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            Everything You Need to Hire Better
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Powerful features designed to streamline your recruitment process and help you make data-driven hiring decisions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-muted hover:border-primary/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;