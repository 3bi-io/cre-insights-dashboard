/**
 * Call-to-Action Section Component
 * Final conversion section with early adopter messaging
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { SectionWrapper } from '../shared/SectionWrapper';
import { StatCard } from '../shared/StatCard';
import { CTABlock } from '../shared/CTABlock';
import { ctaContent } from '../../content/cta.content';

const CTASection = () => {
  return (
    <SectionWrapper variant="gradient" containerClassName="max-w-4xl text-center">
      <Badge className="mb-6 text-sm px-4 py-2">
        <Zap className="h-4 w-4 mr-2" />
        {ctaContent.badge}
      </Badge>

      <h2 className="text-4xl md:text-5xl font-bold mb-6">
        {ctaContent.title}
      </h2>
      
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        {ctaContent.description}
      </p>

      <div className="mb-12">
        <CTABlock
          primaryText={ctaContent.cta.primary}
          primaryPath="/auth"
          secondaryText={ctaContent.cta.secondary}
          secondaryPath="/demo"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
        {ctaContent.stats.map((stat, index) => (
          <StatCard key={index} value={stat.value} label={stat.label} />
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          {ctaContent.footer}
        </p>
      </div>
    </SectionWrapper>
  );
};

export default CTASection;
