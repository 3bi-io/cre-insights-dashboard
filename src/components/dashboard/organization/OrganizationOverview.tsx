import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Shield, 
  Database, 
  AlertTriangle,
  BarChart3,
  TrendingUp
} from 'lucide-react';

export const OrganizationOverview = () => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold">Organization Overview</h3>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Job Fill Rate</span>
            <Badge variant="secondary">87%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Average Time to Hire</span>
            <span className="text-sm text-muted-foreground">14 days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Application Response Rate</span>
            <Badge variant="secondary">92%</Badge>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Budget Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Monthly Budget</span>
            <span className="text-sm font-medium">$50,000</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Current Spend</span>
            <span className="text-sm text-muted-foreground">$45,280</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Budget Remaining</span>
            <Badge variant="secondary">$4,720</Badge>
          </div>
        </CardContent>
      </Card>
    </div>

    <Alert>
      <Activity className="h-4 w-4" />
      <AlertDescription>
        Your organization's performance is trending upward with a 15% increase in applications this month.
      </AlertDescription>
    </Alert>
  </div>
);