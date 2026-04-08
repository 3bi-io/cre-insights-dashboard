/**
 * Hero Section Component
 * Premium homepage hero with curated map backdrop — mobile-first, conversion-oriented
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

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
    <section className="relative w-full h-[100svh] min-h-[600px] max-h-[900px] sm:max-h-[1000px] lg:max-h-[1100px] overflow-hidden">
      {/* Map backdrop — heroMode suppresses all labels/popups/controls */}
      <div className="absolute inset-0 z-0">
        <MapProvider>
          <Suspense
            fallback={
              <div className="w-full h-full bg-muted" />
            }
          >
            <JobMap
              locations={locations}
              selectedLocation={null}
              onLocationSelect={handleLocationSelect}
              showMarkers={true}
              showHeatMap={false}
              autoFitBounds={false}
              interactive={false}
              heroMode={true}
            />
          </Suspense>
        </MapProvider>
      </div>

      {/* Gradient overlays for readability — stronger at bottom for CTA area */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Hero content — anchored to bottom-center on mobile, center on desktop */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full h-full flex flex-col justify-end sm:justify-center pb-12 sm:pb-0"
      >
        <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 lg:px-10">
          {/* Badge */}
          <motion.span
            variants={itemVariants}
            className="inline-flex items-center text-xs font-semibold tracking-wide uppercase text-primary-foreground bg-primary/90 backdrop-blur-sm rounded-full px-3.5 py-1.5 mb-5 sm:mb-6 shadow-md"
          >
            {heroContent.badge}
          </motion.span>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-playfair font-bold leading-[1.08] tracking-tight mb-4 sm:mb-5"
          >
            <span
              className="text-white"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
            >
              {heroContent.headline}
            </span>
            <span
              className="text-cyan-300"
              style={{ textShadow: '0 0 24px rgba(103,232,249,0.4), 0 2px 12px rgba(0,0,0,0.4)' }}
            >
              {heroContent.headlineAccent}
            </span>
          </motion.h1>

          {/* Subheadline — concise on mobile */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-white/90 font-medium mb-8 sm:mb-9 max-w-xl leading-relaxed"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
          >
            {heroContent.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10"
          >
            <Link to="/jobs" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto min-h-[52px] bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-base font-bold shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)] hover:scale-[1.02] transition-all duration-200"
              >
                <Search className="mr-2 h-4.5 w-4.5" />
                {heroContent.cta.primary}
              </Button>
            </Link>
            <Link to="/demo" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-h-[52px] px-8 py-4 text-base font-bold border-white/25 bg-white/10 hover:bg-white/20 backdrop-blur-sm hover:scale-[1.02] transition-all duration-200 shadow-lg text-white"
              >
                Book a Demo
                <ArrowRight className="ml-2 h-4.5 w-4.5" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust signals — compact row */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <span className="inline-flex items-center text-xs sm:text-sm text-white font-medium bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 border border-white/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse" />
              {companyCount.toLocaleString()} Companies
            </span>
            <span className="inline-flex items-center text-xs sm:text-sm text-white font-medium bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 border border-white/20">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2 animate-pulse" />
              {jobCount.toLocaleString()} Jobs
            </span>
            {heroContent.industryTags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="hidden sm:inline-flex items-center text-xs text-white/70 bg-white/8 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
