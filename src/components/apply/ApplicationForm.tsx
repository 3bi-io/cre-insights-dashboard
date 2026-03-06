import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useApplicationForm } from '@/hooks/useApplicationForm';
import { useStepWizard } from '@/hooks/useStepWizard';
import { useScreeningQuestions } from '@/hooks/useScreeningQuestions';
import { useApplyContext } from '@/hooks/useApplyContext';
import { ApplicationFormSkeleton } from './ApplicationFormSkeleton';
import { PersonalInfoSection } from './PersonalInfoSection';
import { CDLInfoSection } from './CDLInfoSection';
import { TechInfoSection } from './TechInfoSection';
import { BackgroundInfoSection } from './BackgroundInfoSection';
import { ConsentSection } from './ConsentSection';
import { ScreeningQuestionsSection } from './ScreeningQuestionsSection';
import { FormProgressIndicator } from './FormProgressIndicator';
import { StepContainer } from './StepContainer';
import { StepNavigation } from './StepNavigation';
import { StepCompletionFeedback } from './StepCompletionFeedback';
import { DraftBanner, AutoSaveIndicator } from '@/components/shared/DraftBanner';
import { toast } from 'sonner';
import type { ScreeningQuestion } from '@/hooks/useScreeningQuestions';

// Patterns to detect screening questions that overlap with native form fields
const CDL_QUESTION_PATTERN = /hold.*cdl|active.*cdl|cdl.*license|have.*cdl|do you.*cdl/i;
const EXPERIENCE_QUESTION_PATTERN = /years.*experience|how many.*experience|driving.*experience/i;
const DRUG_QUESTION_PATTERN = /drug.*test|dot.*test|pass.*drug|drug.*screen/i;

function isRedundantQuestion(q: ScreeningQuestion): 'cdl' | 'experience' | 'drug' | null {
  const text = `${q.id} ${q.question}`;
  if (CDL_QUESTION_PATTERN.test(text)) return 'cdl';
  if (EXPERIENCE_QUESTION_PATTERN.test(text)) return 'experience';
  if (DRUG_QUESTION_PATTERN.test(text)) return 'drug';
  return null;
}

function findBestOption(options: { value: string; label: string }[], nativeValue: string): string | null {
  if (!nativeValue) return null;
  // Direct match
  const direct = options.find(o => o.value.toLowerCase() === nativeValue.toLowerCase() || o.label.toLowerCase() === nativeValue.toLowerCase());
  if (direct) return direct.value;
  // Partial match
  const partial = options.find(o => o.label.toLowerCase().includes(nativeValue.toLowerCase()) || nativeValue.toLowerCase().includes(o.value.toLowerCase()));
  if (partial) return partial.value;
  // For Yes/No type: map CDL values
  if (['Yes', 'Permit', 'InSchool'].includes(nativeValue)) {
    const yesOpt = options.find(o => /yes/i.test(o.value) || /yes/i.test(o.label));
    if (yesOpt) return yesOpt.value;
  }
  if (nativeValue === 'No') {
    const noOpt = options.find(o => /no/i.test(o.value) || /no/i.test(o.label));
    if (noOpt) return noOpt.value;
  }
  return null;
}

function mapExperienceToOption(options: { value: string; label: string }[], months: string): string | null {
  if (!months) return null;
  const m = parseInt(months) || 0;
  const years = m / 12;
  // Try to find the closest numeric option
  let best: { value: string; dist: number } | null = null;
  for (const o of options) {
    const match = o.label.match(/(\d+)/);
    if (match) {
      const optYears = parseInt(match[1]);
      const dist = Math.abs(years - optYears);
      if (!best || dist < best.dist) best = { value: o.value, dist };
    }
  }
  if (best) return best.value;
  // Fallback: if no experience and there's a "no" or "none" option
  if (m === 0) {
    const none = options.find(o => /no|none|0/i.test(o.label));
    if (none) return none.value;
  }
  return options[0]?.value || null;
}



interface ApplicationFormProps {
  clientName?: string | null;
  clientLogoUrl?: string | null;
  industryVertical?: string | null;
}

function isTechVertical(v: string | null | undefined): boolean {
  if (!v) return false;
  return ['cyber', 'tech', 'general'].includes(v.toLowerCase());
}

