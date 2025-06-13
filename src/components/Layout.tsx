
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import ThemeToggle from './ThemeToggle';

const LayoutContent = () => {
  const { state } = useSidebar();
  
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top header with sidebar trigger, conditional logo and theme toggle */}
        <header className="h-16 flex items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            {state === 'collapsed' && (
              <img 
                src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
                alt="C.R. England" 
                className="h-8 w-auto"
              />
            )}
          </div>
          <ThemeToggle />
        </header>
        
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const Layout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default Layout;
