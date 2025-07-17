import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MobileHeader = () => {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const { state } = useSidebar();

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname;
    const routes: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/dashboard/jobs': 'Job Listings',
      '/dashboard/applications': 'Applications',
      '/dashboard/ai-analytics': 'AI Analytics',
      '/dashboard/ai-impact': 'AI Impact',
      '/dashboard/voice-agent': 'Voice Agent',
      '/dashboard/tenstreet': 'Tenstreet',
      '/dashboard/routes': 'Routes',
      '/dashboard/platforms': 'Platforms',
      '/dashboard/clients': 'Clients',
      '/dashboard/privacy-controls': 'Privacy Controls',
      '/dashboard/settings': 'Settings',
    };
    return routes[path] || 'Dashboard';
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'moderator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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
    <header className="h-16 flex items-center justify-between border-b bg-card px-4 shrink-0 sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors" />
        
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
            alt="C.R. England" 
            className="h-8 w-auto"
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold leading-none text-foreground">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">
              CRE Insights
            </p>
          </div>
        </div>
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
                  {userRole && (
                    <Badge className={`${getRoleBadgeColor(userRole)} text-xs w-fit mt-1`}>
                      {userRole}
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
  );
};

export default MobileHeader;