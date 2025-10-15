import { ApplicationStatus } from '../types';

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  interviewed: 'bg-purple-100 text-purple-800',
  hired: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const STATUS_OPTIONS = [
  { value: 'pending' as ApplicationStatus, label: 'Pending' },
  { value: 'reviewed' as ApplicationStatus, label: 'Reviewed' },
  { value: 'interviewed' as ApplicationStatus, label: 'Interviewed' },
  { value: 'hired' as ApplicationStatus, label: 'Hired' },
  { value: 'rejected' as ApplicationStatus, label: 'Rejected' },
] as const;

export const DEFAULT_STATUS: ApplicationStatus = 'pending';
