/**
 * Featured Product Card Component
 * Hero showcase for flagship features like Social Beacon
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Platform {
  name: string;
  icon: LucideIcon;
  color: string;
}

interface Stat {
  value: string;
  label: string;
}

interface Capability {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeaturedProductCardProps {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  platforms?: Platform[];
  stats?: Stat[];
  capabilities?: Capability[];
  cta: {
    primary: string;
    secondary?: string;
    path: string;
  };
  className?: string;
}

export const FeaturedProductCard = ({
  badge,
  title,
  subtitle,
  description,
  platforms,
  stats,
  capabilities,
  cta,
  className
}: FeaturedProductCardProps) => {
  const navigate = useNavigate();

  return (
    <section className={cn(
      'relative overflow-hidden',
      className
    )}>
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute inset-0 bg-grid-primary/5 bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
      
      {/* Floating accents */}
      <div className="absolute top-10 right-[10%] w-64 h-64 bg-primary/15 rounded-full blur-3xl motion-safe:animate-pulse" />
      <div className="absolute bottom-10 left-[10%] w-48 h-48 bg-accent/15 rounded-full blur-3xl motion-safe:animate-pulse delay-700" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 text-sm">
            ✨ {badge}
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-3">
            {title}
          </h2>
          <p className="text-xl md:text-2xl text-primary font-semibold mb-4">
            {subtitle}
          </p>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Platform Icons */}
        {platforms && platforms.length > 0 && (
          <div className="mb-10 md:mb-12">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {platforms.map((platform, index) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group flex flex-col items-center"
                >
                  <div 
                    className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-background border border-border shadow-sm 
                               flex items-center justify-center transition-all duration-300
                               group-hover:shadow-lg group-hover:scale-110 group-hover:border-primary/30"
                  >
                    <platform.icon 
                      className="h-7 w-7 md:h-8 md:w-8 transition-colors" 
                      style={{ color: platform.color }}
                    />
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {platform.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-12 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="text-2xl md:text-3xl font-bold text-primary font-playfair">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Capabilities Grid */}
        {capabilities && capabilities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-12 max-w-4xl mx-auto">
            {capabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-muted hover:border-primary/20 bg-background/80 backdrop-blur-sm">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <capability.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {capability.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {capability.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="text-base md:text-lg px-8 py-6 min-h-[52px]"
            onClick={() => navigate(cta.path)}
          >
            {cta.primary}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          {cta.secondary && (
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base md:text-lg px-8 py-6 min-h-[52px]"
              onClick={() => navigate('/contact')}
            >
              {cta.secondary}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductCard;
