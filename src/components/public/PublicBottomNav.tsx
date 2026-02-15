import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MoreHorizontal, X, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { publicNavigation } from '@/config/publicNavigationConfig';
import { isActivePath } from '@/utils/navigationUtils';

// Primary items shown directly in the bottom bar (first 4)
const PRIMARY_COUNT = 4;
const primaryItems = publicNavigation.slice(0, PRIMARY_COUNT);
const overflowItems = publicNavigation.slice(PRIMARY_COUNT);

const PublicBottomNav: React.FC = () => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => isActivePath(location.pathname, path);

  const isOverflowActive = overflowItems.some(item => isActive(item.href));

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Public mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-1" role="menubar">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              role="menuitem"
              aria-current={active ? 'page' : undefined}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset relative",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} aria-hidden="true" />}
              <span className={cn("text-[10px] font-medium leading-tight", active && "font-semibold")}>
                {item.name}
              </span>
              {/* Animated underline indicator */}
              {active && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full animate-in fade-in slide-in-from-bottom-1 duration-200" />
              )}
              {item.isNew && (
                <span className="absolute top-1.5 right-1/2 translate-x-4 w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}

        {/* More Menu */}
        {overflowItems.length > 0 && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                role="menuitem"
                aria-label="More navigation options"
                aria-expanded={moreOpen}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                  moreOpen || isOverflowActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {moreOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
                )}
                <span className="text-[10px] font-medium leading-tight">More</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-xl"
              aria-label="Additional navigation"
            >
              <SheetHeader className="pb-4">
                <SheetTitle>More</SheetTitle>
              </SheetHeader>
              <ScrollArea className="pb-4">
                <div className="flex flex-col gap-1" role="menu">
                  {overflowItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMoreOpen(false)}
                        role="menuitem"
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg min-h-[48px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                          active
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
                        <span className="flex-1 text-sm font-medium">{item.name}</span>
                        {item.isNew && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold bg-primary/10 text-primary border-0">
                            NEW
                          </Badge>
                        )}
                      </Link>
                    );
                  })}

                  {/* Auth shortcut for mobile */}
                  <div className="border-t mt-2 pt-3 flex gap-2">
                    <Link to="/auth" onClick={() => setMoreOpen(false)} className="flex-1">
                      <Button variant="outline" className="w-full min-h-[44px]">Sign In</Button>
                    </Link>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Floating Voice Apply FAB */}
      <Link
        to="/jobs"
        className="absolute -top-14 right-4 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-95 btn-glow"
        aria-label="Voice Apply"
      >
        <Mic className="w-5 h-5" />
      </Link>
    </nav>
  );
};

export default PublicBottomNav;
