import React, { useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { FileCheck, CheckCircle, Shield, MessageSquare, Mail, Stethoscope, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectionButtonGroup } from '../SelectionButton';
import type { DetailedFormData } from '@/hooks/useDetailedApplicationForm';

interface DetailedConsentSectionProps {
  formData: DetailedFormData;
  onInputChange: (field: string, value: unknown) => void;
  isActive?: boolean;
}

const AGE_OPTIONS = [
  { value: 'yes', label: 'Yes, I am over 21', icon: <CheckCircle className="h-5 w-5" /> },
  { value: 'no', label: 'No' },
];

const DRUG_TEST_OPTIONS = [
  { value: 'yes', label: 'Yes, I can pass', icon: <CheckCircle className="h-5 w-5" /> },
  { value: 'no', label: 'No' },
];

const PHYSICAL_OPTIONS = [
  { value: 'yes', label: 'Yes, I can pass', icon: <Stethoscope className="h-5 w-5" /> },
  { value: 'no', label: 'No' },
];

interface ConsentCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
}

const ConsentCard = ({ id, title, description, icon, checked, onChange, required }: ConsentCardProps) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      "w-full p-4 rounded-xl border-2 text-left transition-all touch-manipulation",
      checked
        ? "border-primary bg-primary/5"
        : "border-border bg-background hover:border-primary/50"
    )}
  >
    <div className="flex items-start gap-3">
      <div className={cn(
        "flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/30"
      )}>
        {checked && <Check className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
          <p className={cn(
            "font-medium text-sm",
            checked ? "text-primary" : "text-foreground"
          )}>
            {title}
            {required && <span className="text-destructive ml-1">*</span>}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  </button>
);

export const DetailedConsentSection = React.memo(({ 
  formData, 
  onInputChange,
  isActive 
}: DetailedConsentSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isActive]);

  const requiredConsentsComplete = 
    formData.drugConsent && 
    formData.dataConsent && 
    formData.ageVerification && 
    formData.agreePrivacyPolicy &&
    formData.backgroundCheckConsent;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Section Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
          <FileCheck className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Consents & Agreements
        </h2>
        <p className="text-muted-foreground mt-1">
          Final step - review and agree to the required items
        </p>
      </div>

      {/* Physical & Medical Requirements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Stethoscope className="h-4 w-4" />
          <span className="text-sm font-medium">Physical & Medical Requirements</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Are you over 21?</Label>
            <SelectionButtonGroup
              options={AGE_OPTIONS}
              value={formData.over21}
              onChange={(value) => onInputChange('over21', value)}
              columns={1}
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Can you pass a drug test?</Label>
            <SelectionButtonGroup
              options={DRUG_TEST_OPTIONS}
              value={formData.canPassDrugTest}
              onChange={(value) => onInputChange('canPassDrugTest', value)}
              columns={1}
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Can you pass a DOT physical?</Label>
            <SelectionButtonGroup
              options={PHYSICAL_OPTIONS}
              value={formData.canPassPhysical}
              onChange={(value) => onInputChange('canPassPhysical', value)}
              columns={1}
            />
          </div>
        </div>
      </div>

      {/* Required Agreements */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Required Agreements</span>
          </div>
          {requiredConsentsComplete && (
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <CheckCircle className="h-4 w-4" />
              All complete
            </div>
          )}
        </div>

        <div className="space-y-3">
          <ConsentCard
            id="drugConsent"
            title="Drug Screening Consent"
            description="I consent to drug screening as required by company policy and DOT regulations."
            icon={<Shield className="h-4 w-4" />}
            checked={formData.drugConsent}
            onChange={(checked) => onInputChange('drugConsent', checked)}
            required
          />

          <ConsentCard
            id="dataConsent"
            title="Data Processing Consent"
            description="I consent to the collection and processing of my personal data for employment purposes."
            icon={<FileCheck className="h-4 w-4" />}
            checked={formData.dataConsent}
            onChange={(checked) => onInputChange('dataConsent', checked)}
            required
          />

          <ConsentCard
            id="ageVerification"
            title="Age Verification"
            description="I certify that I am at least 18 years of age and legally eligible to work."
            icon={<CheckCircle className="h-4 w-4" />}
            checked={formData.ageVerification}
            onChange={(checked) => onInputChange('ageVerification', checked)}
            required
          />

          <ConsentCard
            id="agreePrivacyPolicy"
            title="Privacy Policy & Terms"
            description="I agree to the privacy policy and terms of service for this application."
            icon={<FileCheck className="h-4 w-4" />}
            checked={formData.agreePrivacyPolicy}
            onChange={(checked) => onInputChange('agreePrivacyPolicy', checked)}
            required
          />

          <ConsentCard
            id="backgroundCheckConsent"
            title="Background Check Consent"
            description="I consent to a background check and motor vehicle record check as part of the hiring process."
            icon={<Shield className="h-4 w-4" />}
            checked={formData.backgroundCheckConsent}
            onChange={(checked) => onInputChange('backgroundCheckConsent', checked)}
            required
          />
        </div>
      </div>

      {/* Communication Preferences (Optional) */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">Communication Preferences (Optional)</span>
        </div>

        <div className="space-y-3">
          <ConsentCard
            id="consentToSms"
            title="SMS Updates"
            description="I would like to receive SMS messages about my application status and job opportunities."
            icon={<MessageSquare className="h-4 w-4" />}
            checked={formData.consentToSms}
            onChange={(checked) => onInputChange('consentToSms', checked)}
          />

          <ConsentCard
            id="consentToEmail"
            title="Email Communications"
            description="I would like to receive email communications regarding my application and career opportunities."
            icon={<Mail className="h-4 w-4" />}
            checked={formData.consentToEmail}
            onChange={(checked) => onInputChange('consentToEmail', checked)}
          />
        </div>
      </div>

      {/* Summary */}
      {!requiredConsentsComplete && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Please agree to all required items marked with * to submit your application.
          </p>
        </div>
      )}

      {/* Legal Disclosure */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          By submitting, you confirm that the information provided is accurate and complete.
        </p>
        <p className="text-xs text-muted-foreground/80">
          By submitting this form, you agree we can contact you for follow-ups—via 
          outbound calls, texts, emails, or other digital means—using AI tools or 
          automated systems at the info you shared. Standard rates might apply, 
          and you can opt out anytime.
        </p>
      </div>
    </div>
  );
});

DetailedConsentSection.displayName = 'DetailedConsentSection';
