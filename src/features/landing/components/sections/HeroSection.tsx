/**
 * Hero Section Component
 * Clean, left-aligned hero matching Jobs page style with white pill badges
 * Enhanced with Ken Burns effect and staggered Framer Motion animations
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search } from 'lucide-react';
import { heroContent } from '../../content/hero.content';
import { HeroBackground } from '@/components/shared';
import { supabase } from '@/integrations/supabase/client';
import voiceHero from '@/assets/hero/voice-hero.png';
import cyberHero from '@/assets/hero/cyber-hero.png';
import tradesHero from '@/assets/hero/trades-hero.png';
import healthcareHero from '@/assets/hero/healthcare-hero.png';

// Animation variants for staggered content reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const tagContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const tagVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

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
      enableKenBurns={true}
      enableParallaxOrbs={true}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Badge */}
        <motion.span
          variants={itemVariants}
          className="inline-block text-xs sm:text-sm font-semibold text-black bg-white rounded-full px-4 py-1.5 mb-4 md:mb-6"
        >
          {heroContent.badge}
        </motion.span>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-playfair font-bold text-foreground mb-4 md:mb-6 leading-[1.1]"
        >
          {heroContent.headline}
          <span className="text-white">
            {heroContent.headlineAccent}
          </span>
        </motion.h1>

        {/* Industry tags */}
        <motion.div
          variants={tagContainerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-start gap-2 mb-4 md:mb-6"
        >
          {heroContent.industryTags?.map((tag) => (
            <motion.span
              key={tag}
              variants={tagVariants}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-black bg-white rounded-full"
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-white font-medium mb-6 md:mb-8 max-w-2xl leading-relaxed whitespace-pre-line bg-black/50 backdrop-blur-sm rounded-xl px-6 py-4"
        >
          {heroContent.subheadline}
        </motion.p>

        {/* Dynamic company count */}
        <motion.div variants={itemVariants} className="mb-6 md:mb-8">
          <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2">
            {companyCount.toLocaleString()} Companies Enrolled
          </span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start mb-10 md:mb-14"
        >
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
        </motion.div>
      </motion.div>
    </HeroBackground>
  );
};

export default HeroSection;
