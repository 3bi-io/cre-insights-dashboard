import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CDLInfoSectionProps {
  formData: {
    cdl: string;
    experience: string;
  };
  onInputChange: (name: string, value: string) => void;
}

const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'No experience (0 months)' },
  { value: '1', label: '1 month' },
  { value: '2', label: '2 months' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '9', label: '9 months' },
  { value: '12', label: '1 year (12 months)' },
  { value: '18', label: '1.5 years (18 months)' },
  { value: '24', label: '2 years (24 months)' },
  { value: '36', label: '3 years (36 months)' },
  { value: '48', label: '4+ years (48+ months)' },
];

export const CDLInfoSection = React.memo(({ formData, onInputChange }: CDLInfoSectionProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground border-b pb-2">
        CDL Information
      </h2>
      
      <div className="space-y-2">
        <Label htmlFor="cdl" className="text-sm font-medium">
          Do you have a CDL-A license? <span className="text-destructive">*</span>
        </Label>
        <Select value={formData.cdl} onValueChange={(value) => onInputChange('cdl', value)}>
          <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm" aria-required="true">
            <SelectValue placeholder="Select CDL status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes, I have a CDL-A</SelectItem>
            <SelectItem value="No">No CDL-A</SelectItem>
            <SelectItem value="Permit">I have a CDL permit</SelectItem>
            <SelectItem value="InSchool">Currently in CDL school</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="experience" className="text-sm font-medium">
          CDL-A driving experience? <span className="text-destructive">*</span>
        </Label>
        <Select value={formData.experience} onValueChange={(value) => onInputChange('experience', value)}>
          <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm" aria-required="true">
            <SelectValue placeholder="Select your experience level..." />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {EXPERIENCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Include all verifiable CDL-A driving experience
        </p>
      </div>
    </div>
  );
});

CDLInfoSection.displayName = 'CDLInfoSection';
