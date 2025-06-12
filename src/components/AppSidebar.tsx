
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  BriefcaseIcon, 
  Users, 
  Settings, 
  BarChart3,
  LogOut,
  UserCheck
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const AppSidebar = () => {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const { state } = useSidebar();

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/jobs', label: 'Job Listings', icon: BriefcaseIcon },
    { path: '/applications', label: 'Applications', icon: Users },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/accounts', label: 'Accounts', icon: UserCheck },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <BriefcaseIcon className="w-5 h-5" />
          </div>
          {state === 'expanded' && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">C.R. England</span>
              <span className="text-xs text-muted-foreground">Analytics</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive(item.path)}>
                      <NavLink to={item.path}>
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <div className="p-2 space-y-2">
            {state === 'expanded' && (
              <div className="px-2 py-2 text-sm">
                <div className="font-medium text-foreground truncate">{user.email}</div>
                {userRole && (
                  <Badge className={`${getRoleBadgeColor(userRole)} text-xs mt-1`}>
                    {userRole}
                  </Badge>
                )}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4" />
              {state === 'expanded' && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
