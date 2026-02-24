import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Mail, Phone, CheckCircle2, Loader2, Users } from 'lucide-react';
import { useZipCodeLookup } from '@/hooks/useZipCodeLookup';
import { SelectionButtonGroup } from '../SelectionButton';
import type { DetailedFormData } from '@/hooks/useDetailedApplicationForm';
import { formatPhoneInput, wasCountryCodeDetected, isValidUSPhone } from '@/utils/phoneFormatter';
import { AddressAutocompleteInput } from '@/components/shared/AddressAutocompleteInput';

interface DetailedContactSectionProps {
  formData: DetailedFormData;
  onInputChange: (field: string, value: unknown) => void;
  isActive?: boolean;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

const CONTACT_METHOD_OPTIONS = [
  { value: 'phone', label: 'Phone Call', icon: <Phone className="h-5 w-5" /> },
  { value: 'email', label: 'Email', icon: <Mail className="h-5 w-5" /> },
  { value: 'secondary_phone', label: 'Secondary Phone', icon: <Phone className="h-5 w-5" /> },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child', label: 'Child' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

const isValidField = (value: string, type?: 'email' | 'phone') => {
  if (!value.trim()) return false;
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (type === 'phone') return isValidUSPhone(value);
  return value.trim().length > 0;
};

export const DetailedContactSection = React.memo(({ 
  formData, 
  onInputChange,
  isActive 
}: DetailedContactSectionProps) => {
  const emailRef = useRef<HTMLInputElement>(null);
  const { city: lookupCity, state: lookupState, isLoading: isZipLoading } = useZipCodeLookup(formData.zipCode);
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const [phoneWasReformatted, setPhoneWasReformatted] = useState(false);

  useEffect(() => {
    if (isActive && emailRef.current) {
      setTimeout(() => emailRef.current?.focus(), 300);
    }
  }, [isActive]);

  useEffect(() => {
    if (lookupCity && lookupState) {
      onInputChange('city', lookupCity);
      onInputChange('state', lookupState);
      setWasAutoFilled(true);
    }
  }, [lookupCity, lookupState, onInputChange]);

  const handlePhoneChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatPhoneInput(rawValue);
    
    // Only show reformat message for primary phone
    if (field === 'phone') {
      setPhoneWasReformatted(wasCountryCodeDetected(rawValue));
    }
    
    onInputChange(field, formatted);
  }, [onInputChange]);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
          <MapPin className="h-6 w-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Contact Information
        </h2>
        <p className="text-muted-foreground mt-1">
          How can we reach you?
        </p>
      </div>

      {/* Email and Phone */}
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
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder="john@example.com"
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Primary Phone <span className="text-destructive">*</span>
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
            onChange={handlePhoneChange('phone')}
            placeholder="(555) 123-4567"
            maxLength={14}
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
          {phoneWasReformatted && formData.phone && (
            <p className="text-xs text-muted-foreground mt-1">
              Country code detected and formatted for US
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="secondaryPhone" className="text-sm font-medium">
          Secondary Phone (Optional)
        </Label>
        <Input
          id="secondaryPhone"
          name="secondaryPhone"
          type="tel"
          autoComplete="tel"
          value={formData.secondaryPhone}
          onChange={handlePhoneChange('secondaryPhone')}
          placeholder="(555) 987-6543"
          maxLength={14}
          className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
        />
      </div>

      {/* Preferred Contact Method */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Preferred Contact Method</Label>
        <SelectionButtonGroup
          options={CONTACT_METHOD_OPTIONS}
          value={formData.preferredContactMethod}
          onChange={(value) => onInputChange('preferredContactMethod', value)}
          columns={3}
        />
      </div>

      {/* Address Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">Home Address</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address1" className="text-sm font-medium">
            Street Address
          </Label>
          <AddressAutocompleteInput
            id="address1"
            name="address1"
            autoComplete="street-address"
            value={formData.address1}
            onChange={(value) => onInputChange('address1', value)}
            onPlaceSelect={(address, city, state, zip) => {
              onInputChange('address1', address);
              onInputChange('city', city);
              onInputChange('state', state);
              onInputChange('zipCode', zip);
              setWasAutoFilled(true);
            }}
            placeholder="Start typing an address..."
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address2" className="text-sm font-medium">
            Apt, Suite, etc. (Optional)
          </Label>
          <Input
            id="address2"
            name="address2"
            autoComplete="address-line2"
            value={formData.address2}
            onChange={(e) => onInputChange('address2', e.target.value)}
            placeholder="Apt 4B"
            className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode" className="text-sm font-medium">
              ZIP Code
            </Label>
            <div className="relative">
              <Input
                id="zipCode"
                name="zipCode"
                autoComplete="postal-code"
                value={formData.zipCode}
                onChange={(e) => {
                  onInputChange('zipCode', e.target.value);
                  setWasAutoFilled(false);
                }}
                placeholder="12345"
                maxLength={10}
                className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors pr-10"
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
              {wasAutoFilled && <span className="text-xs text-green-600">(auto)</span>}
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
              {wasAutoFilled && <span className="text-xs text-green-600">(auto)</span>}
            </Label>
            <Select 
              value={formData.state} 
              onValueChange={(value) => {
                onInputChange('state', value);
                setWasAutoFilled(false);
              }}
            >
              <SelectTrigger id="state" className="h-14 text-base rounded-xl border-2">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] z-50">
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

      {/* Emergency Contact Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">Emergency Contact</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              autoComplete="off"
              value={formData.emergencyContactName}
              onChange={(e) => onInputChange('emergencyContactName', e.target.value)}
              placeholder="Emergency contact name"
              className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              autoComplete="off"
              value={formData.emergencyContactPhone}
              onChange={handlePhoneChange('emergencyContactPhone')}
              placeholder="(555) 123-4567"
              maxLength={14}
              className="h-14 text-base rounded-xl border-2 focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Relationship</Label>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIP_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onInputChange('emergencyContactRelationship', option.value)}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all touch-manipulation ${
                  formData.emergencyContactRelationship === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

DetailedContactSection.displayName = 'DetailedContactSection';
