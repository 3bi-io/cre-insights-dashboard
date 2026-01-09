/**
 * Pricing Page Component
 * Mobile-first pricing tiers with collapsible features and early adopter benefits
 */

import React from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Shield, Clock, CreditCard, X as XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CollapsibleFeatureList } from '@/components/public/CollapsibleFeatureList';
import { cn } from '@/lib/utils';

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
    { text: '50% off for first 6 months', icon: Zap },
    { text: 'Lifetime grandfathered pricing', icon: Shield },
    { text: 'Priority feature requests', icon: Clock },
    { text: 'Direct access to product team', icon: CreditCard },
    { text: 'Extended onboarding support', icon: Check },
    { text: 'Free data migration', icon: Check },
  ];

  const allPlansInclude = [
    { title: '30-Day Free Trial', description: 'No credit card required', icon: Clock },
    { title: 'GDPR Compliant', description: 'Full data protection', icon: Shield },
    { title: 'High Availability', description: 'Reliable infrastructure', icon: Zap },
    { title: 'Cancel Anytime', description: 'No long-term contracts', icon: XIcon },
  ];

  // Build pricing offers structured data
  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ATS.me Recruitment Platform",
    "description": "AI-powered applicant tracking system with Voice Apply technology",
    "brand": {
      "@type": "Brand",
      "name": "ATS.me"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Starter Plan",
        "price": "299",
        "priceCurrency": "USD",
        "priceValidUntil": "2026-12-31",
        "availability": "https://schema.org/InStock",
        "description": "Perfect for small teams getting started"
      },
      {
        "@type": "Offer",
        "name": "Professional Plan",
        "price": "599",
        "priceCurrency": "USD",
        "priceValidUntil": "2026-12-31",
        "availability": "https://schema.org/InStock",
        "description": "Most popular for growing businesses"
      },
      {
        "@type": "Offer",
        "name": "Enterprise Plan",
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": "Custom",
          "priceCurrency": "USD"
        },
        "availability": "https://schema.org/InStock",
        "description": "Tailored solutions for large organizations"
      }
    ]
  };

  return (
    <div className="min-h-screen py-8 lg:py-16 px-4">
      <SEO
        title="Pricing & Plans | Early Adopter Discounts Available"
        description="Simple, transparent pricing starting at $299/month. Join our pilot program for 50% off first 6 months + lifetime grandfathered pricing. Starter, Professional & Enterprise plans."
        keywords="ATS pricing, recruitment software cost, early adopter pricing, pilot program discount, ATS.me plans"
        canonical="https://ats.me/pricing"
      />
      <StructuredData data={pricingSchema} />
      <div className="container mx-auto max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-8 lg:mb-16">
          <Badge className="mb-3 lg:mb-4">
            <Zap className="h-3 w-3 mr-1" />
            Early Adopter Pricing Available
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 lg:mb-4 px-2">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Join our pilot program and get exclusive early adopter benefits. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Early Adopter Benefits */}
        <Card className="mb-8 lg:mb-12 border-primary/50 bg-primary/5">
          <CardHeader className="pb-2 lg:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <Zap className="h-5 w-5 text-primary" />
              Early Adopter Benefits
            </CardTitle>
            <CardDescription className="text-sm lg:text-base">
              Be part of our pilot program and get exclusive lifetime benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {earlyAdopterBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                  <benefit.icon className="h-4 w-4 lg:h-5 lg:w-5 text-primary shrink-0" />
                  <span className="text-sm lg:text-base">{benefit.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Tiers - Mobile: Single column, Desktop: 3 columns */}
        {/* On mobile, show Popular plan first */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 mb-8 lg:mb-16">
          {/* Mobile order: Popular first */}
          {[...pricingTiers]
            .sort((a, b) => {
              // Only reorder on mobile - popular first
              if (a.popular) return -1;
              if (b.popular) return 1;
              return 0;
            })
            .map((tier, index) => (
            <Card 
              key={tier.name} 
              className={cn(
                "flex flex-col",
                tier.popular && "border-primary shadow-lg relative lg:scale-105 lg:-my-4 lg:z-10",
                // On mobile, hide the order change visually
                "lg:order-none",
                tier.name === 'Starter' && "lg:order-1",
                tier.name === 'Professional' && "lg:order-2",
                tier.name === 'Enterprise' && "lg:order-3"
              )}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="whitespace-nowrap">{tier.badge}</Badge>
                </div>
              )}
              <CardHeader className={tier.badge ? "pt-6" : ""}>
                <CardTitle className="text-xl lg:text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-sm lg:text-base">{tier.description}</CardDescription>
                <div className="mt-3 lg:mt-4">
                  <span className="text-3xl lg:text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground text-sm lg:text-base">{tier.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Use collapsible on mobile, show all on desktop */}
                <div className="lg:hidden">
                  <CollapsibleFeatureList 
                    features={tier.features} 
                    initialCount={5}
                  />
                </div>
                <ul className="hidden lg:block space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button 
                  className="w-full min-h-[48px] text-base" 
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => tier.name === 'Enterprise' ? navigate('/contact') : navigate('/auth')}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* All Plans Include - Mobile optimized grid */}
        <div className="text-center mb-8 lg:mb-16">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">All Plans Include</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 max-w-4xl mx-auto">
            {allPlansInclude.map((item, index) => (
              <div 
                key={index} 
                className="p-3 lg:p-4 rounded-lg bg-muted/50 text-center"
              >
                <item.icon className="h-5 w-5 lg:h-6 lg:w-6 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm lg:text-base mb-1">{item.title}</h3>
                <p className="text-xs lg:text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-xl lg:text-2xl font-bold mb-4">Ready to Transform Your Hiring?</h2>
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Button size="lg" className="min-h-[48px] text-base" onClick={() => navigate('/auth')}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="min-h-[48px] text-base" onClick={() => navigate('/contact')}>
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
