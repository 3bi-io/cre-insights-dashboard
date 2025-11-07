/**
 * Features Section Component
 * Displays key product features
 */

import React from 'react';
import { SectionWrapper } from '../shared/SectionWrapper';
import { SectionHeader } from '../shared/SectionHeader';
import { IconFeatureCard } from '../shared/IconFeatureCard';
import { featuresContent } from '../../content/features.content';

const FeaturesSection = () => {
  return (
    <SectionWrapper id="features">
      <SectionHeader 
        title={featuresContent.title}
        description={featuresContent.description}
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
  );
};

export default FeaturesSection;
