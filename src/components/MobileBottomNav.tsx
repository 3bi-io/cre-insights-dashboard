import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, MoreHorizontal, X, Target, Share2, Bot, Settings, Building, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  activePatterns: string[];
}

interface NavGroup {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

  // Primary nav items (always visible)
  const primaryNavItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      activePatterns: ['/dashboard']
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

  // Extended nav groups for "More" menu
  const moreNavGroups: NavGroup[] = [
    {
      title: 'Campaigns',
      icon: Target,
      items: [
        { icon: Target, label: 'Campaigns', path: '/admin/campaigns', activePatterns: ['/admin/campaigns'] },
        { icon: Briefcase, label: 'Job Groups', path: '/admin/job-groups', activePatterns: ['/admin/job-groups'] }
      ]
    },
    {
      title: 'Integrations',
      icon: Share2,
      items: [
        { icon: Share2, label: 'ATS Dashboard', path: '/admin/tenstreet', activePatterns: ['/admin/tenstreet'] },
        { icon: Share2, label: 'Publishers', path: '/admin/publishers', activePatterns: ['/admin/publishers'] },
        ...(isAdmin ? [{ icon: Share2, label: 'Webhooks', path: '/admin/webhook-management', activePatterns: ['/admin/webhook-management'] }] : [])
      ]
    },
    {
      title: 'AI Platform',
      icon: Bot,
      items: [
        { icon: Bot, label: 'AI Assistant', path: '/admin/grok', activePatterns: ['/admin/grok'] },
        { icon: Bot, label: 'AI Tools', path: '/admin/ai-tools', activePatterns: ['/admin/ai-tools'] },
        { icon: TrendingUp, label: 'AI Analytics', path: '/admin/ai-analytics', activePatterns: ['/admin/ai-analytics'] }
      ]
    },
    {
      title: 'Settings',
      icon: Settings,
      items: [
        { icon: Settings, label: 'AI Configuration', path: '/admin/ai-settings', activePatterns: ['/admin/ai-settings'] },
        { icon: Settings, label: 'Privacy', path: '/admin/privacy-controls', activePatterns: ['/admin/privacy-controls'] },
        { icon: Settings, label: 'Support', path: '/admin/support', activePatterns: ['/admin/support'] }
      ]
    },
    ...(isSuperAdmin ? [{
      title: 'Administration',
      icon: Building,
      items: [
        { icon: Building, label: 'Organizations', path: '/admin/organizations', activePatterns: ['/admin/organizations'] },
        { icon: Users, label: 'Users', path: '/admin/user-management', activePatterns: ['/admin/user-management'] }
      ]
    }] : [])
  ];

  const isActive = (item: NavItem) => {
    return item.activePatterns.some(pattern => {
      if (pattern === '/dashboard') {
        return location.pathname === pattern;
      }
      return location.pathname.startsWith(pattern);
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors rounded-lg",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
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
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors rounded-lg",
                moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {moreOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <MoreHorizontal className="w-5 h-5" />
              )}
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full pb-8">
              <div className="space-y-6">
                {moreNavGroups.map((group, idx) => (
                  <div key={group.title}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center gap-2 mb-3">
                      <group.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{group.title}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item);
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-lg border transition-colors",
                              active 
                                ? "bg-primary/10 border-primary/20 text-primary" 
                                : "bg-muted/50 border-transparent hover:bg-muted"
                            )}
                          >
                            <Icon className="w-5 h-5 mb-1" />
                            <span className="text-xs text-center line-clamp-1">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
