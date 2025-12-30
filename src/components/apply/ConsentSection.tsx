import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConsentSectionProps {
  formData: {
    consent: string;
    privacy: string;
  };
  onInputChange: (name: string, value: string) => void;
  organizationName?: string | null;
}

export const ConsentSection = React.memo(({ 
  formData, 
  onInputChange, 
  organizationName 
}: ConsentSectionProps) => {
  const companyName = organizationName || 'our team';

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground border-b pb-2">
        Consent
      </h2>
      
      <div className="space-y-2">
        <Label htmlFor="consent" className="text-sm font-medium">
          Do you agree to receive SMS messages from {companyName}? <span className="text-destructive">*</span>
        </Label>
        <Select value={formData.consent} onValueChange={(value) => onInputChange('consent', value)}>
          <SelectTrigger id="consent" name="consent" className="h-12 sm:h-10 text-base sm:text-sm" aria-required="true">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes, I agree</SelectItem>
            <SelectItem value="No">No, I do not agree</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Message and data rates may apply. Reply STOP to opt out at any time.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="privacy" className="text-sm font-medium">
          Do you agree to our privacy policy? <span className="text-destructive">*</span>
        </Label>
        <Select value={formData.privacy} onValueChange={(value) => onInputChange('privacy', value)}>
          <SelectTrigger id="privacy" name="privacy" className="h-12 sm:h-10 text-base sm:text-sm" aria-required="true">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes, I agree</SelectItem>
            <SelectItem value="No">No, I do not agree</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

ConsentSection.displayName = 'ConsentSection';
