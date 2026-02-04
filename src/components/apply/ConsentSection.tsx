import React from 'react';
import { Label } from "@/components/ui/label";
import { FileCheck, MessageSquare, Shield, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsentSectionProps {
  formData: {
    consent: string;
    privacy: string;
  };
  onInputChange: (name: string, value: string) => void;
  clientName?: string | null;
  isActive?: boolean;
}

interface ConsentCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  onToggle: (value: string) => void;
  required?: boolean;
  hint?: string;
}

const ConsentCard = ({ title, description, icon, value, onToggle, required, hint }: ConsentCardProps) => {
  const isAgreed = value === 'Yes';
  
  return (
    <div
      className={cn(
        "relative p-5 rounded-xl border-2 transition-all duration-200",
        isAgreed 
          ? "border-primary bg-primary/5" 
          : "border-border bg-background"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex-shrink-0 p-2.5 rounded-lg",
          isAgreed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            {title}
            {required && <span className="text-destructive text-sm">*</span>}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {hint && (
            <p className="text-xs text-muted-foreground mt-2">{hint}</p>
          )}
        </div>
      </div>
      
      {/* Toggle Buttons */}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => onToggle('Yes')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-12 rounded-lg font-medium transition-all touch-manipulation",
            isAgreed
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Check className="h-4 w-4" />
          I Agree
        </button>
        <button
          type="button"
          onClick={() => onToggle('No')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-12 rounded-lg font-medium transition-all touch-manipulation",
            value === 'No'
              ? "bg-destructive text-destructive-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <X className="h-4 w-4" />
          Decline
        </button>
      </div>
    </div>
  );
};

export const ConsentSection = React.memo(({ 
  formData, 
  onInputChange, 
  clientName,
  isActive 
}: ConsentSectionProps) => {
  const companyName = clientName || 'our team';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
          <FileCheck className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Almost there!
        </h2>
        <p className="text-muted-foreground mt-1">
          Just need your consent to complete your application
        </p>
      </div>
      
      {/* SMS Consent */}
      <ConsentCard
        title={`Receive SMS from ${companyName}`}
        description="Get updates about your application status and new opportunities via text message."
        icon={<MessageSquare className="h-5 w-5" />}
        value={formData.consent}
        onToggle={(value) => onInputChange('consent', value)}
        required
        hint="Message and data rates may apply. Reply STOP to opt out at any time."
      />

      {/* Privacy Policy */}
      <ConsentCard
        title="Privacy Policy Agreement"
        description="Your information is secure and will only be used for employment purposes."
        icon={<Shield className="h-5 w-5" />}
        value={formData.privacy}
        onToggle={(value) => onInputChange('privacy', value)}
        required
      />

      {/* Summary */}
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

ConsentSection.displayName = 'ConsentSection';
