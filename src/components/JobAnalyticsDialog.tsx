
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Eye, MousePointer, DollarSign, BarChart3, Code, Rss, ExternalLink, Tag, Activity, FileText } from 'lucide-react';
import { EmbedTokenGenerator } from '@/features/jobs/components/EmbedTokenGenerator';
import { renderJobDescription } from '@/utils/markdownRenderer';

interface JobAnalyticsDialogProps {
  job: {
    id: string;
    title: string;
    status: string;
    location?: string;
    created_at: string;
    updated_at: string;
    organization_id?: string;
    platforms?: { name: string };
    job_categories?: { name: string };
    feed_date?: string;
    jobreferrer?: string;
    sponsorship_tier?: string;
    indeed_apply_api_token?: string;
    indeed_apply_job_id?: string;
    indeed_apply_post_url?: string;
    tracking_pixel_url?: string;
    [key: string]: unknown;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobAnalyticsDialog: React.FC<JobAnalyticsDialogProps> = ({ job, open, onOpenChange }) => {
  const { data: spendData, isLoading: spendLoading } = useQuery({
    queryKey: ['job-spend', job.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_spend')
        .select('*')
        .eq('job_listing_id', job.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['job-applications', job.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_listing_id', job.id)
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const getApplicantName = (app: any) => {
    if (app.first_name && app.last_name) {
      return `${app.first_name} ${app.last_name}`;
    } else if (app.first_name) {
      return app.first_name;
    } else if (app.last_name) {
      return app.last_name;
    }
    return 'Anonymous Applicant';
  };

  const totalSpend = spendData?.reduce((sum, day) => sum + Number(day.amount), 0) || 0;
  const totalViews = spendData?.reduce((sum, day) => sum + Number(day.views), 0) || 0;
  const totalClicks = spendData?.reduce((sum, day) => sum + Number(day.clicks), 0) || 0;
  const totalApplications = applicationsData?.length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Job Details: "{job.title}"
            <Badge className={getStatusColor(job.status)}>
              {job.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </TabsTrigger>
            <TabsTrigger value="feed-data" className="flex items-center gap-2">
              <Rss className="h-4 w-4" />
              Feed Data
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Embed Widgets
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="space-y-6 mt-4">
            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Publisher:</span> {job.platforms?.name === 'Indeed' ? 'X' : job.platforms?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {job.job_categories?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {job.location || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(job.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {new Date(job.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spend</p>
                      <p className="text-xl font-bold">${totalSpend.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="text-xl font-bold">{totalViews.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Clicks</p>
                      <p className="text-xl font-bold">{totalClicks.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Applications</p>
                      <p className="text-xl font-bold">{totalApplications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            {spendData && spendData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Daily Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {spendData.slice(0, 7).map((day) => (
                      <div key={day.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                        <div className="flex gap-4 text-sm">
                          <span>Views: {day.views}</span>
                          <span>Clicks: {day.clicks}</span>
                          <span className="font-medium">${Number(day.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Applications */}
            {applicationsData && applicationsData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {applicationsData.slice(0, 5).map((application) => (
                      <div key={application.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <span className="font-medium">{getApplicantName(application)}</span>
                          {application.applicant_email && (
                            <span className="text-sm text-muted-foreground ml-2">({application.applicant_email})</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(application.applied_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="description" className="space-y-6 mt-4">
            {(job as any).job_summary && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm">{(job as any).job_summary}</p>
                </CardContent>
              </Card>
            )}

            {((job as any).job_description || (job as any).description) ? (
              <Card>
                <CardContent className="p-6">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderJobDescription(
                        ((job as any).job_description || (job as any).description) as string
                      ),
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No description available for this job listing.</p>
                </CardContent>
              </Card>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview as Public
            </Button>
          </TabsContent>

          <TabsContent value="feed-data" className="space-y-6 mt-4">
            {/* Feed Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Feed Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Feed Date:</span>
                    <div className="mt-1">
                      {job.feed_date ? (
                        <span className="font-medium">{new Date(job.feed_date).toLocaleDateString()}</span>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Not captured</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">System Created:</span>
                    <div className="mt-1">
                      <span className="font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Campaign Attribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Job Referrer:</span>
                    <div className="mt-1">
                      {job.jobreferrer ? (
                        <Badge variant="outline" className="font-mono text-xs">{job.jobreferrer}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Not captured</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Sponsorship Tier:</span>
                    <div className="mt-1">
                      {job.sponsorship_tier ? (
                        <Badge className="text-xs">{job.sponsorship_tier}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Not mapped</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indeed Apply Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">I</span>
                  </div>
                  Indeed Apply Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.indeed_apply_job_id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">
                        Enabled
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Job ID:</span>
                        <div className="mt-1 font-mono text-xs bg-muted px-2 py-1 rounded">
                          {job.indeed_apply_job_id}
                        </div>
                      </div>
                      {job.indeed_apply_api_token && (
                        <div>
                          <span className="font-medium text-muted-foreground">API Token:</span>
                          <div className="mt-1 font-mono text-xs bg-muted px-2 py-1 rounded">
                            {job.indeed_apply_api_token.substring(0, 8)}...{job.indeed_apply_api_token.slice(-4)}
                          </div>
                        </div>
                      )}
                      {job.indeed_apply_post_url && (
                        <div>
                          <span className="font-medium text-muted-foreground">Post URL:</span>
                          <div className="mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => window.open(job.indeed_apply_post_url as string, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open URL
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="secondary" className="text-xs">Not configured</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      Indeed Apply data will be captured on next feed sync
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tracking Pixel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Tracking Pixel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.tracking_pixel_url ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400">
                        Active
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Pixel URL:</span>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                          {job.tracking_pixel_url}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs shrink-0"
                          onClick={() => window.open(job.tracking_pixel_url as string, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="secondary" className="text-xs">Not detected</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      No tracking pixel found in job description
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="embed" className="mt-4">
            {job.organization_id ? (
              <EmbedTokenGenerator
                jobListingId={job.id}
                organizationId={job.organization_id}
                jobTitle={job.title}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Organization information is required to create embed widgets.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default JobAnalyticsDialog;
