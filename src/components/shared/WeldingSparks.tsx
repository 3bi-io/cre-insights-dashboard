/**
 * WeldingSparks Component
 * GPU-optimized welding spark particles with responsive sizing,
 * mobile-first particle reduction, and prefers-reduced-motion support.
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SparkProps {
  style: React.CSSProperties;
  className?: string;
}

const Spark: React.FC<SparkProps> = ({ style, className }) => (
  <div
    className={cn('absolute rounded-full will-change-transform', className)}
    style={style}
  />
);

interface WeldingSparksProps {
  active: boolean;
  className?: string;
}

// Generate deterministic spark configs
const generateSparks = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const angle = (i * 137.5) % 360; // golden angle distribution
    const speed = 0.6 + (i % 5) * 0.3;
    const size = i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5;
    const delay = (i * 0.12) % 2;
    const side = i < Math.ceil(count / 2) ? 'left' : 'right';
    const dx = Math.cos((angle * Math.PI) / 180) * (40 + (i % 7) * 15);
    const dy = Math.sin((angle * Math.PI) / 180) * (30 + (i % 5) * 12) - 60;
    const brightness =
      i % 4 === 0 ? 'bg-white' :
      i % 4 === 1 ? 'bg-blue-200' :
      i % 4 === 2 ? 'bg-orange-300' : 'bg-yellow-200';

    return { dx, dy, speed, size, delay, side, brightness };
  });

const DESKTOP_SPARKS = generateSparks(28);
const MOBILE_SPARKS = generateSparks(12);

// Responsive source positions (mobile images crop differently)
const sourcePositions = {
  desktop: { left: { x: '15%', y: '82%' }, right: { x: '78%', y: '88%' } },
  mobile: { left: { x: '12%', y: '80%' }, right: { x: '82%', y: '86%' } },
};

export const WeldingSparks: React.FC<WeldingSparksProps> = ({ active, className }) => {
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();

  const sparks = useMemo(() => (isMobile ? MOBILE_SPARKS : DESKTOP_SPARKS), [isMobile]);
  const positions = isMobile ? sourcePositions.mobile : sourcePositions.desktop;

  if (!active) return null;

  // Reduced motion: show only static glow indicators
  if (reducedMotion) {
    return (
      <div className={cn('absolute inset-0 z-[3] pointer-events-none', className)} aria-hidden="true">
        <div
          className="absolute rounded-full"
          style={{
            left: positions.left.x, top: positions.left.y, width: 20, height: 20,
            background: 'radial-gradient(circle, rgba(180,220,255,0.8) 0%, rgba(100,160,255,0.3) 40%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: positions.right.x, top: positions.right.y, width: 24, height: 24,
            background: 'radial-gradient(circle, rgba(180,220,255,0.9) 0%, rgba(100,160,255,0.3) 40%, transparent 70%)',
          }}
        />
      </div>
    );
  }

  // Scale factor for responsive particle sizing
  const sizeScale = isMobile ? 0.8 : 1;

  return (
    <div
      className={cn('absolute inset-0 z-[3] pointer-events-none overflow-hidden', className)}
      style={{ contain: 'layout style' }}
      aria-hidden="true"
    >
      {/* Left welder sparks */}
      {sparks.filter(s => s.side === 'left').map((s, i) => (
        <Spark
          key={`l-${i}`}
          className={s.brightness}
          style={{
            left: positions.left.x,
            top: positions.left.y,
            width: s.size * sizeScale,
            height: s.size * sizeScale,
            background: `radial-gradient(circle, currentColor 40%, transparent 70%)`,
            animation: `spark-fly ${s.speed}s ease-out ${s.delay}s infinite`,
            '--spark-dx': `${s.dx}px`,
            '--spark-dy': `${s.dy}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Right welder sparks */}
      {sparks.filter(s => s.side === 'right').map((s, i) => (
        <Spark
          key={`r-${i}`}
          className={s.brightness}
          style={{
            left: positions.right.x,
            top: positions.right.y,
            width: s.size * sizeScale,
            height: s.size * sizeScale,
            background: `radial-gradient(circle, currentColor 40%, transparent 70%)`,
            animation: `spark-fly ${s.speed}s ease-out ${s.delay}s infinite`,
            '--spark-dx': `${s.dx}px`,
            '--spark-dy': `${s.dy}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Static glow points at welding sources */}
      <div
        className="absolute rounded-full opacity-80"
        style={{
          left: positions.left.x, top: positions.left.y,
          width: isMobile ? 16 : 20, height: isMobile ? 16 : 20,
          background: 'radial-gradient(circle, rgba(180,220,255,0.8) 0%, rgba(100,160,255,0.3) 40%, transparent 70%)',
          animation: 'spark-fly 2s ease-in-out infinite alternate',
          '--spark-dx': '0px', '--spark-dy': '0px',
        } as React.CSSProperties}
      />
      <div
        className="absolute rounded-full opacity-80"
        style={{
          left: positions.right.x, top: positions.right.y,
          width: isMobile ? 18 : 24, height: isMobile ? 18 : 24,
          background: 'radial-gradient(circle, rgba(180,220,255,0.9) 0%, rgba(100,160,255,0.3) 40%, transparent 70%)',
          animation: 'spark-fly 2s ease-in-out 0.5s infinite alternate',
          '--spark-dx': '0px', '--spark-dy': '0px',
        } as React.CSSProperties}
      />
    </div>
  );
};
