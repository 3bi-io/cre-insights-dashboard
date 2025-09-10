/**
 * About Page Component
 * Company information, mission, and team
 */

import React from 'react';
import HeroSection from '@/components/about/HeroSection';
import MissionSection from '@/components/about/MissionSection';
import ValuesSection from '@/components/about/ValuesSection';
import TimelineSection from '@/components/about/TimelineSection';
import AboutCTASection from '@/components/about/AboutCTASection';

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <MissionSection />
      <ValuesSection />
      <TimelineSection />
      <AboutCTASection />
    </div>
  );
};

export default AboutPage;