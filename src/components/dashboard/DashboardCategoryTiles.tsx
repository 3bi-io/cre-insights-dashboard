
import React, { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getApplicantCategory } from '@/utils/applicationHelpers';
import { useAuth } from '@/hooks/useAuth';

interface CategoryData {
  category: string;
  percentage: number;
  count: number;
}

const getCategoryDetails = (category: string) => {
  const details = {
    'D': { 
      label: 'Experienced Driver', 
      color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800', 
      description: 'CDL + Age + 3+ months exp' 
    },
    'SC': { 
      label: 'New CDL Holder', 
      color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', 
      description: 'CDL + Age + <3 months exp' 
    },
    'SR': { 
      label: 'Student Ready', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800', 
      description: 'No CDL + Age + <3 months exp' 
    },
    'N/A': { 
      label: 'Uncategorized', 
      color: 'bg-muted text-muted-foreground border-border', 
      description: 'Other combinations' 
    }
  };
  return details[category as keyof typeof details] || details['N/A'];
};

const DashboardCategoryTiles: React.FC = () => {
  const { organization } = useAuth();
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: applications, error } = await supabase
          .from('applications')
          .select('*, job_listings!inner(organization_id)')
          .eq('job_listings.organization_id', organization.id);

        if (error) throw error;

        const categoryCounts = applications.reduce((acc, app) => {
          const category = getApplicantCategory(app);
          acc[category.code] = (acc[category.code] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const total = applications.length;
        setTotalApplications(total);

        const breakdown = Object.entries(categoryCounts).map(([category, count]) => ({
          category,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0
        }));

        // Sort by count descending
        breakdown.sort((a, b) => b.count - a.count);

        setCategoryBreakdown(breakdown);
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [organization?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Applicant Categories
          </CardTitle>
          <CardDescription>
            Loading applicant category breakdown...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Applicant Categories
        </CardTitle>
        <CardDescription>
          Distribution of {totalApplications} applicants by experience and qualification level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryBreakdown.map((category) => {
            const details = getCategoryDetails(category.category);
            return (
              <div key={category.category} className="text-center">
                <div className={`p-4 rounded-lg border-2 ${details.color} mb-2`}>
                  <div className="text-2xl font-bold mb-1">{category.count}</div>
                  <Badge variant="outline" className="text-xs font-medium">
                    {category.category}
                  </Badge>
                </div>
                <div className="text-sm font-medium text-foreground mb-1">{details.label}</div>
                <div className="text-xs text-muted-foreground">{details.description}</div>
                <div className="text-xs text-primary font-medium mt-1">
                  {category.percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCategoryTiles;
