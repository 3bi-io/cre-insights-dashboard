import React, { useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Briefcase, Calendar as CalendarIcon, GraduationCap, Medal, CheckCircle, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SelectionButtonGroup } from '../SelectionButton';
import type { DetailedFormData, EmployerEntry } from '@/hooks/useDetailedApplicationForm';

interface DetailedExperienceSectionProps {
  formData: DetailedFormData;
  onInputChange: (field: string, value: unknown) => void;
  isActive?: boolean;
  isFieldEnabled?: (key: string) => boolean;
  isFieldRequired?: (key: string) => boolean;
}

const EDUCATION_OPTIONS = [
  { value: 'less_than_high_school', label: 'Less than High School' },
  { value: 'high_school', label: 'High School/GED' },
  { value: 'some_college', label: 'Some College' },
  { value: 'associates', label: "Associate's Degree" },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate' },
];

const WORK_AUTH_OPTIONS = [
  { value: 'us_citizen', label: 'US Citizen', description: 'Born or naturalized citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident', description: 'Green card holder' },
  { value: 'work_visa', label: 'Work Visa', description: 'H-1B, L-1, etc.' },
  { value: 'other', label: 'Other' },
];

const MILITARY_OPTIONS = [
  { value: 'yes', label: 'Yes, I served', description: 'Thank you for your service!', icon: <Medal className="h-5 w-5" /> },
  { value: 'no', label: 'No military service' },
];

const VETERAN_OPTIONS = [
  { value: 'yes', label: 'Yes, I am a veteran', icon: <Medal className="h-5 w-5" /> },
  { value: 'no', label: 'No' },
];

const MILITARY_BRANCHES = [
  { value: 'army', label: 'Army' },
  { value: 'navy', label: 'Navy' },
  { value: 'air_force', label: 'Air Force' },
  { value: 'marines', label: 'Marines' },
  { value: 'coast_guard', label: 'Coast Guard' },
  { value: 'space_force', label: 'Space Force' },
];

