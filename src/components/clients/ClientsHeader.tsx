
import React from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientsHeaderProps {
  clientsCount: number;
}

const ClientsHeader = ({ clientsCount }: ClientsHeaderProps) => {
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
            <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsHeader;
