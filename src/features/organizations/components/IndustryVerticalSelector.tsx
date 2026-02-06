import React from 'react';
import { cn } from '@/lib/utils';
import { Truck, HeartPulse, Shield, Wrench, Building, Check } from 'lucide-react';
import { IndustryVertical } from '../types/industryTemplates.types';
import { INDUSTRY_VERTICAL_OPTIONS } from '../config/industryTemplates.config';

interface IndustryVerticalSelectorProps {
  value: IndustryVertical;
  onChange: (value: IndustryVertical) => void;
  disabled?: boolean;
  compact?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck,
  HeartPulse,
  Shield,
  Wrench,
  Building,
};

export const IndustryVerticalSelector = ({
  value,
  onChange,
  disabled = false,
  compact = false,
}: IndustryVerticalSelectorProps) => {
  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
      {INDUSTRY_VERTICAL_OPTIONS.map((option) => {
        const Icon = iconMap[option.icon] || Building;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex flex-col items-start p-4 rounded-lg border-2 text-left transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card',
              disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-card'
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-primary" />
              </div>
            )}
            
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg mb-3',
              isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              <Icon className="h-5 w-5" />
            </div>

            <h3 className="font-semibold text-foreground">{option.label}</h3>
            
            {!compact && (
              <>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {option.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {option.features.slice(0, 2).map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                  {option.features.length > 2 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                      +{option.features.length - 2} more
                    </span>
                  )}
                </div>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};
