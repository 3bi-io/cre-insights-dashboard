import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Calendar as CalendarIcon, CheckCircle2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SelectionButtonGroup } from '../SelectionButton';
import type { DetailedFormData } from '@/hooks/useDetailedApplicationForm';

interface DetailedPersonalSectionProps {
  formData: DetailedFormData;
  onInputChange: (field: string, value: unknown) => void;
  isActive?: boolean;
}

const PREFIX_OPTIONS = [
  { value: 'mr', label: 'Mr.' },
  { value: 'mrs', label: 'Mrs.' },
  { value: 'ms', label: 'Ms.' },
  { value: 'dr', label: 'Dr.' },
];

const SUFFIX_OPTIONS = [
  { value: 'jr', label: 'Jr.' },
  { value: 'sr', label: 'Sr.' },
  { value: 'ii', label: 'II' },
  { value: 'iii', label: 'III' },
];

const ID_TYPE_OPTIONS = [
  { value: 'drivers_license', label: "Driver's License", icon: <CreditCard className="h-5 w-5" /> },
  { value: 'state_id', label: 'State ID', icon: <CreditCard className="h-5 w-5" /> },
  { value: 'passport', label: 'Passport', icon: <CreditCard className="h-5 w-5" /> },
];

const isValidField = (value: string) => value.trim().length > 0;

export const DetailedPersonalSection = React.memo(({ 
  formData, 
  onInputChange,
  isActive 
}: DetailedPersonalSectionProps) => {
  const firstNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && firstNameRef.current) {
      setTimeout(() => firstNameRef.current?.focus(), 300);
    }
  }, [isActive]);

  const formatSSN = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 4);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
          <User className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Personal Information
        </h2>
        <p className="text-muted-foreground mt-1">
          Let's start with your basic details
        </p>
      </div>

      {/* Prefix Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Title (Optional)</Label>
        <div className="flex flex-wrap gap-2">
          {PREFIX_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onInputChange('prefix', formData.prefix === option.value ? '' : option.value)}
              className={cn(
                "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all touch-manipulation",
                formData.prefix === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:border-primary/50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
            First Name <span className="text-destructive">*</span>
            {isValidField(formData.firstName) && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </Label>
          <Input
            ref={firstNameRef}
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            placeholder="John"
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="middleName" className="text-sm font-medium">
            Middle Name
          </Label>
          <Input
            id="middleName"
            value={formData.middleName}
            onChange={(e) => onInputChange('middleName', e.target.value)}
            placeholder="Michael"
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium flex items-center gap-2">
            Last Name <span className="text-destructive">*</span>
            {isValidField(formData.lastName) && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            placeholder="Doe"
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Suffix (Optional)</Label>
          <div className="flex flex-wrap gap-2">
            {SUFFIX_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onInputChange('suffix', formData.suffix === option.value ? '' : option.value)}
                className={cn(
                  "px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all touch-manipulation",
                  formData.suffix === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:border-primary/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          Date of Birth
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-14 justify-start text-left font-normal rounded-xl border-2",
                !formData.dateOfBirth && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : "Select your date of birth"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={formData.dateOfBirth || undefined}
              onSelect={(date) => onInputChange('dateOfBirth', date || null)}
              className="pointer-events-auto"
              initialFocus
              captionLayout="dropdown-buttons"
              fromYear={1940}
              toYear={new Date().getFullYear() - 18}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* SSN and Government ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ssn" className="text-sm font-medium">
            SSN (Last 4 digits)
          </Label>
          <Input
            id="ssn"
            value={formData.ssn}
            onChange={(e) => onInputChange('ssn', formatSSN(e.target.value))}
            placeholder="1234"
            maxLength={4}
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
          <p className="text-xs text-muted-foreground">Only the last 4 digits for verification</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="governmentId" className="text-sm font-medium">
            Government ID Number
          </Label>
          <Input
            id="governmentId"
            value={formData.governmentId}
            onChange={(e) => onInputChange('governmentId', e.target.value)}
            placeholder="ID number"
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* ID Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">ID Type</Label>
        <SelectionButtonGroup
          options={ID_TYPE_OPTIONS}
          value={formData.governmentIdType}
          onChange={(value) => onInputChange('governmentIdType', value)}
          columns={3}
        />
      </div>
    </div>
  );
});

DetailedPersonalSection.displayName = 'DetailedPersonalSection';
