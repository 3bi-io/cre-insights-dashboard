import React from 'react';
import Footer from './Footer';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
  showFooter?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title, 
  description, 
  className = "",
  actions,
  showFooter = true
}) => {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Page Header */}
      {(title || description || actions) && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && (
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-muted-foreground mt-1 max-w-3xl">
                    {description}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex-shrink-0 ml-6 flex items-center gap-2">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn("flex-1", className)}>
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

export default PageLayout;
