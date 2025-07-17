import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMonthlyBudgetData = () => {
  return useQuery({
    queryKey: ['monthly-budget-data'],
    queryFn: async () => {
      const { data: spendData, error } = await supabase
        .from('daily_spend')
        .select('date, amount')
        .order('date', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData = spendData.reduce((acc: any, curr: any) => {
        const date = new Date(curr.date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const fullKey = `${monthKey} ${year}`;
        
        if (!acc[fullKey]) {
          acc[fullKey] = { month: monthKey, spent: 0, budget: 15000 };
        }
        acc[fullKey].spent += Number(curr.amount);
        return acc;
      }, {});

      return Object.values(monthlyData)
        .map((data: any) => ({
          ...data,
          spent: Number(data.spent.toFixed(2)),
          remaining: Number((data.budget - data.spent).toFixed(2))
        }))
        .slice(-6); // Last 6 months
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};