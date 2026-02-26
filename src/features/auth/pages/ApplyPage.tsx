import React from 'react';
import { ApplicationHeader, ApplicationForm } from '../components';

const ApplyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <ApplicationHeader />
          <ApplicationForm />
        </div>
      </div>
    </div>
  );
};

export default ApplyPage;