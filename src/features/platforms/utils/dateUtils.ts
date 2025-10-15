import { DateRangeOption } from '../types';

/**
 * Maps frontend date ranges to Meta API valid date_preset values
 */
export const getMetaDatePreset = (dateRange: DateRangeOption): string => {
  switch (dateRange) {
    case 'last_7d':
      return 'last_7d';
    case 'last_14d':
      return 'last_14d';
    case 'last_30d':
      return 'last_30d';
    case 'last_60d':
      return 'last_90d'; // Meta doesn't have 60d, use 90d instead
    case 'last_90d':
      return 'last_90d';
    case 'this_month':
      return 'this_month';
    case 'last_month':
      return 'last_month';
    default:
      return 'last_30d';
  }
};

/**
 * Computes approximate days window for leads sync
 */
export const getSinceDays = (dateRange: DateRangeOption): number => {
  const now = new Date();
  switch (dateRange) {
    case 'last_7d':
      return 7;
    case 'last_14d':
      return 14;
    case 'last_30d':
      return 30;
    case 'last_60d':
      return 60;
    case 'last_90d':
      return 90;
    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return Math.max(1, Math.ceil((now.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)));
    }
    case 'last_month':
      return 30; // simple default
    default:
      return 30;
  }
};

/**
 * Calculates start date for a given date range
 */
export const getStartDate = (dateRange: DateRangeOption): string => {
  const today = new Date();
  
  switch (dateRange) {
    case 'last_7d':
      return new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'last_14d':
      return new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'last_60d':
      return new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'last_90d':
      return new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'this_month':
      return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    case 'last_month':
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return lastMonth.toISOString().split('T')[0];
    default:
      return new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }
};
