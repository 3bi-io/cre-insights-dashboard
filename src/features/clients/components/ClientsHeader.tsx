import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientsHeaderProps {
  clientsCount: number;
  onCreateClient?: () => void;
}

const ClientsHeader: React.FC<ClientsHeaderProps> = ({
  clientsCount,
  onCreateClient
}) => {
  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-8 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Clients
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Manage your client relationships and contact information
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={onCreateClient} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsHeader;