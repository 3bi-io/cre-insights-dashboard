
import React from 'react';
import { Link } from 'react-router-dom';
import { ApplicationHeader } from '@/components/apply/ApplicationHeader';
import { ApplicationForm } from '@/components/apply/ApplicationForm';

const Apply = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <ApplicationHeader />
          <ApplicationForm />
          <div className="text-center mt-6 pb-6">
            <Link 
              to="/" 
              className="text-primary hover:underline inline-flex items-center gap-2 text-base sm:text-sm touch-manipulation py-2 px-4 rounded-md hover:bg-accent transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apply;
