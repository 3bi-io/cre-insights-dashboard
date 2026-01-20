import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Send, Loader2, FastForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepNavigationProps {
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onSkipToSubmit?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  canProceed?: boolean;
  canSkipToSubmit?: boolean;
  currentStep?: number;
  className?: string;
}

export const StepNavigation = ({
  onBack,
  onNext,
  onSubmit,
  onSkipToSubmit,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  canProceed = true,
  canSkipToSubmit = false,
  currentStep = 1,
  className,
}: StepNavigationProps) => {
  // Show skip option after completing step 1 (essentials) but before final step
  const showSkipOption = canSkipToSubmit && currentStep === 1 && !isLastStep && onSkipToSubmit;

  return (
    <div className={cn("space-y-3 pt-6", className)}>
      {/* Skip to Submit option - shown after step 1 */}
      {showSkipOption && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkipToSubmit}
            disabled={isSubmitting}
            className="text-sm text-muted-foreground hover:text-primary gap-1.5"
          >
            <FastForward className="h-3.5 w-3.5" />
            Skip optional steps & submit now
          </Button>
        </div>
      )}

      {/* Main navigation buttons */}
      <div
        className={cn(
          "flex items-center gap-3",
          isFirstStep ? "justify-end" : "justify-between"
        )}
      >
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="h-12 px-6 text-base font-medium gap-2 touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !canProceed}
            className="h-12 px-8 text-base font-medium gap-2 touch-manipulation bg-primary hover:bg-primary/90 min-w-[180px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <Send className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="h-12 px-8 text-base font-medium gap-2 touch-manipulation min-w-[140px]"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
