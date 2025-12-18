/**
 * Hero Section Component
 * Voice-first messaging with mobile optimization
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, Search, Phone } from 'lucide-react';
import heroImage2400 from '@/assets/hero-recruitment-2400.webp';
import heroImage1200 from '@/assets/hero-recruitment-1200.webp';
import heroImage600 from '@/assets/hero-recruitment-600.webp';
import { heroContent } from '../../content/hero.content';

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Image Background */}
      <div className="absolute inset-0 w-full h-full">
        <picture>
          <source 
            media="(min-width: 1024px)" 
            srcSet={heroImage2400}
            type="image/webp" 
          />
          <source 
            media="(min-width: 640px)" 
            srcSet={heroImage1200}
            type="image/webp" 
          />
          <img
            src={heroImage600}
            alt="Modern recruitment platform with AI-powered analytics dashboard showing candidate pipelines and hiring metrics"
            className="w-full h-full object-cover object-center"
            loading="eager"
            width="2400"
            height="1600"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
      </div>

      {/* Background Effects - reduced on mobile for performance */}
      <div className="absolute inset-0 bg-grid-primary/5 bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] z-[1]"></div>
      <div className="absolute top-20 left-10 md:left-20 w-48 md:w-72 h-48 md:h-72 bg-primary/10 rounded-full blur-2xl md:blur-3xl motion-safe:animate-pulse z-[1]"></div>
      <div className="absolute bottom-20 right-10 md:right-20 w-64 md:w-96 h-64 md:h-96 bg-accent/10 rounded-full blur-2xl md:blur-3xl motion-safe:animate-pulse delay-1000 z-[1]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-4 md:mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors text-xs sm:text-sm">
            {heroContent.badge}
          </Badge>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-playfair font-bold text-foreground mb-4 md:mb-6 leading-tight">
            {heroContent.headline}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {heroContent.headlineAccent}
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
            {heroContent.subheadline}
          </p>

          {/* Voice callback highlight */}
          <div className="flex items-center justify-center gap-2 mb-6 md:mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <Phone className="h-4 w-4 text-primary motion-safe:animate-pulse" />
              <span className="text-sm font-medium text-primary">
                {heroContent.voiceHighlight?.text || 'AI calls back candidates automatically'}
              </span>
            </div>
          </div>
          
          {/* CTA Buttons - proper touch targets */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 md:mb-12 px-4">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto min-h-[48px] bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 text-base sm:text-lg"
              >
                {heroContent.cta.primary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/jobs" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3 text-base sm:text-lg border-primary text-primary hover:bg-primary/10"
              >
                <Search className="mr-2 h-5 w-5" />
                {heroContent.cta.secondary}
              </Button>
            </Link>
          </div>
          
          {/* Social proof - responsive layout */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-muted-foreground px-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm">{heroContent.socialProof.rating}</span>
            </div>
            <div className="text-sm">{heroContent.socialProof.companies}</div>
            <div className="text-sm font-medium text-primary">{heroContent.socialProof.pricing}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
