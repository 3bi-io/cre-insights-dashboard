import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, MessageCircle, Phone, Mail, BookOpen } from 'lucide-react';

const SupportSection = () => {
  const supportTiers = [
    {
      name: 'Starter',
      badge: 'Up to 5 users',
      features: [
        { icon: Mail, text: 'Email support', detail: '48-hour response time' },
        { icon: BookOpen, text: 'Knowledge base access', detail: 'Self-service guides' },
        { icon: Clock, text: 'Business hours', detail: 'Mon-Fri, 9am-5pm EST' }
      ]
    },
    {
      name: 'Professional',
      badge: 'Up to 25 users',
      popular: true,
      features: [
        { icon: MessageCircle, text: 'Priority email & chat', detail: '24-hour response time' },
        { icon: Phone, text: 'Phone support', detail: 'Business hours' },
        { icon: CheckCircle, text: 'Onboarding assistance', detail: '2-hour kickoff call' },
        { icon: BookOpen, text: 'Advanced resources', detail: 'Video tutorials & webinars' }
      ]
    },
    {
      name: 'Enterprise',
      badge: 'Unlimited users',
      features: [
        { icon: MessageCircle, text: 'Dedicated support', detail: '4-hour response SLA' },
        { icon: Phone, text: '24/7 phone support', detail: 'Round-the-clock coverage' },
        { icon: CheckCircle, text: 'White-glove onboarding', detail: 'Full implementation support' },
        { icon: CheckCircle, text: 'Custom training', detail: 'Tailored to your team' },
        { icon: CheckCircle, text: 'Dedicated account manager', detail: 'Strategic partner' }
      ]
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            Support When You Need It
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From self-service resources to dedicated account managers, we're here to ensure your success
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {supportTiers.map((tier, index) => (
            <Card key={index} className={tier.popular ? 'border-primary shadow-lg' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>{tier.name}</CardTitle>
                  {tier.popular && (
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  )}
                </div>
                <CardDescription>{tier.badge}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tier.features.map((feature, featureIndex) => {
                    const Icon = feature.icon;
                    return (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <div className="mt-1">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{feature.text}</div>
                          <div className="text-sm text-muted-foreground">{feature.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include access to our comprehensive{' '}
            <a href="/resources" className="text-primary hover:underline">knowledge base</a>
            {' '}with setup guides, best practices, and integration documentation
          </p>
        </div>
      </div>
    </section>
  );
};

export default SupportSection;
