/**
 * Features Section Component
 * Displays key product features
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper } from '../shared/SectionWrapper';
import { SectionHeader } from '../shared/SectionHeader';
import { IconFeatureCard } from '../shared/IconFeatureCard';
import { featuresContent } from '../../content/features.content';
import { trustContent } from '../../content/trust.content';

const FeaturesSection = () => {
  return (
    <section id="features">
      <SectionWrapper>
        <SectionHeader 
          title={featuresContent.title}
          description={featuresContent.description}
          badge={
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {trustContent.badge}
            </Badge>
          }
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresContent.features.map((feature, index) => (
            <IconFeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </SectionWrapper>
    </section>
  );
};

export default FeaturesSection;
