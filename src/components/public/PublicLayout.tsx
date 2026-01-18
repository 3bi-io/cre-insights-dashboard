import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/common';
import PublicFooter from './PublicFooter';
import { SkipLinks } from '@/components/shared/SkipLinks';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SkipLinks />
      
      <Header />
      
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
