import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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

// Short labels for mobile
const STATUS_LABELS: Record<typeof STATUS_TABS[number], { full: string; short: string }> = {
  all: { full: 'All', short: 'All' },
  pending: { full: 'Pending', short: 'Pend' },
  reviewed: { full: 'Reviewed', short: 'Rev' },
  interviewing: { full: 'Interviewing', short: 'Int' },
  hired: { full: 'Hired', short: 'Hired' },
  rejected: { full: 'Rejected', short: 'Rej' },
};

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
      {/* Scrollable tabs for mobile, grid for desktop */}
      <ScrollArea className="w-full">
        <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-6 h-auto p-1">
          {STATUS_TABS.map((status) => {
            const count = statusCounts[status] || (status === 'all' ? applications.length : 0);
            return (
              <TabsTrigger 
                key={status} 
                value={status}
                className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm"
              >
                {/* Short label on mobile, full on desktop */}
                <span className="sm:hidden">
                  {STATUS_LABELS[status].short}
                  <span className="ml-1 text-muted-foreground">({count})</span>
                </span>
                <span className="hidden sm:inline">
                  {STATUS_LABELS[status].full} ({count})
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <ScrollBar orientation="horizontal" className="md:hidden" />
      </ScrollArea>

      {STATUS_TABS.map((status) => {
        const filteredApps = getFilteredApplications(status);
        
        return (
          <TabsContent key={status} value={status} className="space-y-4">
            {filteredApps.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  checked={selectedApplications.size === filteredApps.length}
                  onCheckedChange={onSelectAll}
                  className="h-5 w-5"
                />
                <span className="text-sm text-muted-foreground">
                  Select all{status !== 'all' && <span className="hidden sm:inline"> {status} applications</span>}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredApps.map((application) => (
                <div key={application.id} className="relative">
                  <Checkbox
                    className="absolute top-2 left-2 z-10 h-5 w-5"
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
              <Card className="p-8 sm:p-12">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-base sm:text-lg font-medium">No applications found</p>
                  <p className="text-xs sm:text-sm">Try adjusting your filters</p>
                </div>
              </Card>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
};
