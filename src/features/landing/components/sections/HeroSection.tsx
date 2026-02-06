/**
 * Hero Section Component
 * Clean, focused hero with entrance animations and minimal social proof
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Search, Zap, Users } from 'lucide-react';
import { heroContent } from '../../content/hero.content';
import { HeroBackground } from '@/components/shared';
import voiceHero from '@/assets/hero/voice-hero.png';
import cyberHero from '@/assets/hero/cyber-hero.png';
import tradesHero from '@/assets/hero/trades-hero.png';
import healthcareHero from '@/assets/hero/healthcare-hero.png';

// Animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

const HeroSection = () => {
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
      {/* Subtle animated gradient accent */}
      <div className="absolute inset-0 overflow-hidden z-[2] pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 sm:w-[400px] h-80 sm:h-[400px] bg-primary/10 rounded-full blur-[100px] motion-safe:animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 right-0 w-80 sm:w-[400px] h-80 sm:h-[400px] bg-accent/8 rounded-full blur-[100px] motion-safe:animate-[float_10s_ease-in-out_infinite_reverse]" />
      </div>
      
      <motion.div 
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <Badge className="mb-4 md:mb-6 bg-white text-black border-white/20 hover:bg-white/90 transition-colors text-xs sm:text-sm font-semibold">
            {heroContent.badge}
          </Badge>
        </motion.div>
        
        {/* Headline */}
        <motion.h1 
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-playfair font-bold text-foreground mb-4 md:mb-6 leading-[1.1]"
        >
          {heroContent.headline}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {heroContent.headlineAccent}
          </span>
        </motion.h1>

        {/* Industry tags */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-2 mb-6 md:mb-8"
        >
          {heroContent.industryTags?.map((tag) => (
            <span 
              key={tag}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-black bg-white rounded-full border border-white/20"
            >
              {tag}
            </span>
          ))}
        </motion.div>
        
        {/* Subheadline */}
        <motion.p 
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-white font-medium mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed whitespace-pre-line bg-black/50 backdrop-blur-sm rounded-xl px-6 py-4"
        >
          {heroContent.subheadline}
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-10 md:mb-14"
        >
          <Link to="/jobs" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-auto min-h-[52px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground px-8 sm:px-10 py-4 text-base sm:text-lg font-semibold shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)] transition-all duration-300"
            >
              <Search className="mr-2 h-5 w-5" />
              {heroContent.cta.secondary}
            </Button>
          </Link>
          <Link to="/auth" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto min-h-[52px] px-8 sm:px-10 py-4 text-base sm:text-lg font-semibold border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
            >
              {heroContent.cta.primary}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
        
        {/* Minimal Social Proof */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-8"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{heroContent.socialProof.companies}</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">{heroContent.socialProof.highlight}</span>
          </div>
        </motion.div>
      </motion.div>
    </HeroBackground>
  );
};

export default HeroSection;
