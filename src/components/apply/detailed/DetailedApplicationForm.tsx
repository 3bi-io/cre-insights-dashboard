import React, { useState, useMemo } from 'react';
import { Truck } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { StructuredData, buildBreadcrumbSchema } from '@/components/StructuredData';
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

// Step configuration for rendering
interface StepConfig {
  id: number;
  Component: React.ComponentType<any>;
  hasEndorsementToggle?: boolean;
}

const STEP_SECTIONS: StepConfig[] = [
  { id: 1, Component: DetailedPersonalSection },
  { id: 2, Component: DetailedContactSection },
  { id: 3, Component: DetailedCDLSection, hasEndorsementToggle: true },
  { id: 4, Component: DetailedExperienceSection },
  { id: 5, Component: DetailedBackgroundSection },
  { id: 6, Component: DetailedConsentSection },
];

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

  const handleDraftRestore = () => {
    restoreDraft();
    setDraftBannerDismissed(true);
  };

  const handleDraftDiscard = () => {
    discardDraft();
    setDraftBannerDismissed(true);
  };

  const canProceed = validateStep(activeStep);
  const showDraftBanner = hasDraft && !draftBannerDismissed;

  const breadcrumbData = useMemo(() => buildBreadcrumbSchema([
    { name: 'Home', url: 'https://ats.me/' },
    { name: 'Jobs', url: 'https://ats.me/jobs' },
    { name: 'Detailed Application', url: 'https://ats.me/apply/detailed' },
  ]), []);

  return (
    <>
      <SEO
        title="Complete Driver Application | CDL Driver Application Form"
        description="Submit your comprehensive driver application with CDL verification, employment history, and background information. Get matched with top trucking companies."
        keywords="CDL application, driver application form, trucking job application, complete driver application, employment verification"
        canonical="https://ats.me/apply/detailed"
      />
      <StructuredData data={breadcrumbData} />
      
      <div className="min-h-screen bg-gradient-to-br from-background to-muted py-6 sm:py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-primary" aria-hidden="true" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Complete Application
              </h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Please complete all sections to submit your comprehensive application
            </p>
          </header>

          {/* Draft Restoration Banner */}
          {showDraftBanner && (
            <DraftBanner
              lastSaved={lastSaved}
              onRestore={handleDraftRestore}
              onDiscard={handleDraftDiscard}
              className="mb-6"
            />
          )}

          {/* Progress Indicator */}
          <nav aria-label="Application progress" className="mb-4">
            <DetailedFormProgressIndicator
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

          {/* Step Content */}
          <main className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-8 mb-6">
            {STEP_SECTIONS.map(({ id, Component, hasEndorsementToggle }) => (
              <StepContainer key={id} direction={direction} isActive={activeStep === id}>
                <Component
                  formData={formData}
                  onInputChange={handleInputChange}
                  isActive={activeStep === id}
                  {...(hasEndorsementToggle && { onEndorsementToggle: handleEndorsementToggle })}
                />
              </StepContainer>
            ))}

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
          </main>

          {/* Celebration Feedback */}
          <StepCompletionFeedback show={showCelebration} stepNumber={activeStep - 1} />
        </div>
      </div>
    </>
  );
};
