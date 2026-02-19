import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Antenna, Mail, Globe, FlaskConical } from 'lucide-react';
import { AdminEmailUtility } from '@/features/admin/components/AdminEmailUtility';
import { useGeoBlocking } from '@/contexts/GeoBlockingContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SettingsTab: React.FC = () => {
  const { simulationModeOverride, setSimulationOverride, countryCode, country } = useGeoBlocking();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardTitle>Social Beacons</CardTitle>
            <CardDescription>Social media platform configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure X, Facebook, Instagram, WhatsApp, TikTok, and Reddit integrations.
            </p>
            <Button asChild variant="outline">
              <Link to="/admin/social-beacons">
                <Antenna className="mr-2 h-4 w-4" /> Social Beacons
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Utilities
          </CardTitle>
          <CardDescription>Send system emails to users</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Send welcome emails and password reset instructions to users. All emails are automatically BCC'd for review.
          </p>
          <AdminEmailUtility />
        </CardContent>
      </Card>

      {/* Dev / QA Tools — Super Admin only */}
      <Card className="border-dashed border-2 border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <FlaskConical className="h-5 w-5" />
            Developer &amp; QA Tools
            <Badge variant="secondary" className="text-xs font-mono">Super Admin</Badge>
          </CardTitle>
          <CardDescription>
            Internal testing utilities — changes here do not affect real users or data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Geo Simulation Toggle */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/40 border border-border">
            <div className="flex items-start gap-3">
              <Globe className={`h-5 w-5 mt-0.5 shrink-0 ${simulationModeOverride ? 'text-warning' : 'text-muted-foreground'}`} />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Non-Americas Simulation Mode
                  {simulationModeOverride && (
                    <Badge className="ml-2 text-[10px] px-1.5 py-0 bg-warning/20 text-warning border-warning/30">
                      ACTIVE
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Forces the apply flow into simulation mode — exactly as non-Americas visitors experience it.
                  Real geo-detection is unchanged. Toggle persists across page navigations.
                </p>
                <p className="text-xs text-muted-foreground">
                  Your actual location:{' '}
                  <span className="font-mono font-medium text-foreground">
                    {country ?? 'Unknown'} {countryCode ? `(${countryCode})` : ''}
                  </span>
                </p>
              </div>
            </div>
            <Switch
              checked={simulationModeOverride}
              onCheckedChange={setSimulationOverride}
              aria-label="Toggle non-Americas simulation mode"
            />
          </div>

          {simulationModeOverride && (
            <Alert className="border-warning/40 bg-warning/8">
              <FlaskConical className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning text-xs">
                <strong>Simulation mode is active.</strong> All apply forms will now render as simulation (read-only, no DB writes).
                Navigate to <Link to="/jobs" className="underline underline-offset-2">any job listing</Link> and click Apply to preview the full flow.
                Disable this toggle when done.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
