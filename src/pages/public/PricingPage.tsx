/**
 * Pricing Page Component
 * Pricing plans and subscription options
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowRight, 
  Check,
  X,
  Star,
  Users,
  Zap,
  Shield,
  Headphones,
  Crown
} from 'lucide-react';

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = React.useState(true);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams getting started",
      monthlyPrice: 175,
      annualPrice: 149,
      stripeMonthlyUrl: "https://buy.stripe.com/14AbIUf660At4ZkdfYaAw07",
      stripeYearlyUrl: "https://buy.stripe.com/5kQ3co8HI1Ex9fA4JsaAw08",
      icon: Users,
      color: "border-muted",
      buttonVariant: "outline" as const,
      features: [
        "Up to 3 team members",
        "50 active job postings",
        "Basic candidate tracking",
        "Email notifications",
        "Standard templates",
        "Basic reporting",
        "Community support",
        "Mobile app access"
      ],
      limitations: [
        "No AI-powered features",
        "Limited integrations",
        "Basic customization"
      ]
    },
    {
      name: "Professional",
      description: "Everything growing teams need to scale",
      monthlyPrice: 475,
      annualPrice: 399,
      stripeMonthlyUrl: "https://buy.stripe.com/aFabIUe22erj63o4JsaAw05",
      stripeYearlyUrl: "https://buy.stripe.com/eVq4gs9LM2IBbnIcbUaAw06",
      icon: Zap,
      color: "border-primary",
      buttonVariant: "default" as const,
      popular: true,
      features: [
        "Up to 15 team members",
        "Unlimited job postings",
        "AI-powered candidate matching",
        "Advanced workflow automation",
        "Custom interview templates",
        "Advanced analytics & reporting",
        "Priority email support",
        "API access",
        "Custom branding",
        "Integration with 50+ job boards",
        "Calendar integrations",
        "Bulk actions"
      ],
      limitations: []
    },
    {
      name: "Enterprise",
      description: "Advanced features for large organizations",
      isEnterprise: true,
      icon: Crown,
      color: "border-accent",
      buttonVariant: "outline" as const,
      features: [
        "Unlimited team members",
        "Unlimited everything",
        "Advanced AI analytics",
        "Custom workflow builder",
        "White-label solution",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
        "Advanced security features",
        "Compliance tools (GDPR, EEO)",
        "Multi-location support",
        "Advanced permissions",
        "Custom reporting",
        "Data export/import",
        "SLA guarantees"
      ],
      limitations: []
    }
  ];

  const enterprise_features = [
    "Single Sign-On (SSO)",
    "Advanced security & compliance",
    "Custom data retention policies",
    "Dedicated infrastructure",
    "Professional services & training",
    "Custom contract terms"
  ];

  const faqs = [
    {
      question: "Can I change plans at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the next billing cycle for downgrades."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "Your data remains accessible for 30 days after cancellation. You can export all your data during this period. After 30 days, data is permanently deleted."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees for any plan. You only pay the monthly or annual subscription fee."
    },
    {
      question: "Do you offer discounts for nonprofits?",
      answer: "Yes, we offer special pricing for qualified nonprofit organizations. Contact our sales team for details."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans. Enterprise customers can also pay by invoice."
    },
    {
      question: "Is there a money-back guarantee?",
      answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days for a full refund."
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    return isAnnual ? plan.annualPrice : plan.monthlyPrice;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (!isAnnual) return null;
    const savings = Math.round(((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100);
    return savings;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Simple, Transparent
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Pricing</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your organization. Start building your 
            recruitment pipeline today.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={`text-sm ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            <Badge className="bg-green-100 text-green-800 border-green-200 ml-2">
              Save up to 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative hover:shadow-lg transition-all duration-300 ${plan.color} ${plan.popular ? 'scale-105 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <plan.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <p className="text-muted-foreground">{plan.description}</p>
                  
                  {!plan.isEnterprise ? (
                    <div className="mt-6">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-foreground">
                          ${getPrice(plan)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          /user/month
                        </span>
                      </div>
                      {isAnnual && getSavings(plan) && (
                        <p className="text-sm text-green-600 mt-2">
                          Save {getSavings(plan)}% annually
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6">
                      <div className="flex items-baseline justify-center">
                        <span className="text-2xl font-bold text-foreground">
                          Custom Pricing
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Contact us for a tailored solution
                      </p>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <Check className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <X className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground line-through">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  {plan.isEnterprise ? (
                    <>
                      <Link to="/contact" className="block">
                        <Button 
                          variant={plan.buttonVariant} 
                          className="w-full"
                          size="lg"
                        >
                          Contact Sales
                        </Button>
                      </Link>
                      <p className="text-xs text-muted-foreground text-center">
                        Let's discuss your needs
                      </p>
                    </>
                  ) : (
                    <>
                      <a 
                        href={isAnnual ? plan.stripeYearlyUrl : plan.stripeMonthlyUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block"
                      >
                        <Button 
                          variant={plan.buttonVariant} 
                          className="w-full"
                          size="lg"
                        >
                          Get Started
                        </Button>
                      </a>
                      <p className="text-xs text-muted-foreground text-center">
                        Start your subscription today
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              Enterprise Add-Ons
            </h2>
            <p className="text-xl text-muted-foreground">
              Additional features available for Enterprise customers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enterprise_features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-background rounded-lg border">
                <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/contact">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Contact Sales
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our pricing
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <Headphones className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              Questions About Pricing?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Our team is here to help you choose the right plan for your organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Talk to Sales
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;