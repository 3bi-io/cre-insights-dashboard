import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/common';
import PublicFooter from './PublicFooter';
import { SkipLinks } from '@/components/shared/SkipLinks';

const PublicLayout = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <SkipLinks />
      
      <Header />
      
      <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
