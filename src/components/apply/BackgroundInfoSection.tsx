
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BackgroundInfoSectionProps {
  formData: {
    drug: string;
    veteran: string;
  };
  onInputChange: (name: string, value: string) => void;
}

export const BackgroundInfoSection = React.memo(({ formData, onInputChange }: BackgroundInfoSectionProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground border-b pb-2">Background Information</h2>
      
      <div>
        <Label htmlFor="drug">Can you pass a drug test?</Label>
        <Select value={formData.drug} onValueChange={(value) => onInputChange('drug', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="veteran">Are you a veteran?</Label>
        <Select value={formData.veteran} onValueChange={(value) => onInputChange('veteran', value)}>
          <SelectTrigger>
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

BackgroundInfoSection.displayName = 'BackgroundInfoSection';
