
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const BudgetOverview = () => {
  const { data: budgetData = [], isLoading } = useQuery({
    queryKey: ['budget-overview'],
    queryFn: async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

      // Get budget allocations for current month
      const { data: budgets } = await supabase
        .from('budget_allocations')
        .select(`
          monthly_budget,
          job_categories!inner(
            id,
            name
          )
        `)
        .eq('year', currentYear)
        .eq('month', currentMonth);

      if (!budgets) return [];

      // Get actual spend for current month by category
      const { data: spendData } = await supabase
        .from('daily_spend')
        .select(`
          amount,
          job_listings!inner(
            category_id,
            job_categories!inner(
              name
            )
          )
        `)
        .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

      // Group spend by category
      const categorySpend = spendData?.reduce((acc: Record<string, number>, item) => {
        const categoryId = item.job_listings.category_id;
        acc[categoryId] = (acc[categoryId] || 0) + Number(item.amount);
        return acc;
      }, {}) || {};

      return budgets.map(budget => {
        const categoryId = budget.job_categories.id;
        const spent = categorySpend[categoryId] || 0;
        const budgetAmount = Number(budget.monthly_budget);
        const remaining = budgetAmount - spent;
        
        let status = 'on-track';
        if (remaining < 0) {
          status = 'over-budget';
        } else if (remaining < budgetAmount * 0.1) { // Less than 10% remaining
          status = 'warning';
        }

        return {
          category: budget.job_categories.name,
          budget: budgetAmount,
          spent,
          remaining,
          status
        };
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'over-budget':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'over-budget':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget Overview</h3>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (budgetData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget Overview</h3>
        <div className="flex items-center justify-center h-32 text-gray-500">
          No budget data available for this month
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget Overview</h3>
      
      <div className="space-y-6">
        {budgetData.map((item, index) => {
          const percentage = (item.spent / item.budget) * 100;
          
          return (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="font-medium text-gray-900">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ${item.spent.toLocaleString()} / ${item.budget.toLocaleString()}
                  </div>
                  <div className={`text-xs ${getStatusColor(item.status)}`}>
                    {item.remaining >= 0 ? `$${item.remaining.toLocaleString()} remaining` : `$${Math.abs(item.remaining).toLocaleString()} over budget`}
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className="h-2"
                />
                {percentage > 100 && (
                  <div className="absolute top-0 left-0 h-2 bg-red-500 rounded-full opacity-60" 
                       style={{ width: `${Math.min((percentage - 100), 20)}%`, marginLeft: '100%' }}></div>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>{percentage.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetOverview;
