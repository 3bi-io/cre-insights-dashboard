/**
 * Hero Section Component
 * Interactive job map as a visual backdrop with overlay headline, CTAs, and trust signals
 */

import React, { lazy, Suspense, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search, Loader2 } from 'lucide-react';
import { heroContent } from '../../content/hero.content';
import { supabase } from '@/integrations/supabase/client';
import { useJobMapData, type MapLocation } from '@/hooks/useJobMapData';
import { MapProvider } from '@/components/map/MapContext';

const JobMap = lazy(() => import('@/components/map/JobMap'));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
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
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

/** Noop handler for non-interactive map */
const noop = () => {};

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

  const { locations } = useJobMapData();

  const handleLocationSelect = useCallback((_loc: MapLocation | null) => {}, []);

  return (
    <section className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden">
      {/* Map backdrop */}
      <div className="absolute inset-0 z-0">
        <MapProvider>
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <JobMap
              locations={locations}
              selectedLocation={null}
              onLocationSelect={handleLocationSelect}
              showMarkers={true}
              showHeatMap={false}
              autoFitBounds={true}
              interactive={false}
            />
          </Suspense>
        </MapProvider>
      </div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/60 pointer-events-none" />

      {/* Hero content overlay */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.span
            variants={itemVariants}
            className="inline-block text-xs sm:text-sm font-semibold text-black bg-white rounded-full px-4 py-1.5 mb-6 shadow-lg"
          >
            {heroContent.badge}
          </motion.span>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-playfair font-bold mb-6 leading-[1.05] tracking-tight"
          >
            <span
              className="text-white"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)' }}
            >
              {heroContent.headline}
            </span>
            <span
              className="text-cyan-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
              style={{ textShadow: '0 0 20px rgba(103,232,249,0.5), 0 2px 8px rgba(0,0,0,0.5)' }}
            >
              {heroContent.headlineAccent}
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl md:text-2xl text-white font-medium mb-10 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)' }}
          >
            {heroContent.subheadline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-10"
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
            <Link to="/demo" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-h-[56px] px-10 py-5 text-lg font-bold border-2 border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-lg text-white"
              >
                Book a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center text-sm lg:text-base text-black font-semibold bg-white rounded-full px-5 py-2 shadow-lg">
                <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
                {companyCount.toLocaleString()} Companies Hiring
              </span>
              <span className="inline-flex items-center text-sm lg:text-base text-black font-semibold bg-white rounded-full px-5 py-2 shadow-lg">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
                {jobCount.toLocaleString()} Jobs Available
              </span>
            </div>

            <motion.div
              variants={tagContainerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-nowrap sm:flex-wrap items-center justify-center gap-2 overflow-x-auto scrollbar-hide pb-1"
            >
              {heroContent.industryTags?.map((tag, index) => (
                <motion.span
                  key={tag}
                  variants={tagVariants}
                  custom={index}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-white/15 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/25 transition-colors"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
