import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isOptional?: boolean;
}

interface FormWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  children: React.ReactNode;
  className?: string;
  showProgress?: boolean;
  showStepIndicator?: boolean;
  allowSkip?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  skipLabel?: string;
  canProceed?: boolean;
}

export const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  children,
  className,
  showProgress = true,
  showStepIndicator = true,
  allowSkip = false,
  isSubmitting = false,
  submitLabel = 'Submit',
  nextLabel = 'Next',
  backLabel = 'Back',
  skipLabel = 'Skip',
  canProceed = true,
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (!isLastStep && currentStepData?.isOptional) {
      onStepChange(currentStep + 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on previous steps or current step
    if (stepIndex <= currentStep) {
      onStepChange(stepIndex);
    }
  };

  return (
    <div className={cn('flex flex-col space-y-6', className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step Indicator */}
      {showStepIndicator && (
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isClickable = index <= currentStep;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Circle */}
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-200',
                      isCompleted && 'border-primary bg-primary text-primary-foreground',
                      isCurrent && 'border-primary bg-background text-primary ring-2 ring-primary ring-offset-2',
                      !isCompleted && !isCurrent && 'border-muted-foreground/30 bg-muted text-muted-foreground',
                      isClickable && 'cursor-pointer hover:border-primary/70',
                      !isClickable && 'cursor-not-allowed'
                    )}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : step.icon ? (
                      step.icon
                    ) : (
                      index + 1
                    )}
                  </button>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 w-8 transition-colors duration-200',
                        index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Title and Description */}
      {currentStepData && (
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {currentStepData.title}
            {currentStepData.isOptional && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (Optional)
              </span>
            )}
          </h2>
          {currentStepData.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {currentStepData.description}
            </p>
          )}
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1">{children}</div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep || isSubmitting}
          className="min-w-[100px]"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>

        <div className="flex items-center gap-2">
          {allowSkip && currentStepData?.isOptional && !isLastStep && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              {skipLabel}
            </Button>
          )}

          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="min-w-[100px]"
          >
            {isLastStep ? (
              isSubmitting ? (
                'Processing...'
              ) : (
                submitLabel
              )
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to manage wizard state
 */
export function useFormWizard(totalSteps: number, initialStep = 0) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());

  const goToStep = React.useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      // Mark current step as completed when moving forward
      if (step > currentStep) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
      }
      setCurrentStep(step);
    }
  }, [currentStep, totalSteps]);

  const goNext = React.useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const goBack = React.useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const reset = React.useCallback(() => {
    setCurrentStep(initialStep);
    setCompletedSteps(new Set());
  }, [initialStep]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return {
    currentStep,
    setCurrentStep: goToStep,
    goNext,
    goBack,
    reset,
    isFirstStep,
    isLastStep,
    progress,
    completedSteps,
    isStepCompleted: (step: number) => completedSteps.has(step),
  };
}

export default FormWizard;
