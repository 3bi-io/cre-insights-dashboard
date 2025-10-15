import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export const BudgetSpendChart = () => {
  const { organization } = useAuth();

  const { data: spendData, isLoading } = useQuery({
    queryKey: ['budget-spend', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      // Get last 30 days of spend
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: dailySpend } = await supabase
        .from('meta_daily_spend')
        .select('date_start, spend')
        .eq('organization_id', organization.id)
        .gte('date_start', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date_start', { ascending: true });

      if (!dailySpend || dailySpend.length === 0) return null;

      // Calculate cumulative spend
      let cumulative = 0;
      const budget = 10000; // This should come from organization settings
      const dailyBudget = budget / 30;

      const chartData = dailySpend.map((day, index) => {
        cumulative += day.spend;
        const expectedSpend = dailyBudget * (index + 1);
        
        return {
          date: new Date(day.date_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          actual: parseFloat(cumulative.toFixed(2)),
          budgeted: parseFloat(expectedSpend.toFixed(2)),
          daily: parseFloat(day.spend.toFixed(2)),
        };
      });

      const totalSpend = cumulative;
      const percentUsed = (totalSpend / budget) * 100;
      const isOverBudget = totalSpend > budget;
      const remaining = budget - totalSpend;

      return {
        chartData,
        totalSpend,
        budget,
        percentUsed,
        isOverBudget,
        remaining,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget vs Spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!spendData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget vs Spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No spend data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget vs Spend (Last 30 Days)
          </CardTitle>
          <div className="flex items-center gap-2">
            {spendData.isOverBudget && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Over Budget
              </Badge>
            )}
            <Badge variant={spendData.percentUsed > 90 ? 'destructive' : spendData.percentUsed > 75 ? 'default' : 'secondary'}>
              {spendData.percentUsed.toFixed(1)}% Used
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-lg font-bold">${spendData.budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className={`text-lg font-bold ${spendData.isOverBudget ? 'text-red-600' : ''}`}>
              ${spendData.totalSpend.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={`text-lg font-bold ${spendData.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${Math.abs(spendData.remaining).toLocaleString()}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={spendData.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend />
            <ReferenceLine y={spendData.budget} stroke="#ef4444" strokeDasharray="3 3" label="Budget" />
            <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual Spend" />
            <Line type="monotone" dataKey="budgeted" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Budgeted" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
