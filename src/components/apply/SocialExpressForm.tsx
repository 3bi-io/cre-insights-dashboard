import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useApplicationForm } from '@/hooks/useApplicationForm';
import { useStepWizard } from '@/hooks/useStepWizard';
import { StepContainer } from './StepContainer';
import { SelectionButtonGroup } from './SelectionButton';
import { formatPhoneInput } from '@/utils/phoneFormatter';
import { ArrowRight, Send, Loader2, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SocialExpressFormProps {
  clientName?: string | null;
  clientLogoUrl?: string | null;
  industryVertical?: string | null;
}

const CDL_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'Permit', label: 'Permit' },
  { value: 'InSchool', label: 'In School' },
  { value: 'No', label: 'No' },
];

const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '6', label: '< 1 year' },
  { value: '24', label: '1–3 years' },
  { value: '48', label: '3+ years' },
];

const DRUG_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

export const SocialExpressForm = ({ clientName, clientLogoUrl, industryVertical }: SocialExpressFormProps) => {
  const {
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting,
  } = useApplicationForm(clientLogoUrl);

  const {
    activeStep,
    direction,
    nextStep,
    prevStep,
    isFirstStep,
  } = useStepWizard({ totalSteps: 2 });

  const [combinedConsent, setCombinedConsent] = useState(false);

  const handleConsentToggle = useCallback((checked: boolean) => {
    setCombinedConsent(checked);
    handleInputChange('consent', checked ? 'Yes' : '');
    handleInputChange('privacy', checked ? 'Yes' : '');
  }, [handleInputChange]);

  const validateStep1 = useCallback((): boolean => {
    if (!formData.firstName.trim()) { toast.error('Please enter your first name'); return false; }
    if (!formData.lastName.trim()) { toast.error('Please enter your last name'); return false; }
    if (!formData.email.trim()) { toast.error('Please enter your email'); return false; }
    if (!formData.phone.trim()) { toast.error('Please enter your phone number'); return false; }
    if (!formData.zip.trim()) { toast.error('Please enter your ZIP code'); return false; }
    if (!formData.over21) { toast.error('Please confirm your age'); return false; }
    return true;
  }, [formData]);

  const validateStep2 = useCallback((): boolean => {
    if (!formData.cdl) { toast.error('Please select your CDL status'); return false; }
    if (!formData.experience) { toast.error('Please select your experience'); return false; }
    if (!formData.drug) { toast.error('Please answer the drug test question'); return false; }
    if (!combinedConsent) { toast.error('Please accept the terms to continue'); return false; }
    return true;
  }, [formData, combinedConsent]);

  const handleNext = () => {
    if (validateStep1()) nextStep();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      handleSubmit(e);
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5 sm:p-8">
        {/* Minimal 2-dot progress */}
        <div className="flex items-center justify-center gap-3 mb-6" role="progressbar" aria-valuenow={activeStep} aria-valuemin={1} aria-valuemax={2}>
          {[1, 2].map(step => (
            <div key={step} className="flex items-center gap-2">
              <div className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                step === activeStep ? "w-8 bg-primary" : step < activeStep ? "w-2.5 bg-primary/60" : "w-2.5 bg-muted-foreground/20"
              )} />
            </div>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} noValidate>
          {/* Step 1: Contact Info */}
          <StepContainer direction={direction} isActive={activeStep === 1}>
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 text-primary mb-2">
                  <Zap className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wide">Express Apply</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Apply in under 60 seconds</h2>
                <p className="text-sm text-muted-foreground mt-1">Just the essentials — we'll get you matched fast</p>
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="express-firstName" className="text-sm font-medium text-foreground">First Name *</Label>
                  <Input
                    id="express-firstName"
                    value={formData.firstName}
                    onChange={e => handleInputChange('firstName', e.target.value)}
                    placeholder="First name"
                    className="h-14 text-base mt-1"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="express-lastName" className="text-sm font-medium text-foreground">Last Name *</Label>
                  <Input
                    id="express-lastName"
                    value={formData.lastName}
                    onChange={e => handleInputChange('lastName', e.target.value)}
                    placeholder="Last name"
                    className="h-14 text-base mt-1"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="express-email" className="text-sm font-medium text-foreground">Email *</Label>
                <Input
                  id="express-email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className="h-14 text-base mt-1"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="express-phone" className="text-sm font-medium text-foreground">Phone *</Label>
                <Input
                  id="express-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', formatPhoneInput(e.target.value))}
                  placeholder="(555) 555-5555"
                  className="h-14 text-base mt-1"
                  autoComplete="tel"
                  required
                />
              </div>

              {/* ZIP */}
              <div>
                <Label htmlFor="express-zip" className="text-sm font-medium text-foreground">ZIP Code *</Label>
                <Input
                  id="express-zip"
                  value={formData.zip}
                  onChange={e => handleInputChange('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="12345"
                  className="h-14 text-base mt-1"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  required
                />
              </div>

              {/* Age confirmation */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">Are you 21 or older? *</Label>
                <SelectionButtonGroup
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' },
                  ]}
                  value={formData.over21}
                  onChange={value => handleInputChange('over21', value)}
                />
              </div>

              {/* Continue button */}
              <Button
                type="button"
                onClick={handleNext}
                className="w-full h-14 text-base font-semibold gap-2 touch-manipulation"
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </StepContainer>

          {/* Step 2: Quick Qualify + Submit */}
          <StepContainer direction={direction} isActive={activeStep === 2}>
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Almost done!</h2>
                <p className="text-sm text-muted-foreground mt-1">A few quick questions and you're all set</p>
              </div>

              {/* CDL Status */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">Do you have a CDL? *</Label>
                <SelectionButtonGroup
                  options={CDL_OPTIONS}
                  value={formData.cdl}
                  onChange={value => handleInputChange('cdl', value)}
                />
              </div>

              {/* Experience */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">Driving experience *</Label>
                <SelectionButtonGroup
                  options={EXPERIENCE_OPTIONS}
                  value={formData.experience}
                  onChange={value => handleInputChange('experience', value)}
                />
              </div>

              {/* Drug Test */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">Can you pass a drug test? *</Label>
                <SelectionButtonGroup
                  options={DRUG_OPTIONS}
                  value={formData.drug}
                  onChange={value => handleInputChange('drug', value)}
                />
              </div>

              {/* Combined consent */}
              <div className={cn(
                "p-4 rounded-xl border-2 transition-all",
                combinedConsent ? "border-primary bg-primary/5" : "border-border"
              )}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="express-consent"
                    checked={combinedConsent}
                    onCheckedChange={handleConsentToggle}
                    className="mt-0.5"
                  />
                  <label htmlFor="express-consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    I agree to receive SMS messages about job opportunities and accept the{' '}
                    <a href="/privacy" target="_blank" className="text-primary underline">privacy policy</a>. 
                    Message & data rates may apply. Reply STOP to opt out.
                  </label>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="h-14 px-6 text-base font-medium touch-manipulation"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-14 text-base font-semibold gap-2 touch-manipulation"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <Send className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Trust signal */}
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Your info is secure and encrypted
              </p>
            </div>
          </StepContainer>
        </form>
      </CardContent>
    </Card>
  );
};
