import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-white mb-4">
          Ready to Transform Your Hiring?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of organizations that have revolutionized their recruitment process with ATS Intel.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="px-8 py-3 text-lg bg-white text-primary hover:bg-white/90">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-white text-white hover:bg-white/10">
              Schedule Demo
            </Button>
          </Link>
        </div>
        <p className="text-sm text-white/70 mt-4">
          No credit card required • Get started instantly
        </p>
      </div>
    </section>
  );
};

export default CTASection;