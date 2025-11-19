import React, { useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import ThemeToggle from './ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatBot from '@/components/chat/MobileChatBot';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LayoutContent = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user, userRole, organization, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hasShownWelcome = useRef(false);
  
  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    toast({
      description: "Content refreshed",
      duration: 2000,
    });
  }, [queryClient, toast]);
  
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

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'admin':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'moderator':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
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
                          {getUserInitials()}
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
                            {userRole === 'super_admin' ? 'Super Admin' : 
                             userRole === 'admin' ? 'Admin' :
                             userRole === 'moderator' ? 'Moderator' : 'User'}
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
          className="flex-1 flex flex-col pb-16 md:pb-0"
        >
          <main className="flex-1">
            <Outlet />
          </main>
        </PullToRefresh>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
        
        {/* Global ChatBot - Only for Admin and Super Admin */}
        {(userRole === 'admin' || userRole === 'super_admin') && organization && (
          <ChatBot 
            page={getCurrentPage()} 
            context={{
              organizationId: organization.id,
              organizationName: organization.name,
              organizationSlug: organization.slug,
              userRole: userRole,
            }}
          />
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
