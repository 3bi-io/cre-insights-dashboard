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

// Bright spark colors as solid hex values for visibility
const SPARK_COLORS = ['#ffffff', '#c8e0ff', '#ffb366', '#fff4b3'];

// Generate deterministic spark configs
const generateSparks = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const angle = (i * 137.5) % 360;
    const speed = 0.6 + (i % 5) * 0.3;
    const size = i % 3 === 0 ? 8 : i % 3 === 1 ? 6 : 4;
    const delay = (i * 0.12) % 2;
    const side = i < Math.ceil(count / 2) ? 'left' : 'right';
    const dx = Math.cos((angle * Math.PI) / 180) * (60 + (i % 7) * 20);
    const dy = Math.sin((angle * Math.PI) / 180) * (50 + (i % 5) * 18) - 60;
    const color = SPARK_COLORS[i % 4];

    return { dx, dy, speed, size, delay, side, color };
  });

const DESKTOP_SPARKS = generateSparks(28);
const MOBILE_SPARKS = generateSparks(12);

// Responsive source positions calibrated to actual torch arc points
const sourcePositions = {
  desktop: { left: { x: '4%', y: '91%' }, right: { x: '76%', y: '93%' } },
  mobile: { left: { x: '2%', y: '89%' }, right: { x: '78%', y: '91%' } },
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
            left: positions.left.x, top: positions.left.y, width: 30, height: 30,
            background: 'radial-gradient(circle, rgba(200,230,255,0.95) 0%, rgba(100,160,255,0.4) 40%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: positions.right.x, top: positions.right.y, width: 34, height: 34,
            background: 'radial-gradient(circle, rgba(200,230,255,0.95) 0%, rgba(100,160,255,0.4) 40%, transparent 70%)',
          }}
        />
      </div>
    );
  }

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
          style={{
            left: positions.left.x,
            top: positions.left.y,
            width: s.size * sizeScale,
            height: s.size * sizeScale,
            backgroundColor: s.color,
            borderRadius: '50%',
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
          style={{
            left: positions.right.x,
            top: positions.right.y,
            width: s.size * sizeScale,
            height: s.size * sizeScale,
            backgroundColor: s.color,
            borderRadius: '50%',
            animation: `spark-fly ${s.speed}s ease-out ${s.delay}s infinite`,
            '--spark-dx': `${s.dx}px`,
            '--spark-dy': `${s.dy}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Static glow points at welding sources */}
      <div
        className="absolute rounded-full opacity-90"
        style={{
          left: positions.left.x, top: positions.left.y,
          width: isMobile ? 28 : 36, height: isMobile ? 28 : 36,
          background: 'radial-gradient(circle, rgba(200,230,255,0.95) 0%, rgba(100,160,255,0.4) 40%, transparent 70%)',
          animation: 'spark-fly 2s ease-in-out infinite alternate',
          '--spark-dx': '0px', '--spark-dy': '0px',
        } as React.CSSProperties}
      />
      <div
        className="absolute rounded-full opacity-90"
        style={{
          left: positions.right.x, top: positions.right.y,
          width: isMobile ? 32 : 40, height: isMobile ? 32 : 40,
          background: 'radial-gradient(circle, rgba(200,230,255,0.95) 0%, rgba(100,160,255,0.4) 40%, transparent 70%)',
          animation: 'spark-fly 2s ease-in-out 0.5s infinite alternate',
          '--spark-dx': '0px', '--spark-dy': '0px',
        } as React.CSSProperties}
      />
    </div>
  );
};
