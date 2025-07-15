
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, MousePointer, DollarSign } from 'lucide-react';

interface JobAnalyticsDialogProps {
  job: any;
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
            Analytics for "{job.title}"
            <Badge className={getStatusColor(job.status)}>
              {job.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Platform:</span> {job.platforms?.name === 'Indeed' ? 'X' : job.platforms?.name || 'N/A'}
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
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Spend</p>
                    <p className="text-xl font-bold">${totalSpend.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-xl font-bold">{totalViews.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Clicks</p>
                    <p className="text-xl font-bold">{totalClicks.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Applications</p>
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
                        {(application.applicant_email || application.email) && (
                          <span className="text-sm text-gray-600 ml-2">({application.applicant_email || application.email})</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(application.applied_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobAnalyticsDialog;
