/**
 * Reusable gradient CTA footer section for public pages
 * Used by FeaturesPage, ClientsPage, DemoPage
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CTAAction {
  label: string;
  to: string;
  variant?: 'primary' | 'outline';
}

interface GradientCTAProps {
  title: string;
  description: string;
  primaryAction: CTAAction;
  secondaryAction?: CTAAction;
}

export const GradientCTA = ({
  title,
  description,
  primaryAction,
  secondaryAction,
}: GradientCTAProps) => {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-r from-primary to-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-primary-foreground mb-3 md:mb-4">
          {title}
        </h2>
        <p className="text-base md:text-xl text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
          <Link to={primaryAction.to}>
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto px-8 py-3 text-base md:text-lg bg-background text-primary hover:bg-background/90 min-h-[52px]"
            >
              {primaryAction.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          {secondaryAction && (
            <Link to={secondaryAction.to}>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-3 text-base md:text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 min-h-[52px]"
              >
                {secondaryAction.label}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};
