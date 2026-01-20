import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Phone } from 'lucide-react';
import { AVAILABLE_FIELD_TYPES } from '@/types/tenstreet';

interface PersonalDataMappings {
  prefix: string;
  givenName: string;
  middleName: string;
  familyName: string;
  affix: string;
  countryCode: string;
  municipality: string;
  region: string;
  postalCode: string;
  address1: string;
  address2: string;
  governmentId: string;
  governmentIdCountryCode: string;
  governmentIdIssuingAuthority: string;
  governmentIdDocumentType: string;
  dateOfBirth: string;
  internetEmailAddress: string;
  primaryPhone: string;
  secondaryPhone: string;
  preferredMethod: string;
}

interface TenstreetFieldMappingsProps {
  mappings: PersonalDataMappings;
  onMappingsChange: (mappings: PersonalDataMappings) => void;
  activeTab: 'personal-name' | 'address-contact' | 'identification';
}

const FieldSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "Select field" }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">-- None --</SelectItem>
      {AVAILABLE_FIELD_TYPES.map(field => (
        <SelectItem key={field} value={field}>{field}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const TenstreetPersonalNameMappings: React.FC<{
  mappings: PersonalDataMappings;
  onMappingsChange: (mappings: PersonalDataMappings) => void;
}> = ({ mappings, onMappingsChange }) => {
  const updateField = (field: keyof PersonalDataMappings, value: string) => {
    onMappingsChange({ ...mappings, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          PersonName Field Mapping
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Prefix (Mr., Mrs., Dr., etc.)</Label>
            <FieldSelect
              value={mappings.prefix}
              onChange={(value) => updateField('prefix', value)}
            />
          </div>
          <div>
            <Label>Given Name (First Name) *</Label>
            <FieldSelect
              value={mappings.givenName}
              onChange={(value) => updateField('givenName', value)}
            />
          </div>
          <div>
            <Label>Middle Name</Label>
            <FieldSelect
              value={mappings.middleName}
              onChange={(value) => updateField('middleName', value)}
            />
          </div>
          <div>
            <Label>Family Name (Last Name) *</Label>
            <FieldSelect
              value={mappings.familyName}
              onChange={(value) => updateField('familyName', value)}
            />
          </div>
          <div>
            <Label>Affix (Jr., Sr., III, etc.)</Label>
            <FieldSelect
              value={mappings.affix}
              onChange={(value) => updateField('affix', value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const TenstreetAddressContactMappings: React.FC<{
  mappings: PersonalDataMappings;
  onMappingsChange: (mappings: PersonalDataMappings) => void;
}> = ({ mappings, onMappingsChange }) => {
  const updateField = (field: keyof PersonalDataMappings, value: string) => {
    onMappingsChange({ ...mappings, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Address & Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Postal Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Country Code</Label>
              <FieldSelect
                value={mappings.countryCode}
                onChange={(value) => updateField('countryCode', value)}
                placeholder="Default: US"
              />
            </div>
            <div>
              <Label>Municipality (City) *</Label>
              <FieldSelect
                value={mappings.municipality}
                onChange={(value) => updateField('municipality', value)}
              />
            </div>
            <div>
              <Label>Region (State) *</Label>
              <FieldSelect
                value={mappings.region}
                onChange={(value) => updateField('region', value)}
              />
            </div>
            <div>
              <Label>Postal Code (ZIP) *</Label>
              <FieldSelect
                value={mappings.postalCode}
                onChange={(value) => updateField('postalCode', value)}
              />
            </div>
            <div>
              <Label>Address Line 1</Label>
              <FieldSelect
                value={mappings.address1}
                onChange={(value) => updateField('address1', value)}
              />
            </div>
            <div>
              <Label>Address Line 2</Label>
              <FieldSelect
                value={mappings.address2}
                onChange={(value) => updateField('address2', value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Data
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email Address *</Label>
              <FieldSelect
                value={mappings.internetEmailAddress}
                onChange={(value) => updateField('internetEmailAddress', value)}
              />
            </div>
            <div>
              <Label>Primary Phone *</Label>
              <FieldSelect
                value={mappings.primaryPhone}
                onChange={(value) => updateField('primaryPhone', value)}
              />
            </div>
            <div>
              <Label>Secondary Phone</Label>
              <FieldSelect
                value={mappings.secondaryPhone}
                onChange={(value) => updateField('secondaryPhone', value)}
              />
            </div>
            <div>
              <Label>Preferred Contact Method</Label>
              <FieldSelect
                value={mappings.preferredMethod}
                onChange={(value) => updateField('preferredMethod', value)}
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <FieldSelect
                value={mappings.dateOfBirth}
                onChange={(value) => updateField('dateOfBirth', value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const TenstreetIdentificationMappings: React.FC<{
  mappings: PersonalDataMappings;
  onMappingsChange: (mappings: PersonalDataMappings) => void;
}> = ({ mappings, onMappingsChange }) => {
  const updateField = (field: keyof PersonalDataMappings, value: string) => {
    onMappingsChange({ ...mappings, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Government ID & Identification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Government ID (SSN, License, etc.)</Label>
            <FieldSelect
              value={mappings.governmentId}
              onChange={(value) => updateField('governmentId', value)}
            />
          </div>
          <div>
            <Label>ID Country Code</Label>
            <FieldSelect
              value={mappings.governmentIdCountryCode}
              onChange={(value) => updateField('governmentIdCountryCode', value)}
            />
          </div>
          <div>
            <Label>Issuing Authority</Label>
            <FieldSelect
              value={mappings.governmentIdIssuingAuthority}
              onChange={(value) => updateField('governmentIdIssuingAuthority', value)}
            />
          </div>
          <div>
            <Label>Document Type</Label>
            <FieldSelect
              value={mappings.governmentIdDocumentType}
              onChange={(value) => updateField('governmentIdDocumentType', value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
