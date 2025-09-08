import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Shield, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PrivacySettingsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [privacy, setPrivacy] = useState({
    dataSharing: false,
    analytics: true,
    marketing: false,
  });

  const handleSavePrivacy = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved.",
    });
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & Data
        </CardTitle>
        <CardDescription>
          Control how your data is used and shared
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dataSharing">Data Sharing</Label>
              <p className="text-sm text-gray-600">Allow sharing anonymized data for platform improvements</p>
            </div>
            <Switch
              id="dataSharing"
              checked={privacy.dataSharing}
              onCheckedChange={(checked) => 
                setPrivacy(prev => ({ ...prev, dataSharing: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Usage Analytics</Label>
              <p className="text-sm text-gray-600">Help us improve the platform by sharing usage data</p>
            </div>
            <Switch
              id="analytics"
              checked={privacy.analytics}
              onCheckedChange={(checked) => 
                setPrivacy(prev => ({ ...prev, analytics: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Marketing Communications</Label>
              <p className="text-sm text-gray-600">Receive product updates and marketing emails</p>
            </div>
            <Switch
              id="marketing"
              checked={privacy.marketing}
              onCheckedChange={(checked) => 
                setPrivacy(prev => ({ ...prev, marketing: checked }))
              }
            />
          </div>
        </div>

        <Button 
          onClick={handleSavePrivacy} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PrivacySettingsTab;