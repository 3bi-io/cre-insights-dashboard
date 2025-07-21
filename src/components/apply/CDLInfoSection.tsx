
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

export const CDLInfoSection = React.memo(({ formData, onInputChange }: CDLInfoSectionProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground border-b pb-2">
        CDL Information
      </h2>
      
      <div className="space-y-2">
        <Label htmlFor="cdl" className="text-sm font-medium">Do you have a CDL-A license?</Label>
        <Select value={formData.cdl} onValueChange={(value) => onInputChange('cdl', value)}>
          <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
            <SelectValue placeholder="Select CDL status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
            <SelectItem value="Permit only">Permit only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="experience" className="text-sm font-medium">Months of CDL-A driving experience?</Label>
        <Select value={formData.experience} onValueChange={(value) => onInputChange('experience', value)}>
          <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
            <SelectValue placeholder="Select months of experience..." />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {Array.from({ length: 48 }, (_, i) => i + 1).map(month => (
              <SelectItem key={month} value={month.toString()}>{month} month{month > 1 ? 's' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

CDLInfoSection.displayName = 'CDLInfoSection';
