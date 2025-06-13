import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface RouteFilterProps {
  routeFilter: {
    origin_city: string | null;
    origin_state: string | null;
    dest_city: string | null;
    dest_state: string | null;
  };
  onClearFilter: () => void;
}

const RouteFilter: React.FC<RouteFilterProps> = ({ routeFilter, onClearFilter }) => {
  return (
    <div className="mb-6">
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground mb-1">Filtered by Route</h3>
            <p className="text-sm text-muted-foreground">
              {routeFilter.origin_city}, {routeFilter.origin_state} → {routeFilter.dest_city}, {routeFilter.dest_state}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilter}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouteFilter;