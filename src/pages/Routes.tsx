import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, MapPin, ArrowRight, Eye } from 'lucide-react';

interface Route {
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  job_count: number;
}

const Routes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('city, state, dest_city, dest_state')
        .not('city', 'is', null)
        .not('state', 'is', null)
        .not('dest_city', 'is', null)
        .not('dest_state', 'is', null);
      
      if (error) throw error;

      // Group by unique origin-destination pairs and count occurrences
      const routeMap = new Map<string, Route>();
      
      data.forEach(job => {
        const key = `${job.city}-${job.state}-${job.dest_city}-${job.dest_state}`;
        if (routeMap.has(key)) {
          routeMap.get(key)!.job_count += 1;
        } else {
          routeMap.set(key, {
            origin_city: job.city,
            origin_state: job.state,
            dest_city: job.dest_city,
            dest_state: job.dest_state,
            job_count: 1
          });
        }
      });

      return Array.from(routeMap.values()).sort((a, b) => b.job_count - a.job_count);
    },
  });

  const filteredRoutes = routes?.filter(route =>
    route.origin_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.origin_state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.dest_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.dest_state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewJobs = (route: Route) => {
    const params = new URLSearchParams({
      origin_city: route.origin_city,
      origin_state: route.origin_state,
      dest_city: route.dest_city,
      dest_state: route.dest_state
    });
    navigate(`/dashboard/jobs?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Routes</h1>
          <p className="text-muted-foreground mt-1">
            View transportation routes from job listings • {routes?.length || 0} unique routes
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by origin or destination city/state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {filteredRoutes?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted" />
              <h3 className="text-lg font-medium mb-2">No routes found</h3>
              <p>Routes will appear here when job listings include origin and destination information.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes?.map((route, index) => (
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
      )}
    </div>
  );
};

export default Routes;