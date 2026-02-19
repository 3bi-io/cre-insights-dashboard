import React, { useCallback, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Globe } from 'lucide-react';
import { useStepWizard } from '@/hooks/useStepWizard';
import { PersonalInfoSection } from './PersonalInfoSection';
import { CDLInfoSection } from './CDLInfoSection';
import { BackgroundInfoSection } from './BackgroundInfoSection';
import { ConsentSection } from './ConsentSection';
import { FormProgressIndicator } from './FormProgressIndicator';
import { StepContainer } from './StepContainer';
import { StepNavigation } from './StepNavigation';
import { StepCompletionFeedback } from './StepCompletionFeedback';
import { SimulationCompleteScreen } from './SimulationCompleteScreen';
import { toast } from 'sonner';

const TOTAL_STEPS = 4;

interface SimFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  over21: string;
  cdl: string;
  cdlClass: string;
  cdlEndorsements: string[];
  experience: string;
  drug: string;
  veteran: string;
  consent: string;
  privacy: string;
}

const initialFormData: SimFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  zip: '',
  over21: '',
  cdl: '',
  cdlClass: '',
  cdlEndorsements: [],
  experience: '',
  drug: '',
  veteran: '',
  consent: '',
  privacy: '',
};

interface SimulatedApplicationFormProps {
  clientName?: string | null;
  country?: string | null;
}

export const SimulatedApplicationForm = ({ clientName, country }: SimulatedApplicationFormProps) => {
  const [formData, setFormData] = useState<SimFormData>(initialFormData);
  const [simComplete, setSimComplete] = useState(false);

  const handleInputChange = useCallback((name: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [name]: value } as SimFormData));
  }, []);

  const {
    activeStep,
    completedSteps,
    direction,
    showCelebration,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    canGoToStep,
  } = useStepWizard({ totalSteps: TOTAL_STEPS });

  const validateStep = useCallback((step: number): boolean => {
    const validations: Record<number, () => { isValid: boolean; message: string }> = {
      1: () => {
        if (!formData.firstName.trim()) return { isValid: false, message: 'Please enter your first name' };
        if (!formData.lastName.trim()) return { isValid: false, message: 'Please enter your last name' };
        if (!formData.email.trim()) return { isValid: false, message: 'Please enter your email' };
        if (!formData.phone.trim()) return { isValid: false, message: 'Please enter your phone number' };
        if (!formData.zip.trim()) return { isValid: false, message: 'Please enter your ZIP code' };
        if (!formData.over21) return { isValid: false, message: 'Please confirm if you are 21 or older' };
        return { isValid: true, message: '' };
      },
      2: () => {
        if (!formData.cdl) return { isValid: false, message: 'Please select your CDL status' };
        if (!formData.experience) return { isValid: false, message: 'Please select your experience level' };
        return { isValid: true, message: '' };
      },
      3: () => {
        if (!formData.drug) return { isValid: false, message: 'Please answer the drug test question' };
        return { isValid: true, message: '' };
      },
      4: () => {
        if (!formData.consent) return { isValid: false, message: 'Please select SMS consent preference' };
        if (!formData.privacy) return { isValid: false, message: 'Please accept the privacy policy' };
        return { isValid: true, message: '' };
      },
    };

    const validation = validations[step]?.() ?? { isValid: true, message: '' };
    if (!validation.isValid) {
      toast.error(validation.message);
    }
    return validation.isValid;
  }, [formData]);

  const canProceed = useMemo((): boolean => {
    const checks: Record<number, boolean> = {
      1: !!(formData.firstName && formData.lastName && formData.email && formData.phone && formData.zip && formData.over21),
      2: !!(formData.cdl && formData.experience),
      3: !!formData.drug,
      4: !!(formData.consent && formData.privacy),
    };
    return checks[activeStep] ?? false;
  }, [formData, activeStep]);

  const handleNext = useCallback(() => {
    if (validateStep(activeStep)) {
      nextStep();
    }
  }, [activeStep, validateStep, nextStep]);

  const handleSimulationSubmit = useCallback(() => {
    if (validateStep(TOTAL_STEPS)) {
      setSimComplete(true);
    }
  }, [validateStep]);

  if (simComplete) {
    return <SimulationCompleteScreen country={country} />;
  }

  const STEP_SECTIONS = [
    { id: 1, Component: PersonalInfoSection },
    { id: 2, Component: CDLInfoSection },
    { id: 3, Component: BackgroundInfoSection },
    { id: 4, Component: ConsentSection, hasClientName: true },
  ];

  return (
    <Card className="shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="p-4 sm:p-8">
        {/* Simulation Mode Banner */}
        <Alert className="mb-5 border-[hsl(var(--warning)/0.5)] bg-[hsl(var(--warning)/0.08)]">
          <Globe className="h-4 w-4 text-[hsl(var(--warning))]" />
          <AlertTitle className="text-[hsl(var(--warning))] font-semibold">
            Simulation Mode — Geo Restriction Active
          </AlertTitle>
          <AlertDescription className="text-[hsl(var(--warning))] opacity-90 text-sm">
            {country
              ? `Applications from ${country} are view-only.`
              : 'Applications from your region are view-only.'}{' '}
            This is a demo of the application experience.{' '}
            <strong>Data entered here will NOT be submitted.</strong>
          </AlertDescription>
        </Alert>

        {/* Progress Indicator */}
        <nav aria-label="Simulation application progress">
          <FormProgressIndicator
            currentStep={activeStep}
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            canGoToStep={canGoToStep}
          />
        </nav>

        {/* Celebration Feedback */}
        <StepCompletionFeedback show={showCelebration} stepNumber={activeStep - 1} />

        <form
          onSubmit={(e) => { e.preventDefault(); handleSimulationSubmit(); }}
          className="min-h-[400px]"
          noValidate
        >
          {STEP_SECTIONS.map(({ id, Component, hasClientName }) => (
            <StepContainer key={id} direction={direction} isActive={activeStep === id}>
              <Component
                formData={formData}
                onInputChange={handleInputChange}
                isActive={activeStep === id}
                {...(hasClientName && { clientName })}
              />
            </StepContainer>
          ))}

          <StepNavigation
            onBack={prevStep}
            onNext={handleNext}
            onSubmit={handleSimulationSubmit}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            isSubmitting={false}
            canProceed={canProceed}
            currentStep={activeStep}
          />
        </form>
      </CardContent>
    </Card>
  );
};
