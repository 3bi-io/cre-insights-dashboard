import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Brand } from './Brand';
import { Badge } from '@/components/ui/badge';
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
          {/* Brand */}
          <Brand variant="auto" size="auto" priority={true} />

          {/* Desktop Navigation */}
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

          {/* Auth Buttons */}
          {showAuth && (
            <div className="hidden md:flex items-center space-x-3" role="group" aria-label="Authentication">
              <Link to="/auth">
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
                  className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Start Free Trial
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="min-h-[44px] min-w-[44px] p-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Open navigation menu"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[300px] sm:w-[400px] flex flex-col"
                id="mobile-menu"
                aria-label="Mobile navigation menu"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex-1 overflow-y-auto flex flex-col space-y-6 mt-6">
                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col space-y-1" role="menu" aria-label="Mobile navigation">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        role="menuitem"
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        className={cn(
                          "flex items-center gap-3 text-base font-medium transition-colors hover:text-primary px-4 py-3 rounded-md min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                          isActive(item.href) 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {item.icon && <item.icon className="h-5 w-5" aria-hidden="true" />}
                        <span className="flex-1">{item.name}</span>
                        {item.isNew && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold bg-primary/10 text-primary border-0">
                            NEW
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Auth Buttons */}
                  {showAuth && (
                    <div className="flex flex-col space-y-3 pt-4 border-t" role="group" aria-label="Authentication">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant="outline" 
                          className="w-full min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          className="w-full min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                        >
                          Start Free Trial
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
