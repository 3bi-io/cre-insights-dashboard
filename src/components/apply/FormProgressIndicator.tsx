import React from 'react';
import { Check, User, Truck, Shield, FileCheck, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormProgressIndicatorProps {
  currentStep: number;
  activeStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  canGoToStep?: (step: number) => boolean;
  industryVertical?: string | null;
}

const CDL_STEPS = [
  { label: 'Personal', icon: User },
  { label: 'CDL', icon: Truck },
  { label: 'Background', icon: Shield },
];

const TECH_STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Skills', icon: Code },
  { label: 'Background', icon: Shield },
];

const consentStep = { label: 'Consent', icon: FileCheck };

function isTechVertical(v: string | null | undefined): boolean {
  if (!v) return false;
  return ['cyber', 'tech', 'general'].includes(v.toLowerCase());
}

export const FormProgressIndicator = ({ 
  currentStep, 
  activeStep,
  completedSteps,
  onStepClick,
  canGoToStep,
  industryVertical,
}: FormProgressIndicatorProps) => {
  const baseSteps = isTechVertical(industryVertical) ? TECH_STEPS : CDL_STEPS;
  const steps = [...baseSteps, consentStep];
  const handleStepClick = (stepNumber: number) => {
    if (canGoToStep?.(stepNumber) && onStepClick) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="mb-8">
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
            style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
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

      {/* Desktop: Full step indicators */}
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
                      "w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                      isCompleted && "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                      isActive && !isCompleted && "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg",
                      !isCompleted && !isActive && "bg-muted text-muted-foreground",
                      isClickable && !isActive && "group-hover:ring-2 group-hover:ring-primary/30"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 animate-in zoom-in-50 duration-300" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn(
                    "mt-2 text-sm font-medium transition-colors",
                    (isCompleted || isActive) ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </button>
                
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4 h-1 rounded-full overflow-hidden bg-muted">
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
