import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Briefcase, FileText, Search, Bell, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCandidateApplications, useSavedJobs } from '../hooks';

const CandidateDashboard = () => {
  const { candidateProfile } = useAuth();
  const { applications } = useCandidateApplications();
  const { savedJobs } = useSavedJobs();

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back{candidateProfile?.first_name ? `, ${candidateProfile.first_name}` : ''}!
          </h2>
          <p className="text-muted-foreground">
            Track your applications and discover new opportunities
          </p>
        </div>

        {/* Profile Completion */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Profile Strength
              <span className="text-sm font-normal text-muted-foreground">
                {candidateProfile?.profile_completion_percentage || 20}% Complete
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={candidateProfile?.profile_completion_percentage || 20} className="mb-4" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Basic profile created</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2" />
                <span>Add work history</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2" />
                <span>Upload resume or documents</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2" />
                <span>Set job preferences</span>
              </div>
            </div>
            <Button className="w-full mt-4" asChild>
              <Link to="/my-jobs/profile">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/my-jobs/applications">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Applications</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applications?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active applications</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/my-jobs/saved">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Jobs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{savedJobs?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Jobs saved</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/my-jobs/search">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Job Search</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Find</div>
                <p className="text-xs text-muted-foreground">Browse opportunities</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/my-jobs/messages">
            <Card className="cursor-pointer hover:bg-accent transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Unread</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Empty States */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Track your application status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No applications yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start applying to jobs to see them here
                </p>
                <Button asChild>
                  <Link to="/my-jobs/search">Browse Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Jobs</CardTitle>
              <CardDescription>Jobs matching your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Complete your profile</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add more details to get personalized job recommendations
                </p>
                <Button variant="outline" asChild>
                  <Link to="/my-jobs/profile">Update Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default CandidateDashboard;
