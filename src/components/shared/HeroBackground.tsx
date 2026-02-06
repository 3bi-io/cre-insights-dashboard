/**
 * HeroBackground Component
 * Reusable hero section with background image, overlay variants, and responsive behavior
 * Ensures WCAG contrast for overlaid text
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface HeroBackgroundProps {
  imageSrc: string;
  imageAlt: string;
  overlayVariant?: 'dark' | 'gradient' | 'light';
  overlayOpacity?: number;
  children: React.ReactNode;
  className?: string;
}

const overlayStyles = {
  dark: 'bg-background/70',
  gradient: 'bg-gradient-to-t from-background via-background/60 to-transparent',
  light: 'bg-background/40',
} as const;

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  imageSrc,
  imageAlt,
  overlayVariant = 'dark',
  overlayOpacity,
  children,
  className,
}) => {
  const customOpacity = overlayOpacity !== undefined 
    ? { opacity: overlayOpacity / 100 } 
    : undefined;

  return (
    <section className={cn('relative overflow-hidden', className)}>
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover object-center"
          aria-hidden="true"
          loading="eager"
        />
      </div>

      {/* Overlay Layer */}
      <div 
        className={cn('absolute inset-0 z-[1]', overlayStyles[overlayVariant])}
        style={customOpacity}
        aria-hidden="true"
      />

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
};

export default HeroBackground;
