import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/common';
import PublicFooter from './PublicFooter';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
