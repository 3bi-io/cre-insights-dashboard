
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  BriefcaseIcon, 
  Users, 
  Settings, 
  LogOut,
  Building,
  MapPin,
  Megaphone,
  Link
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const AppSidebar = () => {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/jobs', label: 'Job Listings', icon: BriefcaseIcon },
    { path: '/dashboard/applications', label: 'Applications', icon: Users },
    { path: '/dashboard/tenstreet', label: 'Tenstreet Integration', icon: Link },
    { path: '/dashboard/routes', label: 'Routes', icon: MapPin },
    { path: '/dashboard/platforms', label: 'Platforms', icon: Megaphone },
    { path: '/dashboard/clients', label: 'Clients', icon: Building },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
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
    <Sidebar collapsible="icon" className={isMobile ? "w-full" : ""}>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-2">
          <SidebarTrigger />
          {(state === 'expanded' || isMobile) && (
            <img 
              src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
              alt="C.R. England" 
              className="h-8 w-auto"
            />
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
                      <NavLink to={item.path} className="flex items-center w-full">
                        <Icon className="w-4 h-4" />
                        <span className={isMobile || state === 'expanded' ? 'block' : 'sr-only'}>
                          {item.label}
                        </span>
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
            {(state === 'expanded' || isMobile) && (
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
              {(state === 'expanded' || isMobile) && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
