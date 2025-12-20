import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/common';
import PublicFooter from './PublicFooter';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip Links for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>
      
      <Header />
      
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
