/**
 * User Type Selector
 * Mobile-optimized account type selection for signup flow
 */

import { Building2, Briefcase, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { cn } from '@/lib/utils';
import type { UserType } from '../hooks/useAuthForm';

interface UserTypeOption {
  type: UserType;
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
}

const userTypeOptions: UserTypeOption[] = [
  {
    type: 'organization',
    icon: Building2,
    title: 'Organization',
    description: 'Post jobs, manage applications, and hire top talent',
    features: ['Post unlimited job listings', 'Track applications', 'AI-powered candidate screening'],
  },
  {
    type: 'jobseeker',
    icon: Briefcase,
    title: 'Jobseeker',
    description: 'Find your next opportunity and track your applications',
    features: ['Search and apply for jobs', 'Track application status', 'Get job recommendations'],
  },
];

interface UserTypeSelectorProps {
  onSelect: (type: UserType) => void;
  onBack: () => void;
}

export function UserTypeSelector({ onSelect, onBack }: UserTypeSelectorProps) {
  const { isMobile } = useResponsiveLayout();

  return (
    <div className="space-y-4">
      {userTypeOptions.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onSelect(option.type)}
            className={cn(
              "w-full rounded-lg border-2 text-left transition-all",
              "hover:border-primary hover:bg-accent/50",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "touch-manipulation",
              // Mobile: larger touch targets and padding
              isMobile ? "p-4 min-h-[120px]" : "p-4"
            )}
          >
            <div className={cn(
              "flex gap-4",
              isMobile ? "flex-col items-start" : "items-start"
            )}>
              <div className={cn(
                "rounded-lg bg-primary/10 flex-shrink-0",
                isMobile ? "p-3" : "p-2"
              )}>
                <Icon className={cn(
                  "text-primary",
                  isMobile ? "w-7 h-7" : "w-6 h-6"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-semibold text-foreground",
                  isMobile ? "text-base" : "text-sm"
                )}>
                  {option.title}
                </h3>
                <p className={cn(
                  "text-muted-foreground mt-1",
                  isMobile ? "text-sm" : "text-xs"
                )}>
                  {option.description}
                </p>
                {/* Features - collapsed on mobile for cleaner look */}
                <ul className={cn(
                  "mt-3 space-y-1",
                  isMobile && "hidden sm:block"
                )}>
                  {option.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Check className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="truncate">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </button>
        );
      })}
      
      <Button
        type="button"
        variant="ghost"
        className="w-full min-h-[44px] touch-manipulation"
        onClick={onBack}
      >
        Already have an account? Sign in
      </Button>
    </div>
  );
}
