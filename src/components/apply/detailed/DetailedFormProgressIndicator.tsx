import React from 'react';
import { Check, User, MapPin, Truck, Briefcase, Shield, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailedFormProgressIndicatorProps {
  activeStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  canGoToStep?: (step: number) => boolean;
}

const steps = [
  { label: 'Personal', shortLabel: '1', icon: User },
  { label: 'Contact', shortLabel: '2', icon: MapPin },
  { label: 'CDL', shortLabel: '3', icon: Truck },
  { label: 'Experience', shortLabel: '4', icon: Briefcase },
  { label: 'Background', shortLabel: '5', icon: Shield },
  { label: 'Consent', shortLabel: '6', icon: FileCheck },
];

export const DetailedFormProgressIndicator = ({ 
  activeStep,
  completedSteps,
  onStepClick,
  canGoToStep,
}: DetailedFormProgressIndicatorProps) => {
  const handleStepClick = (stepNumber: number) => {
    if (canGoToStep?.(stepNumber) && onStepClick) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="mb-6 sm:mb-8">
      {/* Mobile: Compact progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">
            Step {activeStep} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps[activeStep - 1]?.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((activeStep) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index + 1 <= activeStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Compact step indicators for 6 steps */}
      <div className="hidden sm:block">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = completedSteps.has(stepNumber);
            const isActive = activeStep === stepNumber;
            const isClickable = canGoToStep?.(stepNumber) ?? false;
            const StepIcon = step.icon;
            
            return (
              <React.Fragment key={step.label}>
                <button
                  type="button"
                  onClick={() => handleStepClick(stepNumber)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-center group transition-all duration-200",
                    isClickable && "cursor-pointer hover:scale-105",
                    !isClickable && "cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                      isCompleted && "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                      isActive && !isCompleted && "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg",
                      !isCompleted && !isActive && "bg-muted text-muted-foreground",
                      isClickable && !isActive && "group-hover:ring-2 group-hover:ring-primary/30"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 animate-in zoom-in-50 duration-300" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={cn(
                    "mt-1.5 text-xs font-medium transition-colors",
                    (isCompleted || isActive) ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </button>
                
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        isCompleted ? "bg-primary w-full" : "bg-transparent w-0"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
