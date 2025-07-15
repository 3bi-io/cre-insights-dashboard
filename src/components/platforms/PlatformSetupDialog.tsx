
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';

interface PlatformSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: {
    id: string;
    name: string;
    api_endpoint: string | null;
  } | null;
  onSuccess: () => void;
}

const PlatformSetupDialog: React.FC<PlatformSetupDialogProps> = ({
  open,
  onOpenChange,
  platform,
  onSuccess
}) => {
  const [apiEndpoint, setApiEndpoint] = useState(platform?.api_endpoint || '');
  const [enableTracking, setEnableTracking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!platform) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('platforms')
        .update({
          api_endpoint: apiEndpoint.trim() || null,
        })
        .eq('id', platform.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${platform.name} platform configured successfully`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating platform:', error);
      toast({
        title: "Error",
        description: "Failed to update platform configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultEndpoint = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case 'x':
      case 'twitter':
        return 'https://api.x.com/2';
      case 'meta':
      case 'facebook':
        return 'https://graph.facebook.com/v18.0';
      case 'google ads':
      case 'google':
        return 'https://googleads.googleapis.com/v14';
      default:
        return '';
    }
  };

  const handleUseDefault = () => {
    if (platform) {
      setApiEndpoint(getDefaultEndpoint(platform.name));
    }
  };

  if (!platform) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Setup {platform.name} Platform</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-endpoint">API Endpoint</Label>
            <div className="flex gap-2">
              <Input
                id="api-endpoint"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.platform.com/v1"
                type="url"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUseDefault}
                className="whitespace-nowrap"
              >
                Use Default
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure the API endpoint for {platform.name} integration
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enable-tracking"
              checked={enableTracking}
              onCheckedChange={setEnableTracking}
            />
            <Label htmlFor="enable-tracking">Enable campaign tracking</Label>
          </div>

          {platform.name.toLowerCase() === 'x' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">X (Twitter) Setup</h4>
              <p className="text-sm text-blue-700 mb-2">
                To track your X advertising campaigns, you'll need:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• X Ads API access</li>
                <li>• Valid API credentials</li>
                <li>• Campaign tracking enabled</li>
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Configuring...' : 'Configure Platform'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformSetupDialog;
