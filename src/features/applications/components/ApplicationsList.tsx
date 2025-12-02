import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Application } from '@/types/common.types';
import { ApplicationCard, ApplicationsTableView } from '../components';
import { ColumnVisibility } from '../components/TableColumnVisibility';
import { logger } from '@/lib/logger';

interface ApplicationsListProps {
  applications: Application[];
  viewMode: 'card' | 'table';
  selectedApplications: Set<string>;
  columnVisibility: ColumnVisibility;
  loading: boolean;
  onStatusChange: (id: string, status: string) => void;
  onRecruiterAssignment: (id: string, recruiterId: string) => void;
  onDetailsView: (app: Application) => void;
  onSmsOpen: (app: Application) => void;
  onScreeningOpen: (app: Application) => void;
  onTenstreetUpdate: (app: Application) => void;
  onSelectApplication: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export const ApplicationsList = ({
  applications,
  viewMode,
  selectedApplications,
  columnVisibility,
  loading,
  onStatusChange,
  onRecruiterAssignment,
  onDetailsView,
  onSmsOpen,
  onScreeningOpen,
  onTenstreetUpdate,
  onSelectApplication,
  onSelectAll,
}: ApplicationsListProps) => {
  if (!applications || applications.length === 0) {
    return (
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm animate-fade-in">
        <CardContent className="p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-lg font-medium text-foreground mb-2">No applications found</p>
          <p className="text-muted-foreground">
            {loading ? "Loading applications..." : "Try adjusting your filters or check back later"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'table') {
    return (
      <ApplicationsTableView
        applications={applications}
        selectedApplications={selectedApplications}
        columnVisibility={columnVisibility}
        onStatusChange={onStatusChange}
        onRecruiterAssignment={(applicationId, recruiterId) => {
          logger.debug('Recruiter assignment requested', { applicationId, recruiterId }, 'Applications');
          onRecruiterAssignment(applicationId, recruiterId);
        }}
        onDetailsView={onDetailsView}
        onSmsOpen={onSmsOpen}
        onScreeningOpen={onScreeningOpen}
        onTenstreetUpdate={onTenstreetUpdate}
        onSelectApplication={onSelectApplication}
        onSelectAll={onSelectAll}
      />
    );
  }

  return (
    <>
      {applications.map((application, index) => (
        <div 
          key={application.id || index}
          className="animate-fade-in"
          style={{ animationDelay: `${(index % 10) * 50}ms` }}
        >
          <ApplicationCard
            application={application}
            onStatusChange={(applicationId, newStatus) => onStatusChange(applicationId, newStatus)}
            onRecruiterAssignment={(applicationId, recruiterId) => {
              logger.debug('Recruiter assignment requested', { applicationId, recruiterId }, 'Applications');
              onRecruiterAssignment(applicationId, recruiterId);
            }}
            onDetailsView={() => onDetailsView(application)}
            onSmsOpen={() => onSmsOpen(application)}
            onScreeningOpen={() => onScreeningOpen(application)}
            onTenstreetUpdate={() => onTenstreetUpdate(application)}
          />
        </div>
      ))}
    </>
  );
};
