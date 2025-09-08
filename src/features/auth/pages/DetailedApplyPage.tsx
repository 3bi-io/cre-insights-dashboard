import React from 'react';
import { PageLayout } from '@/features/shared';

const DetailedApplyPage = () => {
  return (
    <PageLayout 
      title="Detailed Application" 
      description="Complete your job application with detailed information"
      showFooter={false}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Detailed Application Form</h2>
          <p className="text-muted-foreground">
            This feature is being migrated to the new architecture. Please use the standard application form for now.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default DetailedApplyPage;