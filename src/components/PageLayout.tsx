import React from 'react';
import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title, 
  description, 
  className = "" 
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Page Header */}
      {(title || description) && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        </div>
      )}
      
      {/* Main Content */}
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PageLayout;