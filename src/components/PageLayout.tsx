import React from 'react';
import Footer from './Footer';

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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && (
                  <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-muted-foreground text-lg max-w-3xl">
                    {description}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex-shrink-0 ml-6">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${className}`}>
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

export default PageLayout;