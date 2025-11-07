/**
 * Benefits Section Component
 * Displays key benefits and value propositions
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { SectionWrapper } from '../shared/SectionWrapper';
import { benefitsContent } from '../../content/benefits.content';

const BenefitsSection = () => {
  return (
    <SectionWrapper variant="muted">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-6">
          {benefitsContent.title}
        </h2>
        <div className="space-y-4">
          {benefitsContent.benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              <span className="text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link to="/features">
            <Button className="bg-primary hover:bg-primary/90">
              {benefitsContent.ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default BenefitsSection;
