
import React from 'react';

const ClientsLoading = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-8 py-6 max-w-7xl">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Clients
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Manage your client relationships and contact information
            </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsLoading;
