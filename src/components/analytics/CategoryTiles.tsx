
import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CategoryData {
  category: string;
  percentage: number;
  count: number;
}

interface CategoryTilesProps {
  categoryBreakdown: CategoryData[];
}

const getCategoryDetails = (category: string) => {
  const details = {
    'D': { 
      label: 'Experienced Driver', 
      color: 'bg-green-100 text-green-800 border-green-200', 
      description: 'CDL + Age + 3+ months exp' 
    },
    'SC': { 
      label: 'New CDL Holder', 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      description: 'CDL + Age + <3 months exp' 
    },
    'SR': { 
      label: 'Student Ready', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
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

const CategoryTiles: React.FC<CategoryTilesProps> = ({ categoryBreakdown }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Applicant Categories
        </CardTitle>
        <CardDescription>
          Distribution of applicants by experience and qualification level
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

export default CategoryTiles;
