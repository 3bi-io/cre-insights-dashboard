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
import { WeldingSparks } from '@/components/shared/WeldingSparks';
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
  const [activeSlide, setActiveSlide] = React.useState(0);

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

  const { data: jobCount = 0 } = useQuery({
    queryKey: ['public-job-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('job_listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('is_hidden.eq.false,is_hidden.is.null');
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
      enableParallaxOrbs={true}
      onSlideChange={setActiveSlide}
      overlayContent={<WeldingSparks active={activeSlide === 2} />}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20"
      >
        {/* Badge - compact, high contrast */}
        <motion.span
          variants={itemVariants}
          className="inline-block text-xs sm:text-sm font-semibold text-black bg-white rounded-full px-4 py-1.5 mb-6 shadow-lg"
        >
          {heroContent.badge}
        </motion.span>

        {/* Headline - impactful with gradient accent */}
        <motion.h1
          variants={itemVariants}
          className="text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-foreground mb-6 leading-[1.1] tracking-tight"
        >
          {heroContent.headline}
          <span className="text-white">
            {heroContent.headlineAccent}
          </span>
        </motion.h1>

        {/* Subheadline - clear value prop above the fold */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl md:text-2xl text-white font-medium mb-8 max-w-2xl leading-relaxed whitespace-pre-line bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl"
        >
          {heroContent.subheadline}
        </motion.p>

        {/* CTA Buttons - primary action first, prominent */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 items-start mb-10"
        >
          <Link to="/jobs" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto min-h-[56px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground px-10 py-5 text-lg font-bold shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] hover:scale-105 transition-all duration-300"
            >
              <Search className="mr-2 h-5 w-5" />
              {heroContent.cta.primary}
            </Button>
          </Link>
          <Link to="/auth" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-h-[56px] px-10 py-5 text-lg font-bold border-2 border-primary bg-white text-primary hover:bg-primary/10 hover:scale-105 transition-all duration-300 shadow-lg"
            >
              {heroContent.cta.secondary}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Trust signals - compact row */}
        <motion.div 
          variants={itemVariants} 
          className="flex flex-col items-start gap-3"
        >
          {/* Dynamic company count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center text-sm lg:text-base text-black font-semibold bg-white rounded-full px-5 py-2 shadow-lg">
              <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
              {companyCount.toLocaleString()} Companies Hiring
            </span>
            <span className="inline-flex items-center text-sm lg:text-base text-black font-semibold bg-white rounded-full px-5 py-2 shadow-lg">
              <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
              {jobCount.toLocaleString()} Jobs Available
            </span>
          </div>
          
          {/* Industry tags - always below company count */}
          <motion.div
            variants={tagContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto scrollbar-hide pb-1"
          >
            {heroContent.industryTags?.map((tag, index) => (
              <motion.span
                key={tag}
                variants={tagVariants}
                custom={index}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-black rounded-full border border-white hover:bg-black/80 transition-colors"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </HeroBackground>
  );
};

export default HeroSection;
