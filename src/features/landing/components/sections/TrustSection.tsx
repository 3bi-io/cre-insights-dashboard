/**
 * Trust Section Component
 * Displays trust indicators and pilot program stats
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper } from '../shared/SectionWrapper';
import { StatCard } from '../shared/StatCard';
import { trustContent } from '../../content/trust.content';

const TrustSection = () => {
  return (
    <SectionWrapper variant="muted" className="py-16">
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
          {trustContent.badge}
        </Badge>
        <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-4">
          {trustContent.title}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {trustContent.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {trustContent.stats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            description={stat.description}
          />
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          {trustContent.footer}
        </p>
      </div>
    </SectionWrapper>
  );
};

export default TrustSection;
