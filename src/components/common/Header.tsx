import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
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
  { name: 'Pricing', href: '/pricing' },
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
    <nav className={cn(
      "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 py-2">
          {/* Brand */}
          <Brand size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive(item.href) 
                    ? "text-primary border-b-2 border-primary pb-1" 
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          {showAuth && (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-6 mt-6">
                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col space-y-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "text-base font-medium transition-colors hover:text-primary px-3 py-2 rounded-md",
                          isActive(item.href) 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  {/* Mobile Auth Buttons */}
                  {showAuth && (
                    <div className="flex flex-col space-y-3 pt-4 border-t">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full">
                          Get Started
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