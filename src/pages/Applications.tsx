
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Eye, MessageCircle, Calendar, Webhook, Phone, ExternalLink, Edit, Mail, Download, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import ZapierWebhookSetup from '@/components/applications/ZapierWebhookSetup';
import ApplicationDetailsDialog from '@/components/applications/ApplicationDetailsDialog';
import TenstreetUpdateDialog from '@/components/applications/TenstreetUpdateDialog';
import SmsConversationDialog from '@/components/applications/SmsConversationDialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const Applications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      // First, get all applications with their direct job_listing relationships
      const { data: appsWithListings, error } = await supabase
        .from('applications')
        .select(`
          *,
          job_listings:job_listing_id(title, job_title, client, client_id, clients:client_id(name)),
          recruiters:recruiter_id(id, first_name, last_name, email)
        `)
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      
      // Get unique job_ids that don't have job_listing_id matches
      const missingJobIds = appsWithListings
        ?.filter(app => app.job_id && !app.job_listing_id)
        .map(app => app.job_id)
        .filter((value, index, self) => self.indexOf(value) === index) || [];
      
      // Batch fetch job listings for missing job_ids
      let jobListingsMap = new Map();
      if (missingJobIds.length > 0) {
        const { data: jobListings } = await supabase
          .from('job_listings')
          .select('job_id, title, job_title, client, client_id, clients:client_id(name)')
          .in('job_id', missingJobIds);
        
        if (jobListings) {
          jobListings.forEach(job => {
            if (job.job_id) {
              jobListingsMap.set(job.job_id, job);
            }
          });
        }
      }
      
      // Enhance applications with job listing data
      const enhancedData = appsWithListings?.map(app => {
        if (app.job_id && !app.job_listing_id && jobListingsMap.has(app.job_id)) {
          return { ...app, job_listings: jobListingsMap.get(app.job_id) };
        }
        return app;
      });
      
      return enhancedData;
    },
  });

  // Get recruiters for assignment dropdown
  const { data: recruiters } = useQuery({
    queryKey: ['recruiters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recruiters')
        .select('*')
        .eq('status', 'active')
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Get current recruiter for current user
  const { data: currentRecruiter } = useQuery({
    queryKey: ['current-recruiter'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('recruiters')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Recruiter assignment mutation
  const assignRecruiterMutation = useMutation({
    mutationFn: async ({ applicationId, recruiterId }: { applicationId: string; recruiterId: string | null }) => {
      const { error } = await supabase
        .from('applications')
        .update({ recruiter_id: recruiterId, updated_at: new Date().toISOString() })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: "Recruiter Assigned",
        description: "Recruiter has been assigned successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign recruiter. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRecruiterAssignment = (applicationId: string, recruiterId: string | null) => {
    assignRecruiterMutation.mutate({ applicationId, recruiterId });
  };

  const handleSmsOpen = (application: any) => {
    setSelectedApplication(application);
    setSmsDialogOpen(true);
  };

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

  const downloadApplicationsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Applications Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Applications: ${applications?.length || 0}`, 20, yPosition);
    yPosition += 6;

    if (statusCounts) {
      Object.entries(statusCounts).forEach(([status, count]) => {
        doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`, 20, yPosition);
        yPosition += 6;
      });
    }

    yPosition += 10;

    // Applications List
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Applications', 20, yPosition);
    yPosition += 10;

    filteredApplications?.forEach((app, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      const applicantName = getApplicantName(app);
      const email = getApplicantEmail(app);
      const jobTitle = app.job_listings?.title || app.job_listings?.job_title || 'Unknown Position';
      const category = getApplicantCategory(app);
      const clientName = getClientName(app);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${applicantName}`, 20, yPosition);
      yPosition += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${email}`, 25, yPosition);
      yPosition += 5;
      doc.text(`Position: ${jobTitle}`, 25, yPosition);
      yPosition += 5;
      if (clientName) {
        doc.text(`Client: ${clientName}`, 25, yPosition);
        yPosition += 5;
      }
      doc.text(`Category: ${category.code} - ${category.label}`, 25, yPosition);
      yPosition += 5;
      doc.text(`Status: ${app.status}`, 25, yPosition);
      yPosition += 5;
      if (app.phone) {
        doc.text(`Phone: ${app.phone}`, 25, yPosition);
        yPosition += 5;
      }
      doc.text(`Applied: ${new Date(app.applied_at).toLocaleDateString()}`, 25, yPosition);
      yPosition += 10;
    });

    doc.save('applications-report.pdf');
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
    const category = getApplicantCategory(app);
    
    const matchesSearch = (
      applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesCategory = categoryFilter === 'all' || category.code === categoryFilter;
    
    return matchesSearch && matchesCategory;
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
    <div className={`${isMobile ? 'p-4' : 'p-6'} max-w-7xl mx-auto`}>
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-col sm:flex-row'} justify-between items-start sm:items-center gap-4 mb-8`}>
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>Applications</h1>
          <p className="text-muted-foreground mt-1">Track and manage job applications</p>
        </div>
        <Button
          onClick={downloadApplicationsPDF}
          className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}
          variant="outline"
          size={isMobile ? 'lg' : 'default'}
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
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

          <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-4 mb-6`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by applicant name, email, or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isMobile ? 'h-12 text-base' : ''}`}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className={`${isMobile ? 'w-full h-12 text-base' : 'w-48'}`}>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="D">D - Experienced Driver</SelectItem>
                <SelectItem value="SC">SC - New CDL Holder</SelectItem>
                <SelectItem value="SR">SR - Student Ready</SelectItem>
                <SelectItem value="N/A">N/A - Uncategorized</SelectItem>
              </SelectContent>
            </Select>
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
                     <div className={`flex ${isMobile ? 'flex-col' : 'flex-col md:flex-row md:items-center'} justify-between gap-4`}>
                       <div className="flex-1 min-w-0">
                          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-3'} mb-2`}>
                            <div className="flex items-center gap-2">
                              <h3 className={`${isMobile ? 'text-lg' : 'text-lg'} font-medium text-white`}>
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
                            </div>
                            <div className="flex gap-2">
                              <Select
                                value={application.status}
                                onValueChange={(newStatus) => handleStatusChange(application.id, newStatus)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <SelectTrigger className={`${isMobile ? 'w-full h-10' : 'w-32 h-7'} text-xs font-medium ${getStatusColor(application.status)}`}>
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
                              
                              {/* Recruiter Assignment Dropdown */}
                              <Select
                                value={application.recruiter_id || 'unassigned'}
                                onValueChange={(value) => handleRecruiterAssignment(application.id, value === 'unassigned' ? null : value)}
                                disabled={assignRecruiterMutation.isPending}
                              >
                                <SelectTrigger className={`${isMobile ? 'w-full h-10' : 'w-40 h-7'} text-xs`}>
                                  <SelectValue placeholder="Assign Recruiter" />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {recruiters?.map((recruiter) => (
                                    <SelectItem key={recruiter.id} value={recruiter.id}>
                                      {recruiter.first_name} {recruiter.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        <div className="space-y-1 mb-2">
                          <p className="text-gray-600 flex items-center gap-2">
                            <span>{getApplicantEmail(application)}</span>
                          </p>
                           {application.phone && (
                             <p className="text-foreground flex items-center gap-2">
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
                      
                        {isMobile ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => {
                                const dialog = document.querySelector(`[data-application-details="${application.id}"]`) as HTMLElement;
                                dialog?.click();
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const dialog = document.querySelector(`[data-tenstreet-update="${application.id}"]`) as HTMLElement;
                                dialog?.click();
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Tenstreet Update
                              </DropdownMenuItem>
                              {application.phone && (
                                <DropdownMenuItem onClick={() => handleSmsOpen(application)}>
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  SMS Chat
                                </DropdownMenuItem>
                              )}
                              {application.phone && (
                                <DropdownMenuItem onClick={() => window.open(`tel:${application.phone}`)}>
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => window.open(`mailto:${getApplicantEmail(application)}`)}>
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            <ApplicationDetailsDialog application={application} />
                            <TenstreetUpdateDialog application={application} />
                            {application.phone && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-2"
                                onClick={() => handleSmsOpen(application)}
                              >
                                <MessageCircle className="w-4 h-4" />
                                SMS
                              </Button>
                            )}
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
                        )}
                        
                        {/* Hidden dialog triggers for mobile dropdown */}
                        <div className="hidden">
                          <div data-application-details={application.id}>
                            <ApplicationDetailsDialog application={application} />
                          </div>
                          <div data-tenstreet-update={application.id}>
                            <TenstreetUpdateDialog application={application} />
                          </div>
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

      {/* SMS Conversation Dialog */}
      <SmsConversationDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        application={selectedApplication}
        currentRecruiterId={currentRecruiter?.id}
      />
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
