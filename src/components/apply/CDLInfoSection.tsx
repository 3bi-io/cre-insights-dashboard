import React from 'react';
import { Label } from "@/components/ui/label";
import { Truck, GraduationCap, Clock, Award } from 'lucide-react';
import { SelectionButtonGroup } from './SelectionButton';

interface CDLInfoSectionProps {
  formData: {
    cdl: string;
    experience: string;
  };
  onInputChange: (name: string, value: string) => void;
  isActive?: boolean;
}

const CDL_OPTIONS = [
  { value: 'Yes', label: 'Yes, I have a CDL-A', description: 'Active Class A license', icon: <Award className="h-5 w-5" /> },
  { value: 'Permit', label: 'I have a CDL permit', description: 'Permit holder', icon: <GraduationCap className="h-5 w-5" /> },
  { value: 'InSchool', label: 'Currently in CDL school', description: 'In training now', icon: <GraduationCap className="h-5 w-5" /> },
  { value: 'No', label: 'No CDL-A', description: 'No license yet' },
];

const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'No experience', description: 'Just starting out' },
  { value: '3', label: '1-3 months', description: 'Recent graduate' },
  { value: '6', label: '4-6 months', description: 'Some experience' },
  { value: '12', label: '6-12 months', description: 'Building skills' },
  { value: '24', label: '1-2 years', description: 'Experienced driver' },
  { value: '36', label: '2-3 years', description: 'Seasoned professional' },
  { value: '48', label: '4+ years', description: 'Veteran driver' },
];

export const CDLInfoSection = React.memo(({ formData, onInputChange, isActive }: CDLInfoSectionProps) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
          <Truck className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Tell us about your CDL
        </h2>
        <p className="text-muted-foreground mt-1">
          Your license and experience help us match you with the right opportunities
        </p>
      </div>
      
      {/* CDL Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Do you have a CDL-A license? <span className="text-destructive">*</span>
        </Label>
        <SelectionButtonGroup
          options={CDL_OPTIONS}
          value={formData.cdl}
          onChange={(value) => onInputChange('cdl', value)}
          columns={2}
        />
      </div>
      
      {/* Experience */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          How much CDL-A driving experience? <span className="text-destructive">*</span>
        </Label>
        <SelectionButtonGroup
          options={EXPERIENCE_OPTIONS}
          value={formData.experience}
          onChange={(value) => onInputChange('experience', value)}
          columns={2}
        />
        <p className="text-xs text-muted-foreground text-center mt-2">
          Include all verifiable CDL-A driving experience
        </p>
      </div>
    </div>
  );
});

CDLInfoSection.displayName = 'CDLInfoSection';
