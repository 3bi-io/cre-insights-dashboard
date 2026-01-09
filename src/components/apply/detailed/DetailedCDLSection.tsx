import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Truck, Calendar as CalendarIcon, CheckCircle, XCircle, Shield, Award, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SelectionButtonGroup } from '../SelectionButton';
import type { DetailedFormData } from '@/hooks/useDetailedApplicationForm';

interface DetailedCDLSectionProps {
  formData: DetailedFormData;
  onInputChange: (field: string, value: unknown) => void;
  onEndorsementToggle: (endorsement: string) => void;
  isActive?: boolean;
}

const CDL_OPTIONS = [
  { value: 'yes', label: 'Yes, I have a CDL', description: 'Commercial Driver\'s License holder', icon: <CheckCircle className="h-5 w-5" /> },
  { value: 'no', label: 'No CDL yet', description: 'Looking to obtain one', icon: <XCircle className="h-5 w-5" /> },
];

const CDL_CLASS_OPTIONS = [
  { value: 'A', label: 'Class A', description: 'Tractor-trailer, tanks, flatbeds' },
  { value: 'B', label: 'Class B', description: 'Straight trucks, buses' },
  { value: 'C', label: 'Class C', description: 'Small passenger, hazmat' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'no experience', label: 'No Experience', icon: <Clock className="h-5 w-5" /> },
  { value: 'less than 3 months', label: '< 3 Months' },
  { value: '3-6 months', label: '3-6 Months' },
  { value: '6-12 months', label: '6-12 Months' },
  { value: '1-2 years', label: '1-2 Years' },
  { value: '2-5 years', label: '2-5 Years' },
  { value: '5+ years', label: '5+ Years', description: 'Experienced driver', icon: <Award className="h-5 w-5" /> },
];

const ENDORSEMENTS = [
  { code: 'H', name: 'Hazmat', description: 'Hazardous materials' },
  { code: 'N', name: 'Tank', description: 'Tank vehicles' },
  { code: 'P', name: 'Passenger', description: 'Passenger transport' },
  { code: 'S', name: 'School Bus', description: 'School bus driving' },
  { code: 'T', name: 'Doubles/Triples', description: 'Double/Triple trailers' },
  { code: 'X', name: 'Hazmat + Tank', description: 'Combined endorsement' },
];

const HAZMAT_OPTIONS = [
  { value: 'yes', label: 'Yes', icon: <CheckCircle className="h-5 w-5" /> },
  { value: 'no', label: 'No' },
  { value: 'willing_to_obtain', label: 'Willing to Obtain' },
];

const TWIC_OPTIONS = [
  { value: 'yes', label: 'Yes, I have TWIC', icon: <Shield className="h-5 w-5" /> },
  { value: 'no', label: 'No' },
  { value: 'willing_to_obtain', label: 'Willing to Obtain' },
];

