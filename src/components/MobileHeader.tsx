import React from 'react';
import { useLocation, Link } from 'react-router-dom';
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
import { 
  getUserInitials, 
  getRoleBadgeColor, 
  getRoleDisplayName 
} from '@/utils/navigationUtils';

const MobileHeader = () => {
  const location = useLocation();
  const { user, userRole, organization, signOut } = useAuth();
  const { state } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
  };

  const initials = getUserInitials(user?.email);

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
        <div className="flex items-center gap-3 min-w-0">
          <Brand variant="icon" size="sm" showAsLink={false} priority={true} />
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-semibold leading-none text-foreground truncate">
              {getRouteTitle(location.pathname)}
            </h1>
            {organization?.name && (
              <span className="text-xs text-muted-foreground truncate mt-0.5">
                {organization.name}
              </span>
            )}
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
                  {userRole && (
                    <Badge className={`${getRoleBadgeColor(userRole)} text-xs w-fit mt-1`}>
                      {getRoleDisplayName(userRole)}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/admin/settings?tab=profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              {(userRole === 'admin' || userRole === 'super_admin') && (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to={userRole === 'super_admin' ? '/admin/organizations' : '/admin/settings/organization'}>
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>Organization</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/admin/user-management">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Team Members</span>
                    </Link>
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
