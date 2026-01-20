import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard } from 'lucide-react';
import { TenstreetFieldSelect } from './TenstreetFieldSelect';

interface IdentificationFieldsProps {
  mappings: {
    governmentId: string;
    governmentIdCountryCode: string;
    governmentIdIssuingAuthority: string;
    governmentIdDocumentType: string;
    dateOfBirth: string;
  };
  onChange: (field: string, value: string) => void;
}

export const TenstreetIdentificationFields: React.FC<IdentificationFieldsProps> = ({ mappings, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Identification & Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Government ID (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Government ID (SSN)</Label>
              <TenstreetFieldSelect
                value={mappings.governmentId}
                onChange={(value) => onChange('governmentId', value)}
              />
            </div>
            <div>
              <Label>Country Code</Label>
              <TenstreetFieldSelect
                value={mappings.governmentIdCountryCode}
                onChange={(value) => onChange('governmentIdCountryCode', value)}
                placeholder="Default: US"
              />
            </div>
            <div>
              <Label>Issuing Authority</Label>
              <TenstreetFieldSelect
                value={mappings.governmentIdIssuingAuthority}
                onChange={(value) => onChange('governmentIdIssuingAuthority', value)}
                placeholder="Default: SSA"
              />
            </div>
            <div>
              <Label>Document Type</Label>
              <TenstreetFieldSelect
                value={mappings.governmentIdDocumentType}
                onChange={(value) => onChange('governmentIdDocumentType', value)}
                placeholder="Default: SSN"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth</Label>
              <TenstreetFieldSelect
                value={mappings.dateOfBirth}
                onChange={(value) => onChange('dateOfBirth', value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
