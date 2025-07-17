
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import ThemeToggle from './ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatBot from '@/components/chat/MobileChatBot';
import MobileHeader from './MobileHeader';

const LayoutContent = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Extract page name from current route
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path.includes('/dashboard/')) {
      return path.split('/dashboard/')[1];
    }
    return 'dashboard';
  };
  
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Always show mobile header on mobile, desktop header on desktop */}
        <div className="md:hidden">
          <MobileHeader />
        </div>
        <div className="hidden md:block">
          <header className="h-16 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-4">
              {(state === 'collapsed') && (
                <img 
                  src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
                  alt="C.R. England" 
                  className="h-8 w-auto"
                />
              )}
            </div>
            <ThemeToggle />
          </header>
        </div>
        
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        
        {/* Global ChatBot */}
        <ChatBot page={getCurrentPage()} />
      </div>
    </div>
  );
};

const Layout = () => {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default Layout;
