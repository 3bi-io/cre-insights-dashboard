/**
 * TruckWheelSpin Component
 * CSS-only spinning wheel overlays positioned on truck hero images
 * Creates the illusion of a driving truck with rolling wheels
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface WheelProps {
  left: string;
  top: string;
  size: number;
  className?: string;
}

const Wheel: React.FC<WheelProps> = ({ left, top, size, className }) => (
  <div
    className={cn('absolute', className)}
    style={{ left, top, width: size, height: size, transform: 'translate(-50%, -50%)' }}
  >
    {/* Outer tire ring */}
    <div
      className="absolute inset-0 rounded-full motion-safe:animate-[wheel-roll_2.5s_linear_infinite]"
      style={{
        background: `conic-gradient(
          from 0deg,
          rgba(40,40,40,0.7) 0deg, rgba(60,60,60,0.5) 15deg,
          rgba(40,40,40,0.7) 30deg, rgba(60,60,60,0.5) 45deg,
          rgba(40,40,40,0.7) 60deg, rgba(60,60,60,0.5) 75deg,
          rgba(40,40,40,0.7) 90deg, rgba(60,60,60,0.5) 105deg,
          rgba(40,40,40,0.7) 120deg, rgba(60,60,60,0.5) 135deg,
          rgba(40,40,40,0.7) 150deg, rgba(60,60,60,0.5) 165deg,
          rgba(40,40,40,0.7) 180deg, rgba(60,60,60,0.5) 195deg,
          rgba(40,40,40,0.7) 210deg, rgba(60,60,60,0.5) 225deg,
          rgba(40,40,40,0.7) 240deg, rgba(60,60,60,0.5) 255deg,
          rgba(40,40,40,0.7) 270deg, rgba(60,60,60,0.5) 285deg,
          rgba(40,40,40,0.7) 300deg, rgba(60,60,60,0.5) 315deg,
          rgba(40,40,40,0.7) 330deg, rgba(60,60,60,0.5) 345deg,
          rgba(40,40,40,0.7) 360deg
        )`,
        border: '2px solid rgba(30,30,30,0.6)',
      }}
    />
    {/* Inner hub with spokes */}
    <div
      className="absolute rounded-full motion-safe:animate-[wheel-roll_2.5s_linear_infinite]"
      style={{
        inset: '25%',
        background: `conic-gradient(
          from 0deg,
          rgba(120,120,120,0.6) 0deg, transparent 20deg,
          transparent 50deg, rgba(120,120,120,0.6) 60deg,
          transparent 80deg, transparent 110deg,
          rgba(120,120,120,0.6) 120deg, transparent 140deg,
          transparent 170deg, rgba(120,120,120,0.6) 180deg,
          transparent 200deg, transparent 230deg,
          rgba(120,120,120,0.6) 240deg, transparent 260deg,
          transparent 290deg, rgba(120,120,120,0.6) 300deg,
          transparent 320deg, transparent 350deg,
          rgba(120,120,120,0.6) 360deg
        )`,
        border: '1px solid rgba(80,80,80,0.5)',
      }}
    />
    {/* Center hub cap */}
    <div
      className="absolute rounded-full"
      style={{
        inset: '38%',
        background: 'radial-gradient(circle, rgba(100,100,100,0.7) 0%, rgba(60,60,60,0.6) 100%)',
      }}
    />
    {/* Ground shadow */}
    <div
      className="absolute"
      style={{
        left: '-10%',
        right: '-10%',
        bottom: '-15%',
        height: '20%',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
        filter: 'blur(3px)',
      }}
    />
  </div>
);

interface TruckWheelSpinProps {
  active: boolean;
  className?: string;
}

export const TruckWheelSpin: React.FC<TruckWheelSpinProps> = ({ active, className }) => {
  if (!active) return null;

  return (
    <div className={cn('absolute inset-0 z-[3] pointer-events-none overflow-hidden', className)} aria-hidden="true">
      {/* Front wheel */}
      <Wheel left="25%" top="88%" size={48} />
      {/* Rear wheel */}
      <Wheel left="65%" top="88%" size={48} />

      {/* Road motion blur strip */}
      <div
        className="absolute left-0 right-0 motion-safe:animate-[road-blur_1.5s_linear_infinite]"
        style={{
          bottom: '2%',
          height: '6%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(200,200,200,0.08) 20%, transparent 40%, rgba(200,200,200,0.06) 60%, transparent 80%, rgba(200,200,200,0.08) 100%)',
          filter: 'blur(2px)',
        }}
      />
    </div>
  );
};
