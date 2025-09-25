import React from 'react';
import { PageLayout } from '@/features/shared';
import AIAnalyticsDashboard from '@/components/analytics/AIAnalyticsDashboard';
import { useSearchParams } from 'react-router-dom';

const AIAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const jobListingId = searchParams.get('jobId');
  const applicationId = searchParams.get('applicationId');

  return (
    <PageLayout 
      title="AI Analytics" 
      description="Advanced AI-powered insights and candidate analytics"
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <AIAnalyticsDashboard 
          jobListingId={jobListingId || undefined}
          applicationId={applicationId || undefined}
        />
      </div>
    </PageLayout>
  );
};

export default AIAnalyticsPage;