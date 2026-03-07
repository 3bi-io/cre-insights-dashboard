/**
 * Audio Visualizer Component
 * Real-time frequency bar visualization for ElevenLabs voice conversations
 * Uses getInputByteFrequencyData / getOutputByteFrequencyData from the SDK
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  getInputFrequencyData: () => Uint8Array | undefined;
  getOutputFrequencyData: () => Uint8Array | undefined;
  isSpeaking: boolean;
  isConnected: boolean;
  className?: string;
}

const BAR_COUNT = 24;
const BAR_GAP = 3;

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  getInputFrequencyData,
  getOutputFrequencyData,
  isSpeaking,
  isConnected,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = (width - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;
    const maxBarHeight = height * 0.85;
    const minBarHeight = height * 0.06;

    ctx.clearRect(0, 0, width, height);

    // Get frequency data — output when agent speaks, input when user speaks
    const freqData = isSpeaking
      ? getOutputFrequencyData()
      : getInputFrequencyData();

    const binCount = freqData?.length || 0;
    const step = Math.max(1, Math.floor(binCount / BAR_COUNT));

    // Gradient: primary → accent tones using CSS custom properties
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'hsl(var(--primary))');
    gradient.addColorStop(0.6, 'hsl(var(--primary) / 0.7)');
    gradient.addColorStop(1, 'hsl(var(--accent))');

    const idleColor = 'hsl(var(--muted-foreground) / 0.25)';

    for (let i = 0; i < BAR_COUNT; i++) {
      const dataIndex = Math.min(i * step, binCount - 1);
      const value = freqData?.[dataIndex] ?? 0;
      const normalised = value / 255;
      const eased = Math.pow(normalised, 0.75);

      let barHeight: number;
      if (isConnected && normalised > 0.01) {
        barHeight = minBarHeight + eased * (maxBarHeight - minBarHeight);
      } else {
        // Idle breathing animation
        barHeight =
          minBarHeight +
          Math.sin(Date.now() / 600 + i * 0.4) * minBarHeight * 0.6;
      }

      const x = i * (barWidth + BAR_GAP);
      const y = (height - barHeight) / 2;

      ctx.beginPath();
      ctx.fillStyle = isConnected && normalised > 0.01 ? gradient : idleColor;

      // Glow when active
      if (isConnected && normalised > 0.3) {
        ctx.shadowColor = 'hsl(var(--primary) / 0.4)';
        ctx.shadowBlur = 6 * normalised;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      const radius = barWidth / 2;
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [getInputFrequencyData, getOutputFrequencyData, isSpeaking, isConnected]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className={cn('w-full h-28 sm:h-36', className)}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
};
