import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Building, 
  BarChart3, 
  Settings, 
  Shield, 
  Activity,
  TrendingUp,
  Database,
  UserCheck,
  Globe,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const AdminMetricsCard = ({ title, value, description, icon: Icon, trend }: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: { value: string; positive: boolean; };
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className={`h-3 w-3 ${trend.positive ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-xs ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.value}
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);

const OrganizationManagementPanel = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Organization Management</h3>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        New Organization
      </Button>
    </div>
    
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">CR England</CardTitle>
              <CardDescription>Transportation & Logistics</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Active</Badge>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Users</p>
              <p className="font-medium">24</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Jobs</p>
              <p className="font-medium">156</p>
            </div>
            <div>
              <p className="text-muted-foreground">Monthly Spend</p>
              <p className="font-medium">$45,280</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const SystemOverviewPanel = () => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold">System Overview</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AdminMetricsCard
        title="Total Organizations"
        value="24"
        description="Active organizations"
        icon={Building}
        trend={{ value: "+2 this month", positive: true }}
      />
      <AdminMetricsCard
        title="Total Users"
        value="1,247"
        description="Across all organizations"
        icon={Users}
        trend={{ value: "+8.2%", positive: true }}
      />
      <AdminMetricsCard
        title="System Uptime"
        value="99.97%"
        description="Last 30 days"
        icon={Activity}
        trend={{ value: "99.9% SLA", positive: true }}
      />
      <AdminMetricsCard
        title="Total Revenue"
        value="$124,580"
        description="Monthly recurring"
        icon={TrendingUp}
        trend={{ value: "+12.5%", positive: true }}
      />
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Connection Pool</span>
            <Badge variant="secondary">Healthy</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Query Performance</span>
            <Badge variant="secondary">Optimal</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Storage Usage</span>
            <span className="text-sm text-muted-foreground">2.4TB / 5TB</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">SSL Certificates</span>
            <Badge variant="secondary">Valid</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Firewall Status</span>
            <Badge variant="secondary">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Failed Login Attempts</span>
            <span className="text-sm text-muted-foreground">3 today</span>
          </div>
        </CardContent>
      </Card>
    </div>

    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Scheduled maintenance window: Sunday 2:00 AM - 4:00 AM EST for database optimization.
      </AlertDescription>
    </Alert>
  </div>
);

const UserManagementPanel = () => (
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
            <UserCheck className="w-4 h-4" />
            Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,247</div>
          <p className="text-xs text-muted-foreground">+12 this week</p>
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
          <div className="text-2xl font-bold">47</div>
          <p className="text-xs text-muted-foreground">Across 24 orgs</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Recent Signups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">28</div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle>Recent User Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-medium">john.doe@crengland.com</p>
              <p className="text-sm text-muted-foreground">Last login: 2 hours ago</p>
            </div>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-medium">sarah.smith@crengland.com</p>
              <p className="text-sm text-muted-foreground">Last login: 5 hours ago</p>
            </div>
            <Badge variant="outline">User</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">mike.johnson@crengland.com</p>
              <p className="text-sm text-muted-foreground">Last login: 1 day ago</p>
            </div>
            <Badge variant="outline">User</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AdminDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if user doesn't have super admin privileges
  if (!user || userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Super Administrator Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                System-wide management and analytics
              </p>
            </div>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Super Admin
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <SystemOverviewPanel />
          </TabsContent>

          <TabsContent value="organizations" className="mt-6">
            <OrganizationManagementPanel />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagementPanel />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings and parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System configuration interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;