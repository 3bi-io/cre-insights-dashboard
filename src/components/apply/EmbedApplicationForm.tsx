import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useEmbedApplicationForm } from '@/hooks/useEmbedApplicationForm';
import { useStepWizard } from '@/hooks/useStepWizard';
import { ApplicationFormSkeleton } from './ApplicationFormSkeleton';
import { PersonalInfoSection } from './PersonalInfoSection';
import { CDLInfoSection } from './CDLInfoSection';
import { TechInfoSection } from './TechInfoSection';
import { BackgroundInfoSection } from './BackgroundInfoSection';
import { ConsentSection } from './ConsentSection';
import { FormProgressIndicator } from './FormProgressIndicator';
import { StepContainer } from './StepContainer';
import { StepNavigation } from './StepNavigation';
import { StepCompletionFeedback } from './StepCompletionFeedback';
import { DraftBanner, AutoSaveIndicator } from '@/components/shared/DraftBanner';
import { toast } from 'sonner';

const TOTAL_STEPS = 4;

interface StepConfig {
  id: number;
  Component: React.ComponentType<any>;
  hasClientName?: boolean;
}

function isTechVertical(v: string | null | undefined): boolean {
  if (!v) return false;
  return ['cyber', 'tech', 'general'].includes(v.toLowerCase());
}

const getCdlStepSections = (): StepConfig[] => [
  { id: 1, Component: PersonalInfoSection },
  { id: 2, Component: CDLInfoSection },
  { id: 3, Component: BackgroundInfoSection },
  { id: 4, Component: ConsentSection, hasClientName: true },
];

const getTechStepSections = (): StepConfig[] => [
  { id: 1, Component: PersonalInfoSection },
  { id: 2, Component: TechInfoSection },
  { id: 3, Component: BackgroundInfoSection },
  { id: 4, Component: ConsentSection, hasClientName: true },
];

interface EmbedApplicationFormProps {
  clientName?: string | null;
  industryVertical?: string | null;
  onSubmitSuccess?: (result: {
    applicationId: string;
    clientName?: string;
    hasVoiceAgent?: boolean;
    organizationId?: string;
  }) => void;
}

/**
 * Embed-specific application form that routes to dedicated outbound voice agent
 * Sets source: 'Embed Form' for all submissions
 */
export const EmbedApplicationForm = ({ clientName, industryVertical, onSubmitSuccess }: EmbedApplicationFormProps) => {
  const isTech = isTechVertical(industryVertical);
  const stepSections = isTech ? getTechStepSections() : getCdlStepSections();
  const { 
    formData, 
    handleInputChange, 
    handleSubmit, 
    isSubmitting,
    hasDraft,
    lastSaved,
    restoreDraft,
    discardDraft,
  } = useEmbedApplicationForm({
    onSuccess: (data) => {
      onSubmitSuccess?.({
        applicationId: data.applicationId,
        clientName: data.organizationName,
        hasVoiceAgent: data.hasVoiceAgent,
        organizationId: data.organizationId,
      });
    },
  });

  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false);
  
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


  const handleFormSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (validateStep(TOTAL_STEPS)) {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }
  }, [validateStep, handleSubmit]);

  const handleDraftRestore = useCallback(() => {
    restoreDraft();
    setDraftBannerDismissed(true);
  }, [restoreDraft]);

  const handleDraftDiscard = useCallback(() => {
    discardDraft();
    setDraftBannerDismissed(true);
  }, [discardDraft]);

  const showDraftBanner = hasDraft && !draftBannerDismissed;

  return (
    <Card className="shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="p-4 sm:p-8">
        {showDraftBanner && (
          <DraftBanner
            lastSaved={lastSaved}
            onRestore={handleDraftRestore}
            onDiscard={handleDraftDiscard}
            className="mb-4"
          />
        )}

        <nav aria-label="Application progress">
          <FormProgressIndicator 
            currentStep={activeStep}
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            canGoToStep={canGoToStep}
            industryVertical={industryVertical}
          />
        </nav>

        <div className="flex justify-end mb-2">
          <AutoSaveIndicator lastSaved={lastSaved} />
        </div>
        
        <StepCompletionFeedback show={showCelebration} stepNumber={activeStep - 1} />
        
        <form onSubmit={handleFormSubmit} className="min-h-[400px]" noValidate>
          {stepSections.map(({ id, Component, hasClientName }) => (
            <StepContainer key={id} direction={direction} isActive={activeStep === id}>
              <Suspense fallback={<ApplicationFormSkeleton />}>
                <Component 
                  formData={formData} 
                  onInputChange={handleInputChange}
                  isActive={activeStep === id}
                  {...(hasClientName && { clientName })}
                />
              </Suspense>
            </StepContainer>
          ))}

          <StepNavigation
            onBack={prevStep}
            onNext={handleNext}
            onSubmit={handleFormSubmit}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            isSubmitting={isSubmitting}
            canProceed={canProceed}
            currentStep={activeStep}
          />
        </form>
      </CardContent>
    </Card>
  );
};
