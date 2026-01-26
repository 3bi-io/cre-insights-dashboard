import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RotateCcw } from 'lucide-react';

interface GlobalSettingsPanelProps {
  organizationId?: string | null;
}

export function GlobalSettingsPanel({ organizationId = null }: GlobalSettingsPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Global Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure default behaviors and templates for social engagement across all platforms
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Auto-Engage Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auto-Engage Defaults</CardTitle>
            <CardDescription>
              Default settings for automated responses and engagement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Auto-Respond</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically respond to common inquiries
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Human Review Required</Label>
                <p className="text-xs text-muted-foreground">
                  Queue responses for review before sending
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label>Response Delay (seconds)</Label>
              <Input type="number" defaultValue="30" min="0" max="300" />
              <p className="text-xs text-muted-foreground">
                Wait time before auto-responding (more natural)
              </p>
            </div>

            <div className="space-y-2">
              <Label>AI Confidence Threshold</Label>
              <Select defaultValue="0.8">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.6">60% - More Responses</SelectItem>
                  <SelectItem value="0.7">70% - Balanced</SelectItem>
                  <SelectItem value="0.8">80% - Conservative</SelectItem>
                  <SelectItem value="0.9">90% - Very Strict</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Minimum confidence required for auto-responses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Branding Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding & Voice</CardTitle>
            <CardDescription>
              Customize the tone and branding for generated content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input placeholder="Your Company Name" />
            </div>

            <div className="space-y-2">
              <Label>Brand Voice</Label>
              <Select defaultValue="professional">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Hashtags</Label>
              <Input placeholder="#CDLJobs #TruckDrivers #Hiring" />
              <p className="text-xs text-muted-foreground">
                Comma-separated hashtags to include in all posts
              </p>
            </div>

            <div className="space-y-2">
              <Label>Call-to-Action URL</Label>
              <Input placeholder="https://apply.yourcompany.com" />
            </div>
          </CardContent>
        </Card>

        {/* Default Templates */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Default Response Templates</CardTitle>
            <CardDescription>
              Fallback templates when AI-generated responses are not available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Job Inquiry Response</Label>
                <Textarea 
                  rows={3}
                  placeholder="Thanks for your interest! We're always looking for great drivers. Apply at {apply_url} or call {phone}."
                />
              </div>

              <div className="space-y-2">
                <Label>Salary Question Response</Label>
                <Textarea 
                  rows={3}
                  placeholder="Great question! Our pay is competitive and depends on experience and route. Contact us at {phone} for specific details."
                />
              </div>

              <div className="space-y-2">
                <Label>Benefits Question Response</Label>
                <Textarea 
                  rows={3}
                  placeholder="We offer full benefits including health insurance, 401k, paid time off, and more. Learn more at {website}."
                />
              </div>

              <div className="space-y-2">
                <Label>General Inquiry Response</Label>
                <Textarea 
                  rows={3}
                  placeholder="Thanks for reaching out! For more information, visit {website} or call us at {phone}."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
