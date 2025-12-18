import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Search, 
  Bookmark, 
  User, 
  MessageSquare,
  LogOut,
  Home,
  Settings,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Brand } from '@/components/common';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const CandidateLayout = () => {
  const { signOut, candidateProfile, user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/my-jobs', icon: Home },
    { name: 'Applications', href: '/my-jobs/applications', icon: Briefcase },
    { name: 'Search', href: '/my-jobs/search', icon: Search },
    { name: 'Saved', href: '/my-jobs/saved', icon: Bookmark },
    { name: 'Profile', href: '/my-jobs/profile', icon: User },
    { name: 'Messages', href: '/my-jobs/messages', icon: MessageSquare },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
        aria-label="Candidate portal header"
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Brand variant="horizontal" size="md" showAsLink={false} />
              <span className="text-lg font-semibold hidden sm:inline">Candidate Portal</span>
            </div>
            
            <div className="flex items-center gap-4" role="group" aria-label="User actions">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Open account menu"
                    aria-haspopup="menu"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
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
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40">
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
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background"
        role="navigation"
        aria-label="Mobile candidate navigation"
      >
        <div className="grid grid-cols-5 gap-1 p-2" role="menubar">
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
                  'flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span className="truncate">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default CandidateLayout;