
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground border-b pb-2">CDL Information</h2>
      
      <div>
        <Label htmlFor="cdl">Do you have a CDL-A license?</Label>
        <Select value={formData.cdl} onValueChange={(value) => onInputChange('cdl', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select CDL status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
            <SelectItem value="Permit only">Permit only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="experience">Months of CDL-A driving experience?</Label>
        <Select value={formData.experience} onValueChange={(value) => onInputChange('experience', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select months of experience..." />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 48 }, (_, i) => i + 1).map(month => (
              <SelectItem key={month} value={month.toString()}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

CDLInfoSection.displayName = 'CDLInfoSection';
