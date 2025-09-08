import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NotificationsSettingsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    budgetWarnings: true,
    weeklyReports: false,
    applicationUpdates: true,
  });

  const handleSaveNotifications = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Settings saved",
      description: "Your notification preferences have been updated.",
    });
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose what notifications you'd like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailAlerts">Email Alerts</Label>
              <p className="text-sm text-gray-600">Get notified about important updates via email</p>
            </div>
            <Switch
              id="emailAlerts"
              checked={notifications.emailAlerts}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, emailAlerts: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="budgetWarnings">Budget Warnings</Label>
              <p className="text-sm text-gray-600">Alert when approaching budget limits</p>
            </div>
            <Switch
              id="budgetWarnings"
              checked={notifications.budgetWarnings}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, budgetWarnings: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weeklyReports">Weekly Reports</Label>
              <p className="text-sm text-gray-600">Receive weekly performance summaries</p>
            </div>
            <Switch
              id="weeklyReports"
              checked={notifications.weeklyReports}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, weeklyReports: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="applicationUpdates">Application Updates</Label>
              <p className="text-sm text-gray-600">Notifications when new applications are received</p>
            </div>
            <Switch
              id="applicationUpdates"
              checked={notifications.applicationUpdates}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, applicationUpdates: checked }))
              }
            />
          </div>
        </div>

        <Button 
          onClick={handleSaveNotifications} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationsSettingsTab;