import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Zap, Shield, BarChart3, Users, Globe } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analytics",
      description: "Advanced machine learning algorithms analyze candidate data to predict hiring success and optimize your recruitment process."
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "Streamline your hiring process with intelligent automation that handles repetitive tasks and accelerates decision-making."
    },
    {
      icon: Shield,
      title: "Compliance & Security",
      description: "Enterprise-grade security with full GDPR compliance, ensuring your candidate data is always protected."
    },
    {
      icon: BarChart3,
      title: "Advanced Reporting",
      description: "Comprehensive analytics dashboard with real-time insights into your recruitment metrics and team performance."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Seamless collaboration tools that keep your entire hiring team aligned and efficient throughout the process."
    },
    {
      icon: Globe,
      title: "Global Integration",
      description: "Connect with 100+ job boards and platforms worldwide to expand your reach and find the best talent."
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