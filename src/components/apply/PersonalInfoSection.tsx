
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export const PersonalInfoSection = React.memo(({ formData, onInputChange }: PersonalInfoSectionProps) => {
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
            type="email"
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
            type="tel"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            required
            aria-required="true"
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
            placeholder="Enter your city"
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" className="text-sm font-medium">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => onInputChange('state', e.target.value)}
            placeholder="Enter your state"
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip" className="text-sm font-medium">
            ZIP Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="zip"
            value={formData.zip}
            onChange={(e) => onInputChange('zip', e.target.value)}
            required
            aria-required="true"
            placeholder="Enter your ZIP code"
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="over21" className="text-sm font-medium">
          Are you over 21? <span className="text-destructive">*</span>
        </Label>
        <Select value={formData.over21} onValueChange={(value) => onInputChange('over21', value)}>
          <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm" aria-required="true">
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
