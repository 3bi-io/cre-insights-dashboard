import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Star, Loader2 } from 'lucide-react';
import { useNotificationPreferences, NotificationPreferences } from '../hooks/useNotificationPreferences';
import { Skeleton } from '@/components/ui/skeleton';

const NotificationsPage = () => {
  const {
    preferences,
    isLoading,
    isSaving,
    hasChanges,
    updatePreference,
    enableAll,
    disableAll,
    save,
  } = useNotificationPreferences();

  const notificationGroups = [
    {
      title: 'Email Notifications',
      icon: Mail,
      settings: [
        { 
          key: 'emailApplicationUpdates' as keyof NotificationPreferences, 
          label: 'Application Updates', 
          description: 'Get notified when there are updates to your applications' 
        },
        { 
          key: 'emailNewJobs' as keyof NotificationPreferences, 
          label: 'New Job Matches', 
          description: 'Receive alerts for new jobs matching your preferences' 
        },
        { 
          key: 'emailMessages' as keyof NotificationPreferences, 
          label: 'Messages', 
          description: 'Get notified when recruiters send you messages' 
        },
        { 
          key: 'emailMarketing' as keyof NotificationPreferences, 
          label: 'Tips & Updates', 
          description: 'Receive career tips and platform updates' 
        },
      ],
    },
    {
      title: 'Push Notifications',
      icon: Bell,
      settings: [
        { 
          key: 'pushApplicationUpdates' as keyof NotificationPreferences, 
          label: 'Application Updates', 
          description: 'Real-time alerts for application status changes' 
        },
        { 
          key: 'pushNewJobs' as keyof NotificationPreferences, 
          label: 'New Job Matches', 
          description: 'Instant alerts for relevant new jobs' 
        },
        { 
          key: 'pushMessages' as keyof NotificationPreferences, 
          label: 'Messages', 
          description: 'Real-time message notifications' 
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8 px-4 pb-24 md:pb-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

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
                    <div className="space-y-0.5">
                      <Label className="font-medium">{setting.label}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch
                      checked={preferences[setting.key]}
                      onCheckedChange={(checked) => updatePreference(setting.key, checked)}
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
            <Button variant="outline" onClick={enableAll}>
              Enable All
            </Button>
            <Button variant="outline" onClick={disableAll}>
              Disable All
            </Button>
          </CardContent>
        </Card>

        <Button 
          onClick={save} 
          className="w-full" 
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Notification Preferences'
          )}
        </Button>
        
        {hasChanges && (
          <p className="text-center text-sm text-muted-foreground">
            You have unsaved changes
          </p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
