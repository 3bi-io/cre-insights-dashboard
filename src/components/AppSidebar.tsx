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
  Link,
  Mic,
  BarChart3,
  TrendingUp,
  Shield,
  Target
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
  const { state, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/jobs', label: 'Job Listings', icon: BriefcaseIcon },
    { path: '/dashboard/campaigns', label: 'Campaigns', icon: Target },
    { path: '/dashboard/applications', label: 'Applications', icon: Users },
    { path: '/dashboard/ai-analytics', label: 'AI Analytics', icon: BarChart3 },
    { path: '/dashboard/voice-agent', label: 'Voice Agent', icon: Mic },
    { path: '/dashboard/tenstreet', label: 'Tenstreet Integration', icon: Link },
    { path: '/dashboard/routes', label: 'Routes', icon: MapPin },
    { path: '/dashboard/platforms', label: 'Platforms', icon: Megaphone },
    { path: '/dashboard/clients', label: 'Clients', icon: Building },
    { path: '/dashboard/privacy-controls', label: 'Privacy Controls', icon: Shield },
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
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="border-b px-4 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
            alt="C.R. England" 
            className="h-8 w-auto"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-lg leading-none">CRE Insights</span>
            <span className="text-xs text-muted-foreground leading-none mt-0.5">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={active}
                        className={`
                          relative group transition-all duration-200 
                          ${active 
                            ? 'bg-primary text-primary-foreground shadow-sm font-medium' 
                            : 'hover:bg-accent hover:text-accent-foreground'
                          }
                          h-10 px-3
                        `}
                      >
                        <NavLink 
                          to={item.path} 
                          className="flex items-center w-full gap-3"
                          onClick={() => {
                            // Auto-close mobile menu after navigation
                            if (isMobile) {
                              setTimeout(() => setOpenMobile(false), 150);
                            }
                          }}
                        >
                          <Icon className={`
                            w-4 h-4
                            ${active ? 'text-primary-foreground' : ''}
                            transition-transform group-hover:scale-110
                          `} />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-4 shrink-0">
        {user && (
          <div className="space-y-3">
            <div className="px-2 py-2 rounded-lg bg-accent/50 border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {user.email}
                  </div>
                  {userRole && (
                    <Badge className={`${getRoleBadgeColor(userRole)} text-xs`}>
                      {userRole}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
