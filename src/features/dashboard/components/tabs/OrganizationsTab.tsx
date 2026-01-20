import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ExternalLink, ChevronRight } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationsTabProps {
  totalOrganizations: number;
  newThisMonth: number;
  totalUsers: number;
  topOrganizations: Organization[] | undefined;
}

export const OrganizationsTab: React.FC<OrganizationsTabProps> = ({
  totalOrganizations,
  newThisMonth,
  totalUsers,
  topOrganizations,
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Organization Overview</CardTitle>
            <CardDescription>Quick view of all organizations</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link to="/admin/organizations">
              View All <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{totalOrganizations}</p>
              <p className="text-sm text-muted-foreground">Total Organizations</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{newThisMonth}</p>
              <p className="text-sm text-muted-foreground">New This Month</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
          
          {topOrganizations && topOrganizations.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium mb-3">Organizations</h4>
              {topOrganizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">{org.slug}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No organizations found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
