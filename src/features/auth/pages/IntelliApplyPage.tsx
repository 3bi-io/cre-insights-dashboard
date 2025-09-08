import React from 'react';
import { PageLayout } from '@/features/shared';

const IntelliApplyPage = () => {
  return (
    <PageLayout 
      title="IntelliApply" 
      description="Smart application process powered by AI"
      showFooter={false}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">IntelliApply System</h2>
          <p className="text-muted-foreground">
            This feature is being migrated to the new architecture. Enhanced AI-powered application experience coming soon.
          </p>
        </div>
      </div>
    </PageLayout>
  );
export default IntelliApplyPage;