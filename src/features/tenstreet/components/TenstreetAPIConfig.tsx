import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';

interface TenstreetConfig {
  clientId: string;
  password: string;
  service: string;
  mode: string;
  source: string;
  companyId: string;
  companyName: string;
  driverId: string;
  jobId: string;
  statusTag: string;
  appReferrer: string;
}

interface TenstreetAPIConfigProps {
  config: TenstreetConfig;
  onConfigChange: (config: TenstreetConfig) => void;
}

export const TenstreetAPIConfig: React.FC<TenstreetAPIConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const updateField = (field: keyof TenstreetConfig, value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Tenstreet API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={config.clientId}
              onChange={(e) => updateField('clientId', e.target.value)}
              placeholder="e.g. 123"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={config.password}
              onChange={(e) => updateField('password', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="service">Service</Label>
            <Input
              id="service"
              value={config.service}
              onChange={(e) => updateField('service', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="mode">Mode</Label>
            <Select value={config.mode} onValueChange={(value) => updateField('mode', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROD">Production</SelectItem>
                <SelectItem value="DEV">Development</SelectItem>
                <SelectItem value="TEST">Test</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={config.source}
              onChange={(e) => updateField('source', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="companyId">Company ID</Label>
            <Input
              id="companyId"
              value={config.companyId}
              onChange={(e) => updateField('companyId', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={config.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="driverId">Driver ID (Optional)</Label>
            <Input
              id="driverId"
              value={config.driverId}
              onChange={(e) => updateField('driverId', e.target.value)}
              placeholder="Leave empty to auto-generate"
            />
          </div>
          <div>
            <Label htmlFor="jobId">Job ID (Optional)</Label>
            <Input
              id="jobId"
              value={config.jobId}
              onChange={(e) => updateField('jobId', e.target.value)}
              placeholder="****"
            />
          </div>
          <div>
            <Label htmlFor="statusTag">Status Tag</Label>
            <Input
              id="statusTag"
              value={config.statusTag}
              onChange={(e) => updateField('statusTag', e.target.value)}
              placeholder="Status=New Applicant"
            />
          </div>
          <div>
            <Label htmlFor="appReferrer">App Referrer</Label>
            <Input
              id="appReferrer"
              value={config.appReferrer}
              onChange={(e) => updateField('appReferrer', e.target.value)}
              placeholder="3BI"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenstreetAPIConfig;
