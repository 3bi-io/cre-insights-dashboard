import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepCompletionFeedbackProps {
  show: boolean;
  stepNumber: number;
  className?: string;
}

const CELEBRATION_MESSAGES = [
  { message: "Great start! 🚀", subtext: "You're on your way" },
  { message: "Looking good! 💪", subtext: "Keep going" },
  { message: "Almost there! 🎯", subtext: "One more step" },
  { message: "Perfect! ✨", subtext: "Ready to submit" },
];

export const StepCompletionFeedback = ({ 
  show, 
  stepNumber,
  className 
}: StepCompletionFeedbackProps) => {
  if (!show) return null;

  const celebration = CELEBRATION_MESSAGES[stepNumber - 1] || CELEBRATION_MESSAGES[0];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center pointer-events-none",
        "animate-in fade-in duration-200",
        className
      )}
    >
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <CheckCircle2 className="h-12 w-12 text-primary animate-in zoom-in-50 duration-500" />
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground">{celebration.message}</p>
            <p className="text-sm text-muted-foreground">{celebration.subtext}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
