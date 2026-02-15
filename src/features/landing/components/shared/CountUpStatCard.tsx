/**
 * CountUpStatCard - Animated stat card with count-up on viewport entry
 * Supports numeric values with prefixes/suffixes and non-numeric display values
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { motion } from 'framer-motion';

interface CountUpStatCardProps {
  value: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
  className?: string;
  delay?: number;
}

/**
 * Parse stat strings like "95%", "< 3 min", "24/7", "48 Hours"
 * Returns numeric value + prefix/suffix for animation, or null if non-numeric
 */
function parseStatValue(value: string): { end: number; prefix: string; suffix: string; decimals: number } | null {
  // Match patterns like "95%", "3.5x", "< 3", "48"
  const match = value.match(/^([^0-9]*?)\s*(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;
  
  const prefix = match[1].trim();
  const num = parseFloat(match[2]);
  const suffix = match[3].trim();
  const decimals = match[2].includes('.') ? match[2].split('.')[1].length : 0;
  
  return { end: num, prefix: prefix ? prefix + ' ' : '', suffix: suffix ? ' ' + suffix : '', decimals };
}

export const CountUpStatCard = ({ 
  value, 
  label, 
  icon: Icon, 
  description,
  className,
  delay = 0
}: CountUpStatCardProps) => {
  const parsed = parseStatValue(value);
  
  // Use count-up for numeric values
  const countUp = parsed
    ? useCountUp({ end: parsed.end, prefix: parsed.prefix, suffix: parsed.suffix, decimals: parsed.decimals, delay })
    : null;

  return (
    <motion.div
      ref={countUp?.ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: delay / 1000, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group',
        className
      )}
    >
      {/* Subtle gradient background on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {Icon && (
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="text-3xl md:text-4xl font-bold text-primary mb-2 font-playfair tabular-nums">
          {countUp ? countUp.value : value}
        </div>
        <div className={cn(
          'text-muted-foreground font-medium',
          description && 'text-foreground mb-1'
        )}>
          {label}
        </div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
    </motion.div>
  );
};
