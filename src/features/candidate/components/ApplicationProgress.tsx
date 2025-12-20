import React from 'react';
import { Check, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
}

interface ApplicationProgressProps {
  status: string;
}

const getStepsForStatus = (status: string): Step[] => {
  const steps: Step[] = [
    { id: 'submitted', label: 'Submitted', status: 'upcoming' },
    { id: 'reviewed', label: 'Reviewed', status: 'upcoming' },
    { id: 'interview', label: 'Interview', status: 'upcoming' },
    { id: 'decision', label: 'Decision', status: 'upcoming' },
  ];

  const statusMap: Record<string, number> = {
    pending: 0,
    reviewed: 1,
    interview_scheduled: 2,
    offer_extended: 3,
    hired: 3,
    rejected: 3,
    withdrawn: -1,
  };

  const currentIndex = statusMap[status] ?? 0;

  return steps.map((step, index) => ({
    ...step,
    status: status === 'withdrawn' 
      ? 'upcoming' 
      : index < currentIndex 
        ? 'completed' 
        : index === currentIndex 
          ? 'current' 
          : 'upcoming',
  }));
};

export const ApplicationProgress: React.FC<ApplicationProgressProps> = ({ status }) => {
  const steps = getStepsForStatus(status);

  if (status === 'withdrawn') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Circle className="h-4 w-4" />
        <span>Application withdrawn</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                step.status === 'completed' && 'border-primary bg-primary text-primary-foreground',
                step.status === 'current' && 'border-primary text-primary',
                step.status === 'upcoming' && 'border-muted-foreground/30 text-muted-foreground/30'
              )}
            >
              {step.status === 'completed' ? (
                <Check className="h-4 w-4" />
              ) : step.status === 'current' ? (
                <Clock className="h-4 w-4" />
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>
            <span
              className={cn(
                'text-xs mt-1 whitespace-nowrap',
                step.status === 'completed' && 'text-primary',
                step.status === 'current' && 'text-primary font-medium',
                step.status === 'upcoming' && 'text-muted-foreground/50'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-8 -mt-4',
                step.status === 'completed' ? 'bg-primary' : 'bg-muted-foreground/20'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
