import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, BarChart3 } from 'lucide-react';

const BenefitsSection = () => {
  const benefits = [
    "Reduce time-to-hire by up to 95% with intelligent automation",
    "Improve candidate quality with AI-powered screening and matching",
    "Scale your recruiting operations without increasing headcount",
    "Ensure compliance with built-in GDPR and EEO tools",
    "Get actionable insights with advanced analytics and reporting",
    "Integrate seamlessly with your existing HR tech stack"
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-6">
              Why Organizations Choose INTEL ATS
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link to="/features">
                <Button className="bg-primary hover:bg-primary/90">
                  Explore All Features
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-24 w-24 text-primary/60 mx-auto mb-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;