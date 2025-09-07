import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Plus, Search, Filter, MoreVertical, Mail, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  department: string;
  created_at: string;
}

const Accounts = () => {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async (): Promise<UserAccount[]> => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Then get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      // Create a map of user roles for quick lookup
      const rolesMap = new Map();
      userRoles?.forEach(userRole => {
        rolesMap.set(userRole.user_id, userRole.role);
      });

      // Transform the data to match the expected format
      return (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || profile.email?.split('@')[0] || 'Unknown User',
        email: profile.email || 'No email',
        role: rolesMap.get(profile.id) || 'user',
        status: 'active', // We can assume active since they exist in profiles
        lastLogin: new Date(profile.created_at).toLocaleDateString(),
        department: getDepartmentForRole(rolesMap.get(profile.id) || 'user'),
        created_at: profile.created_at
      }));
    },
  });

  const getDepartmentForRole = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administration';
      case 'moderator':
        return 'Operations';
      default:
        return 'General';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'admin':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'moderator':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border shadow-sm">
          <div className="container mx-auto px-8 py-6 max-w-7xl">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                User Accounts
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Manage user accounts, roles, and permissions across the platform
              </p>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-8 py-8 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-8 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                User Accounts
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Manage user accounts, roles, and permissions across the platform
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
              <Button className="flex items-center gap-2 h-10">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add User</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search accounts..." 
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {accounts?.length || 0} total accounts
            </Badge>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No user accounts found</p>
                      <p className="text-sm text-muted-foreground">
                        User accounts will appear here when users sign up
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                accounts?.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{account.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {account.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(account.role)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {account.role === 'super_admin' ? 'Super Admin' : 
                         account.role === 'admin' ? 'Admin' :
                         account.role === 'moderator' ? 'Moderator' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">{account.department}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(account.status)}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {account.lastLogin}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border border-border">
                          <DropdownMenuItem>Edit Account</DropdownMenuItem>
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem>Reset Password</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Deactivate
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{accounts?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">
                  {accounts?.filter(a => a.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-foreground">
                  {accounts?.filter(a => a.role === 'admin').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold text-foreground">
                  {accounts ? new Set(accounts.map(a => a.department)).size : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
