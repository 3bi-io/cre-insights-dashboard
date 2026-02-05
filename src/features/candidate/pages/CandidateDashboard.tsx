import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Briefcase, 
  Search, 
  Bell, 
  CheckCircle2,
  Circle,
  ArrowRight,
  MapPin,
  Clock,
  Bookmark
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCandidateApplications, useSavedJobs } from '../hooks';
import { useRecommendedJobs } from '../hooks/useJobDetail';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { ApplicationProgress } from '../components/ApplicationProgress';
import { format } from 'date-fns';
 import { CompanyLogo } from '@/components/shared';

const CandidateDashboard = () => {
  const { candidateProfile } = useAuth();
  const { applications, isLoading: isLoadingApps } = useCandidateApplications();
  const { savedJobs, isLoading: isLoadingSaved } = useSavedJobs();
  const { jobs: recommendedJobs, isLoading: isLoadingRecommended } = useRecommendedJobs(undefined, 4);

  const recentApplications = applications?.slice(0, 3) || [];
  const activeAppsCount = applications?.filter((app: any) => 
    ['pending', 'reviewed', 'interview_scheduled'].includes(app.status)
  ).length || 0;

  const completionPercentage = candidateProfile?.profile_completion_percentage || 20;

  const completionSteps = [
    { label: 'Basic profile created', completed: true },
    { label: 'Add your name', completed: !!candidateProfile?.first_name },
    { label: 'Add location', completed: !!candidateProfile?.city },
    { label: 'Set job preferences', completed: !!candidateProfile?.desired_job_title },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      reviewed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      interview_scheduled: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      hired: 'bg-green-500/10 text-green-600 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      reviewed: 'Reviewed',
      interview_scheduled: 'Interview',
      hired: 'Hired',
      rejected: 'Not Selected',
    };
    return (
      <Badge className={variants[status] || 'bg-muted'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <PageHeader
        title={`Welcome back${candidateProfile?.first_name ? `, ${candidateProfile.first_name}` : ''}!`}
        description="Track your applications and discover new opportunities"
      />

      {/* Profile Completion */}
      {completionPercentage < 80 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Complete Your Profile</CardTitle>
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={completionPercentage} className="h-2 mb-4" />
            <div className="flex flex-wrap gap-4 mb-4">
              {completionSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={step.completed ? '' : 'text-muted-foreground'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <Button asChild size="sm">
              <Link to="/my-jobs/profile">
                Complete Profile
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/my-jobs/applications">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{activeAppsCount}</p>
                  <p className="text-sm text-muted-foreground">Active Applications</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/my-jobs/saved">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{savedJobs?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Saved Jobs</p>
                </div>
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/my-jobs/search">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">Find</p>
                  <p className="text-sm text-muted-foreground">Browse Jobs</p>
                </div>
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/my-jobs/messages">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Unread Messages</p>
                </div>
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Track your application status</CardDescription>
            </div>
            {applications && applications.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/my-jobs/applications">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingApps ? (
              <div className="space-y-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : recentApplications.length > 0 ? (
              <div className="space-y-4">
                {recentApplications.map((app: any) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{app.job_listings?.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                           {app.job_listings?.clients?.name || app.job_listings?.organizations?.name}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(app.applied_at), 'MMM d')}
                          </span>
                          {app.job_listings?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {app.job_listings.city}, {app.job_listings.state}
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Briefcase}
                title="No applications yet"
                description="Start applying to jobs to track them here"
                actionLabel="Browse Jobs"
                actionHref="/my-jobs/search"
              />
            )}
          </CardContent>
        </Card>

        {/* Recommended Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recommended Jobs</CardTitle>
              <CardDescription>Jobs matching your profile</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/my-jobs/search">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingRecommended ? (
              <div className="space-y-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : recommendedJobs && recommendedJobs.length > 0 ? (
              <div className="space-y-3">
                {recommendedJobs.map((job: any) => (
                  <Link
                    key={job.id}
                    to={`/my-jobs/job/${job.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                       <CompanyLogo
                         logoUrl={job.clients?.logo_url || job.organizations?.logo_url}
                         companyName={job.clients?.name || job.organizations?.name || 'Company'}
                         size="sm"
                       />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{job.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                           {job.clients?.name || job.organizations?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {job.city && job.state && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.city}, {job.state}
                            </span>
                          )}
                          {job.salary_min && (
                            <span>From ${job.salary_min.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title="No recommendations yet"
                description="Complete your profile to get personalized job recommendations"
                actionLabel="Update Profile"
                actionHref="/my-jobs/profile"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateDashboard;
