import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  UserCheck, 
  Shield, 
  Users,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useOrganizationUserData } from '@/hooks/useOrganizationUserData';

export const OrganizationUserManagement = () => {
  const { data: userData, isLoading } = useOrganizationUserData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">User Management</h3>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">User Management</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Organization members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.adminUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Admin privileges</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {!userData?.recentUsers?.length ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No team members found</p>
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Invite Your First Team Member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userData.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 
                         user.email.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'secondary' : 'outline'}>
                      {user.role}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};