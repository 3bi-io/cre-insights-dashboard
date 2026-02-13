import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Brand } from './Brand';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/components/ThemeToggle';
import { publicNavigation, type PublicNavItem } from '@/config/publicNavigationConfig';
import { isActivePath } from '@/utils/navigationUtils';

interface HeaderProps {
  navigation?: PublicNavItem[];
  showAuth?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  navigation = publicNavigation, 
  showAuth = true,
  className 
}) => {
  const location = useLocation();

  const isActive = (path: string) => isActivePath(location.pathname, path);

  return (
    <nav 
      className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b",
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-12 py-2">
          {/* Factor 1: Brand */}
          <Brand variant="auto" size="auto" priority={true} />

          {/* Factor 2: Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1" role="menubar" aria-label="Primary navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                role="menuitem"
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isActive(item.href) 
                    ? "text-primary bg-primary/5" 
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {item.name}
                {item.isNew && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold bg-primary/10 text-primary border-0">
                    NEW
                  </Badge>
                )}
              </Link>
            ))}
          </div>

          {/* Factor 3: Auth Buttons + Theme Toggle */}
          <div className="flex items-center space-x-2 md:space-x-3" role="group" aria-label="Authentication">
            <ThemeToggle />
            {showAuth && (
              <>
                <Link to="/auth" className="hidden sm:block">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    size="sm" 
                    className="min-h-[44px] text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
