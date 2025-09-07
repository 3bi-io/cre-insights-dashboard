import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  UserCheck, 
  Shield, 
  Users,
  Mail,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const OrganizationUserManagement = () => (
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
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">+2 this month</p>
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
          <div className="text-2xl font-bold">22</div>
          <p className="text-xs text-muted-foreground">91% of total</p>
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
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">Including you</p>
        </CardContent>
      </Card>
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
              <div>
                <p className="font-medium">John Doe</p>
                <p className="text-sm text-muted-foreground">john.doe@company.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Admin</Badge>
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
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">SS</span>
              </div>
              <div>
                <p className="font-medium">Sarah Smith</p>
                <p className="text-sm text-muted-foreground">sarah.smith@company.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">User</Badge>
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
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">MJ</span>
              </div>
              <div>
                <p className="font-medium">Mike Johnson</p>
                <p className="text-sm text-muted-foreground">mike.johnson@company.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">User</Badge>
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
        </div>
      </CardContent>
    </Card>
  </div>
);