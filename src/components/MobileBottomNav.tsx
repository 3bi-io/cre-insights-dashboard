import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  activePatterns: string[];
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();

  // Determine base path based on user role
  const basePath = userRole === 'super_admin' || userRole === 'admin' ? '/admin' : '/dashboard';

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: basePath,
      activePatterns: [basePath, '/dashboard']
    },
    {
      icon: FileText,
      label: 'Applications',
      path: `${basePath}/applications`,
      activePatterns: [`${basePath}/applications`]
    },
    {
      icon: Briefcase,
      label: 'Jobs',
      path: `${basePath}/jobs`,
      activePatterns: [`${basePath}/jobs`]
    },
    {
      icon: Settings,
      label: 'Settings',
      path: `${basePath}/settings`,
      activePatterns: [`${basePath}/settings`]
    }
  ];

  const isActive = (item: NavItem) => {
    return item.activePatterns.some(pattern => {
      if (pattern === basePath || pattern === '/dashboard') {
        return location.pathname === pattern;
      }
      return location.pathname.startsWith(pattern);
    });
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors rounded-lg",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 transition-transform",
                  active && "scale-110"
                )} 
              />
              <span className={cn(
                "text-xs font-medium",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
