import { Application, ApplicationStats } from '../types';
import { getApplicantCategory } from './applicationFormatters';

/**
 * Calculates statistics for a collection of applications
 */
export const calculateApplicationStats = (applications: Application[]): ApplicationStats => {
  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  applications?.forEach(app => {
    // Count by status
    if (app.status) {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    }

    // Count by category
    const category = getApplicantCategory(app);
    byCategory[category.code] = (byCategory[category.code] || 0) + 1;

    // Count by source
    const source = app.source || 'Other';
    bySource[source] = (bySource[source] || 0) + 1;
  });

  return {
    total: applications?.length || 0,
    byStatus,
    byCategory,
    bySource
  };
};

/**
 * Gets status counts from applications
 */
export const getStatusCounts = (applications: Application[]): Record<string, number> => {
  return applications?.reduce((acc, app) => {
    if (app.status) {
      acc[app.status] = (acc[app.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};
};

/**
 * Gets category counts from applications
 */
export const getCategoryCounts = (applications: Application[]): Record<string, number> => {
  return applications?.reduce((acc, app) => {
    const category = getApplicantCategory(app);
    acc[category.code] = (acc[category.code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
};

/**
 * Gets source counts from applications
 */
export const getSourceCounts = (applications: Application[]): Record<string, number> => {
  return applications?.reduce((acc, app) => {
    const source = app.source || 'Other';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
};
