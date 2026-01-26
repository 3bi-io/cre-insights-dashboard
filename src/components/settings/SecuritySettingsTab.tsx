import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Smartphone, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Security Settings Tab - Unified security controls within Settings page
 * Replaces the standalone /admin/settings/security route
 */
const SecuritySettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Monitor and manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">Password</p>
                <p className="text-xs text-muted-foreground">Strong</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-medium text-sm">2FA</p>
                <p className="text-xs text-muted-foreground">Not enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Last Login</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Require a verification code when signing in
              </p>
            </div>
            <Switch disabled />
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication is coming soon. This will allow you to use an authenticator 
              app or SMS to verify your identity when signing in.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Current Session</p>
                <p className="text-xs text-muted-foreground">
                  This device • Active now
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Current
            </Badge>
          </div>
          
          <Button variant="outline" className="w-full" disabled>
            Sign Out All Other Sessions
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Session management will be available in a future update
          </p>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground mb-4">
              To change your password, use the password reset flow. We'll send you an email 
              with instructions to create a new password.
            </p>
            <Button variant="outline">
              Request Password Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettingsTab;
