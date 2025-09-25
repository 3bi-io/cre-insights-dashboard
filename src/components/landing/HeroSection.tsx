import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Star, Search } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-primary/5 bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
            🚀 Now with Advanced AI Analytics
          </Badge>
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-playfair font-bold text-foreground mb-6 leading-tight">
            Transform Your
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Hiring Process</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Revolutionize recruitment with AI-powered analytics, automated workflows, and comprehensive candidate tracking. 
            Find, evaluate, and hire top talent faster than ever before.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
                Start Free Trial
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
                Browse Jobs
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-3 text-lg border-primary text-primary hover:bg-primary/10"
            >
              <Play className="mr-2 h-5 w-5" />
              Launch Demo
            </Button>
          </div>
          
          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm">Rated 4.9/5</span>
            </div>
            <div className="text-sm">
              Trusted by Fortune 500 companies worldwide
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;