import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/features/shared';

export const ApplicationsLoadingSkeleton = () => {
  return (
    <PageLayout title="Applications" description="Track and manage job applications">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded animate-pulse"></div>
                    <div className="h-8 bg-gradient-to-r from-primary/10 to-transparent rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gradient-to-r from-primary/20 to-transparent rounded w-1/3"></div>
                      <div className="h-3 bg-gradient-to-r from-primary/10 to-transparent rounded w-1/2"></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-3 bg-gradient-to-r from-primary/10 to-transparent rounded"></div>
                        <div className="h-3 bg-gradient-to-r from-primary/10 to-transparent rounded"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
