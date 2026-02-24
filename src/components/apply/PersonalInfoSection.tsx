import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useZipCodeLookup } from '@/hooks/useZipCodeLookup';
import { Loader2, CheckCircle2, User, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectionButtonGroup } from './SelectionButton';
import { formatPhoneInput, wasCountryCodeDetected, isValidUSPhone } from '@/utils/phoneFormatter';
import { AddressAutocompleteInput } from '@/components/shared/AddressAutocompleteInput';
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
    address: string;
    city: string;
    state: string;
    zip: string;
    over21: string;
  };
  onInputChange: (name: string, value: string) => void;
  isActive?: boolean;
}

const isValidField = (value: string, type?: 'email' | 'phone' | 'zip') => {
  if (!value.trim()) return false;
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (type === 'phone') return isValidUSPhone(value);
  if (type === 'zip') return value.length >= 5;
  return value.trim().length > 0;
};

export const PersonalInfoSection = React.memo(({ formData, onInputChange, isActive }: PersonalInfoSectionProps) => {
  const firstNameRef = useRef<HTMLInputElement>(null);
  const { city: lookupCity, state: lookupState, isLoading: isZipLoading } = useZipCodeLookup(formData.zip);
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const [phoneWasReformatted, setPhoneWasReformatted] = useState(false);

  // Auto-focus first field when becoming active
  useEffect(() => {
    if (isActive && firstNameRef.current) {
      setTimeout(() => firstNameRef.current?.focus(), 300);
    }
  }, [isActive]);

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
    const rawValue = e.target.value;
    const formatted = formatPhoneInput(rawValue);
    
    // Detect if country code was stripped (for user feedback)
    setPhoneWasReformatted(wasCountryCodeDetected(rawValue));
    
    onInputChange('phone', formatted);
  }, [onInputChange]);

  const AGE_OPTIONS = [
    { value: 'Yes', label: 'Yes, I am 21 or older', description: 'Required for CDL driving' },
    { value: 'No', label: 'No, I am under 21' },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
          <User className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Let's start with your info
        </h2>
        <p className="text-muted-foreground mt-1">
          We'll use this to contact you about your application
        </p>
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
            name="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            required
            aria-required="true"
            placeholder="John"
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium flex items-center gap-2">
            Last Name <span className="text-destructive">*</span>
            {isValidField(formData.lastName) && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </Label>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            required
            aria-required="true"
            placeholder="Doe"
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Contact Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email <span className="text-destructive">*</span>
            {isValidField(formData.email, 'email') && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
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
            placeholder="john@example.com"
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Phone Number <span className="text-destructive">*</span>
            {isValidField(formData.phone, 'phone') && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
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
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
            maxLength={14}
          />
          {phoneWasReformatted && formData.phone && (
            <p className="text-xs text-muted-foreground mt-1">
              Country code detected and formatted for US
            </p>
          )}
        </div>
      </div>

      {/* Location Fields */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">Location</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">
            Address
          </Label>
          <AddressAutocompleteInput
            id="address"
            name="address"
            autoComplete="street-address"
            value={formData.address}
            onChange={(value) => onInputChange('address', value)}
            onPlaceSelect={(address, city, state, zip) => {
              onInputChange('address', address);
              onInputChange('city', city);
              onInputChange('state', state);
              onInputChange('zip', zip);
              setWasAutoFilled(true);
            }}
            placeholder="Start typing an address..."
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zip" className="text-sm font-medium flex items-center gap-2">
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
                placeholder="12345"
                className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors pr-10"
                maxLength={10}
              />
              {isZipLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
              )}
              {wasAutoFilled && !isZipLoading && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
              City
              {wasAutoFilled && <span className="text-xs text-green-600 font-normal">(auto-filled)</span>}
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
              placeholder="City"
              className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium flex items-center gap-2">
              State
              {wasAutoFilled && <span className="text-xs text-green-600 font-normal">(auto-filled)</span>}
            </Label>
            <Select 
              value={formData.state} 
              onValueChange={(value) => {
                onInputChange('state', value);
                setWasAutoFilled(false);
              }}
            >
              <SelectTrigger id="state" name="state" className="h-14 text-base rounded-xl border-2">
                <SelectValue placeholder="Select..." />
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
      </div>

      {/* Age Verification */}
      <div className="space-y-3 pt-2">
        <Label className="text-sm font-medium">
          Are you 21 or older? <span className="text-destructive">*</span>
        </Label>
        <SelectionButtonGroup
          options={AGE_OPTIONS}
          value={formData.over21}
          onChange={(value) => onInputChange('over21', value)}
          columns={2}
        />
      </div>
    </div>
  );
});

PersonalInfoSection.displayName = 'PersonalInfoSection';
