// Canonical data fetching hook
export { usePaginatedApplications } from './usePaginatedApplications';

// CRUD mutations hook
export { useApplicationsMutations } from './useApplicationsMutations';

// UI state management hook
export { useApplicationsManagement } from './useApplicationsManagement';
export type { ViewMode, ApplicationsManagementConfig, ApplicationsUIState } from './useApplicationsManagement';

// Legacy hook - deprecated, use usePaginatedApplications + useApplicationsMutations instead
/** @deprecated Use usePaginatedApplications for data and useApplicationsMutations for CRUD */
export { useApplications } from './useApplications';
export type { ApplicationFilters } from './useApplications';

// Dialog state management
export { useApplicationDialogs } from './useApplicationDialogs';
export { useOrganizationData } from './useOrganizationData';

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

// Application Stats hook (aggregate statistics for all applications)
export { useApplicationStats } from './useApplicationStats';
