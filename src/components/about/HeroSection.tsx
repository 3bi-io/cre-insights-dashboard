import React from 'react';
import { Badge } from '@/components/ui/badge';

const HeroSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            🚀 Our Story
          </Badge>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6">
            Transforming Hiring for
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> the Future</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to make hiring more intelligent, efficient, and fair for organizations 
            and candidates worldwide. Powered by AI, driven by human insight.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;