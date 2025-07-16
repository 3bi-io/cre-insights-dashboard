
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Eye, MessageCircle, Calendar, Webhook, Phone, ExternalLink, Edit, Mail } from 'lucide-react';
import ZapierWebhookSetup from '@/components/applications/ZapierWebhookSetup';
import ApplicationDetailsDialog from '@/components/applications/ApplicationDetailsDialog';
import { useToast } from '@/hooks/use-toast';

const Applications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job_listings:job_listing_id(title, job_title, client, client_id, clients:client_id(name))
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
                .select('title, job_title, client, client_id, clients:client_id(name)')
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

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, newStatus }: { applicationId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    updateStatusMutation.mutate({ applicationId, newStatus });
  };

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

  const getClientName = (app: any) => {
    // Try to get client name from the relationship first, then fallback to client field
    return app.job_listings?.clients?.name || app.job_listings?.client || null;
  };

  const getApplicantCategory = (app: any) => {
    const hasCdl = app.cdl?.toLowerCase() === 'yes';
    const hasAge = app.age?.toLowerCase() === 'yes';
    const expValue = app.exp?.toLowerCase() || '';
    
    // Determine if experience is more than 3 months
    const hasMoreThan3MonthsExp = 
      expValue.includes('more than 3') || 
      expValue.includes('>3') || 
      expValue.includes('over 3') ||
      expValue.includes('4') || expValue.includes('5') || expValue.includes('6') ||
      expValue.includes('year') || expValue.includes('experienced');
    
    const hasLessThan3MonthsExp = 
      expValue.includes('less than 3') || 
      expValue.includes('<3') || 
      expValue.includes('under 3') ||
      expValue.includes('1') || expValue.includes('2') || 
      expValue.includes('beginner') || expValue.includes('new');

    // Apply the rules:
    // "D" = cdl(Yes), age(Yes), exp(More than 3 months)
    if (hasCdl && hasAge && hasMoreThan3MonthsExp) {
      return { code: 'D', label: 'Experienced Driver', color: 'bg-green-100 text-green-800' };
    }
    
    // "SC" = cdl(Yes), age(Yes), exp(Less than 3 months)
    if (hasCdl && hasAge && hasLessThan3MonthsExp) {
      return { code: 'SC', label: 'New CDL Holder', color: 'bg-blue-100 text-blue-800' };
    }
    
    // "SR" = cdl(No), age(Yes), exp(Less than 3 months)
    if (!hasCdl && hasAge && hasLessThan3MonthsExp) {
      return { code: 'SR', label: 'Student Ready', color: 'bg-yellow-100 text-yellow-800' };
    }

    // Default for applicants that don't match any category
    return { code: 'N/A', label: 'Uncategorized', color: 'bg-gray-100 text-gray-800' };
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

  const categoryCounts = applications?.reduce((acc, app) => {
    const category = getApplicantCategory(app);
    acc[category.code] = (acc[category.code] || 0) + 1;
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

          {/* Applicant Categories Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { code: 'D', label: 'Experienced Driver', color: 'bg-green-100 text-green-800', desc: 'CDL + Age + 3+ months exp' },
              { code: 'SC', label: 'New CDL Holder', color: 'bg-blue-100 text-blue-800', desc: 'CDL + Age + <3 months exp' },
              { code: 'SR', label: 'Student Ready', color: 'bg-yellow-100 text-yellow-800', desc: 'No CDL + Age + <3 months exp' },
              { code: 'N/A', label: 'Uncategorized', color: 'bg-gray-100 text-gray-800', desc: 'Other combinations' }
            ].map((category) => (
              <Card key={category.code}>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge className={`text-lg font-bold px-3 py-1 ${category.color}`}>
                      {category.code}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {categoryCounts?.[category.code] || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-300 mb-1">{category.label}</div>
                  <div className="text-xs text-gray-500">{category.desc}</div>
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
                           {(() => {
                             const category = getApplicantCategory(application);
                             return (
                               <Badge className={`text-xs font-bold px-2 py-1 ${category.color}`}>
                                 {category.code}
                               </Badge>
                             );
                           })()}
                           <Select
                             value={application.status}
                             onValueChange={(newStatus) => handleStatusChange(application.id, newStatus)}
                             disabled={updateStatusMutation.isPending}
                           >
                             <SelectTrigger className={`w-32 h-7 text-xs font-medium ${getStatusColor(application.status)}`}>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="pending">Pending</SelectItem>
                               <SelectItem value="reviewed">Reviewed</SelectItem>
                               <SelectItem value="interviewed">Interviewed</SelectItem>
                               <SelectItem value="hired">Hired</SelectItem>
                               <SelectItem value="rejected">Rejected</SelectItem>
                             </SelectContent>
                           </Select>
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
                           {getClientName(application) && (
                             <span className="ml-2 text-blue-600">• {getClientName(application)}</span>
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
                         {application.phone && (
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="flex items-center gap-2"
                             onClick={() => window.open(`tel:${application.phone}`)}
                           >
                             <Phone className="w-4 h-4" />
                             Call
                           </Button>
                         )}
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="flex items-center gap-2"
                           onClick={() => window.open(`mailto:${getApplicantEmail(application)}`)}
                         >
                           <Mail className="w-4 h-4" />
                           Email
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
