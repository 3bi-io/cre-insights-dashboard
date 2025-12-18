/**
 * Onboarding Section Component
 * Displays implementation timeline and quick wins
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { SectionWrapper } from '../shared/SectionWrapper';
import { SectionHeader } from '../shared/SectionHeader';
import { TimelineCard } from '../shared/TimelineCard';
import { onboardingContent } from '../../content/onboarding.content';

const OnboardingSection = () => {
  return (
    <SectionWrapper>
      <SectionHeader 
        title={onboardingContent.title}
        description={onboardingContent.description}
        badge={
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Clock className="h-3 w-3 mr-1 inline" />
            {onboardingContent.badge}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {onboardingContent.steps.map((step, index) => (
          <TimelineCard
            key={index}
            icon={step.icon}
            title={step.title}
            time={step.time}
            tasks={step.tasks}
          />
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-8 mb-12">
        <h3 className="text-2xl font-playfair font-bold text-foreground mb-6 text-center">
          {onboardingContent.quickWinsTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {onboardingContent.quickWins.map((win, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground">{win}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          {onboardingContent.ctaTitle}
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/contact">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              {onboardingContent.ctaPrimary}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/resources">
            <Button variant="outline" size="lg">
              {onboardingContent.ctaSecondary}
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          {onboardingContent.ctaFooter}
        </p>
      </div>
    </SectionWrapper>
  );
};

export default OnboardingSection;
