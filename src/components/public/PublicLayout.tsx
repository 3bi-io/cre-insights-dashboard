/**
 * Public Layout Component
 * Layout for public pages with navigation and footer
 */

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin,
  Twitter,
  Linkedin,
  Github
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { user, userRole } = useAuth();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/intel-ats-logo.png" 
                alt="INTEL ATS"
                className="h-8 w-auto"
              />
              <span className="font-playfair font-bold text-xl text-foreground">
                INTEL ATS
              </span>
            </Link>

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

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <Link to={userRole === 'super_admin' ? '/admin' : '/'}>
                  <Button variant="ghost" size="sm">
                    {userRole === 'super_admin' ? 'Admin' : 'Dashboard'}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-background">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "block px-3 py-2 text-base font-medium rounded-md transition-colors",
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 space-y-2">
                  {user ? (
                    <Link to={userRole === 'super_admin' ? '/admin' : '/'} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        {userRole === 'super_admin' ? 'Admin' : 'Dashboard'}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                          Start Free Trial
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <img 
                  src="/intel-ats-logo.png" 
                  alt="INTEL ATS" 
                  className="h-8 w-auto"
                />
                <span className="font-playfair font-bold text-xl text-foreground">
                  INTEL ATS
                </span>
              </Link>
              <p className="text-muted-foreground mb-6 max-w-md">
                Revolutionize your hiring process with AI-powered analytics, automated workflows, 
                and comprehensive candidate tracking. Transform how you find, evaluate, and hire top talent.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/features" className="text-muted-foreground hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    API Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>hello@ats.io</span>
                </li>
                <li className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center space-x-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>San Francisco, CA</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 INTEL ATS. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;