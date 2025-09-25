import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, logDebug } from '@/utils/loggerUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Mail, MoreVertical, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminMagicLinkSection } from './AdminMagicLinkSection';
import { AdminPasswordResetSection } from './AdminPasswordResetSection';
import { SuperAdminUserManagement } from './SuperAdminUserManagement';

interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  role: string;
}

const AdministratorsSettingsTab = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Fetch administrators
  const { data: administrators, isLoading: adminLoading } = useQuery({
    queryKey: ['administrators'],
    queryFn: async (): Promise<AdminUser[]> => {
      logDebug('Fetching administrators', {}, 'AdminSettings');
      
      // Get admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('role', 'admin');
      
      if (rolesError) {
        logError('Error fetching admin roles', rolesError, 'AdminSettings');
        throw rolesError;
      }

      logDebug('Admin roles found', { count: adminRoles?.length || 0 }, 'AdminSettings');

      if (!adminRoles || adminRoles.length === 0) {
        logInfo('No admin roles found', {}, 'AdminSettings');
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

      logDebug('Final administrators result', { count: result.length }, 'AdminSettings');
      return result;
    },
    enabled: userRole === 'admin' || userRole === 'super_admin', // Only fetch if current user is admin or super_admin
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

  const handleAddAdmin = async (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    try {
      setAddingAdmin(true);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.id) {
        toast({
          title: 'User not found',
          description: 'Ask the user to sign up first so a profile exists.',
          variant: 'destructive',
        });
        return;
      }

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.id, role: 'admin' });

      if (insertError) {
        // Unique violation -> already has this role
        // @ts-ignore
        if (insertError.code === '23505') {
          toast({ title: 'Already an admin', description: `${email} already has admin role.` });
        } else {
          throw insertError;
        }
      } else {
        toast({ title: 'Admin granted', description: `${email} is now an administrator.` });
        setNewAdminEmail('');
        queryClient.invalidateQueries({ queryKey: ['administrators'] });
      }
    } catch (err) {
      console.error('Error adding admin:', err);
      toast({ title: 'Error', description: 'Failed to grant admin role.', variant: 'destructive' });
    } finally {
      setAddingAdmin(false);
    }
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
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
              <div className="rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="w-full sm:w-auto flex-1">
                  <Label htmlFor="adminEmail" className="mb-1 block">Add Administrator by Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="user@example.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                    <Button onClick={handleAddAdmin} disabled={addingAdmin || !newAdminEmail}>
                      {addingAdmin ? 'Granting...' : 'Grant Admin'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">User must have signed up at least once.</p>
                </div>
              </div>

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
                            <Users className="w-8 h-8 text-gray-400" />
                            <p className="text-sm text-gray-500">No administrators found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      administrators?.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {admin.email || 'Email not available'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {admin.id === user?.id ? 'You' : 'Team member'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {admin.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(admin.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {admin.id !== user?.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleRemoveAdmin(admin.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Admin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AdminMagicLinkSection />
      <AdminPasswordResetSection />
      <SuperAdminUserManagement />
    </div>
  );
};

export default AdministratorsSettingsTab;