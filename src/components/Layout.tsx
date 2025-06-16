
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import ThemeToggle from './ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';

const LayoutContent = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header with conditional logo and theme toggle */}
        <header className="h-16 flex items-center justify-between border-b bg-card px-4 shrink-0">
          <div className="flex items-center gap-4">
            {(state === 'collapsed' && !isMobile) && (
              <img 
                src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
                alt="C.R. England" 
                className="h-8 w-auto"
              />
            )}
          </div>
          <ThemeToggle />
        </header>
        
        <main className="flex-1 overflow-auto">
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
