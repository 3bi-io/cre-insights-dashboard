import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Settings, Building2, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Brand } from '@/components/common';
import { getRouteTitle } from '@/config/navigationConfig';

const MobileHeader = () => {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const { state } = useSidebar();

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
    <header 
      className="h-12 flex items-center justify-between border-b bg-card px-4 shrink-0 sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/95 py-2"
      role="banner"
      aria-label="Admin header"
    >
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <SidebarTrigger 
          className="hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
          aria-label="Toggle sidebar navigation"
        />
        
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <Brand variant="icon" size="sm" showAsLink={false} priority={true} />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold leading-none text-foreground">
              {getRouteTitle(location.pathname)}
            </h1>
          </div>
        </div>
      </div>

      {/* Right side - User menu and theme toggle */}
      <div className="flex items-center gap-2" role="group" aria-label="User actions">
        <ThemeToggle />
        
        {/* User Profile Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Open user menu"
                aria-haspopup="menu"
              >
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
              <DropdownMenuItem asChild className="cursor-pointer">
                <a href="/admin/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <a href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
              {(userRole === 'admin' || userRole === 'super_admin') && (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <a href="/admin/organizations">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>Organization</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <a href="/admin/user-management">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Team Members</span>
                    </a>
                  </DropdownMenuItem>
                </>
              )}
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
