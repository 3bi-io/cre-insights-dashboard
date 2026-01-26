import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Activity, Shield, Database, Cpu, Mail } from 'lucide-react';
import { AdminEmailUtility } from '@/features/admin/components/AdminEmailUtility';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  created_at: string | null;
  user_id: string | null;
}

interface OverviewTabProps {
  recentActivity: AuditLog[] | undefined;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ recentActivity }) => {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You have super admin privileges. Use them responsibly.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                      <span className="text-sm">{log.table_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at || '').toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity logged</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health indicators</CardDescription>
            </div>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Database</span>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Edge Functions</span>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">API Services</span>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Utilities Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Email Utilities</CardTitle>
            <CardDescription>Send system emails to users</CardDescription>
          </div>
          <Mail className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <AdminEmailUtility />
        </CardContent>
      </Card>
    </div>
  );
};
