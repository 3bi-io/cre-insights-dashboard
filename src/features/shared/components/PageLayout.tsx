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
    <div className="min-h-screen flex flex-col">
      {/* Page Header */}
      {(title || description || actions) && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
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
                <div className="flex items-center gap-2 shrink-0">
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