import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const steps = [
  { label: 'Personal', shortLabel: '1' },
  { label: 'CDL', shortLabel: '2' },
  { label: 'Background', shortLabel: '3' },
  { label: 'Consent', shortLabel: '4' },
];

export const FormProgressIndicator = ({ currentStep, totalSteps = 4 }: FormProgressIndicatorProps) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          
          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <span className="sm:hidden">{step.shortLabel}</span>
                  )}
                  <span className="hidden sm:inline">{stepNumber}</span>
                </div>
                <span className={cn(
                  "mt-1 text-xs sm:text-sm font-medium",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      currentStep > stepNumber + 1 ? "bg-primary" : 
                      currentStep > stepNumber ? "bg-primary/50" : "bg-muted"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
