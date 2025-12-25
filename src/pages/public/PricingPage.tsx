/**
 * Pricing Page Component
 * Displays pricing tiers and plans with early adopter benefits
 */

import React from 'react';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const navigate = useNavigate();

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$299',
      period: '/month',
      description: 'Perfect for small teams getting started',
      badge: null,
      features: [
        'Up to 3 active users',
        '50 job postings per month',
        'Basic AI screening',
        'Email support',
        'Standard reporting',
        'Mobile app access',
        'Job board integrations (5 boards)',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$599',
      period: '/month',
      description: 'Most popular for growing businesses',
      badge: 'MOST POPULAR',
      features: [
        'Up to 10 active users',
        'Unlimited job postings',
        'Advanced AI screening & analytics',
        'Priority chat & email support',
        'Advanced reporting & insights',
        'Voice Apply technology',
        'Job board integrations (50+ boards)',
        'Automated workflows',
        'Interview scheduling',
        'Custom branding',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Tailored solutions for large organizations',
      badge: 'BEST VALUE',
      features: [
        'Unlimited users',
        'Unlimited job postings',
        'Full AI suite with custom models',
        'Dedicated account manager',
        'Custom integrations & API access',
        'White-label options',
        'All job boards',
        'Advanced security & compliance',
        'Custom SLAs',
        'On-site training',
        'Priority development requests',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const earlyAdopterBenefits = [
    '50% off for first 6 months',
    'Lifetime grandfathered pricing',
    'Priority feature requests',
    'Direct access to product team',
    'Extended onboarding support',
    'Free data migration',
  ];

  return (
    <div className="min-h-screen py-16 px-4">
      <SEO
        title="Pricing & Plans | Early Adopter Discounts Available"
        description="Simple, transparent pricing starting at $299/month. Join our pilot program for 50% off first 6 months + lifetime grandfathered pricing. Starter, Professional & Enterprise plans."
        keywords="ATS pricing, recruitment software cost, early adopter pricing, pilot program discount, ATS.me plans"
        canonical="https://ats.me/pricing"
      />
      <div className="container mx-auto max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Early Adopter Pricing Available
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join our pilot program and get exclusive early adopter benefits. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Early Adopter Benefits */}
        <Card className="mb-12 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Early Adopter Benefits
            </CardTitle>
            <CardDescription>
              Be part of our pilot program and get exclusive lifetime benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earlyAdopterBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.name} 
              className={tier.popular ? 'border-primary shadow-lg relative' : ''}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default">{tier.badge}</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => tier.name === 'Enterprise' ? navigate('/contact') : navigate('/auth')}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">All Plans Include</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">30-Day Free Trial</h3>
              <p className="text-sm text-muted-foreground">No credit card required</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">GDPR Compliant</h3>
              <p className="text-sm text-muted-foreground">Full data protection</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">High Availability</h3>
              <p className="text-sm text-muted-foreground">Reliable infrastructure</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Cancel Anytime</h3>
              <p className="text-sm text-muted-foreground">No long-term contracts</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Hiring?</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
