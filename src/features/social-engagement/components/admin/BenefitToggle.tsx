import React from 'react';
import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  Home, 
  Truck, 
  Heart, 
  PawPrint, 
  Package, 
  GraduationCap, 
  Shield,
  Users,
  Wallet,
  Gift,
  HeartPulse,
  type LucideIcon
} from 'lucide-react';

// Icon mapping for benefits
const BENEFIT_ICONS: Record<string, LucideIcon> = {
  DollarSign,
  Home,
  Truck,
  Heart,
  PawPrint,
  Package,
  GraduationCap,
  Shield,
  Users,
  Wallet,
  Gift,
  HeartPulse,
};

interface BenefitToggleProps {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function BenefitToggle({
  id,
  label,
  icon,
  selected,
  onToggle,
  disabled = false,
}: BenefitToggleProps) {
  const IconComponent = BENEFIT_ICONS[icon] || Shield;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
        'text-sm font-medium cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        selected
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-pressed={selected}
      aria-label={`${label} ${selected ? 'selected' : 'not selected'}`}
    >
      <IconComponent className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

interface BenefitToggleGroupProps {
  benefits: Array<{ id: string; label: string; icon: string }>;
  selectedBenefits: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

export function BenefitToggleGroup({
  benefits,
  selectedBenefits,
  onToggle,
  disabled = false,
  className,
}: BenefitToggleGroupProps) {
  return (
    <div 
      className={cn('grid grid-cols-2 gap-2', className)}
      role="group"
      aria-label="Select job benefits"
    >
      {benefits.map((benefit) => (
        <BenefitToggle
          key={benefit.id}
          id={benefit.id}
          label={benefit.label}
          icon={benefit.icon}
          selected={selectedBenefits.includes(benefit.id)}
          onToggle={() => onToggle(benefit.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
