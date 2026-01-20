import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationSelectorProps {
  organizations: Organization[] | undefined;
  isLoading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  organizations,
  isLoading,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
      <Label htmlFor="orgSelect" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Target Organization
      </Label>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger id="orgSelect" className="bg-background">
          <SelectValue placeholder="Select an organization..." />
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-md max-h-[300px] z-50">
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading organizations...</SelectItem>
          ) : (
            organizations?.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {!selectedId && (
        <p className="text-sm text-destructive">
          You must select an organization before importing jobs or generating applications.
        </p>
      )}
    </div>
  );
};
