import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { TenstreetFieldSelect } from './TenstreetFieldSelect';

interface PersonalNameFieldsProps {
  mappings: {
    prefix: string;
    givenName: string;
    middleName: string;
    familyName: string;
    affix: string;
  };
  onChange: (field: string, value: string) => void;
}

export const TenstreetPersonalNameFields: React.FC<PersonalNameFieldsProps> = ({ mappings, onChange }) => {
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
            <TenstreetFieldSelect
              value={mappings.prefix}
              onChange={(value) => onChange('prefix', value)}
            />
          </div>
          <div>
            <Label>Given Name (First Name) *</Label>
            <TenstreetFieldSelect
              value={mappings.givenName}
              onChange={(value) => onChange('givenName', value)}
            />
          </div>
          <div>
            <Label>Middle Name</Label>
            <TenstreetFieldSelect
              value={mappings.middleName}
              onChange={(value) => onChange('middleName', value)}
            />
          </div>
          <div>
            <Label>Family Name (Last Name) *</Label>
            <TenstreetFieldSelect
              value={mappings.familyName}
              onChange={(value) => onChange('familyName', value)}
            />
          </div>
          <div>
            <Label>Affix (Jr., Sr., III, etc.)</Label>
            <TenstreetFieldSelect
              value={mappings.affix}
              onChange={(value) => onChange('affix', value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
