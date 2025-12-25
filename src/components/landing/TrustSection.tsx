import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Zap, Rocket } from 'lucide-react';

const TrustSection = () => {
  const stats = [
    {
      icon: Users,
      value: 'Growing',
      label: 'Pilot Program',
      description: 'Early adopters testing in production'
    },
    {
      icon: Zap,
      value: 'Designed for',
      label: 'Efficiency',
      description: 'Automation-first architecture'
    },
    {
      icon: Shield,
      value: 'Built-in',
      label: 'GDPR & EEO Compliance',
      description: 'Privacy and fairness by design'
    },
    {
      icon: Rocket,
      value: 'Active',
      label: 'Development',
      description: 'New features shipping weekly'
    }
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Now Accepting Beta Users
          </Badge>
          <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-4">
            Built on Proven Technology, Designed for Modern Recruiting
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform is built on enterprise-grade infrastructure with 
            integrations to Tenstreet, major job boards, and leading HR systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="font-semibold text-foreground mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Early Adopter Benefits:</strong> Priority support, feature voting rights, and special pricing for pilot program participants
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
