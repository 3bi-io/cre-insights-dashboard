/**
 * Hero Section Component
 * Main landing page hero with responsive background
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, Search } from 'lucide-react';
import heroImage2400 from '@/assets/hero-recruitment-2400.webp';
import heroImage1200 from '@/assets/hero-recruitment-1200.webp';
import heroImage600 from '@/assets/hero-recruitment-600.webp';
import { heroContent } from '../../content/hero.content';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-primary/5 bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] z-[1]"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse z-[1]"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000 z-[1]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
            {heroContent.badge}
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-playfair font-bold text-foreground mb-6 leading-tight">
            {heroContent.headline}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {heroContent.headlineAccent}
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            {heroContent.subheadline}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
                {heroContent.cta.primary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/jobs">
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-3 text-lg border-primary text-primary hover:bg-primary/10"
              >
                <Search className="mr-2 h-5 w-5" />
                {heroContent.cta.secondary}
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm">{heroContent.socialProof.rating}</span>
            </div>
            <div className="text-sm">{heroContent.socialProof.companies}</div>
            <div className="text-sm">{heroContent.socialProof.pricing}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
