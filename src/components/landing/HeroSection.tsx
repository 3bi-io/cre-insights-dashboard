/**
 * Hero Section Component (Legacy)
 * Voice-first messaging with animated gradients
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Search, Phone, Star } from 'lucide-react';
import VoiceWorkflowIllustration from '@/components/landing/VoiceWorkflowIllustration';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-primary/20 rounded-full blur-[100px] motion-safe:animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -top-20 -right-20 w-60 sm:w-[400px] h-60 sm:h-[400px] bg-accent/15 rounded-full blur-[80px] motion-safe:animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-secondary/10 rounded-full blur-[120px] motion-safe:animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 right-10 w-40 sm:w-64 h-40 sm:h-64 bg-success/10 rounded-full blur-[60px] motion-safe:animate-pulse" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,hsl(var(--background)/0.5)_70%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
            🚀 Now with Advanced AI Analytics
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-playfair font-bold text-foreground mb-6 leading-tight">
            Transform Your
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Hiring Process</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Revolutionize recruitment with AI-powered analytics, automated workflows, and comprehensive jobseeker tracking. 
            Find, evaluate, and hire top talent faster than ever before.
          </p>

          {/* Voice callback highlight */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full border border-success/20">
              <Phone className="h-4 w-4 text-success motion-safe:animate-pulse" />
              <span className="text-sm font-medium text-success">
                AI calls back jobseekers automatically
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/jobs">
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-3 text-lg border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
              >
                <Search className="mr-2 h-5 w-5" />
                Browse Jobs
              </Button>
            </Link>
          </div>

          {/* Voice Workflow Illustration */}
          <VoiceWorkflowIllustration />

          {/* Social proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-muted-foreground mt-12">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm">4.9/5 Rating</span>
            </div>
            <div className="text-sm">Trusted by 500+ Companies</div>
            <div className="text-sm font-medium text-primary">Free Trial Available</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
