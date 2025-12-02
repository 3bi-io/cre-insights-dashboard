import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight, Eye, Building } from 'lucide-react';

interface Route {
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  job_count: number;
}

interface RoutesGridProps {
  routes: Route[];
}

const RoutesGrid = ({ routes }: RoutesGridProps) => {
  const navigate = useNavigate();

  const handleViewJobs = useCallback((route: Route) => {
    const params = new URLSearchParams({
      origin_city: route.origin_city,
      origin_state: route.origin_state,
      dest_city: route.dest_city,
      dest_state: route.dest_state
    });
    navigate(`/admin/jobs?${params.toString()}`);
  }, [navigate]);

  if (routes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No routes found</h3>
            <p className="text-sm">Routes will appear here when job listings include origin and destination information.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {routes.map((route, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-primary" />
              Route Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Origin</div>
                <div className="font-medium text-foreground">
                  {route.origin_city}, {route.origin_state}
                </div>
              </div>
              
              <ArrowRight className="w-5 h-5 text-muted-foreground mx-4" />
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Destination</div>
                <div className="font-medium text-foreground">
                  {route.dest_city}, {route.dest_state}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-muted-foreground">Job Listings</span>
                <span className="font-medium text-foreground">
                  {route.job_count} {route.job_count === 1 ? 'listing' : 'listings'}
                </span>
              </div>
              
              <Button 
                className="w-full" 
                size="sm"
                onClick={() => handleViewJobs(route)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RoutesGrid;