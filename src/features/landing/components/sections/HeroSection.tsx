/**
 * Hero Section Component
 * Voice-first messaging with framer-motion animations and modern social proof
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Search, Quote } from 'lucide-react';
import { heroContent } from '../../content/hero.content';
import { HeroBackground } from '@/components/shared';
import voiceHero from '@/assets/hero/voice-hero.png';

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

const HeroSection = () => {
  return (
    <HeroBackground
      imageSrc={voiceHero}
      imageAlt="AI-powered voice technology with sound waves representing Voice Apply recruitment"
      overlayVariant="gradient"
      overlayOpacity={50}
      className="min-h-[90vh] md:min-h-screen flex items-center justify-center"
    >
      {/* Animated gradient blobs on top of hero image */}
      <div className="absolute inset-0 overflow-hidden z-[2] pointer-events-none">
        {/* Primary gradient blob - top left */}
        <div className="absolute -top-40 -left-40 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-primary/15 rounded-full blur-[100px] motion-safe:animate-[float_8s_ease-in-out_infinite]" />
        
        {/* Accent gradient blob - top right */}
        <div className="absolute -top-20 -right-20 w-60 sm:w-[400px] h-60 sm:h-[400px] bg-accent/10 rounded-full blur-[80px] motion-safe:animate-[float_10s_ease-in-out_infinite_reverse]" />
        
        {/* Secondary gradient blob - bottom center */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-secondary/8 rounded-full blur-[120px] motion-safe:animate-[float_12s_ease-in-out_infinite]" />
        
        {/* Success accent - bottom right */}
        <div className="absolute bottom-20 right-10 w-40 sm:w-64 h-40 sm:h-64 bg-success/8 rounded-full blur-[60px] motion-safe:animate-pulse" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 z-[3] bg-[linear-gradient(hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)] pointer-events-none" />
      
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto">
          {/* Badge with entrance animation */}
          <motion.div variants={itemVariants}>
            <Badge className="mb-4 md:mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors text-xs sm:text-sm">
              {heroContent.badge}
            </Badge>
          </motion.div>
          
          {/* Enhanced headline - larger typography */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-playfair font-bold text-foreground mb-4 md:mb-6 leading-tight"
          >
            {heroContent.headline}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {heroContent.headlineAccent}
            </span>
          </motion.h1>

          {/* Industry tags */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-2 mb-6 md:mb-8 px-2"
          >
            {heroContent.industryTags?.map((tag) => (
              <div 
                key={tag}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-success/10 rounded-full border border-success/20"
              >
                <span className="text-xs sm:text-sm font-medium text-success">
                  {tag}
                </span>
              </div>
            ))}
          </motion.div>
          
          {/* Subheadline */}
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-2 whitespace-pre-line"
          >
            {heroContent.subheadline}
          </motion.p>
          
          {/* Enhanced CTA Buttons with glow effects */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 md:mb-12 px-4"
          >
            <Link to="/jobs" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto min-h-[52px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground px-8 sm:px-10 py-4 text-base sm:text-lg font-semibold shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] transition-all duration-300"
              >
                <Search className="mr-2 h-5 w-5" />
                {heroContent.cta.secondary}
              </Button>
            </Link>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto min-h-[52px] px-8 sm:px-10 py-4 text-base sm:text-lg font-semibold border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-300"
              >
                {heroContent.cta.primary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
          
          {/* Company Logos Social Proof */}
          <motion.div 
            variants={itemVariants}
            className="mt-12 md:mt-16"
          >
            {/* Trusted by badge */}
            <p className="text-sm text-muted-foreground mb-6">
              {heroContent.socialProof.companies}
            </p>
            
            {/* Logo strip - grayscale with hover to color */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-8">
              {heroContent.socialProof.logos?.map((logo) => (
                <div 
                  key={logo.name}
                  className="group relative"
                >
                  <img 
                    src={logo.src} 
                    alt={logo.name}
                    className="h-8 md:h-10 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
            
            {/* Testimonial snippet */}
            {heroContent.socialProof.testimonial && (
              <div className="inline-flex items-center gap-3 bg-card/60 backdrop-blur-sm border border-border/50 rounded-full px-5 py-2.5">
                <Quote className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  "{heroContent.socialProof.testimonial.quote}"
                </span>
                <span className="text-xs text-muted-foreground">
                  — {heroContent.socialProof.testimonial.author}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </HeroBackground>
  );
};

export default HeroSection;
