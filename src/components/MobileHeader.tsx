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
      '/': 'Home',
      '/dashboard': 'Admin Dashboard',
      '/admin/jobs': 'Job Listings',
      '/admin/applications': 'Applications',
      '/admin/campaigns': 'Campaigns',
      '/admin/job-groups': 'Job Groups',
      '/admin/ai-impact': 'AI Impact',
      '/admin/voice-agent': 'Voice Agent',
      '/admin/tenstreet': 'ATS Integrations',
      '/admin/publishers': 'Publishers',
      '/admin/organizations': 'Organizations',
      '/admin/media': 'Media',
      '/admin/privacy-controls': 'Privacy Controls',
      '/admin/settings': 'Settings',
      '/admin/user-management': 'User Management',
    };
    return routes[path] || 'Dashboard';
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
    <header className="h-16 flex items-center justify-between border-b bg-card px-4 shrink-0 sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors" />
        
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <img 
            src="/ats-io-logo.png" 
            alt="INTEL ATS" 
            className="h-8 w-auto"
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold leading-none text-foreground">
              {getPageTitle()}
            </h1>
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
  );
};

export default MobileHeader;