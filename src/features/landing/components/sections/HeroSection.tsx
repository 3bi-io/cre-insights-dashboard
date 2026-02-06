/**
 * Hero Section Component
 * Clean, left-aligned hero matching Jobs page style with white pill badges
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search } from 'lucide-react';
import { heroContent } from '../../content/hero.content';
import { HeroBackground } from '@/components/shared';
import { supabase } from '@/integrations/supabase/client';
import voiceHero from '@/assets/hero/voice-hero.png';
import cyberHero from '@/assets/hero/cyber-hero.png';
import tradesHero from '@/assets/hero/trades-hero.png';
import healthcareHero from '@/assets/hero/healthcare-hero.png';

const HeroSection = () => {
  const { data: companyCount = 0 } = useQuery({
    queryKey: ['public-company-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('public_client_info')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <HeroBackground
      imageSrc={voiceHero}
      imageAlt="AI-powered voice technology with sound waves representing Voice Apply recruitment"
      slideshowImages={[cyberHero, tradesHero, healthcareHero]}
      slideshowInterval={6000}
      variant="full"
      overlayVariant="gradient"
      overlayOpacity={60}
    >
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Badge */}
        <span className="inline-block text-xs sm:text-sm font-semibold text-black bg-white rounded-full px-4 py-1.5 mb-4 md:mb-6">
          {heroContent.badge}
        </span>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-playfair font-bold text-black mb-4 md:mb-6 leading-[1.1]">
          {heroContent.headline}
          <span className="text-white">
            {heroContent.headlineAccent}
          </span>
        </h1>

        {/* Industry tags */}
        <div className="flex flex-wrap items-start gap-2 mb-4 md:mb-6">
          {heroContent.industryTags?.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-black bg-white rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Subheadline */}
        <p className="text-base sm:text-lg md:text-xl text-white font-medium mb-6 md:mb-8 max-w-2xl leading-relaxed whitespace-pre-line bg-black/50 backdrop-blur-sm rounded-xl px-6 py-4">
          {heroContent.subheadline}
        </p>

        {/* Dynamic company count */}
        <div className="mb-6 md:mb-8">
          <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2">
            {companyCount.toLocaleString()} Companies Enrolled
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start mb-10 md:mb-14">
          <Link to="/jobs">
            <Button
              size="lg"
              className="min-h-[52px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground px-8 sm:px-10 py-4 text-base sm:text-lg font-semibold shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)] transition-all duration-300"
            >
              <Search className="mr-2 h-5 w-5" />
              {heroContent.cta.primary}
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              variant="outline"
              size="lg"
              className="min-h-[52px] px-8 sm:px-10 py-4 text-base sm:text-lg font-semibold border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
            >
              {heroContent.cta.secondary}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </HeroBackground>
  );
};

export default HeroSection;
