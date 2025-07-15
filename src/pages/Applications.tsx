
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Eye, MessageCircle, Calendar, Webhook, Phone, ExternalLink } from 'lucide-react';
import ZapierWebhookSetup from '@/components/applications/ZapierWebhookSetup';
import ApplicationDetailsDialog from '@/components/applications/ApplicationDetailsDialog';

const Applications = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job_listings:job_listing_id(title, job_title, platforms:platform_id(name))
        `)
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      
      // For applications with job_id but no job_listing_id, try to find matching job listing
      if (data) {
        const enhancedData = await Promise.all(
          data.map(async (app) => {
            if (app.job_id && !app.job_listing_id) {
              const { data: jobListing } = await supabase
                .from('job_listings')
                .select('title, job_title, platforms:platform_id(name)')
                .eq('job_id', app.job_id)
                .single();
              
              if (jobListing) {
                return { ...app, job_listings: jobListing };
              }
            }
            return app;
          })
        );
        return enhancedData;
      }
      
      return data;
    },
  });

  const getApplicantName = (app: any) => {
    // Try full_name first, then construct from first/last name
    if (app.full_name) {
      return app.full_name;
    } else if (app.first_name && app.last_name) {
      return `${app.first_name} ${app.last_name}`;
    } else if (app.first_name) {
      return app.first_name;
    } else if (app.last_name) {
      return app.last_name;
    }
    return 'Anonymous Applicant';
  };

  const getApplicantEmail = (app: any) => {
    return app.applicant_email || app.email || 'No email provided';
  };

  const filteredApplications = applications?.filter(app => {
    const applicantName = getApplicantName(app);
    const applicantEmail = getApplicantEmail(app);
    const jobTitle = app.job_listings?.title || app.job_listings?.job_title || '';
    
    return (
      applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const statusCounts = applications?.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Applications</h1>
          <p className="text-muted-foreground mt-1">Track and manage job applications</p>
        </div>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="webhook-setup" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Zapier Integration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['pending', 'reviewed', 'interviewed', 'hired', 'rejected'].map((status) => (
              <Card key={status}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {statusCounts?.[status] || 0}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">{status}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by applicant name, email, or job title..."
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

          {filteredApplications?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No applications found</h3>
                  <p>Applications will appear here as candidates apply to your job listings.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications?.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-white">
                            {getApplicantName(application)}
                          </h3>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 mb-2">
                          <p className="text-gray-600 flex items-center gap-2">
                            <span>{getApplicantEmail(application)}</span>
                          </p>
                          {application.phone && (
                            <p className="text-gray-600 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {application.phone}
                            </p>
                          )}
                        </div>
                         <p className="text-sm text-gray-500 mb-2">
                           Applied for: <span className="font-medium">
                             {application.job_listings?.title || 
                              application.job_listings?.job_title || 
                              (application.job_id ? `Job ID: ${application.job_id}` : 'Unknown Position')}
                           </span>
                           {application.job_listings?.platforms?.name && (
                             <span> via {application.job_listings.platforms.name}</span>
                           )}
                         </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Applied {new Date(application.applied_at).toLocaleDateString()}
                          </span>
                          {application.source && (
                            <span>Source: {application.source}</span>
                          )}
                        </div>
                         
                         {/* Display job_id if available */}
                         <div className="flex gap-2 flex-wrap">
                           {application.job_id && (
                             <Badge variant="outline" className="text-xs">
                               Job ID: {application.job_id}
                             </Badge>
                           )}
                         </div>
                      </div>
                      
                       <div className="flex gap-2">
                         <ApplicationDetailsDialog application={application} />
                         <Button variant="outline" size="sm" className="flex items-center gap-2">
                           <MessageCircle className="w-4 h-4" />
                           Contact
                         </Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhook-setup">
          <ZapierWebhookSetup />
        </TabsContent>
      </Tabs>
    </div>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
};

export default Applications;
