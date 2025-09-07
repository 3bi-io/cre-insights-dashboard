import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import DashboardLoading from '@/components/dashboard/DashboardLoading';
import { Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatBot from '@/components/chat/MobileChatBot';
import MobileHeader from '@/components/MobileHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { dateRange, setDateRange, filters, updateFilters, resetFilters } = useDashboardFilters();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

const LayoutContent = () => {
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const { user, userRole, organization, signOut } = useAuth();
  
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
              {(state === 'collapsed') && organization && (
                <div className="flex items-center gap-2">
                  {organization.logo_url ? (
                    <img 
                      src={organization.logo_url} 
                      alt={organization.name} 
                      className="h-8 w-auto"
                    />
                  ) : (
                    <img 
                      src="/ats-io-logo.png" 
                      alt={organization.name} 
                      className="h-8 w-auto"
                    />
                  )}
                  <span className="text-sm font-medium text-muted-foreground">
                    {organization.name}
                  </span>
                </div>
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
        
        <main className="flex-1 overflow-auto">
          <DashboardContent />
        </main>
        
        {/* Global ChatBot */}
        <ChatBot page="dashboard" />
      </div>
    </div>
  );
};

const Home = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return <DashboardLoading />;
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is authenticated, show dashboard with layout
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default Home;