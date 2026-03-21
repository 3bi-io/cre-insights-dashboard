import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, 
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, 
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  useSidebar
} from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { useTenstreetNotifications } from '@/hooks/useTenstreetNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Building, User, CreditCard, Lock, UserCog, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { Brand } from '@/components/common';
import { getNavigationGroups, mainNavItems } from '@/config/navigationConfig';
import { getRoleBadgeColor, getUserInitials, getRoleDisplayName, getDisplayName } from '@/utils/navigationUtils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const AppSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, userRole, organization, signOut } = useAuth();
  const { hasVoiceAgent, hasTenstreetAccess } = useOrganizationFeatures();
  const { counts: tenstreetCounts } = useTenstreetNotifications();

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

  // Fetch pending applications count for badge
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-applications-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count || 0;
    },
    staleTime: 2 * 60 * 1000,
    enabled: isAdmin || userRole === 'recruiter',
  });

  const mainItems = mainNavItems;
  const navigationItems = getNavigationGroups({
    userRole,
    isSuperAdmin,
    isAdmin,
    hasVoiceAgent: hasVoiceAgent(),
    hasTenstreetAccess: hasTenstreetAccess(),
    organizationSlug: organization?.slug,
    tenstreetNotificationCount: tenstreetCounts.totalNotifications
  });

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/dashboard';
    }
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search;
    }
    if (path.includes('?')) {
      const pathWithoutHash = path.split('#')[0];
      const [basePath, query] = pathWithoutHash.split('?');
      return location.pathname === basePath && location.search === `?${query}`;
    }
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = getUserInitials(user?.email);
  const displayName = getDisplayName(undefined, undefined, user?.email);

  const regularGroups = navigationItems.filter(group => group.group === "Recruitment");
  const accordionGroups = navigationItems.filter(group => group.group !== "Recruitment");
  
  const shouldExpandAll = location.pathname === '/dashboard' && !isMobile;
  const defaultExpandedValues = shouldExpandAll 
    ? accordionGroups.map(group => group.group) 
    : [];

  // Get badge for a nav item
  const getItemBadge = (item: any) => {
    if (item.badge) return item.badge;
    if (item.path === '/admin/applications' && pendingCount && pendingCount > 0) {
      return pendingCount;
    }
    return undefined;
  };

  return (
    <Sidebar aria-label="Admin sidebar navigation" collapsible="icon">
      {/* Header with Logo + Role Badge */}
      <SidebarHeader className="border-b border-border/50">
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
        {/* Super Admin indicator */}
        {isSuperAdmin && !collapsed && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-medium text-amber-500 tracking-wide uppercase">Super Admin Mode</span>
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="relative">
        {/* Main standalone items */}
        {mainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu role="menu" aria-label="Main navigation">
                {mainItems.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link 
                          to={item.path} 
                          className={cn(
                            "flex items-center gap-3 rounded-lg transition-all duration-150",
                            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                            active && "border-l-2 border-primary bg-primary/10 text-primary font-medium"
                          )}
                          role="menuitem"
                          aria-current={active ? 'page' : undefined}
                        >
                          <Icon className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
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

        {/* Regular groups (Recruitment) */}
        {regularGroups.map(group => (
          <SidebarGroup key={group.group} role="group" aria-labelledby={`group-${group.group}`}>
            <SidebarGroupLabel 
              id={`group-${group.group}`}
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-4"
            >
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu role="menu" aria-label={`${group.group} navigation`}>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const itemBadge = getItemBadge(item);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link 
                          to={item.path} 
                          className={cn(
                            "flex items-center gap-3 rounded-lg transition-all duration-150",
                            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                            active && "border-l-2 border-primary bg-primary/10 text-primary font-medium",
                            !active && "hover:bg-muted/50"
                          )}
                          role="menuitem"
                          aria-current={active ? 'page' : undefined}
                        >
                          <Icon className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                          <span className="flex-1">{item.label}</span>
                          {itemBadge && (
                            <Badge 
                              variant="destructive" 
                              className="ml-auto h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5 rounded-full"
                              aria-label={`${itemBadge} notifications`}
                            >
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
              <AccordionItem key={group.group} value={group.group} className="border-none">
                <AccordionTrigger 
                  className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:no-underline py-2 px-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-md"
                  aria-label={`${group.group} section`}
                >
                  {group.group}
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <SidebarMenu role="menu" aria-label={`${group.group} navigation`}>
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      const itemBadge = getItemBadge(item);
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={active}>
                            <Link 
                              to={item.path} 
                              className={cn(
                                "flex items-center gap-3 rounded-lg transition-all duration-150",
                                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                                active && "border-l-2 border-primary bg-primary/10 text-primary font-medium",
                                !active && "hover:bg-muted/50"
                              )}
                              role="menuitem"
                              aria-current={active ? 'page' : undefined}
                            >
                              <Icon className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                              <span className="flex-1">{item.label}</span>
                              {itemBadge && (
                                <Badge 
                                  variant="destructive" 
                                  className="ml-auto h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5 rounded-full"
                                  aria-label={`${itemBadge} notifications`}
                                >
                                  {itemBadge}
                                </Badge>
                              )}
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

        {/* Scroll fade indicator */}
        <div className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-sidebar to-transparent" />
      </SidebarContent>
      
      {/* Footer - User Profile Chip */}
      <SidebarFooter className="border-t border-border/50">
        {/* Collapse toggle */}
        {!isMobile && (
          <div className="px-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-full justify-center h-7 text-muted-foreground hover:text-foreground"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span className="text-xs">Collapse</span>
                </>
              )}
            </Button>
          </div>
        )}

        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start h-auto py-2.5 px-3 rounded-xl",
                  "bg-muted/30 hover:bg-muted/60 border border-border/50",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                )}
                aria-label="Open account menu"
                aria-haspopup="menu"
              >
                <Avatar className="w-8 h-8 mr-3 shrink-0">
                  <AvatarFallback className={cn(
                    "text-xs font-semibold",
                    userRole === 'super_admin' && "bg-amber-500/20 text-amber-500",
                    userRole === 'admin' && "bg-blue-500/20 text-blue-400",
                    userRole === 'recruiter' && "bg-emerald-500/20 text-emerald-400",
                    userRole === 'client' && "bg-purple-500/20 text-purple-400",
                    !['super_admin', 'admin', 'recruiter', 'client'].includes(userRole || '') && "bg-muted text-muted-foreground"
                  )}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium truncate">{displayName}</div>
                    {userRole && (
                      <Badge 
                        variant="outline"
                        className={cn("text-[10px] mt-0.5 px-1.5 py-0", getRoleBadgeColor(userRole))}
                      >
                        {getRoleDisplayName(userRole)}
                      </Badge>
                    )}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.email}</p>
                  {organization && (
                    <p className="text-xs text-muted-foreground">{organization.name}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/settings?tab=profile" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              {organization && (
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings?tab=organization" className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Organization Settings
                  </Link>
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin/user-management" className="flex items-center">
                    <UserCog className="w-4 h-4 mr-2" />
                    Team Members
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/admin/settings?tab=integrations" className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Integrations
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/settings?tab=privacy" className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Security
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
