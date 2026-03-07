/**
 * Standardized hero section for public pages
 * Implements the compact hero pattern from HERO_VISUAL_CONSISTENCY_GUIDE.md
 */

import React from 'react';
import { HeroBackground } from './HeroBackground';

interface PublicPageHeroProps {
  imageSrc: string;
  imageAlt: string;
  badge?: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  /** Override default overlay settings */
  overlayVariant?: 'dark' | 'gradient';
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export const PublicPageHero = ({
  imageSrc,
  imageAlt,
  badge,
  title,
  titleAccent,
  subtitle,
  overlayVariant = 'dark',
  overlayOpacity = 65,
  children,
}: PublicPageHeroProps) => {
  return (
    <HeroBackground
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      variant="compact"
      overlayVariant={overlayVariant}
      overlayOpacity={overlayOpacity}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          {badge && (
            <span className="inline-block text-xs sm:text-sm font-semibold text-black bg-white rounded-full px-4 py-1.5 mb-4 md:mb-6">
              {badge}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 lg:mb-4 text-foreground">
            {title}
            {titleAccent && <span className="text-white"> {titleAccent}</span>}
          </h1>
          <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2">
            {subtitle}
          </span>
          {children}
        </div>
      </div>
    </HeroBackground>
  );
};
