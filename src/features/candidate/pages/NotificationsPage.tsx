import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Briefcase, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NotificationsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailApplicationUpdates: true,
    emailNewJobs: true,
    emailMessages: true,
    emailMarketing: false,
    pushApplicationUpdates: true,
    pushNewJobs: false,
    pushMessages: true
  });

  const handleSave = () => {
    // In a real implementation, save to database
    toast({
      title: 'Settings saved',
      description: 'Your notification preferences have been updated'
    });
  };

  const notificationGroups = [
    {
      title: 'Email Notifications',
      icon: Mail,
      settings: [
        { key: 'emailApplicationUpdates', label: 'Application Updates', description: 'Get notified when there are updates to your applications' },
        { key: 'emailNewJobs', label: 'New Job Matches', description: 'Receive alerts for new jobs matching your preferences' },
        { key: 'emailMessages', label: 'Messages', description: 'Get notified when recruiters send you messages' },
        { key: 'emailMarketing', label: 'Tips & Updates', description: 'Receive career tips and platform updates' }
      ]
    },
    {
      title: 'Push Notifications',
      icon: Bell,
      settings: [
        { key: 'pushApplicationUpdates', label: 'Application Updates', description: 'Real-time alerts for application status changes' },
        { key: 'pushNewJobs', label: 'New Job Matches', description: 'Instant alerts for relevant new jobs' },
        { key: 'pushMessages', label: 'Messages', description: 'Real-time message notifications' }
      ]
    }
  ];

  return (
    <div className="container max-w-2xl py-8 px-4 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground">Choose how you want to be notified</p>
      </div>

      <div className="space-y-6">
        {notificationGroups.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.settings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between py-2">
                    <div>
                      <Label className="font-medium">{setting.label}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch
                      checked={settings[setting.key as keyof typeof settings]}
                      onCheckedChange={(checked) => 
                        setSettings({ ...settings, [setting.key]: checked })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Quick Preferences
            </CardTitle>
            <CardDescription>
              Quickly enable or disable all notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSettings(prev => 
                Object.fromEntries(Object.keys(prev).map(k => [k, true])) as typeof settings
              )}
            >
              Enable All
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSettings(prev => 
                Object.fromEntries(Object.keys(prev).map(k => [k, false])) as typeof settings
              )}
            >
              Disable All
            </Button>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">
          Save Notification Preferences
        </Button>
      </div>
    </div>
  );
};

export default NotificationsPage;