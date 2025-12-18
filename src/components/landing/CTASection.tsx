/**
 * Call-to-Action Section Component
 * Final conversion section with early adopter messaging
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto max-w-4xl text-center">
        <Badge className="mb-6 text-sm px-4 py-2">
          <Zap className="h-4 w-4 mr-2" />
          Limited Time: Early Adopter Program
        </Badge>

        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Transform Your Hiring Process?
        </h2>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join 50+ companies in our pilot program. Get 50% off for 6 months, lifetime grandfathered pricing, and direct access to our product team.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/auth')}
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/contact')}
          >
            Contact Sales
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
          <div>
            <div className="text-3xl font-bold mb-2">30 Days</div>
            <div className="text-muted-foreground">Free trial, no credit card</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">48 Hours</div>
            <div className="text-muted-foreground">Average go-live time</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">50% Off</div>
            <div className="text-muted-foreground">First 6 months for early adopters</div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            No long-term contracts • Cancel anytime • GDPR compliant • SOC 2 certified
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;