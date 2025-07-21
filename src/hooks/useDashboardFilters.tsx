
import { useState, useEffect } from 'react';
import { subDays } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

interface DashboardFilters {
  status: string;
  platform: string;
  category: string;
  location: string;
  metrics: {
    showSpend: boolean;
    showApplications: boolean;
    showConversions: boolean;
    showCTR: boolean;
  };
}

export const useDashboardFilters = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const [filters, setFilters] = useState<DashboardFilters>({
    status: '',
    platform: '',
    category: '',
    location: '',
    metrics: {
      showSpend: true,
      showApplications: true,
      showConversions: true,
      showCTR: true,
    }
  });

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardFilters', JSON.stringify(filters));
  }, [filters]);

  // Save date range to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardDateRange', JSON.stringify({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString()
    }));
  }, [dateRange]);

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('dashboardFilters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }

    const savedDateRange = localStorage.getItem('dashboardDateRange');
    if (savedDateRange) {
      try {
        const parsed = JSON.parse(savedDateRange);
        setDateRange({
          from: new Date(parsed.from),
          to: new Date(parsed.to)
        });
      } catch (error) {
        console.error('Error loading saved date range:', error);
      }
    }
  }, []);

  const updateFilters = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      platform: '',
      category: '',
      location: '',
      metrics: {
        showSpend: true,
        showApplications: true,
        showConversions: true,
        showCTR: true,
      }
    });
  };

  return {
    dateRange,
    setDateRange,
    filters,
    setFilters,
    updateFilters,
    resetFilters
  };
};
