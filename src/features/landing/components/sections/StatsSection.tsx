/**
 * Stats Section Component
 * Animated count-up stats with dot-grid background pattern
 */

import React from 'react';
import { SectionWrapper } from '../shared/SectionWrapper';
import { CountUpStatCard } from '../shared/CountUpStatCard';
import { statsContent } from '../../content/stats.content';
import { Clock, Bot, PhoneCall, Rocket } from 'lucide-react';

const statIcons = [Clock, Bot, PhoneCall, Rocket];

const StatsSection = () => {
  return (
    <SectionWrapper variant="default" className="py-14 md:py-20 bg-dot-pattern relative">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statsContent.map((stat, index) => (
          <CountUpStatCard
            key={index}
            value={stat.number}
            label={stat.label}
            icon={statIcons[index]}
            delay={index * 150}
          />
        ))}
      </div>
    </SectionWrapper>
  );
};

export default StatsSection;
