
import React from 'react';
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

// Mock data for accounts
const accounts = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@crengland.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15',
    department: 'HR'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@crengland.com',
    role: 'moderator',
    status: 'active',
    lastLogin: '2024-01-14',
    department: 'Recruiting'
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@crengland.com',
    role: 'user',
    status: 'inactive',
    lastLogin: '2024-01-10',
    department: 'Operations'
  },
  {
    id: '4',
    name: 'Lisa Chen',
    email: 'lisa.chen@crengland.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-15',
    department: 'Marketing'
  }
];

const Accounts = () => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

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
              {accounts.length} total accounts
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
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
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
                      {account.role}
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
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">
                  {accounts.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-foreground">
                  {accounts.filter(a => a.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold text-foreground">4</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
