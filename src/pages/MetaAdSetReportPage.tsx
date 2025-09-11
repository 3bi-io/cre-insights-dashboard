import React from 'react';
import { PageLayout } from '@/features/shared';
import MetaAdSetReport from '@/components/analytics/MetaAdSetReport';

const MetaAdSetReportPage = () => {
  return (
    <PageLayout 
      title="Meta Ad Set Report" 
      description="Detailed spend and lead analysis by Ad Set for Meta advertising campaigns"
    >
      <div className="p-6 max-w-7xl mx-auto">
        <MetaAdSetReport />
      </div>
    </PageLayout>
  );
};

export default MetaAdSetReportPage;