import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BriefcaseIcon, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const JobGroups = () => {
  const { userRole } = useAuth();
  const [jobGroups, setJobGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has proper permissions
  if (userRole !== 'super_admin' && userRole !== 'admin') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need admin or super admin permissions to access job groups.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Groups</h1>
          <p className="text-muted-foreground mt-1">
            Organize and manage job listings in groups for campaign targeting
            {userRole === 'super_admin' && (
              <span className="ml-2 text-primary font-medium">(Super Administrator View)</span>
            )}
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Job Group
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !jobGroups || jobGroups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BriefcaseIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No job groups configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first job group to organize job listings for targeted campaigns.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Job Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobGroups.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Campaigns Using</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">0</div>
              </CardContent>
            </Card>
          </div>

          {/* Job Groups Grid would go here */}
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Getting Started</CardTitle>
          <CardDescription>How to create and manage job groups</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Create a job group by clicking "Create Job Group" and providing a name and description</li>
            <li>Add job listings to the group by selecting them from your available jobs</li>
            <li>Configure targeting criteria such as location, experience level, or job type</li>
            <li>Associate the job group with campaigns for coordinated marketing efforts</li>
            <li>Monitor performance metrics across all jobs in the group</li>
            <li>Edit or remove job groups as your recruitment needs change</li>
          </ol>
          <Alert className="mt-4">
            <BriefcaseIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> Job groups help you organize related positions for more effective 
              campaign targeting and budget allocation across similar roles.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobGroups;