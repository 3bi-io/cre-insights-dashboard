import React, { useState, useMemo } from 'react';
import { SEO } from '@/components/SEO';
import { StructuredData, buildBreadcrumbSchema } from '@/components/StructuredData';
import { useStepWizard } from '@/hooks/useStepWizard';
import { useDetailedApplicationForm } from '@/hooks/useDetailedApplicationForm';
import { useApplyContext } from '@/hooks/useApplyContext';
import { StepContainer } from '../StepContainer';
import { StepNavigation } from '../StepNavigation';
import { StepCompletionFeedback } from '../StepCompletionFeedback';
import { ApplicationHeader } from '../ApplicationHeader';
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

  const {
    jobTitle,
    clientName,
    location,
    source,
    isLoading: contextLoading,
  } = useApplyContext();

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

  // Dynamic SEO based on job context
  const seoContent = useMemo(() => {
    const title = jobTitle 
      ? `Apply for ${jobTitle} | CDL Driver Application`
      : 'Complete Driver Application | CDL Driver Application Form';
    const description = jobTitle && clientName
      ? `Apply for ${jobTitle} at ${clientName}. Complete driver application with CDL verification and employment history.`
      : 'Submit your comprehensive driver application with CDL verification, employment history, and background information. Get matched with top trucking companies.';
    return { title, description };
  }, [jobTitle, clientName]);

  const breadcrumbData = useMemo(() => buildBreadcrumbSchema([
    { name: 'Home', url: 'https://ats.me/' },
    { name: 'Jobs', url: 'https://ats.me/jobs' },
    { name: jobTitle || 'Detailed Application', url: 'https://ats.me/apply/detailed' },
  ]), [jobTitle]);

  return (
    <>
      <SEO
        title={seoContent.title}
        description={seoContent.description}
        keywords="CDL application, driver application form, trucking job application, complete driver application, employment verification"
        canonical="https://ats.me/apply/detailed"
      />
      <StructuredData data={breadcrumbData} />
      
      <div className="h-full overflow-y-auto bg-gradient-to-br from-background to-muted">
        <div className="min-h-full py-6 sm:py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Dynamic Header with Job Context */}
          <ApplicationHeader
            jobTitle={jobTitle || 'Complete Application'}
            clientName={clientName}
            location={location}
            source={source}
            isLoading={contextLoading}
          />

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
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              className="min-h-[400px]"
              noValidate
            >
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
            </form>
          </main>

          {/* Celebration Feedback */}
          <StepCompletionFeedback show={showCelebration} stepNumber={activeStep - 1} />
        </div>
        </div>
      </div>
    </>
  );
};
