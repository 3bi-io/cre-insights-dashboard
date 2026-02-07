/**
 * Waveform Visualizer Component
 * Canvas-based audio frequency visualization with gradient bars
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface WaveformVisualizerProps {
  frequencyData: Uint8Array;
  isPlaying: boolean;
  className?: string;
  barColor?: string;
  glowColor?: string;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  frequencyData,
  isPlaying,
  className,
  barColor = 'hsl(220, 85%, 65%)',
  glowColor = 'hsl(260, 75%, 70%)',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { isMobile } = useResponsiveLayout();
  
  const barCount = isMobile ? 32 : 64;
  const barGap = isMobile ? 3 : 2;

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = (width - (barCount - 1) * barGap) / barCount;
    const maxBarHeight = height * 0.85;
    const minBarHeight = height * 0.08;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create gradient for bars
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, barColor);
    gradient.addColorStop(0.5, glowColor);
    gradient.addColorStop(1, 'hsl(200, 85%, 70%)');

    // Sample frequency data evenly across available bins
    const frequencyBinCount = frequencyData.length;
    const step = Math.max(1, Math.floor(frequencyBinCount / barCount));

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.min(i * step, frequencyBinCount - 1);
      const value = frequencyData[dataIndex] || 0;
      
      // Normalize and apply easing for smoother visual
      const normalizedValue = value / 255;
      const easedValue = Math.pow(normalizedValue, 0.8);
      
      // Calculate bar height with minimum
      let barHeight: number;
      if (isPlaying && normalizedValue > 0) {
        barHeight = minBarHeight + easedValue * (maxBarHeight - minBarHeight);
      } else {
        // Idle state: show subtle static bars
        barHeight = minBarHeight + Math.sin(i * 0.3) * (minBarHeight * 0.5);
      }

      const x = i * (barWidth + barGap);
      const y = (height - barHeight) / 2;

      // Draw bar with rounded corners
      ctx.beginPath();
      ctx.fillStyle = isPlaying ? gradient : 'hsl(220, 15%, 35%)';
      
      // Add glow effect when playing
      if (isPlaying && normalizedValue > 0.3) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8 * normalizedValue;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      
      // Rounded rectangle
      const radius = barWidth / 2;
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    }

    // Continue animation loop when playing
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(drawVisualizer);
    }
  }, [frequencyData, isPlaying, barCount, barGap, barColor, glowColor]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      drawVisualizer();
    };

    window.addEventListener('resize', handleResize);
    drawVisualizer();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawVisualizer]);

  // Redraw when playing state or frequency data changes
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    drawVisualizer();
  }, [isPlaying, frequencyData, drawVisualizer]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'w-full h-24 md:h-32 relative',
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
};

export default WaveformVisualizer;
