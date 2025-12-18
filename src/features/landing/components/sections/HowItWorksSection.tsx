/**
 * How It Works Section
 * Visual flow diagram showing the automated voice callback process
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper } from '../shared/SectionWrapper';
import { howItWorksContent, HowItWorksStep } from '../../content/howitworks.content';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const StepCard: React.FC<{ step: HowItWorksStep; index: number; isLast: boolean }> = ({ 
  step, 
  index, 
  isLast 
}) => {
  const Icon = step.icon;
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Step number badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {index + 1}
        </span>
      </div>
      
      {/* Card */}
      <div className="relative bg-card border rounded-xl p-6 pt-8 text-center w-full h-full shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-7 w-7 text-primary" />
          </div>
        </div>
        
        <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
        
        {step.highlight && (
          <Badge variant="secondary" className="text-xs">
            {step.highlight}
          </Badge>
        )}
      </div>
      
      {/* Arrow connector (hidden on mobile, shown on desktop) */}
      {!isLast && (
        <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-20">
          <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
};

const HowItWorksSection: React.FC = () => {
  return (
    <SectionWrapper id="how-it-works" variant="muted">
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
          {howItWorksContent.badge}
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          {howItWorksContent.title}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {howItWorksContent.description}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        {howItWorksContent.steps.map((step, index) => (
          <StepCard 
            key={index} 
            step={step} 
            index={index} 
            isLast={index === howItWorksContent.steps.length - 1} 
          />
        ))}
      </div>
    </SectionWrapper>
  );
};

export default HowItWorksSection;
