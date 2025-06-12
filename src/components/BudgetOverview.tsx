
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const budgetData = [
  {
    category: 'Driver Recruitment',
    budget: 25000,
    spent: 18750,
    remaining: 6250,
    status: 'on-track'
  },
  {
    category: 'Logistics Positions',
    budget: 15000,
    spent: 14200,
    remaining: 800,
    status: 'warning'
  },
  {
    category: 'Management Roles',
    budget: 10000,
    spent: 7500,
    remaining: 2500,
    status: 'on-track'
  },
  {
    category: 'Technical Positions',
    budget: 8000,
    spent: 8100,
    remaining: -100,
    status: 'over-budget'
  }
];

const BudgetOverview = () => {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget Overview</h3>
      
      <div className="space-y-6">
        {budgetData.map((item, index) => {
          const percentage = (item.spent / item.budget) * 100;
          const progressColor = item.status === 'over-budget' ? 'bg-red-500' : 
                               item.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500';
          
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
