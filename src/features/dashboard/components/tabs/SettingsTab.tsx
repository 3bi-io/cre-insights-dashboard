import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Shield } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>Manage AI providers and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure AI providers, API keys, and processing settings for the platform.
            </p>
            <Button asChild variant="outline">
              <Link to="/admin/ai-configuration">
                <Settings className="mr-2 h-4 w-4" /> Configure AI
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Platform security configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage authentication, RLS policies, and security audit settings.
            </p>
            <Button asChild variant="outline">
              <Link to="/admin/settings?tab=privacy">
                <Shield className="mr-2 h-4 w-4" /> Security Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Settings Links</CardTitle>
          <CardDescription>Navigate to specific settings sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/settings?tab=profile">Profile</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/settings?tab=organization">Organization</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/settings?tab=api">API Keys</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/settings?tab=integrations">Integrations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
