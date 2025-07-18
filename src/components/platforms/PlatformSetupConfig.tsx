
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface PlatformSetupConfigProps {
  platformName: string;
  apiEndpoint: string;
  enableTracking: boolean;
  onApiEndpointChange: (value: string) => void;
  onTrackingChange: (value: boolean) => void;
  onUseDefault: () => void;
}

const PlatformSetupConfig: React.FC<PlatformSetupConfigProps> = ({
  platformName,
  apiEndpoint,
  enableTracking,
  onApiEndpointChange,
  onTrackingChange,
  onUseDefault
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="api-endpoint">API Endpoint</Label>
        <div className="flex gap-2">
          <Input
            id="api-endpoint"
            value={apiEndpoint}
            onChange={(e) => onApiEndpointChange(e.target.value)}
            placeholder="https://api.platform.com/v1"
            type="url"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={onUseDefault}
            className="whitespace-nowrap"
          >
            Use Default
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure the API endpoint for {platformName} integration
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enable-tracking"
          checked={enableTracking}
          onCheckedChange={onTrackingChange}
        />
        <Label htmlFor="enable-tracking">Enable campaign tracking</Label>
      </div>
    </>
  );
};

export default PlatformSetupConfig;
