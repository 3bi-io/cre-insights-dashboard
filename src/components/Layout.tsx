import React, { Suspense, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import ThemeToggle from './ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
const ChatBot = React.lazy(() => import('@/components/chat/MobileChatBot'));
import MobileHeader from './MobileHeader';
import MobileBottomNav from './MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Brand } from '@/components/common';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';
import { SkipLinks } from '@/components/shared/SkipLinks';
import ScrollToTop from '@/components/shared/ScrollToTop';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  getUserInitials, 
  getRoleBadgeColor, 
  getRoleDisplayName 
} from '@/utils/navigationUtils';

const LayoutContent = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user, userRole, organization, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hasShownWelcome = useRef(false);
  
  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);
  
  // Show welcome balloon for admins
  useEffect(() => {
    if (user && (userRole === 'admin' || userRole === 'super_admin') && !hasShownWelcome.current) {
      hasShownWelcome.current = true;
      
      // Small delay to ensure page is loaded
      setTimeout(() => {
        toast({
          description: (
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">ƷBI Analytics Assistant</div>
                <div className="text-sm">Get AI Insights</div>
              </div>
            </div>
          ),
          duration: 5000,
        });
      }, 1000);
    }
  }, [user, userRole, toast]);
  
  // Extract page name from current route
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    return path.slice(1) || 'dashboard';
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const initials = getUserInitials(user?.email);
  
  return (
    <div className="h-screen flex w-full overflow-hidden">
      <SkipLinks />
      <ScrollToTop />
      
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Always show mobile header on mobile, desktop header on desktop */}
        <div className="md:hidden">
          <MobileHeader />
        </div>
        <div className="hidden md:block">
          <header className="h-16 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              {(state === 'collapsed') && (
                <Brand variant="horizontal" size="md" showAsLink={true} linkTo="/dashboard" priority={true} />
              )}
            </div>
            
            {/* Right side - User menu and theme toggle */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              {/* User Profile Dropdown */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Account</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                        {organization && (
                          <p className="text-xs leading-none text-muted-foreground">
                            {organization.name}
                          </p>
                        )}
                        {userRole && (
                          <Badge className={`${getRoleBadgeColor(userRole)} text-xs w-fit mt-1`}>
                            {getRoleDisplayName(userRole)}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
        </div>
        
        <PullToRefresh 
          onRefresh={handleRefresh} 
          enabled={isMobile}
          className="flex-1 h-full pb-16 md:pb-0"
        >
          <main id="main-content" className="min-h-full p-4 md:p-6" tabIndex={-1}>
            <ErrorBoundary name="AdminLayout" level="error" fallbackProps={{ title: 'Something went wrong', description: 'This page encountered an error. Please try again.' }}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </PullToRefresh>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
        
        {/* Global ChatBot - Only for Admin and Super Admin */}
        {(userRole === 'admin' || userRole === 'super_admin') && organization && (
          <Suspense fallback={null}>
            <ChatBot 
              page={getCurrentPage()} 
              context={{
                organizationId: organization.id,
                organizationName: organization.name,
                organizationSlug: organization.slug,
                userRole: userRole,
              }}
            />
          </Suspense>
        )}
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
