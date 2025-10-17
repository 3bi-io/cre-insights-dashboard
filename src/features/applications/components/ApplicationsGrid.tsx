import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import ApplicationCard from '@/components/applications/ApplicationCard';
import type { Application } from '@/types/common.types';

interface ApplicationsGridProps {
  applications: Application[];
  statusCounts: Record<string, number>;
  selectedApplications: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectApplication: (id: string, checked: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onSmsOpen: (app: Application) => void;
  onDetailsView: (app: Application) => void;
  onTenstreetUpdate: (app: Application) => void;
  onScreeningOpen: (app: Application) => void;
}

const STATUS_TABS = ['all', 'pending', 'reviewed', 'interviewing', 'hired', 'rejected'] as const;

export const ApplicationsGrid = ({
  applications,
  statusCounts,
  selectedApplications,
  onSelectAll,
  onSelectApplication,
  onStatusChange,
  onSmsOpen,
  onDetailsView,
  onTenstreetUpdate,
  onScreeningOpen,
}: ApplicationsGridProps) => {
  const getFilteredApplications = (status: typeof STATUS_TABS[number]) => {
    return status === 'all' 
      ? applications 
      : applications.filter(app => app.status === status);
  };

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList className="grid w-full grid-cols-6">
        {STATUS_TABS.map((status) => (
          <TabsTrigger key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status] || applications.length})
          </TabsTrigger>
        ))}
      </TabsList>

      {STATUS_TABS.map((status) => {
        const filteredApps = getFilteredApplications(status);
        
        return (
          <TabsContent key={status} value={status} className="space-y-4">
            {filteredApps.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  checked={selectedApplications.size === filteredApps.length}
                  onCheckedChange={onSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select all {status !== 'all' && `${status} applications`}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((application) => (
                <div key={application.id} className="relative">
                  <Checkbox
                    className="absolute top-2 left-2 z-10"
                    checked={selectedApplications.has(application.id)}
                    onCheckedChange={(checked) => 
                      onSelectApplication(application.id, checked as boolean)
                    }
                  />
                  <ApplicationCard
                    application={application}
                    onStatusChange={(appId, newStatus) => onStatusChange(appId, newStatus)}
                    onRecruiterAssignment={() => {}}
                    onSmsOpen={() => onSmsOpen(application)}
                    onDetailsView={() => onDetailsView(application)}
                    onTenstreetUpdate={() => onTenstreetUpdate(application)}
                    onScreeningOpen={() => onScreeningOpen(application)}
                  />
                </div>
              ))}
            </div>

            {filteredApps.length === 0 && (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No applications found</p>
                  <p className="text-sm">Try adjusting your filters or search criteria</p>
                </div>
              </Card>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
};