export const ApplicationForm = ({ clientName, clientLogoUrl, industryVertical }: ApplicationFormProps) => {
  const isTech = isTechVertical(industryVertical);
  const Step2Component = isTech ? TechInfoSection : CDLInfoSection;
  const { jobListingId } = useApplyContext();
  const { data: screeningQuestions } = useScreeningQuestions(jobListingId);
  const hasScreening = screeningQuestions && screeningQuestions.length > 0;
  const totalSteps = 4;

  // Split screening questions into CDL-related and background-related
  const { cdlScreeningQuestions, backgroundScreeningQuestions } = useMemo(() => {
    if (!hasScreening) return { cdlScreeningQuestions: [], backgroundScreeningQuestions: [] };
    const cdlPattern = /cdl|license|experience|driving/i;
    const cdl = screeningQuestions!.filter(q => cdlPattern.test(q.id) || cdlPattern.test(q.question));
    const bg = screeningQuestions!.filter(q => !cdlPattern.test(q.id) && !cdlPattern.test(q.question));
    return { cdlScreeningQuestions: cdl, backgroundScreeningQuestions: bg };
  }, [hasScreening, screeningQuestions]);

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

  // Identify redundant questions and filter them out
  const { visibleCdlQuestions, visibleBgQuestions, redundantQuestions } = useMemo(() => {
    const redundant: { question: ScreeningQuestion; field: 'cdl' | 'experience' | 'drug' }[] = [];
    const visibleCdl: typeof cdlScreeningQuestions = [];
    const visibleBg: typeof backgroundScreeningQuestions = [];
    for (const q of cdlScreeningQuestions) {
      const field = isRedundantQuestion(q);
      if (field) redundant.push({ question: q, field });
      else visibleCdl.push(q);
    }
    for (const q of backgroundScreeningQuestions) {
      const field = isRedundantQuestion(q);
      if (field) redundant.push({ question: q, field });
      else visibleBg.push(q);
    }
    return { visibleCdlQuestions: visibleCdl, visibleBgQuestions: visibleBg, redundantQuestions: redundant };
  }, [cdlScreeningQuestions, backgroundScreeningQuestions]);

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
        for (const q of visibleCdlQuestions.filter(q => q.required)) {
          if (!formData.custom_questions[q.id]) return { isValid: false, message: `Please answer: ${q.question}` };
        }
        return { isValid: true, message: '' };
      },
      3: () => {
        if (!formData.drug) return { isValid: false, message: 'Please answer the drug test question' };
        for (const q of visibleBgQuestions.filter(q => q.required)) {
          if (!formData.custom_questions[q.id]) return { isValid: false, message: `Please answer: ${q.question}` };
        }
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
  }, [formData, visibleCdlQuestions, visibleBgQuestions]);

  // (redundant question detection moved above validateStep)

  // Auto-populate answers for redundant screening questions from native fields
  useEffect(() => {
    if (redundantQuestions.length === 0) return;
    const updates: Record<string, string> = {};
    for (const { question, field } of redundantQuestions) {
      let mapped: string | null = null;
      if (field === 'cdl') mapped = findBestOption(question.options, formData.cdl);
      else if (field === 'experience') mapped = mapExperienceToOption(question.options, formData.experience);
      else if (field === 'drug') mapped = findBestOption(question.options, formData.drug);
      if (mapped && mapped !== formData.custom_questions[question.id]) {
        updates[question.id] = mapped;
      }
    }
    if (Object.keys(updates).length > 0) {
      handleInputChange('custom_questions', { ...formData.custom_questions, ...updates });
    }
  }, [formData.cdl, formData.experience, formData.drug, redundantQuestions, formData.custom_questions, handleInputChange]);

  // Check if current step can proceed (using visible questions only; redundant ones are auto-populated)
  const canProceed = useMemo((): boolean => {
    const cdlScreeningValid = visibleCdlQuestions.filter(q => q.required).every(q => !!formData.custom_questions[q.id]);
    const bgScreeningValid = visibleBgQuestions.filter(q => q.required).every(q => !!formData.custom_questions[q.id]);

    const checks: Record<number, boolean> = {
      1: !!(formData.firstName && formData.lastName && formData.email && formData.phone && formData.zip && formData.over21),
      2: !!(formData.cdl && formData.experience) && cdlScreeningValid,
      3: !!formData.drug && bgScreeningValid,
      4: !!(formData.consent && formData.privacy),
    };

    return checks[activeStep] ?? false;
  }, [formData, activeStep, visibleCdlQuestions, visibleBgQuestions]);

  const handleNext = useCallback(() => {
    if (validateStep(activeStep)) {
      nextStep();
    }
  }, [activeStep, validateStep, nextStep]);


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
            industryVertical={industryVertical}
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
              <CDLInfoSection
                formData={formData}
                onInputChange={handleInputChange}
                isActive={activeStep === 2}
                screeningQuestions={visibleCdlQuestions}
                screeningAnswers={formData.custom_questions}
                onScreeningAnswerChange={(questionId, value) => {
                  handleInputChange('custom_questions', {
                    ...formData.custom_questions,
                    [questionId]: value,
                  });
                }}
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
                screeningQuestions={visibleBgQuestions}
                screeningAnswers={formData.custom_questions}
                onScreeningAnswerChange={(questionId, value) => {
                  handleInputChange('custom_questions', {
                    ...formData.custom_questions,
                    [questionId]: value,
                  });
                }}
              />
            </Suspense>
          </StepContainer>

          {/* Step 4: Consent */}
          <StepContainer direction={direction} isActive={activeStep === 4}>
            <Suspense fallback={<ApplicationFormSkeleton />}>
              <ConsentSection formData={formData} onInputChange={handleInputChange} isActive={activeStep === 4} clientName={clientName} />
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
            canProceed={canProceed}
            currentStep={activeStep}
          />
        </form>
      </CardContent>
    </Card>
  );
};
