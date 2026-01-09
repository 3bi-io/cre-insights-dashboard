import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { useStepWizard } from '@/hooks/useStepWizard';
import { useDetailedApplicationForm } from '@/hooks/useDetailedApplicationForm';
import { StepContainer } from '../StepContainer';
import { StepNavigation } from '../StepNavigation';
import { StepCompletionFeedback } from '../StepCompletionFeedback';
import { DetailedFormProgressIndicator } from './DetailedFormProgressIndicator';
import { DetailedPersonalSection } from './DetailedPersonalSection';
import { DetailedContactSection } from './DetailedContactSection';
import { DetailedCDLSection } from './DetailedCDLSection';
import { DetailedExperienceSection } from './DetailedExperienceSection';
import { DetailedBackgroundSection } from './DetailedBackgroundSection';
import { DetailedConsentSection } from './DetailedConsentSection';
import { DraftBanner, AutoSaveIndicator } from '@/components/shared/DraftBanner';

const TOTAL_STEPS = 6;

export const DetailedApplicationForm = () => {
  const {
    formData,
    handleInputChange,
    handleEndorsementToggle,
    handleSubmit,
    validateStep,
    isSubmitting,
    hasDraft,
    lastSaved,
    restoreDraft,
    discardDraft,
  } = useDetailedApplicationForm();

  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false);

  const {
    activeStep,
    completedSteps,
    direction,
    showCelebration,
    goToStep,
    nextStep,
    prevStep,
    canGoToStep,
    isFirstStep,
    isLastStep,
  } = useStepWizard({ totalSteps: TOTAL_STEPS });

  const handleNext = () => {
    if (validateStep(activeStep)) {
      nextStep();
    }
  };

  const canProceed = validateStep(activeStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-6 sm:py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Complete Application</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Please complete all sections to submit your comprehensive application
          </p>
        </div>

        {/* Draft Restoration Banner */}
        {hasDraft && !draftBannerDismissed && (
          <DraftBanner
            lastSaved={lastSaved}
            onRestore={() => {
              restoreDraft();
              setDraftBannerDismissed(true);
            }}
            onDiscard={() => {
              discardDraft();
              setDraftBannerDismissed(true);
            }}
            className="mb-6"
          />
        )}

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-4">
          <DetailedFormProgressIndicator
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            canGoToStep={canGoToStep}
          />
        </div>
        
        {/* Auto-save indicator */}
        <div className="flex justify-end mb-2">
          <AutoSaveIndicator lastSaved={lastSaved} />
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-8 mb-6">
          <StepContainer direction={direction} isActive={activeStep === 1}>
            <DetailedPersonalSection
              formData={formData}
              onInputChange={handleInputChange}
              isActive={activeStep === 1}
            />
          </StepContainer>

          <StepContainer direction={direction} isActive={activeStep === 2}>
            <DetailedContactSection
              formData={formData}
              onInputChange={handleInputChange}
              isActive={activeStep === 2}
            />
          </StepContainer>

          <StepContainer direction={direction} isActive={activeStep === 3}>
            <DetailedCDLSection
              formData={formData}
              onInputChange={handleInputChange}
              onEndorsementToggle={handleEndorsementToggle}
              isActive={activeStep === 3}
            />
          </StepContainer>

          <StepContainer direction={direction} isActive={activeStep === 4}>
            <DetailedExperienceSection
              formData={formData}
              onInputChange={handleInputChange}
              isActive={activeStep === 4}
            />
          </StepContainer>

          <StepContainer direction={direction} isActive={activeStep === 5}>
            <DetailedBackgroundSection
              formData={formData}
              onInputChange={handleInputChange}
              isActive={activeStep === 5}
            />
          </StepContainer>

          <StepContainer direction={direction} isActive={activeStep === 6}>
            <DetailedConsentSection
              formData={formData}
              onInputChange={handleInputChange}
              isActive={activeStep === 6}
            />
          </StepContainer>

          {/* Navigation */}
          <StepNavigation
            onBack={prevStep}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            isSubmitting={isSubmitting}
            canProceed={canProceed}
          />
        </div>

        {/* Celebration Feedback */}
        <StepCompletionFeedback show={showCelebration} stepNumber={activeStep - 1} />
      </div>
    </div>
  );
};
