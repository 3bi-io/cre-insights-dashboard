import React, { Suspense, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useApplicationForm } from '@/hooks/useApplicationForm';
import { useStepWizard } from '@/hooks/useStepWizard';
import { ApplicationFormSkeleton } from './ApplicationFormSkeleton';
import { PersonalInfoSection } from './PersonalInfoSection';
import { CDLInfoSection } from './CDLInfoSection';
import { BackgroundInfoSection } from './BackgroundInfoSection';
import { ConsentSection } from './ConsentSection';
import { FormProgressIndicator } from './FormProgressIndicator';
import { StepContainer } from './StepContainer';
import { StepNavigation } from './StepNavigation';
import { StepCompletionFeedback } from './StepCompletionFeedback';
import { toast } from 'sonner';

interface ApplicationFormProps {
  organizationName?: string | null;
}

export const ApplicationForm = ({ organizationName }: ApplicationFormProps) => {
  const { formData, handleInputChange, handleSubmit, isSubmitting } = useApplicationForm();
  
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
  } = useStepWizard({ totalSteps: 4 });

  // Step validation functions
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.firstName.trim()) {
          toast.error('Please enter your first name');
          return false;
        }
        if (!formData.lastName.trim()) {
          toast.error('Please enter your last name');
          return false;
        }
        if (!formData.email.trim()) {
          toast.error('Please enter your email');
          return false;
        }
        if (!formData.phone.trim()) {
          toast.error('Please enter your phone number');
          return false;
        }
        if (!formData.zip.trim()) {
          toast.error('Please enter your ZIP code');
          return false;
        }
        if (!formData.over21) {
          toast.error('Please confirm if you are 21 or older');
          return false;
        }
        return true;
      case 2:
        if (!formData.cdl) {
          toast.error('Please select your CDL status');
          return false;
        }
        if (!formData.experience) {
          toast.error('Please select your experience level');
          return false;
        }
        return true;
      case 3:
        if (!formData.drug) {
          toast.error('Please answer the drug test question');
          return false;
        }
        return true;
      case 4:
        if (!formData.consent) {
          toast.error('Please select SMS consent preference');
          return false;
        }
        if (!formData.privacy) {
          toast.error('Please accept the privacy policy');
          return false;
        }
        return true;
      default:
        return true;
    }
  }, [formData]);

  // Check if current step can proceed (all required fields filled)
  const canProceed = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone && formData.zip && formData.over21);
      case 2:
        return !!(formData.cdl && formData.experience);
      case 3:
        return !!formData.drug;
      case 4:
        return !!(formData.consent && formData.privacy);
      default:
        return false;
    }
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(activeStep)) {
      nextStep();
    }
  }, [activeStep, validateStep, nextStep]);

  const handleFormSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (validateStep(4)) {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }
  }, [validateStep, handleSubmit]);

  return (
    <Card className="shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <CardContent className="p-4 sm:p-8">
        {/* Progress Indicator */}
        <FormProgressIndicator 
          currentStep={activeStep}
          activeStep={activeStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
          canGoToStep={canGoToStep}
        />
        
        {/* Celebration Feedback */}
        <StepCompletionFeedback show={showCelebration} stepNumber={activeStep - 1} />
        
        <form onSubmit={handleFormSubmit} className="min-h-[400px]">
          {/* Step 1: Personal Info */}
          <StepContainer direction={direction} isActive={activeStep === 1}>
            <Suspense fallback={<ApplicationFormSkeleton />}>
              <PersonalInfoSection 
                formData={formData} 
                onInputChange={handleInputChange}
                isActive={activeStep === 1}
              />
            </Suspense>
          </StepContainer>

          {/* Step 2: CDL Info */}
          <StepContainer direction={direction} isActive={activeStep === 2}>
            <Suspense fallback={<ApplicationFormSkeleton />}>
              <CDLInfoSection 
                formData={formData} 
                onInputChange={handleInputChange}
                isActive={activeStep === 2}
              />
            </Suspense>
          </StepContainer>

          {/* Step 3: Background Info */}
          <StepContainer direction={direction} isActive={activeStep === 3}>
            <Suspense fallback={<ApplicationFormSkeleton />}>
              <BackgroundInfoSection 
                formData={formData} 
                onInputChange={handleInputChange}
                isActive={activeStep === 3}
              />
            </Suspense>
          </StepContainer>

          {/* Step 4: Consent */}
          <StepContainer direction={direction} isActive={activeStep === 4}>
            <Suspense fallback={<ApplicationFormSkeleton />}>
              <ConsentSection 
                formData={formData} 
                onInputChange={handleInputChange}
                organizationName={organizationName}
                isActive={activeStep === 4}
              />
            </Suspense>
          </StepContainer>

          {/* Navigation Buttons */}
          <StepNavigation
            onBack={prevStep}
            onNext={handleNext}
            onSubmit={handleFormSubmit}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            isSubmitting={isSubmitting}
            canProceed={canProceed(activeStep)}
          />
        </form>
      </CardContent>
    </Card>
  );
};
