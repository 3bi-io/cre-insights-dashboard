import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, logDebug } from '@/utils/loggerUtils';
import { logger } from '@/lib/logger';
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
  full_name: string | null;
  created_at: string;
  role: string;
  organization_name?: string | null;
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
      
      // Get admin and super_admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .in('role', ['admin', 'super_admin']);
      
      if (rolesError) {
        logError('Error fetching admin roles', rolesError, 'AdminSettings');
        throw rolesError;
      }

      logDebug('Admin roles found', { count: adminRoles?.length || 0 }, 'AdminSettings');

      if (!adminRoles || adminRoles.length === 0) {
        logInfo('No admin roles found', {}, 'AdminSettings');
        return [];
      }

      // Fetch profiles for all admin user IDs
      const userIds = adminRoles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, organization_id, organizations(name)')
        .in('id', userIds);

      if (profilesError) {
        logError('Error fetching admin profiles', profilesError, 'AdminSettings');
      }

      // Create a map for quick lookup
      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      // Log orphaned roles for debugging
      const orphanedRoles = adminRoles.filter(r => !profileMap.has(r.user_id));
      if (orphanedRoles.length > 0) {
        logError('Found orphaned admin roles without profiles', { 
          orphanedUserIds: orphanedRoles.map(r => r.user_id) 
        }, 'AdminSettings');
      }

      // Map with profile data, sort by role priority then date
      const result = adminRoles.map(adminRole => {
        const profile = profileMap.get(adminRole.user_id);
        const orgName = (profile?.organizations as any)?.name || null;
        
        return {
          id: adminRole.user_id,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          created_at: adminRole.created_at,
          role: adminRole.role,
          organization_name: orgName
        };
      }).sort((a, b) => {
        // Super admins first, then admins
        if (a.role === 'super_admin' && b.role !== 'super_admin') return -1;
        if (a.role !== 'super_admin' && b.role === 'super_admin') return 1;
        // Then by date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
      logger.error('Error removing admin', error);
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
      logger.error('Error adding admin', err);
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
                      <TableHead>Organization</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {administrators?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-8 h-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No administrators found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      administrators?.map((admin) => {
                        // Display logic: avoid showing email twice if full_name equals email
                        const displayName = admin.full_name && admin.full_name !== admin.email 
                          ? admin.full_name 
                          : null;
                        const displayEmail = admin.email || 'Unknown user';
                        
                        return (
                          <TableRow key={admin.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {displayName || displayEmail}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {admin.id === user?.id ? 'You' : (displayName ? displayEmail : '')}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {admin.organization_name || 'No Organization'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={
                                  admin.role === 'super_admin' 
                                    ? 'bg-purple-100 text-purple-800 border-purple-200' 
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                }
                              >
                                {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(admin.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {admin.id !== user?.id && admin.role !== 'super_admin' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={() => handleRemoveAdmin(admin.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove Admin
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
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