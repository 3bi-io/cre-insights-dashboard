
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConsentSectionProps {
  formData: {
    consent: string;
    privacy: string;
  };
  onInputChange: (name: string, value: string) => void;
}

export const ConsentSection = React.memo(({ formData, onInputChange }: ConsentSectionProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground border-b pb-2">
        Consent
      </h2>
      
      <div className="space-y-2">
        <Label htmlFor="consent" className="text-sm font-medium">
          Do you agree to receive SMS messages from C.R. England?
        </Label>
        <Select value={formData.consent} onValueChange={(value) => onInputChange('consent', value)}>
          <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="privacy" className="text-sm font-medium">
          Do you agree to our privacy policy?
        </Label>
        <Select value={formData.privacy} onValueChange={(value) => onInputChange('privacy', value)}>
          <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

ConsentSection.displayName = 'ConsentSection';
