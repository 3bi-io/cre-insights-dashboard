
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
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
import { 
  LayoutDashboard, 
  BriefcaseIcon, 
  Users, 
  Settings,
  Building,
  MessageSquare,
  Phone,
  Route,
  Share2,
  Shield,
  FileImage
} from 'lucide-react';

const AppSidebar = () => {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();

  const navigationItems = [
    { 
      group: "Analytics", 
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    { 
      group: "Recruitment", 
      items: [
        { path: '/dashboard/jobs', label: 'Job Listings', icon: BriefcaseIcon },
        { path: '/dashboard/applications', label: 'Applications', icon: Users },
        { path: '/dashboard/campaigns', label: 'Campaigns', icon: MessageSquare },
        { path: '/dashboard/voice-agent', label: 'Voice Agent', icon: Phone },
      ]
    },
    { 
      group: "Management", 
      items: [
        { path: '/dashboard/routes', label: 'Routes', icon: Route },
        { path: '/dashboard/platforms', label: 'Platforms', icon: Share2 },
        { path: '/dashboard/clients', label: 'Clients', icon: Building },
        { path: '/dashboard/tenstreet', label: 'Tenstreet', icon: Share2 },
        { path: '/dashboard/media', label: 'Media', icon: FileImage },
      ]
    },
    { 
      group: "Settings", 
      items: [
        { path: '/dashboard/privacy-controls', label: 'Privacy Controls', icon: Shield },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    },
  ];

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

  const regularGroups = navigationItems.filter(group => 
    group.group === "Analytics" || group.group === "Recruitment"
  );
  
  const accordionGroups = navigationItems.filter(group => 
    group.group === "Management" || group.group === "Settings"
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <img 
            src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
            alt="C.R. England" 
            className="h-8 w-auto"
          />
          <span className="font-semibold text-lg">Analytics</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Regular groups */}
        {regularGroups.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive(item.path)}>
                        <Link to={item.path} className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Accordion groups */}
        <div className="px-2">
          <Accordion type="multiple" defaultValue={["Management", "Settings"]}>
            {accordionGroups.map((group) => (
              <AccordionItem key={group.group} value={group.group}>
                <AccordionTrigger className="text-xs font-medium text-sidebar-foreground/70 hover:no-underline py-2">
                  {group.group}
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={isActive(item.path)}>
                            <Link to={item.path} className="flex items-center gap-3">
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="h-12 hover:bg-accent">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium truncate max-w-32">
                        {user.email}
                      </span>
                      {userRole && (
                        <Badge className={`${getRoleBadgeColor(userRole)} text-xs`}>
                          {userRole}
                        </Badge>
                      )}
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-56">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
