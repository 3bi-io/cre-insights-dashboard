/**
 * WeldingSparks Component
 * CSS-only realistic welding spark particles that animate from spark points
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SparkProps {
  style: React.CSSProperties;
  className?: string;
}

const Spark: React.FC<SparkProps> = ({ style, className }) => (
  <div
    className={cn('absolute rounded-full', className)}
    style={style}
  />
);

interface WeldingSparksProps {
  active: boolean;
  className?: string;
}

// Generate deterministic spark configs
const sparks = Array.from({ length: 28 }, (_, i) => {
  const angle = (i * 137.5) % 360; // golden angle distribution
  const speed = 0.6 + (i % 5) * 0.3;
  const size = i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5;
  const delay = (i * 0.12) % 2;
  const side = i < 14 ? 'left' : 'right';
  const dx = Math.cos((angle * Math.PI) / 180) * (40 + (i % 7) * 15);
  const dy = Math.sin((angle * Math.PI) / 180) * (30 + (i % 5) * 12) - 60; // bias upward
  const brightness = i % 4 === 0 ? 'bg-white' : i % 4 === 1 ? 'bg-blue-200' : i % 4 === 2 ? 'bg-orange-300' : 'bg-yellow-200';

  return { dx, dy, speed, size, delay, side, brightness };
});

export const WeldingSparks: React.FC<WeldingSparksProps> = ({ active, className }) => {
  if (!active) return null;

  return (
    <div className={cn('absolute inset-0 z-[3] pointer-events-none overflow-hidden', className)} aria-hidden="true">
      {/* Left welder spark source (~15% from left, ~85% from top) */}
      {sparks.filter(s => s.side === 'left').map((s, i) => (
        <Spark
          key={`l-${i}`}
          className={s.brightness}
          style={{
            left: '15%',
            top: '82%',
            width: s.size,
            height: s.size,
            boxShadow: `0 0 ${s.size * 2}px ${s.size}px rgba(255,200,100,0.6)`,
            animation: `spark-fly ${s.speed}s ease-out ${s.delay}s infinite`,
            '--spark-dx': `${s.dx}px`,
            '--spark-dy': `${s.dy}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Right welder spark source (~80% from left, ~90% from top) */}
      {sparks.filter(s => s.side === 'right').map((s, i) => (
        <Spark
          key={`r-${i}`}
          className={s.brightness}
          style={{
            left: '78%',
            top: '88%',
            width: s.size,
            height: s.size,
            boxShadow: `0 0 ${s.size * 2}px ${s.size}px rgba(255,200,100,0.6)`,
            animation: `spark-fly ${s.speed}s ease-out ${s.delay}s infinite`,
            '--spark-dx': `${s.dx}px`,
            '--spark-dy': `${s.dy}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Glow points at welding sources */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          left: '14%', top: '81%', width: 20, height: 20,
          background: 'radial-gradient(circle, rgba(180,220,255,0.8) 0%, rgba(100,160,255,0.3) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          left: '77%', top: '87%', width: 24, height: 24,
          background: 'radial-gradient(circle, rgba(180,220,255,0.9) 0%, rgba(100,160,255,0.3) 40%, transparent 70%)',
          animationDelay: '0.5s',
        }}
      />
    </div>
  );
};
