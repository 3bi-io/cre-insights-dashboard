/**
 * Stats Section Component
 * Displays key statistics with 4-column layout
 */

import React from 'react';
import { SectionWrapper } from '../shared/SectionWrapper';
import { StatCard } from '../shared/StatCard';
import { statsContent } from '../../content/stats.content';

const StatsSection = () => {
  return (
    <SectionWrapper variant="muted" className="py-12 md:py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {statsContent.map((stat, index) => (
          <StatCard key={index} value={stat.number} label={stat.label} />
        ))}
      </div>
    </SectionWrapper>
  );
};

export default StatsSection;
