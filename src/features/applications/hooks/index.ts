export { useApplications } from './useApplications';
export type { ApplicationFilters } from './useApplications';
export { useApplicationDialogs } from './useApplicationDialogs';
export { useOrganizationData } from './useOrganizationData';
export { useApplicationsManagement } from './useApplicationsManagement';
export { usePaginatedApplications } from './usePaginatedApplications';

// New consolidated hooks for improved architecture
export { useApplicationsFilters } from './useApplicationsFilters';
export type { ApplicationsFiltersState } from './useApplicationsFilters';

export { useApplicationsExport } from './useApplicationsExport';

export { useApplicationsBulkActions } from './useApplicationsBulkActions';

// Activity Timeline hooks
export { useApplicationActivities, useLogActivity } from './useApplicationActivities';
export type { CandidateActivity } from './useApplicationActivities';

// Kanban Board hooks
export { useKanbanBoard, KANBAN_COLUMNS } from './useKanbanBoard';

// Communication Logs hooks
export { useCommunicationLogs, useCommunicationStats } from './useCommunicationLogs';
export type { CommunicationLog } from './useCommunicationLogs';
