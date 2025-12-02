import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { useATSExplorerAccess } from '@/hooks/useATSExplorerAccess';
import { useTenstreetNotifications } from '@/hooks/useTenstreetNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, BriefcaseIcon, Users, Settings, Building, MessageSquare, Share2, Shield, Zap, Bot, UserCog, BarChart3, MapPin, UserCheck, Rss, HelpCircle, Target, TrendingUp, Sparkles, Webhook, Globe, Key, FolderKanban } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { Brand } from '@/components/common';

const AppSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, userRole, organization, signOut } = useAuth();
  const { hasVoiceAgent, hasTenstreetAccess } = useOrganizationFeatures();
  const { hasATSExplorerAccess } = useATSExplorerAccess();
  const { counts: tenstreetCounts } = useTenstreetNotifications();

  // Check role helpers
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

  // Main standalone items
  const mainItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ];

  // Restructured navigation with logical groupings
  const navigationItems = [
    {
      group: "Recruitment",
      icon: Users,
      items: [
        { path: '/admin/applications', label: 'Applications', icon: Users },
        { path: '/admin/jobs', label: 'Job Listings', icon: BriefcaseIcon },
        ...(organization?.slug !== 'acme' ? [
          { path: '/admin/clients', label: 'Clients', icon: UserCheck }
        ] : []),
        { path: '/admin/routes', label: 'Routes', icon: MapPin },
        ...(hasVoiceAgent() && isAdmin ? [
          { path: '/admin/elevenlabs-admin', label: 'Voice Agents', icon: MessageSquare }
        ] : [])
      ]
    },
    {
      group: "Campaigns",
      icon: Target,
      items: [
        { path: '/admin/campaigns', label: 'Campaigns', icon: Target },
        { path: '/admin/job-groups', label: 'Job Groups', icon: FolderKanban }
      ]
    },
    {
      group: "Integrations",
      icon: Share2,
      items: [
        ...(hasTenstreetAccess() ? [{
          path: '/admin/tenstreet',
          label: 'ATS Dashboard',
          icon: Share2,
          badge: tenstreetCounts.totalNotifications > 0 ? tenstreetCounts.totalNotifications : undefined
        }] : []),
        ...(hasATSExplorerAccess ? [
          { path: '/admin/tenstreet-explorer', label: 'ATS Explorer', icon: Zap }
        ] : []),
        { path: '/admin/publishers', label: 'Publishers', icon: Globe },
        ...(isAdmin ? [
          { path: '/admin/webhook-management', label: 'Webhooks', icon: Webhook }
        ] : []),
        ...(isSuperAdmin ? [
          { path: '/admin/universal-feeds', label: 'Universal Feeds', icon: Rss },
          { path: '/admin/tenstreet-credentials', label: 'ATS Credentials', icon: Key }
        ] : [])
      ]
    },
    {
      group: "AI Platform",
      icon: Bot,
      items: [
        { path: '/admin/grok', label: 'AI Assistant', icon: Sparkles },
        { path: '/admin/ai-tools', label: 'AI Tools', icon: Bot },
        { path: '/admin/ai-analytics', label: 'AI Analytics', icon: BarChart3 },
        { path: '/admin/ai-impact', label: 'AI Impact', icon: Zap }
      ]
    },
    ...(isSuperAdmin ? [{
      group: "Analytics",
      icon: TrendingUp,
      items: [
        { path: '/admin/visitor-analytics', label: 'Visitor Analytics', icon: BarChart3 },
        { path: '/admin/meta-adset-report', label: 'Meta Ad Sets', icon: TrendingUp },
        { path: '/admin/meta-spend-analytics', label: 'Meta Spend', icon: Share2 }
      ]
    }] : []),
    {
      group: "Settings",
      icon: Settings,
      items: [
        { path: '/admin/ai-settings', label: 'AI Configuration', icon: Settings },
        { path: '/admin/privacy-controls', label: 'Privacy & Compliance', icon: Shield },
        { path: '/admin/support', label: 'Support', icon: HelpCircle }
      ]
    },
    ...(isSuperAdmin ? [{
      group: "Administration",
      icon: Building,
      items: [
        { path: '/admin/organizations', label: 'Organizations', icon: Building },
        { path: '/admin/user-management', label: 'User Management', icon: UserCog },
        { path: '/admin/super-admin-feeds', label: 'Feed Management', icon: Rss }
      ]
    }] : [])
  ];
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
  // First group (Recruitment) shown expanded, rest in accordion
  const regularGroups = navigationItems.filter(group => group.group === "Recruitment");
  const accordionGroups = navigationItems.filter(group => group.group !== "Recruitment");
  
  // Auto-expand relevant accordion groups on dashboard
  const shouldExpandAll = location.pathname === '/dashboard' && !isMobile;
  const defaultExpandedValues = shouldExpandAll 
    ? accordionGroups.map(group => group.group) 
    : [];
  return <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          {organization ? (
            <Brand 
              variant="horizontal" 
              size="md" 
              showAsLink={false}
              priority={true}
              customLogoUrl={organization.logo_url}
              organizationName={organization.name}
            />
          ) : (
            <Brand variant="horizontal" size="md" showAsLink={false} priority={true} />
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
                  const itemBadge = (item as any).badge;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive(item.path)}>
                        <Link to={item.path} className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span className="flex-1">{item.label}</span>
                          {itemBadge && (
                            <Badge variant="destructive" className="ml-auto">
                              {itemBadge}
                            </Badge>
                          )}
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