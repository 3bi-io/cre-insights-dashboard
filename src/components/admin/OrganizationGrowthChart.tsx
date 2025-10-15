import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export const OrganizationGrowthChart = () => {
  const { data: growthData, isLoading } = useQuery({
    queryKey: ['organization-growth'],
    queryFn: async () => {
      const last6Months = new Date();
      last6Months.setMonth(last6Months.getMonth() - 6);

      // Get organization growth over time
      const { data: orgs } = await supabase
        .from('organizations')
        .select('created_at')
        .gte('created_at', last6Months.toISOString());

      // Get user growth over time
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', last6Months.toISOString());

      // Get application growth over time
      const { data: apps } = await supabase
        .from('applications')
        .select('created_at')
        .gte('created_at', last6Months.toISOString());

      // Group by month
      const monthlyData = new Map();
      
      const addToMonth = (dateStr: string, type: 'orgs' | 'users' | 'apps') => {
        const date = new Date(dateStr);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { month: monthKey, orgs: 0, users: 0, apps: 0 });
        }
        const existing = monthlyData.get(monthKey);
        existing[type]++;
      };

      orgs?.forEach(o => addToMonth(o.created_at, 'orgs'));
      users?.forEach(u => addToMonth(u.created_at, 'users'));
      apps?.forEach(a => addToMonth(a.created_at, 'apps'));

      return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Growth Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Growth Trends (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="orgs" stroke="#3b82f6" name="Organizations" strokeWidth={2} />
            <Line type="monotone" dataKey="users" stroke="#10b981" name="Users" strokeWidth={2} />
            <Line type="monotone" dataKey="apps" stroke="#f59e0b" name="Applications" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
