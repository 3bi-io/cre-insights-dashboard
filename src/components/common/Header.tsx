import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Brand } from './Brand';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/components/ThemeToggle';
import { publicNavigation, type PublicNavItem } from '@/config/publicNavigationConfig';
import { isActivePath } from '@/utils/navigationUtils';
import { Mic, Bot, BarChart3, Link2, Sparkles, X, ChevronDown, Play } from 'lucide-react';

interface HeaderProps {
  navigation?: PublicNavItem[];
  showAuth?: boolean;
  className?: string;
}

const megaMenuFeatures = [
  { icon: Mic, label: 'Voice Apply', desc: 'AI-powered voice interviews', href: '/features#voice-apply' },
  { icon: Bot, label: 'AI Screening', desc: 'Instant candidate qualification', href: '/features#ai-screening' },
  { icon: BarChart3, label: 'Pipeline & Kanban', desc: 'Visual candidate tracking', href: '/features#pipeline' },
  { icon: Link2, label: 'ATS Integrations', desc: 'Tenstreet, DriverReach sync', href: '/features#integrations' },
];

export const Header: React.FC<HeaderProps> = ({ 
  navigation = publicNavigation, 
  showAuth = true,
  className 
}) => {
  const location = useLocation();
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(() => {
    return !localStorage.getItem('announcement-dismissed');
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mega menu on route change
  useEffect(() => {
    setMegaMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => isActivePath(location.pathname, path);

  const dismissAnnouncement = () => {
    setAnnouncementVisible(false);
    localStorage.setItem('announcement-dismissed', 'true');
  };

  return (
    <>
      {/* Announcement Bar */}
      {announcementVisible && (
        <div className="relative bg-primary text-primary-foreground text-center text-xs sm:text-sm py-2 px-8">
          <span className="font-medium">
            🚀 Limited Time: Founders Pass — $1/apply, zero upfront cost —{' '}
            <Link to="/founders-pass" className="underline hover:no-underline font-semibold">
              Claim yours now
            </Link>
          </span>
          <button
            onClick={dismissAnnouncement}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-foreground/10 rounded"
            aria-label="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <nav 
        className={cn(
          "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b transition-all duration-300",
          scrolled && "shadow-sm",
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex justify-between items-center transition-all duration-300",
            scrolled ? "h-12" : "h-14 md:h-12"
          )}>
            {/* Factor 1: Brand */}
            <Brand variant="auto" size="auto" priority={true} />

            {/* Factor 2: Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1" role="menubar" aria-label="Primary navigation">
              {navigation.map((item) => {
                // Features gets a mega-menu
                if (item.href === '/features') {
                  return (
                    <div key={item.name} className="relative">
                      <button
                        role="menuitem"
                        onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                        onMouseEnter={() => setMegaMenuOpen(true)}
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          isActive(item.href) || megaMenuOpen
                            ? "text-primary bg-primary/5"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {item.name}
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", megaMenuOpen && "rotate-180")} />
                      </button>

                      {/* Mega Menu Dropdown */}
                      {megaMenuOpen && (
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[420px] bg-popover border rounded-xl shadow-xl p-4 z-50"
                          onMouseLeave={() => setMegaMenuOpen(false)}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            {megaMenuFeatures.map((feat) => (
                              <Link
                                key={feat.label}
                                to={feat.href}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                              >
                                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                  <feat.icon className="h-4.5 w-4.5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{feat.label}</p>
                                  <p className="text-xs text-muted-foreground">{feat.desc}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <Link
                              to="/features"
                              className="flex items-center gap-2 text-sm text-primary font-medium hover:underline px-3 py-1.5"
                            >
                              <Sparkles className="h-4 w-4" />
                              View all features
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
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
                );
              })}
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
                  <Link to="/demo">
                    <Button 
                      size="sm" 
                      className="min-h-[44px] text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                      Get Demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
