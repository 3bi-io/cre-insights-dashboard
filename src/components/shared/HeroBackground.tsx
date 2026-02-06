/**
 * HeroBackground Component
 * Reusable hero section with background image, overlay variants, and GPU-accelerated rendering
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type OverlayVariant = 'dark' | 'gradient' | 'light';

interface HeroBackgroundProps {
  imageSrc: string;
  imageAlt: string;
  overlayVariant?: OverlayVariant;
  className?: string;
  children: React.ReactNode;
  /** Additional overlay classes for fine-tuning */
  overlayClassName?: string;
  /** Minimum height - defaults to min-h-[50vh] md:min-h-[60vh] */
  minHeight?: string;
}

const overlayStyles: Record<OverlayVariant, string> = {
  dark: 'bg-black/50',
  gradient: 'bg-gradient-to-b from-black/60 via-black/30 to-background',
  light: 'bg-black/30',
};

const additionalOverlays: Record<OverlayVariant, string> = {
  dark: 'bg-gradient-to-b from-black/40 via-black/20 to-transparent',
  gradient: '', // gradient variant already has the gradient built in
  light: 'bg-gradient-to-t from-background via-transparent to-black/20',
};

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  imageSrc,
  imageAlt,
  overlayVariant = 'dark',
  className,
  children,
  overlayClassName,
  minHeight = 'min-h-[50vh] md:min-h-[60vh]',
}) => {
  return (
    <section
      className={cn(
        'relative overflow-hidden flex items-center justify-center',
        minHeight,
        className
      )}
      role="img"
      aria-label={imageAlt}
    >
      {/* Background Image with lazy loading and GPU acceleration */}
      <img
        src={imageSrc}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Primary Overlay */}
      <div
        className={cn(
          'absolute inset-0',
          overlayStyles[overlayVariant],
          overlayClassName
        )}
        aria-hidden="true"
      />

      {/* Secondary gradient overlay for additional depth */}
      {additionalOverlays[overlayVariant] && (
        <div
          className={cn('absolute inset-0', additionalOverlays[overlayVariant])}
          aria-hidden="true"
        />
      )}

      {/* Content container */}
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
};

export default HeroBackground;
