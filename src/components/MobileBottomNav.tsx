import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { useTenstreetNotifications } from '@/hooks/useTenstreetNotifications';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getNavigationGroups } from '@/config/navigationConfig';

interface PrimaryNavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  activePatterns: string[];
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, organization } = useAuth();
  const { hasVoiceAgent, hasTenstreetAccess } = useOrganizationFeatures();
  const { counts: tenstreetCounts } = useTenstreetNotifications();
  const [moreOpen, setMoreOpen] = useState(false);

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

  // Primary nav items (always visible in bottom bar)
  const primaryNavItems: PrimaryNavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin',
      activePatterns: ['/admin']
    },
    {
      icon: Users,
      label: 'Applications',
      path: '/admin/applications',
      activePatterns: ['/admin/applications']
    },
    {
      icon: Briefcase,
      label: 'Jobs',
      path: '/admin/jobs',
      activePatterns: ['/admin/jobs']
    }
  ];

  // Get navigation groups from centralized config
  const navigationGroups = getNavigationGroups({
    userRole,
    isSuperAdmin,
    isAdmin,
    hasVoiceAgent: hasVoiceAgent(),
    hasTenstreetAccess: hasTenstreetAccess(),
    organizationSlug: organization?.slug,
    tenstreetNotificationCount: tenstreetCounts.totalNotifications
  });

  // Filter out Recruitment group from "More" menu since Applications/Jobs are in primary nav
  const moreNavGroups = navigationGroups.map(group => {
    if (group.group === "Recruitment") {
      // Exclude Applications and Job Listings as they're in primary nav
      return {
        ...group,
        items: group.items.filter(item => 
          item.path !== '/admin/applications' && 
          item.path !== '/admin/jobs'
        )
      };
    }
    return group;
  }).filter(group => group.items.length > 0);

  const isActive = (path: string, patterns?: string[]) => {
    const checkPatterns = patterns || [path];
    return checkPatterns.some(pattern => {
      if (pattern === '/dashboard') {
        return location.pathname === pattern;
      }
      // Handle paths with query parameters and hash fragments
      if (pattern.includes('?')) {
        const patternWithoutHash = pattern.split('#')[0];
        const [basePath, query] = patternWithoutHash.split('?');
        return location.pathname === basePath && location.search === `?${query}`;
      }
      return location.pathname.startsWith(pattern);
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Primary mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2" role="menubar">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.activePatterns);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              role="menuitem"
              aria-current={active ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} aria-hidden="true" />
              <span className={cn("text-xs font-medium", active && "font-semibold")}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Menu */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              role="menuitem"
              aria-label="Open more navigation options"
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {moreOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
              )}
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="h-[70vh] rounded-t-xl"
            aria-label="Additional navigation options"
          >
            <SheetHeader className="pb-4">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full pb-8">
              <div className="space-y-6" role="menu">
                {moreNavGroups.map((group, idx) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.group} role="group" aria-labelledby={`group-${group.group}`}>
                      {idx > 0 && <Separator className="mb-4" />}
                      <div className="flex items-center gap-2 mb-3" id={`group-${group.group}`}>
                        <GroupIcon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm font-medium text-muted-foreground">{group.group}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2" role="group">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.path);
                          const badge = item.badge;
                          return (
                            <button
                              key={item.path}
                              onClick={() => handleNavigate(item.path)}
                              role="menuitem"
                              aria-current={active ? 'page' : undefined}
                              aria-label={`Navigate to ${item.label}${badge ? ` (${badge} notifications)` : ''}`}
                              className={cn(
                                "relative flex flex-col items-center justify-center p-3 rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                                active 
                                  ? "bg-primary/10 border-primary/20 text-primary" 
                                  : "bg-muted/50 border-transparent hover:bg-muted"
                              )}
                            >
                              <Icon className="w-5 h-5 mb-1" aria-hidden="true" />
                              <span className="text-xs text-center line-clamp-1">{item.label}</span>
                              {badge && badge > 0 && (
                                <Badge 
                                  variant="destructive" 
                                  className="absolute -top-1 -right-1 h-5 min-w-5 text-xs px-1"
                                  aria-label={`${badge} notifications`}
                                >
                                  {badge > 99 ? '99+' : badge}
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
