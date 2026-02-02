/**
 * Hero Section Component
 * Voice-first messaging with animated gradients and workflow illustration
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, Search } from 'lucide-react';
import { heroContent } from '../../content/hero.content';
import { howItWorksContent } from '../../content/howitworks.content';

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient blob - top left */}
        <div className="absolute -top-40 -left-40 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-primary/20 rounded-full blur-[100px] motion-safe:animate-[float_8s_ease-in-out_infinite]" />
        
        {/* Accent gradient blob - top right */}
        <div className="absolute -top-20 -right-20 w-60 sm:w-[400px] h-60 sm:h-[400px] bg-accent/15 rounded-full blur-[80px] motion-safe:animate-[float_10s_ease-in-out_infinite_reverse]" />
        
        {/* Secondary gradient blob - bottom center */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-secondary/10 rounded-full blur-[120px] motion-safe:animate-[float_12s_ease-in-out_infinite]" />
        
        {/* Success accent - bottom right */}
        <div className="absolute bottom-20 right-10 w-40 sm:w-64 h-40 sm:h-64 bg-success/10 rounded-full blur-[60px] motion-safe:animate-pulse" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)]" />

      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,hsl(var(--background)/0.5)_70%)]" />
      
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

          {/* Industry tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 md:mb-8 px-2">
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
          </div>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-2 whitespace-pre-line">
            {heroContent.subheadline}
          </p>
          
          {/* CTA Buttons - proper touch targets */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 md:mb-12 px-4">
            <Link to="/jobs" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto min-h-[48px] bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Search className="mr-2 h-5 w-5" />
                {heroContent.cta.secondary}
              </Button>
            </Link>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3 text-base sm:text-lg border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
              >
                {heroContent.cta.primary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* How It Works - Two Rows: Jobseeker & Employer */}
          <div className="mb-8 md:mb-12">
            <div className="text-center mb-6">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm sm:text-base px-4 py-1.5">
                {howItWorksContent.badge}
              </Badge>
            </div>
            
            {/* Employer Row */}
            <div className="mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-muted-foreground mb-3 text-center">
                {howItWorksContent.employerTitle}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
                {howItWorksContent.employerSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div 
                      key={index}
                      className="relative bg-card/80 backdrop-blur-sm border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex justify-center mb-2 mt-1">
                        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-accent" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">{step.title}</h3>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Jobseeker Row */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-muted-foreground mb-3 text-center">
                {howItWorksContent.jobseekerTitle}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
                {howItWorksContent.jobseekerSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div 
                      key={index}
                      className="relative bg-card/80 backdrop-blur-sm border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex justify-center mb-2 mt-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">{step.title}</h3>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Social proof - responsive layout */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-muted-foreground px-4 mt-12">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs sm:text-sm">{heroContent.socialProof.rating}</span>
            </div>
            <div className="text-xs sm:text-sm">{heroContent.socialProof.companies}</div>
            <div className="text-xs sm:text-sm font-medium text-primary">{heroContent.socialProof.highlight}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
