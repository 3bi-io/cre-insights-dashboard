import React, { useCallback, useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useZipCodeLookup } from '@/hooks/useZipCodeLookup';
import { Loader2, CheckCircle2 } from 'lucide-react';

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

interface PersonalInfoSectionProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    zip: string;
    over21: string;
  };
  onInputChange: (name: string, value: string) => void;
}

// Format phone number as user types
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export const PersonalInfoSection = React.memo(({ formData, onInputChange }: PersonalInfoSectionProps) => {
  // ZIP code auto-lookup for city/state
  const { city: lookupCity, state: lookupState, isLoading: isZipLoading } = useZipCodeLookup(formData.zip);
  const [wasAutoFilled, setWasAutoFilled] = useState(false);

  // Auto-fill city and state when ZIP lookup returns data
  useEffect(() => {
    if (lookupCity && lookupState) {
      onInputChange('city', lookupCity);
      onInputChange('state', lookupState);
      setWasAutoFilled(true);
    }
  }, [lookupCity, lookupState, onInputChange]);

  // Reset auto-fill indicator when zip changes
  useEffect(() => {
    if (!formData.zip || formData.zip.length < 5) {
      setWasAutoFilled(false);
    }
  }, [formData.zip]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onInputChange('phone', formatted);
  }, [onInputChange]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-foreground border-b pb-2">
        Personal Information
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            required
            aria-required="true"
            placeholder="Enter your first name"
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            required
            aria-required="true"
            placeholder="Enter your last name"
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            required
            aria-required="true"
            placeholder="Enter your email"
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            required
            aria-required="true"
            className="h-12 sm:h-10 text-base sm:text-sm"
            maxLength={14}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="zip" className="text-sm font-medium">
            ZIP Code <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="zip"
              name="zip"
              autoComplete="postal-code"
              value={formData.zip}
              onChange={(e) => onInputChange('zip', e.target.value)}
              required
              aria-required="true"
              placeholder="Enter ZIP code"
              className="h-12 sm:h-10 text-base sm:text-sm pr-10"
              maxLength={10}
            />
            {isZipLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {wasAutoFilled && !isZipLoading && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
            City
            {wasAutoFilled && <span className="text-xs text-muted-foreground">(auto-filled)</span>}
          </Label>
          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            value={formData.city}
            onChange={(e) => {
              onInputChange('city', e.target.value);
              setWasAutoFilled(false);
            }}
            placeholder="Enter your city"
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" className="text-sm font-medium flex items-center gap-2">
            State
            {wasAutoFilled && <span className="text-xs text-muted-foreground">(auto-filled)</span>}
          </Label>
          <Select 
            value={formData.state} 
            onValueChange={(value) => {
              onInputChange('state', value);
              setWasAutoFilled(false);
            }}
          >
            <SelectTrigger id="state" name="state" className="h-12 sm:h-10 text-base sm:text-sm">
              <SelectValue placeholder="Select state..." />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {US_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="over21" className="text-sm font-medium">
          Are you over 21? <span className="text-destructive">*</span>
        </Label>
        <Select value={formData.over21} onValueChange={(value) => onInputChange('over21', value)}>
          <SelectTrigger id="over21" name="over21" className="h-12 sm:h-10 text-base sm:text-sm" aria-required="true">
            <SelectValue placeholder="Select your age status..." />
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

PersonalInfoSection.displayName = 'PersonalInfoSection';
