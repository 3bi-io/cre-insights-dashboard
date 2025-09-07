import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutDashboard, BriefcaseIcon, Users, Settings, Building, MessageSquare, Phone, Route, Share2, Shield, FileImage } from 'lucide-react';
const AppSidebar = () => {
  const location = useLocation();
  const {
    user,
    userRole,
    organization,
    signOut
  } = useAuth();
  const navigationItems = [{
    group: "Analytics",
    items: [{
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    }]
  }, {
    group: "Recruitment",
    items: [{
      path: '/dashboard/jobs',
      label: 'Job Listings',
      icon: BriefcaseIcon
    }, {
      path: '/dashboard/applications',
      label: 'Applications',
      icon: Users
    }, {
      path: '/dashboard/campaigns',
      label: 'Campaigns',
      icon: MessageSquare
    }, {
      path: '/dashboard/voice-agent',
      label: 'Voice Agent',
      icon: Phone
    }]
  }, {
    group: "Management",
    items: [{
      path: '/dashboard/routes',
      label: 'Routes',
      icon: Route
    }, {
      path: '/dashboard/platforms',
      label: 'Platforms',
      icon: Share2
    }, {
      path: '/dashboard/clients',
      label: 'Clients',
      icon: Building
    }, ...(userRole === 'admin' || userRole === 'super_admin' ? [{
      path: '/dashboard/organizations',
      label: 'Organizations',
      icon: Building
    }] : []), {
      path: '/dashboard/tenstreet',
      label: 'Tenstreet',
      icon: Share2
    }, {
      path: '/dashboard/media',
      label: 'Media',
      icon: FileImage
    }]
  }, {
    group: "Settings",
    items: [{
      path: '/dashboard/privacy-controls',
      label: 'Privacy Controls',
      icon: Shield
    }, {
      path: '/dashboard/settings',
      label: 'Settings',
      icon: Settings
    }]
  }];
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };
  const handleSignOut = async () => {
    await signOut();
  };
  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'moderator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };
  const regularGroups = navigationItems.filter(group => group.group === "Analytics" || group.group === "Recruitment");
  const accordionGroups = navigationItems.filter(group => group.group === "Management" || group.group === "Settings");
  return <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          {organization ? (
            <>
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={organization.name} 
                  className="h-8 w-auto" 
                />
              ) : (
                <img 
                  src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
                  alt={organization.name} 
                  className="h-8 w-auto" 
                />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{organization.name}</span>
                <span className="text-xs text-muted-foreground">ATS Platform</span>
              </div>
            </>
          ) : (
            <>
              <img 
                src="/ats-io-logo.png" 
                alt="ATS.IO" 
                className="h-8 w-auto" 
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">ATS.IO</span>
                <span className="text-xs text-muted-foreground">Applicant Tracking System</span>
              </div>
            </>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Regular groups */}
        {regularGroups.map(group => <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(item => {
              const Icon = item.icon;
              return <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive(item.path)}>
                        <Link to={item.path} className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>;
            })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>)}

        {/* Accordion groups */}
        <div className="px-2">
          <Accordion type="multiple" defaultValue={[]}>
            {accordionGroups.map(group => <AccordionItem key={group.group} value={group.group}>
                <AccordionTrigger className="text-xs font-medium text-sidebar-foreground/70 hover:no-underline py-2">
                  {group.group}
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <SidebarMenu>
                    {group.items.map(item => {
                  const Icon = item.icon;
                  return <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={isActive(item.path)}>
                            <Link to={item.path} className="flex items-center gap-3">
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>;
                })}
                  </SidebarMenu>
                </AccordionContent>
              </AccordionItem>)}
          </Accordion>
        </div>
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{user?.email}</div>
                  {userRole && (
                    <Badge className={`text-xs ${getRoleBadgeColor(userRole)}`}>
                      {userRole === 'super_admin' ? 'Super Admin' : 
                       userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </Badge>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
      
    </Sidebar>;
};
export default AppSidebar;