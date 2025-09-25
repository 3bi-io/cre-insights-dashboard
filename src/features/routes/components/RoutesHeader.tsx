import React from 'react';
import { MapPin } from 'lucide-react';

interface RoutesHeaderProps {
  routesCount: number;
}

const RoutesHeader = ({ routesCount }: RoutesHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Routes</h1>
        </div>
        <p className="text-muted-foreground">
          View transportation routes from job listings • {routesCount} unique routes
        </p>
      </div>
    </div>
  );
};

export default RoutesHeader;