import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone } from 'lucide-react';
import { TenstreetFieldSelect } from './TenstreetFieldSelect';

interface AddressContactFieldsProps {
  mappings: {
    countryCode: string;
    municipality: string;
    region: string;
    postalCode: string;
    address1: string;
    address2: string;
    internetEmailAddress: string;
    primaryPhone: string;
    secondaryPhone: string;
    preferredMethod: string;
  };
  onChange: (field: string, value: string) => void;
}

export const TenstreetAddressContactFields: React.FC<AddressContactFieldsProps> = ({ mappings, onChange }) => {
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
              <TenstreetFieldSelect
                value={mappings.countryCode}
                onChange={(value) => onChange('countryCode', value)}
                placeholder="Default: US"
              />
            </div>
            <div>
              <Label>Municipality (City) *</Label>
              <TenstreetFieldSelect
                value={mappings.municipality}
                onChange={(value) => onChange('municipality', value)}
              />
            </div>
            <div>
              <Label>Region (State) *</Label>
              <TenstreetFieldSelect
                value={mappings.region}
                onChange={(value) => onChange('region', value)}
              />
            </div>
            <div>
              <Label>Postal Code (ZIP) *</Label>
              <TenstreetFieldSelect
                value={mappings.postalCode}
                onChange={(value) => onChange('postalCode', value)}
              />
            </div>
            <div>
              <Label>Address Line 1</Label>
              <TenstreetFieldSelect
                value={mappings.address1}
                onChange={(value) => onChange('address1', value)}
              />
            </div>
            <div>
              <Label>Address Line 2</Label>
              <TenstreetFieldSelect
                value={mappings.address2}
                onChange={(value) => onChange('address2', value)}
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
              <TenstreetFieldSelect
                value={mappings.internetEmailAddress}
                onChange={(value) => onChange('internetEmailAddress', value)}
              />
            </div>
            <div>
              <Label>Primary Phone</Label>
              <TenstreetFieldSelect
                value={mappings.primaryPhone}
                onChange={(value) => onChange('primaryPhone', value)}
              />
            </div>
            <div>
              <Label>Secondary Phone</Label>
              <TenstreetFieldSelect
                value={mappings.secondaryPhone}
                onChange={(value) => onChange('secondaryPhone', value)}
              />
            </div>
            <div>
              <Label>Preferred Contact Method</Label>
              <Select 
                value={mappings.preferredMethod} 
                onValueChange={(value) => onChange('preferredMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default: PrimaryPhone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">-- Auto Select --</SelectItem>
                  <SelectItem value="PrimaryPhone">Primary Phone</SelectItem>
                  <SelectItem value="SecondaryPhone">Secondary Phone</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
