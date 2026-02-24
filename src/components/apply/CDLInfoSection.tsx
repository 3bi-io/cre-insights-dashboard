import React from 'react';
import { Label } from "@/components/ui/label";
import { Truck, GraduationCap, Clock, Award, ShieldCheck } from 'lucide-react';
import { SelectionButtonGroup } from './SelectionButton';
import { Checkbox } from "@/components/ui/checkbox";

interface CDLInfoSectionProps {
  formData: {
    cdl: string;
    cdlClass: string;
    cdlEndorsements: string[];
    experience: string;
  };
  onInputChange: (name: string, value: string | string[]) => void;
  isActive?: boolean;
}

const CDL_OPTIONS = [
  { value: 'Yes', label: 'Yes, I have a CDL-A', description: 'Active Class A license', icon: <Award className="h-5 w-5" /> },
  { value: 'Permit', label: 'I have a CDL permit', description: 'Permit holder', icon: <GraduationCap className="h-5 w-5" /> },
  { value: 'InSchool', label: 'Currently in CDL school', description: 'In training now', icon: <GraduationCap className="h-5 w-5" /> },
  { value: 'No', label: 'No CDL-A', description: 'No license yet' },
];

const CDL_CLASS_OPTIONS = [
  { value: 'A', label: 'Class A', description: 'Combo vehicles' },
  { value: 'B', label: 'Class B', description: 'Heavy single' },
  { value: 'C', label: 'Class C', description: 'Hazmat/passenger' },
];

const CDL_ENDORSEMENTS = [
  { id: 'H', label: 'H - Hazardous Materials', description: 'Required for hazmat transport' },
  { id: 'N', label: 'N - Tank Vehicles', description: 'Liquid/gas tankers' },
  { id: 'P', label: 'P - Passenger', description: 'Buses and passenger vehicles' },
  { id: 'T', label: 'T - Double/Triple Trailers', description: 'Multiple trailer combinations' },
  { id: 'X', label: 'X - Hazmat + Tank', description: 'Combined H and N' },
  { id: 'S', label: 'S - School Bus', description: 'School bus endorsement' },
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
  const showCDLClass = formData.cdl === 'Yes' || formData.cdl === 'Permit';
  const showEndorsements = formData.cdl === 'Yes';
  
  const handleEndorsementChange = (endorsementId: string, checked: boolean) => {
    const current = formData.cdlEndorsements || [];
    if (checked) {
      onInputChange('cdlEndorsements', [...current, endorsementId]);
    } else {
      onInputChange('cdlEndorsements', current.filter(e => e !== endorsementId));
    }
  };

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
          name="cdl-status"
          label="CDL Status"
          options={CDL_OPTIONS}
          value={formData.cdl}
          onChange={(value) => onInputChange('cdl', value)}
          columns={2}
        />
      </div>
      
      {/* CDL Class - only show if they have a CDL */}
      {showCDLClass && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            CDL Class
          </Label>
          <SelectionButtonGroup
            name="cdl-class"
            label="CDL Class"
            options={CDL_CLASS_OPTIONS}
            value={formData.cdlClass}
            onChange={(value) => onInputChange('cdlClass', value)}
            columns={2}
          />
        </div>
      )}
      
      {/* Endorsements - only show if they have a full CDL */}
      {showEndorsements && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label className="text-sm font-medium">
            Endorsements <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CDL_ENDORSEMENTS.map((endorsement) => (
              <label
                key={endorsement.id}
                className="flex items-start gap-3 p-3 rounded-lg border-2 border-border hover:border-primary/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <Checkbox
                  id={`endorsement-${endorsement.id}`}
                  checked={(formData.cdlEndorsements || []).includes(endorsement.id)}
                  onCheckedChange={(checked) => handleEndorsementChange(endorsement.id, !!checked)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{endorsement.label}</span>
                  <p className="text-xs text-muted-foreground">{endorsement.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Experience */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          How much CDL-A driving experience? <span className="text-destructive">*</span>
        </Label>
        <SelectionButtonGroup
          name="experience-level"
          label="Driving Experience"
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