export const DetailedCDLSection = React.memo(({ 
  formData, 
  onInputChange,
  onEndorsementToggle,
  isActive 
}: DetailedCDLSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isActive]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Section Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
          <Truck className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          CDL & Driving Experience
        </h2>
        <p className="text-muted-foreground mt-1">
          Tell us about your commercial driving qualifications
        </p>
      </div>

      {/* CDL Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Do you have a CDL? <span className="text-destructive">*</span>
        </Label>
        <SelectionButtonGroup
          options={CDL_OPTIONS}
          value={formData.cdl}
          onChange={(value) => onInputChange('cdl', value)}
          columns={2}
        />
      </div>

      {/* Experience Level */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Commercial Driving Experience</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EXPERIENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onInputChange('experience', option.value)}
              className={cn(
                "p-3 rounded-xl border-2 text-sm font-medium transition-all touch-manipulation text-center",
                formData.experience === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-primary/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* CDL Details (shown only if CDL = yes) */}
      {formData.cdl === 'yes' && (
        <div className="space-y-6 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-300">
          {/* CDL Class */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">CDL Class</Label>
            <SelectionButtonGroup
              options={CDL_CLASS_OPTIONS}
              value={formData.cdlClass}
              onChange={(value) => onInputChange('cdlClass', value)}
              columns={3}
            />
          </div>

          {/* CDL State and Expiration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cdlState" className="text-sm font-medium">
                CDL State
              </Label>
              <Input
                id="cdlState"
                value={formData.cdlState}
                onChange={(e) => onInputChange('cdlState', e.target.value.toUpperCase())}
                placeholder="TX"
                maxLength={2}
                className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">CDL Expiration Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-14 justify-start text-left font-normal rounded-xl border-2",
                      !formData.cdlExpirationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.cdlExpirationDate ? format(formData.cdlExpirationDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.cdlExpirationDate || undefined}
                    onSelect={(date) => onInputChange('cdlExpirationDate', date || null)}
                    className="pointer-events-auto"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Endorsements */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">CDL Endorsements (select all that apply)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ENDORSEMENTS.map((endorsement) => (
                <button
                  key={endorsement.code}
                  type="button"
                  onClick={() => onEndorsementToggle(endorsement.code)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all touch-manipulation",
                    formData.cdlEndorsements.includes(endorsement.code)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-lg font-bold",
                      formData.cdlEndorsements.includes(endorsement.code) ? "text-primary" : "text-foreground"
                    )}>
                      {endorsement.code}
                    </span>
                    {formData.cdlEndorsements.includes(endorsement.code) && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{endorsement.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Driving Years */}
      <div className="space-y-2">
        <Label htmlFor="drivingExperienceYears" className="text-sm font-medium">
          Total Years of Driving Experience
        </Label>
        <Input
          id="drivingExperienceYears"
          type="number"
          min="0"
          max="50"
          value={formData.drivingExperienceYears}
          onChange={(e) => onInputChange('drivingExperienceYears', e.target.value)}
          placeholder="Years of experience"
          className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
        />
      </div>

      {/* HAZMAT & TWIC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">HAZMAT Endorsement</Label>
          <SelectionButtonGroup
            options={HAZMAT_OPTIONS}
            value={formData.hazmatEndorsement}
            onChange={(value) => onInputChange('hazmatEndorsement', value)}
            columns={1}
          />
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-medium">TWIC Card</Label>
          <SelectionButtonGroup
            options={TWIC_OPTIONS}
            value={formData.twicCard}
            onChange={(value) => onInputChange('twicCard', value)}
            columns={1}
          />
        </div>
      </div>

      {/* Medical & DOT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Medical Card Expiration</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-14 justify-start text-left font-normal rounded-xl border-2",
                  !formData.medicalCardExpiration && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.medicalCardExpiration ? format(formData.medicalCardExpiration, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={formData.medicalCardExpiration || undefined}
                onSelect={(date) => onInputChange('medicalCardExpiration', date || null)}
                className="pointer-events-auto"
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Last DOT Physical</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-14 justify-start text-left font-normal rounded-xl border-2",
                  !formData.dotPhysicalDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dotPhysicalDate ? format(formData.dotPhysicalDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={formData.dotPhysicalDate || undefined}
                onSelect={(date) => onInputChange('dotPhysicalDate', date || null)}
                className="pointer-events-auto"
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Accident & Violation History */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accidentHistory" className="text-sm font-medium">
            Accident History (last 3 years)
          </Label>
          <Textarea
            id="accidentHistory"
            value={formData.accidentHistory}
            onChange={(e) => onInputChange('accidentHistory', e.target.value)}
            placeholder="Please describe any accidents in the last 3 years, or type 'None'"
            rows={3}
            className="text-base rounded-xl border-2 focus:border-primary transition-colors resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="violationHistory" className="text-sm font-medium">
            Moving Violations (last 3 years)
          </Label>
          <Textarea
            id="violationHistory"
            value={formData.violationHistory}
            onChange={(e) => onInputChange('violationHistory', e.target.value)}
            placeholder="Please describe any moving violations in the last 3 years, or type 'None'"
            rows={3}
            className="text-base rounded-xl border-2 focus:border-primary transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
});

DetailedCDLSection.displayName = 'DetailedCDLSection';
