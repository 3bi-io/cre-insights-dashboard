import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Shield, Calendar as CalendarIcon, Briefcase, Globe, MapPin, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SelectionButtonGroup } from '../SelectionButton';
import type { DetailedFormData } from '@/hooks/useDetailedApplicationForm';

interface DetailedBackgroundSectionProps {
  formData: DetailedFormData;
  onInputChange: (field: string, value: unknown) => void;
  isActive?: boolean;
  isFieldEnabled?: (key: string) => boolean;
  isFieldRequired?: (key: string) => boolean;
}

const FELONY_OPTIONS = [
  { value: 'no', label: 'No', description: 'No felony convictions' },
  { value: 'yes', label: 'Yes', description: 'I will provide details' },
];

const PASSPORT_OPTIONS = [
  { value: 'yes', label: 'Yes', icon: <Globe className="h-5 w-5" /> },
  { value: 'no', label: 'No' },
  { value: 'willing_to_obtain', label: 'Willing to Obtain' },
];

const WORK_PREFERENCE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'sometimes', label: 'Sometimes' },
];

const RELOCATE_OPTIONS = [
  { value: 'yes', label: 'Yes', icon: <MapPin className="h-5 w-5" /> },
  { value: 'no', label: 'No' },
  { value: 'depends', label: 'Depends on Location' },
];

const HOW_HEARD_OPTIONS = [
  { value: 'job_board', label: 'Job Board' },
  { value: 'company_website', label: 'Company Website' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'referral', label: 'Employee Referral' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'job_fair', label: 'Job Fair' },
  { value: 'other', label: 'Other' },
];

export const DetailedBackgroundSection = React.memo(({ 
  formData, 
  onInputChange,
  isActive,
  isFieldEnabled = () => true,
  isFieldRequired = () => false,
}: DetailedBackgroundSectionProps) => {
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
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Background & Preferences
        </h2>
        <p className="text-muted-foreground mt-1">
          A few more details to complete your profile
        </p>
      </div>

      {/* Felony Question */}
      {isFieldEnabled('convictedFelony') && (
        <>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Have you been convicted of a felony?</Label>
            <SelectionButtonGroup options={FELONY_OPTIONS} value={formData.convictedFelony} onChange={(value) => onInputChange('convictedFelony', value)} columns={2} />
          </div>
          {formData.convictedFelony === 'yes' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Label htmlFor="felonyDetails" className="text-sm font-medium">Please provide details</Label>
              <Textarea id="felonyDetails" value={formData.felonyDetails} onChange={(e) => onInputChange('felonyDetails', e.target.value)}
                placeholder="Please describe the nature and date of conviction" rows={3}
                className="text-base rounded-xl border-2 focus:border-primary transition-colors resize-none" />
              <p className="text-xs text-muted-foreground">A conviction does not automatically disqualify you from employment</p>
            </div>
          )}
        </>
      )}

      {/* Passport Card */}
      {isFieldEnabled('passportCard') && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Passport Card</Label>
          <SelectionButtonGroup options={PASSPORT_OPTIONS} value={formData.passportCard} onChange={(value) => onInputChange('passportCard', value)} columns={3} />
        </div>
      )}

      {/* Work Preferences Section */}
      {(isFieldEnabled('canWorkWeekends') || isFieldEnabled('canWorkNights') || isFieldEnabled('willingToRelocate') || isFieldEnabled('salaryExpectations') || isFieldEnabled('preferredStartDate')) && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm font-medium">Work Preferences</span>
          </div>

          {(isFieldEnabled('canWorkWeekends') || isFieldEnabled('canWorkNights')) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {isFieldEnabled('canWorkWeekends') && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Can you work weekends?</Label>
                  <SelectionButtonGroup options={WORK_PREFERENCE_OPTIONS} value={formData.canWorkWeekends} onChange={(value) => onInputChange('canWorkWeekends', value)} columns={3} />
                </div>
              )}
              {isFieldEnabled('canWorkNights') && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Can you work nights?</Label>
                  <SelectionButtonGroup options={WORK_PREFERENCE_OPTIONS} value={formData.canWorkNights} onChange={(value) => onInputChange('canWorkNights', value)} columns={3} />
                </div>
              )}
            </div>
          )}

          {isFieldEnabled('willingToRelocate') && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Willing to relocate?</Label>
              <SelectionButtonGroup options={RELOCATE_OPTIONS} value={formData.willingToRelocate} onChange={(value) => onInputChange('willingToRelocate', value)} columns={3} />
            </div>
          )}

          {(isFieldEnabled('preferredStartDate') || isFieldEnabled('salaryExpectations')) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isFieldEnabled('preferredStartDate') && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preferred Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-14 justify-start text-left font-normal rounded-xl border-2", !formData.preferredStartDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.preferredStartDate ? format(formData.preferredStartDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar mode="single" selected={formData.preferredStartDate || undefined} onSelect={(date) => onInputChange('preferredStartDate', date || null)} className="pointer-events-auto" initialFocus disabled={(date) => date < new Date()} />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {isFieldEnabled('salaryExpectations') && (
                <div className="space-y-2">
                  <Label htmlFor="salaryExpectations" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Salary Expectations
                  </Label>
                  <Input id="salaryExpectations" value={formData.salaryExpectations} onChange={(e) => onInputChange('salaryExpectations', e.target.value)}
                    placeholder="e.g., $50,000-$60,000" className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* How Did You Hear Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <Label className="text-sm font-medium">How did you hear about us?</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HOW_HEARD_OPTIONS.map((option) => (
            <button key={option.value} type="button" onClick={() => onInputChange('howDidYouHear', option.value)}
              className={cn("p-3 rounded-xl border-2 text-sm font-medium transition-all touch-manipulation text-center",
                formData.howDidYouHear === option.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/50"
              )}>{option.label}</button>
          ))}
        </div>
        {formData.howDidYouHear === 'referral' && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
            <Label htmlFor="referralSource" className="text-sm font-medium">Who referred you?</Label>
            <Input id="referralSource" value={formData.referralSource} onChange={(e) => onInputChange('referralSource', e.target.value)}
              placeholder="Employee name" className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors" />
          </div>
        )}
      </div>
    </div>
  );
});

DetailedBackgroundSection.displayName = 'DetailedBackgroundSection';
