import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepNavigationProps {
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  canProceed?: boolean;
  currentStep?: number;
  className?: string;
}

export const StepNavigation = ({
  onBack,
  onNext,
  onSubmit,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  canProceed = true,
  currentStep = 1,
  className,
}: StepNavigationProps) => {
  return (
    <div className={cn("space-y-3 pt-6", className)}>
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
