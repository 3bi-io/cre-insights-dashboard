import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutDashboard, BriefcaseIcon, Users, Settings, Building, MessageSquare, Phone, Share2, Shield, FileImage, Zap, Bot, Palette, UserCog, BarChart3, MapPin, UserCheck, Rss, HelpCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Brand } from '@/components/common';
const AppSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const {
    user,
    userRole,
    organization,
    signOut
  } = useAuth();
  const { hasVoiceAgent, hasTenstreetAccess } = useOrganizationFeatures();
  // Main standalone items
  const mainItems = [
    ...(userRole === 'super_admin' || userRole === 'admin' ? [{
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    }] : [])
  ];

  const navigationItems = [{
    group: "Recruitment", 
    items: [
      {
        path: '/admin/applications',
        label: 'Applications',
        icon: Users
      },
      {
        path: '/admin/jobs',
        label: 'Job Listings',
        icon: BriefcaseIcon
      },
      ...(organization?.slug !== 'acme' ? [{
        path: '/admin/clients',
        label: 'Clients',
        icon: UserCheck
      }] : []),
      {
        path: '/admin/routes',
        label: 'Routes',
        icon: MapPin
      },
      ...(hasVoiceAgent() ? [{
        path: '/admin/voice-agent',
        label: 'Voice Agent',
        icon: Phone
      }] : []),
      ...(organization?.slug === 'acme' ? [{
        path: '/demo',
        label: 'Demo Voice Agent',
        icon: MessageSquare
      }] : []),
      ...(hasVoiceAgent() && (userRole === 'super_admin' || userRole === 'admin') ? [{
        path: '/admin/elevenlabs-admin',
        label: 'ElevenLabs Admin',
        icon: MessageSquare
      }] : [])
    ]
  }, {
    group: "Campaigns",
    items: [
      {
        path: '/admin/job-groups',
        label: 'Job Groups',
        icon: BriefcaseIcon
      }
    ]
  }, {
    group: "Management",
    items: [
      {
        path: '/admin/publishers',
        label: 'Publishers',
        icon: Share2
      },
      ...(hasTenstreetAccess() ? [{
        path: '/admin/tenstreet',
        label: 'ATS Integrations',
        icon: Share2
      }] : []),
      ...(hasTenstreetAccess() && userRole === 'super_admin' ? [{
        path: '/admin/tenstreet-explorer',
        label: 'ATS Explorer',
        icon: Zap
      }] : []),
      ...(userRole === 'super_admin' ? [{
        path: '/admin/organizations',
        label: 'Organizations',
        icon: Building
       }] : []),
      ...(userRole === 'super_admin' ? [{
        path: '/admin/media',
        label: 'Media',
        icon: FileImage
      }] : [])
    ]
  }, {
    group: "AI & Analytics",
    items: [
      {
        path: '/admin/ai-tools',
        label: 'AI Tools',
        icon: Bot
      },
      {
        path: '/admin/ai-analytics',
        label: 'AI Analytics',
        icon: BarChart3
      },
      {
        path: '/admin/ai-impact',
        label: 'AI Impact',
        icon: Zap
      }
    ]
  }, {
    group: "Settings",
    items: [
      {
        path: '/admin/support',
        label: 'Support',
        icon: HelpCircle
      },
      {
        path: '/admin/ai-settings',
        label: 'AI Settings',
        icon: Settings
      },
      {
        path: '/admin/privacy-controls',
        label: 'Privacy Controls',
        icon: Shield
      },
      ...(userRole === 'super_admin' || userRole === 'admin' ? [{
        path: '/admin/webhook-management',
        label: 'Webhooks',
        icon: Share2
      }] : []),
      ...(userRole === 'super_admin' ? [{
        path: '/admin/user-management',
        label: 'User Management',
        icon: UserCog
      }] : []),
      ...(userRole === 'super_admin' ? [{
        path: '/admin/super-admin-feeds',
        label: 'Feed Management',
        icon: Rss
      }] : []),
      ...(userRole === 'super_admin' ? [{
        path: '/admin/hayes-data',
        label: 'Hayes Data',
        icon: Users
      }] : [])
    ]
  }];
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search;
    }
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      return location.pathname === basePath && location.search === `?${query}`;
    }
    return location.pathname === path;
  };
  const handleSignOut = async () => {
    await signOut();
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
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };
  const regularGroups = navigationItems.filter(group => group.group === "Recruitment");
  const accordionGroups = navigationItems.filter(group => 
    group.group === "Campaigns" || 
    group.group === "Management" || 
    group.group === "AI & Analytics" || 
    group.group === "Settings"
  );
  
  // Auto-expand all accordion groups on /dashboard for desktop and tablet devices
  const shouldExpandAll = location.pathname === '/dashboard' && !isMobile;
  const defaultExpandedValues = shouldExpandAll ? accordionGroups.map(group => group.group) : [];
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
                  src="/logo.png" 
                  alt={organization.name} 
                  className="h-8 w-auto" 
                />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{organization.name}</span>
              </div>
            </>
          ) : (
            <>
              <Brand size="md" showAsLink={false} />
            </>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main standalone items */}
        {mainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map(item => {
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
        )}

        {/* Regular groups */}
        {regularGroups.map(group => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(item => {
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
          <Accordion type="multiple" defaultValue={defaultExpandedValues}>
            {accordionGroups.map(group => (
              <AccordionItem key={group.group} value={group.group}>
                <AccordionTrigger className="text-xs font-medium text-sidebar-foreground/70 hover:no-underline py-2">
                  {group.group}
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <SidebarMenu>
                    {group.items.map(item => {
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
                       userRole === 'admin' ? 'Admin' :
                       userRole === 'moderator' ? 'Moderator' : 'User'}
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