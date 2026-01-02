/**
 * Centralized hooks barrel export
 * Re-exports from feature modules for backward compatibility
 */

// Feature hook re-exports for backward compatibility
export { usePaginatedApplications } from '@/features/applications/hooks/usePaginatedApplications';
export { useJobs } from '@/features/jobs/hooks/useJobs';

// Core hooks
export { usePlatformAccess } from './usePlatformAccess';
