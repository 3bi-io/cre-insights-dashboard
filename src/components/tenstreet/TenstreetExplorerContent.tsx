import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, FileText, User, Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TenstreetExplorerContent = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['tenstreet-explorer-applications', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('applications')
        .select('id, first_name, last_name, applicant_email, phone, city, state, status, applied_at, source')
        .order('applied_at', { ascending: false })
        .limit(50);
      
      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,applicant_email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'hired':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
      case 'new':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Application Explorer</CardTitle>
          <CardDescription>Search and browse all applications in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Applications
          </CardTitle>
          <CardDescription>
            {applications?.length || 0} applications found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading applications...
            </div>
          ) : applications && applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {app.first_name} {app.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {app.applicant_email}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        {app.city && app.state && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {app.city}, {app.state}
                          </span>
                        )}
                        {app.applied_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(app.applied_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.source && (
                      <Badge variant="outline">{app.source}</Badge>
                    )}
                    <Badge variant={getStatusColor(app.status)}>
                      {app.status || 'New'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No applications found</p>
              {searchTerm && (
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenstreetExplorerContent;
