/**
 * Call-to-Action Section Component
 * Final conversion section for the landing page
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
          Founders Pass — Limited Time
        </Badge>

        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Hire Faster?
        </h2>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          $0 to start. Pay only $1–$3 per apply. The best end-to-end recruitment solution available today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/founders-pass')}
          >
            Claim Your Founders Pass
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/contact?subject=founders-pass')}
          >
            Talk to Us
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
          <div>
            <div className="text-3xl font-bold mb-2">$0</div>
            <div className="text-muted-foreground">To get started</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">$1–$3</div>
            <div className="text-muted-foreground">Per apply</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">Priority</div>
            <div className="text-muted-foreground">Onboarding support</div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            No contracts • Cancel anytime • GDPR compliant
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
