import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface CarrierOption {
  value: string;
  label: string;
}

interface FeedSourceSelectorProps {
  feedSource: 'cdl_jobcast' | 'crengland';
  onFeedSourceChange: (source: 'cdl_jobcast' | 'crengland') => void;
  userParam: string;
  onUserParamChange: (value: string) => void;
  boardParam: string;
  onBoardParamChange: (value: string) => void;
  crEnglandDivision: string;
  onCrEnglandDivisionChange: (value: string) => void;
  selectiveImport: boolean;
  onSelectiveImportChange: (checked: boolean) => void;
  selectedOrganization: string;
  onSelectedOrganizationChange: (value: string) => void;
  organizations: Organization[];
  loadingOrgs: boolean;
  availableUsers: CarrierOption[];
}

export const FeedSourceSelector: React.FC<FeedSourceSelectorProps> = ({
  feedSource,
  onFeedSourceChange,
  userParam,
  onUserParamChange,
  boardParam,
  onBoardParamChange,
  crEnglandDivision,
  onCrEnglandDivisionChange,
  selectiveImport,
  onSelectiveImportChange,
  selectedOrganization,
  onSelectedOrganizationChange,
  organizations,
  loadingOrgs,
  availableUsers,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Feed Configuration
        </CardTitle>
        <CardDescription>
          Select feed source and target organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="feedSource">Feed Source</Label>
            <Select 
              value={feedSource} 
              onValueChange={(v) => onFeedSourceChange(v as 'cdl_jobcast' | 'crengland')}
            >
              <SelectTrigger id="feedSource" className="bg-popover">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="cdl_jobcast">CDL Job Cast</SelectItem>
                <SelectItem value="crengland">C.R. England</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Target Organization</Label>
            <Select 
              value={selectedOrganization} 
              onValueChange={onSelectedOrganizationChange}
            >
              <SelectTrigger id="organization" className="bg-popover">
                <SelectValue placeholder="Select organization..." />
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-60">
                {loadingOrgs ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {feedSource === 'cdl_jobcast' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userParam">Carrier Partner</Label>
              <Select value={userParam} onValueChange={onUserParamChange}>
                <SelectTrigger id="userParam" className="bg-popover">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-60">
                  {availableUsers.map((user) => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="boardParam">Board Name</Label>
              <Input
                id="boardParam"
                value={boardParam}
                onChange={(e) => onBoardParamChange(e.target.value)}
                placeholder="AIRecruiter"
              />
            </div>
          </div>
        )}

        {feedSource === 'crengland' && (
          <div className="space-y-2">
            <Label htmlFor="crEnglandDivision">Division (Optional)</Label>
            <Select value={crEnglandDivision} onValueChange={onCrEnglandDivisionChange}>
              <SelectTrigger id="crEnglandDivision" className="bg-popover">
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="">All Divisions</SelectItem>
                <SelectItem value="company">Company Drivers</SelectItem>
                <SelectItem value="owner_operator">Owner Operators</SelectItem>
                <SelectItem value="student">Student Drivers</SelectItem>
                <SelectItem value="dedicated">Dedicated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="selectiveImport"
            checked={selectiveImport}
            onCheckedChange={(checked) => onSelectiveImportChange(checked as boolean)}
          />
          <Label htmlFor="selectiveImport" className="text-sm cursor-pointer">
            Enable selective import (choose specific jobs)
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedSourceSelector;
