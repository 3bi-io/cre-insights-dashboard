import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/common';
import PublicFooter from './PublicFooter';
import PublicBottomNav from './PublicBottomNav';
import { SkipLinks } from '@/components/shared/SkipLinks';
import ScrollToTop from '@/components/shared/ScrollToTop';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

const PublicLayout = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <SkipLinks />
      <ScrollToTop />
      
      <Header />
      
      <main id="main-content" className="flex-1 overflow-y-auto pb-16 md:pb-0" tabIndex={-1}>
        <ErrorBoundary
          name="PublicLayout"
          level="error"
          fallbackProps={{
            title: 'Something went wrong',
            description: 'This page encountered an error. Please try refreshing.',
          }}
        >
          <Outlet />
        </ErrorBoundary>
        <PublicFooter />
      </main>

      <PublicBottomNav />
    </div>
  );
};

export default PublicLayout;
