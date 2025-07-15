import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Bell, Shield, Database, Trash2, Save, Users, Mail, MoreVertical, Plug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import IntegrationsTab from '@/components/settings/IntegrationsTab';
import { AdminMagicLinkSection } from '@/components/settings/AdminMagicLinkSection';

interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  role: string;
}

const Settings = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    budgetWarnings: true,
    weeklyReports: false,
    applicationUpdates: true,
  });

  const [privacy, setPrivacy] = useState({
    dataSharing: false,
    analytics: true,
    marketing: false,
  });

  // Fetch administrators
  const { data: administrators, isLoading: adminLoading } = useQuery({
    queryKey: ['administrators'],
    queryFn: async (): Promise<AdminUser[]> => {
      console.log('Fetching administrators...');
      
      // Get admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('role', 'admin');
      
      if (rolesError) {
        console.error('Error fetching admin roles:', rolesError);
        throw rolesError;
      }

      console.log('Admin roles found:', adminRoles);

      if (!adminRoles || adminRoles.length === 0) {
        console.log('No admin roles found');
        return [];
      }

      // Since we can't access auth.users directly and profiles table is for clients,
      // we'll only show the current user's email if they're an admin
      const result = adminRoles.map(adminRole => {
        const isCurrentUser = adminRole.user_id === user?.id;
        
        return {
          id: adminRole.user_id,
          email: isCurrentUser ? user?.email || null : null,
          created_at: adminRole.created_at,
          role: adminRole.role
        };
      });

      console.log('Final administrators result:', result);
      return result;
    },
    enabled: userRole === 'admin', // Only fetch if current user is admin
  });

  // Mutation to remove admin role
  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) throw error;
      
      // Add user role instead
      const { error: userRoleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'user' });
      
      if (userRoleError) throw userRoleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administrators'] });
      toast({
        title: "Admin removed",
        description: "User has been removed from administrators.",
      });
    },
    onError: (error) => {
      console.error('Error removing admin:', error);
      toast({
        title: "Error",
        description: "Failed to remove administrator.",
        variant: "destructive",
      });
    },
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

  const handleRemoveAdmin = (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Cannot remove yourself",
        description: "You cannot remove your own admin privileges.",
        variant: "destructive",
      });
      return;
    }
    removeAdminMutation.mutate(userId);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          {userRole === 'admin' && <TabsTrigger value="administrators">Administrators</TabsTrigger>}
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your account details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Account Status</Label>
                  <div className="pt-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Enter your first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Enter your last name" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="C.R. England" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" value="UTC-07:00 (Mountain Time)" disabled />
              </div>

              <Button className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
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

              <Button onClick={handleSaveNotifications} disabled={loading} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
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
                    <p className="text-sm text-gray-600">Help improve the platform with usage analytics</p>
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
                    <p className="text-sm text-gray-600">Receive updates about new features and tips</p>
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

              <Button onClick={handleSavePrivacy} disabled={loading} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Download your data or request account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                You can request a copy of all your data stored in our system. This includes job listings, 
                applications, and analytics data.
              </p>
              <Button variant="outline">Request Data Export</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="administrators" className="space-y-6">
            <AdminMagicLinkSection />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  App Administrators
                </CardTitle>
                <CardDescription>
                  Manage users with administrator privileges
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Current Administrators</p>
                        <p className="text-sm text-gray-600">
                          {administrators?.length || 0} administrator{administrators?.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                      <Badge variant="secondary">
                        Total: {administrators?.length || 0}
                      </Badge>
                    </div>

                    <div className="bg-card rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {administrators?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8">
                                <div className="flex flex-col items-center gap-2">
                                  <Users className="w-8 h-8 text-muted-foreground" />
                                  <p className="text-muted-foreground">No administrators found</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            administrators?.map((admin) => (
                              <TableRow key={admin.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                      <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-foreground">
                                        {admin.id === user?.id ? 'You' : `Admin User`}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {admin.email || `ID: ${admin.id.slice(0, 8)}...`}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {admin.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(admin.created_at).toLocaleDateString()}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem 
                                        onClick={() => handleRemoveAdmin(admin.id)}
                                        className="text-destructive"
                                        disabled={admin.id === user?.id}
                                      >
                                        Remove Admin
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Managing Administrators</h4>
                      <p className="text-sm text-blue-600">
                        Administrator roles are managed through the user_roles table. Email addresses are only visible for your own account due to security restrictions.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="danger" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                <p className="text-sm text-red-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                  This will permanently delete:
                </p>
                <ul className="text-sm text-red-600 list-disc list-inside space-y-1 mb-4">
                  <li>All job listings and their associated data</li>
                  <li>Application tracking and candidate information</li>
                  <li>Analytics and reporting history</li>
                  <li>Account settings and preferences</li>
                </ul>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