export const DetailedExperienceSection = React.memo(({ 
  formData, 
  onInputChange,
  isActive,
  isFieldEnabled = () => true,
  isFieldRequired = () => false,
}: DetailedExperienceSectionProps) => {
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
          <Briefcase className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Experience & Background
        </h2>
        <p className="text-muted-foreground mt-1">
          Share your work history and qualifications
        </p>
      </div>

      {/* Employment History */}
      {isFieldEnabled('employers') && (
        <div className="space-y-6">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Previous Employment {isFieldRequired('employers') && <span className="text-destructive">*</span>}
          </Label>
          <p className="text-xs text-muted-foreground -mt-4">
            List up to 3 previous employers, starting with the most recent. All fields are optional.
          </p>

          {formData.employers.map((employer, index) => (
            <div key={index} className="space-y-3 p-4 rounded-xl border-2 border-border bg-muted/30">
              <h4 className="text-sm font-semibold text-foreground">Employer {index + 1}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Company Name</Label>
                  <Input value={employer.companyName} onChange={(e) => { const updated = [...formData.employers]; updated[index] = { ...updated[index], companyName: e.target.value }; onInputChange('employers', updated); }}
                    placeholder="Company name" className="text-base rounded-xl border-2 focus:border-primary transition-colors h-12" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Company Phone</Label>
                  <Input type="tel" value={employer.phone} onChange={(e) => { const updated = [...formData.employers]; updated[index] = { ...updated[index], phone: e.target.value }; onInputChange('employers', updated); }}
                    placeholder="(555) 555-5555" className="text-base rounded-xl border-2 focus:border-primary transition-colors h-12" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">City</Label>
                  <Input value={employer.city} onChange={(e) => { const updated = [...formData.employers]; updated[index] = { ...updated[index], city: e.target.value }; onInputChange('employers', updated); }}
                    placeholder="City" className="text-base rounded-xl border-2 focus:border-primary transition-colors h-12" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">State</Label>
                  <Input value={employer.state} onChange={(e) => { const updated = [...formData.employers]; updated[index] = { ...updated[index], state: e.target.value }; onInputChange('employers', updated); }}
                    placeholder="State" className="text-base rounded-xl border-2 focus:border-primary transition-colors h-12" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <Input type="month" value={employer.startDate} onChange={(e) => { const updated = [...formData.employers]; updated[index] = { ...updated[index], startDate: e.target.value }; onInputChange('employers', updated); }}
                    className="text-base rounded-xl border-2 focus:border-primary transition-colors h-12" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <Input type="month" value={employer.endDate} onChange={(e) => { const updated = [...formData.employers]; updated[index] = { ...updated[index], endDate: e.target.value }; onInputChange('employers', updated); }}
                    className="text-base rounded-xl border-2 focus:border-primary transition-colors h-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Education Level */}
      {isFieldEnabled('educationLevel') && (
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            Education Level {isFieldRequired('educationLevel') && <span className="text-destructive">*</span>}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EDUCATION_OPTIONS.map((option) => (
              <button key={option.value} type="button" onClick={() => onInputChange('educationLevel', option.value)}
                className={cn("p-3 rounded-xl border-2 text-sm font-medium transition-all touch-manipulation text-center",
                  formData.educationLevel === option.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/50"
                )}>{option.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Work Authorization */}
      {isFieldEnabled('workAuthorization') && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Work Authorization Status {isFieldRequired('workAuthorization') && <span className="text-destructive">*</span>}</Label>
          <SelectionButtonGroup options={WORK_AUTH_OPTIONS} value={formData.workAuthorization} onChange={(value) => onInputChange('workAuthorization', value)} columns={2} />
        </div>
      )}

      {/* Military Service Section */}
      {isFieldEnabled('militaryService') && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Medal className="h-4 w-4" />
            <span className="text-sm font-medium">Military Service</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Have you served in the military?</Label>
              <SelectionButtonGroup options={MILITARY_OPTIONS} value={formData.militaryService} onChange={(value) => onInputChange('militaryService', value)} columns={1} />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Veteran Status</Label>
              <SelectionButtonGroup options={VETERAN_OPTIONS} value={formData.veteranStatus} onChange={(value) => onInputChange('veteranStatus', value)} columns={1} />
            </div>
          </div>

          {formData.militaryService === 'yes' && (
            <div className="space-y-4 pt-4 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Branch of Service</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MILITARY_BRANCHES.map((branch) => (
                    <button key={branch.value} type="button" onClick={() => onInputChange('militaryBranch', branch.value)}
                      className={cn("p-3 rounded-xl border-2 text-sm font-medium transition-all touch-manipulation",
                        formData.militaryBranch === branch.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/50"
                      )}>
                      <div className="flex items-center justify-center gap-2">
                        {formData.militaryBranch === branch.value && <CheckCircle className="h-4 w-4" />}
                        {branch.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Service Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-14 justify-start text-left font-normal rounded-xl border-2", !formData.militaryStartDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.militaryStartDate ? format(formData.militaryStartDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar mode="single" selected={formData.militaryStartDate || undefined} onSelect={(date) => onInputChange('militaryStartDate', date || null)} className="pointer-events-auto" initialFocus captionLayout="dropdown-buttons" fromYear={1970} toYear={new Date().getFullYear()} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Service End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-14 justify-start text-left font-normal rounded-xl border-2", !formData.militaryEndDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.militaryEndDate ? format(formData.militaryEndDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar mode="single" selected={formData.militaryEndDate || undefined} onSelect={(date) => onInputChange('militaryEndDate', date || null)} className="pointer-events-auto" initialFocus captionLayout="dropdown-buttons" fromYear={1970} toYear={new Date().getFullYear()} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

DetailedExperienceSection.displayName = 'DetailedExperienceSection';
