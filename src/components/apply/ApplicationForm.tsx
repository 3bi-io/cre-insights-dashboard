import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useApplicationForm } from '@/hooks/useApplicationForm';
import { useStepWizard } from '@/hooks/useStepWizard';
import { useScreeningQuestions } from '@/hooks/useScreeningQuestions';
import { useApplyContext } from '@/hooks/useApplyContext';
import { ApplicationFormSkeleton } from './ApplicationFormSkeleton';
import { PersonalInfoSection } from './PersonalInfoSection';
import { CDLInfoSection } from './CDLInfoSection';
import { BackgroundInfoSection } from './BackgroundInfoSection';
import { ConsentSection } from './ConsentSection';
import { ScreeningQuestionsSection } from './ScreeningQuestionsSection';
import { FormProgressIndicator } from './FormProgressIndicator';
import { StepContainer } from './StepContainer';
import { StepNavigation } from './StepNavigation';
import { StepCompletionFeedback } from './StepCompletionFeedback';
import { DraftBanner, AutoSaveIndicator } from '@/components/shared/DraftBanner';
import { toast } from 'sonner';




interface ApplicationFormProps {
  clientName?: string | null;
  clientLogoUrl?: string | null;
}

export const ApplicationForm = ({ clientName, clientLogoUrl }: ApplicationFormProps) => {
  const { jobListingId } = useApplyContext();
  const { data: screeningQuestions } = useScreeningQuestions(jobListingId);
  const hasScreening = screeningQuestions && screeningQuestions.length > 0;
  const totalSteps = hasScreening ? 5 : 4;

  const { 
    formData, 
    handleInputChange, 
    handleSubmit, 
    isSubmitting,
    hasDraft,
    lastSaved,
    restoreDraft,
    discardDraft,
  } = useApplicationForm(clientLogoUrl);

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
  } = useStepWizard({ totalSteps });

  // Map logical step to validation step accounting for screening insertion
  // Steps: 1=Personal, 2=CDL, 3=Background, [4=Screening if present], last=Consent
  const consentStep = totalSteps;

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
    };

    // Add screening validation if present (step 4 when hasScreening)
    if (hasScreening && step === 4) {
      const requiredQuestions = screeningQuestions!.filter(q => q.required);
      for (const q of requiredQuestions) {
        if (!formData.custom_questions[q.id]) {
          toast.error(`Please answer: ${q.question}`);
          return false;
        }
      }
      return true;
    }

    // Consent step (last step)
    if (step === consentStep) {
      if (!formData.consent) { toast.error('Please select SMS consent preference'); return false; }
      if (!formData.privacy) { toast.error('Please accept the privacy policy'); return false; }
      return true;
    }

    const validation = validations[step]?.() ?? { isValid: true, message: '' };
    if (!validation.isValid) {
      toast.error(validation.message);
    }
    return validation.isValid;
  }, [formData, hasScreening, screeningQuestions, consentStep]);

  // Check if current step can proceed
  const canProceed = useMemo((): boolean => {
    const checks: Record<number, boolean> = {
      1: !!(formData.firstName && formData.lastName && formData.email && formData.phone && formData.zip && formData.over21),
      2: !!(formData.cdl && formData.experience),
      3: !!formData.drug,
    };

    // Screening step check
    if (hasScreening && activeStep === 4) {
      const requiredQuestions = screeningQuestions!.filter(q => q.required);
      return requiredQuestions.every(q => !!formData.custom_questions[q.id]);
    }

    // Consent step (last)
    if (activeStep === consentStep) {
      return !!(formData.consent && formData.privacy);
    }

    return checks[activeStep] ?? false;
  }, [formData, activeStep, hasScreening, screeningQuestions, consentStep]);

  const handleNext = useCallback(() => {
    if (validateStep(activeStep)) {
      nextStep();
    }
  }, [activeStep, validateStep, nextStep]);

  // Skip to submit - allows users to submit after step 1 with minimal info
  const handleSkipToSubmit = useCallback(() => {
    // Validate step 1 first
    if (!validateStep(1)) return;
    
    // Set default consent values for quick submit
    handleInputChange('consent', 'yes');
    handleInputChange('privacy', 'yes');
    
    // Submit the form
    handleSubmit(new Event('submit') as unknown as React.FormEvent);
  }, [validateStep, handleInputChange, handleSubmit]);

  const handleFormSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (validateStep(totalSteps)) {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }
  }, [validateStep, handleSubmit, totalSteps]);

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
        {/* Draft Restoration Banner */}
        {showDraftBanner && (
          <DraftBanner
            lastSaved={lastSaved}
            onRestore={handleDraftRestore}
            onDiscard={handleDraftDiscard}
            className="mb-4"
          />
        )}

        {/* Progress Indicator */}
        <nav aria-label="Application progress">
          <FormProgressIndicator 
            currentStep={activeStep}
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            canGoToStep={canGoToStep}
          />
        </nav>

        {/* Auto-save indicator */}
        <div className="flex justify-end mb-2">
          <AutoSaveIndicator lastSaved={lastSaved} />
        </div>
        
        {/* Celebration Feedback */}
        <StepCompletionFeedback show={showCelebration} stepNumber={activeStep - 1} />
        
        <form onSubmit={handleFormSubmit} className="min-h-[400px]" noValidate>
          {/* Step 1: Personal Info */}
          <StepContainer direction={direction} isActive={activeStep === 1}>
            <Suspense fallback={<ApplicationFormSkeleton />}>
              <PersonalInfoSection formData={formData} onInputChange={handleInputChange} isActive={activeStep === 1} />
            </Suspense>
          </StepContainer>

          {/* Step 2: CDL Info */}
          <StepContainer direction={direction} isActive={activeStep === 2}>
            <Suspense fallback={<ApplicationFormSkeleton />}>
              <CDLInfoSection formData={formData} onInputChange={handleInputChange} isActive={activeStep === 2} />
            </Suspense>
          </StepContainer>

          {/* Step 3: Background Info */}
          <StepContainer direction={direction} isActive={activeStep === 3}>
            <Suspense fallback={<ApplicationFormSkeleton />}>
              <BackgroundInfoSection formData={formData} onInputChange={handleInputChange} isActive={activeStep === 3} />
            </Suspense>
          </StepContainer>

          {/* Step 4: Screening Questions (conditional) */}
          {hasScreening && (
            <StepContainer direction={direction} isActive={activeStep === 4}>
              <ScreeningQuestionsSection
                questions={screeningQuestions!}
                answers={formData.custom_questions}
                onAnswerChange={(questionId, value) => {
                  handleInputChange('custom_questions', {
                    ...formData.custom_questions,
                    [questionId]: value,
                  });
                }}
                isActive={activeStep === 4}
              />
            </StepContainer>
          )}

          {/* Last Step: Consent */}
          <StepContainer direction={direction} isActive={activeStep === consentStep}>
            <Suspense fallback={<ApplicationFormSkeleton />}>
              <ConsentSection formData={formData} onInputChange={handleInputChange} isActive={activeStep === consentStep} clientName={clientName} />
            </Suspense>
          </StepContainer>

          {/* Navigation Buttons */}
          <StepNavigation
            onBack={prevStep}
            onNext={handleNext}
            onSubmit={handleFormSubmit}
            onSkipToSubmit={handleSkipToSubmit}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            isSubmitting={isSubmitting}
            canProceed={canProceed}
            canSkipToSubmit={canProceed && activeStep === 1}
            currentStep={activeStep}
          />
        </form>
      </CardContent>
    </Card>
  );
};
