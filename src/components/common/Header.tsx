import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Brand } from './Brand';

interface NavigationItem {
  name: string;
  href: string;
}

interface HeaderProps {
  navigation?: NavigationItem[];
  showAuth?: boolean;
  className?: string;
}

const defaultNavigation: NavigationItem[] = [
  { name: 'Jobs', href: '/jobs' },
  { name: 'Features', href: '/features' },
  { name: 'Resources', href: '/resources' },
  { name: 'Contact', href: '/contact' }
];

export const Header: React.FC<HeaderProps> = ({ 
  navigation = defaultNavigation, 
  showAuth = true,
  className 
}) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

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
          <div className="hidden md:flex items-center space-x-8" role="menubar" aria-label="Primary navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                role="menuitem"
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm",
                  isActive(item.href) 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          {showAuth && (
            <div className="hidden md:flex items-center space-x-4" role="group" aria-label="Authentication">
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

          {/* Mobile Menu Button - proper touch target */}
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
                className="w-[300px] sm:w-[400px]"
                id="mobile-menu"
                aria-label="Mobile navigation menu"
              >
                <div className="flex flex-col space-y-6 mt-6">
                  {/* Mobile Navigation Links - proper touch targets */}
                  <nav className="flex flex-col space-y-1" role="menu" aria-label="Mobile navigation">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        role="menuitem"
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        className={cn(
                          "text-base font-medium transition-colors hover:text-primary px-4 py-3 rounded-md min-h-[48px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                          isActive(item.href) 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Auth Buttons */}
                  {showAuth && (
                    <div className="flex flex-col space-y-3 pt-4 border-t" role="group" aria-label="Authentication">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
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
