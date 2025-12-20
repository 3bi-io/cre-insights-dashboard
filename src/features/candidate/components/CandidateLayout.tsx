import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Briefcase, 
  Search, 
  Bookmark, 
  User, 
  MessageSquare,
  LogOut,
  Home,
  Settings,
  Bell,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Brand } from '@/components/common';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const CandidateLayout = () => {
  const { signOut, candidateProfile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  const navigation = [
    { name: 'Dashboard', href: '/my-jobs', icon: Home },
    { name: 'Applications', href: '/my-jobs/applications', icon: Briefcase },
    { name: 'Search Jobs', href: '/my-jobs/search', icon: Search },
    { name: 'Saved Jobs', href: '/my-jobs/saved', icon: Bookmark },
    { name: 'Profile', href: '/my-jobs/profile', icon: User },
    { name: 'Messages', href: '/my-jobs/messages', icon: MessageSquare, badge: 'Soon' },
  ];

  const getUserInitials = () => {
    if (candidateProfile?.first_name) {
      return candidateProfile.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (candidateProfile?.first_name && candidateProfile?.last_name) {
      return `${candidateProfile.first_name} ${candidateProfile.last_name}`;
    }
    if (candidateProfile?.first_name) {
      return candidateProfile.first_name;
    }
    return 'Candidate';
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearchQuery.trim()) {
      navigate(`/my-jobs/search?q=${encodeURIComponent(quickSearchQuery.trim())}`);
      setQuickSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip Links for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>
      
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
        aria-label="Candidate portal header"
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Brand variant="horizontal" size="md" showAsLink={false} />
              <span className="text-lg font-semibold hidden lg:inline">Candidate Portal</span>
            </div>

            {/* Quick Search - Desktop */}
            <form 
              onSubmit={handleQuickSearch} 
              className="hidden md:flex flex-1 max-w-md mx-4"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Quick search jobs..."
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </form>
            
            <div className="flex items-center gap-2" role="group" aria-label="User actions">
              {/* Notifications Bell */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                asChild
              >
                <Link to="/my-jobs/notifications" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Open account menu"
                    aria-haspopup="menu"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden sm:inline">{getDisplayName()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/my-jobs/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-jobs/settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-jobs/notifications" className="flex items-center">
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
          <nav className="flex-1 space-y-1 p-4" role="navigation" aria-label="Candidate portal navigation">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    {item.name}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">Need help?</p>
              <Link 
                to="/contact" 
                className="text-primary hover:underline"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="navigation"
        aria-label="Mobile candidate navigation"
      >
        <div className="grid grid-cols-5 gap-1 p-1.5" role="menubar">
          {navigation.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Navigate to ${item.name}`}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-xs transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon 
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110"
                  )} 
                  aria-hidden="true" 
                />
                <span className="truncate font-medium">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default CandidateLayout;
