import { useState, useCallback } from 'react';

export interface StepConfig {
  id: number;
  label: string;
  shortLabel: string;
  icon?: string;
}

export const WIZARD_STEPS: StepConfig[] = [
  { id: 1, label: 'Personal', shortLabel: '1' },
  { id: 2, label: 'CDL', shortLabel: '2' },
  { id: 3, label: 'Background', shortLabel: '3' },
  { id: 4, label: 'Consent', shortLabel: '4' },
];

interface UseStepWizardProps {
  totalSteps?: number;
  onStepChange?: (step: number) => void;
}

interface StepValidation {
  isValid: boolean;
  message?: string;
}

export const useStepWizard = ({ totalSteps = 4, onStepChange }: UseStepWizardProps = {}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showCelebration, setShowCelebration] = useState(false);

  const goToStep = useCallback((step: number) => {
    if (step < 1 || step > totalSteps) return;
    
    // Only allow going to completed steps or the next available step
    const maxAllowedStep = Math.max(...Array.from(completedSteps), 0) + 1;
    if (step > maxAllowedStep) return;
    
    setDirection(step > activeStep ? 'forward' : 'backward');
    setActiveStep(step);
    onStepChange?.(step);
  }, [activeStep, completedSteps, totalSteps, onStepChange]);

  const nextStep = useCallback(() => {
    if (activeStep >= totalSteps) return;
    
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, activeStep]));
    
    // Show celebration briefly
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1500);
    
    setDirection('forward');
    setActiveStep(prev => prev + 1);
    onStepChange?.(activeStep + 1);
  }, [activeStep, totalSteps, onStepChange]);

  const prevStep = useCallback(() => {
    if (activeStep <= 1) return;
    
    setDirection('backward');
    setActiveStep(prev => prev - 1);
    onStepChange?.(activeStep - 1);
  }, [activeStep, onStepChange]);

  const isStepCompleted = useCallback((step: number) => {
    return completedSteps.has(step);
  }, [completedSteps]);

  const canGoToStep = useCallback((step: number) => {
    if (step <= 1) return true;
    const maxAllowedStep = Math.max(...Array.from(completedSteps), 0) + 1;
    return step <= maxAllowedStep;
  }, [completedSteps]);

  const isFirstStep = activeStep === 1;
  const isLastStep = activeStep === totalSteps;
  const progress = ((activeStep - 1) / (totalSteps - 1)) * 100;

  return {
    activeStep,
    setActiveStep,
    completedSteps,
    direction,
    showCelebration,
    goToStep,
    nextStep,
    prevStep,
    isStepCompleted,
    canGoToStep,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps,
  };
};
