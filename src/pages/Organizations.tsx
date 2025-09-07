import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import OrganizationManagement from '@/components/organizations/OrganizationManagement';

const Organizations = () => {
  const { userRole } = useAuth();

  if (userRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You need super admin permissions to access organization management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage multi-tenant organizations and settings.
            {userRole === 'super_admin' && (
              <span className="ml-2 text-primary font-medium">(Super Administrator View)</span>
            )}
          </p>
        </div>
        
        <OrganizationManagement />
      </div>
    </div>
  );
};

export default Organizations;