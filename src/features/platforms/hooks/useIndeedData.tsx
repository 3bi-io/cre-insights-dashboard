/**
 * Hook for Indeed platform data integration
 * Migrated from src/hooks/useIndeedData.tsx
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface IndeedStats {
  employerId: string;
  impressions: number;
  clicks: number;
  applications: number;
  spend: number;
  cpc: number;
  ctr: number;
  date: string;
}

export const useIndeedData = () => {
  const [data, setData] = useState<IndeedStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndeedStats = async (employerId?: string, dateRange?: { start: string; end: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('Fetching Indeed stats', { employerId, dateRange, context: 'indeed-data' });
      
      const { data: result, error: functionError } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'get_stats',
          employerId,
          dateRange
        }
      });

      if (functionError) {
        logger.error('Indeed stats fetch failed', functionError, { context: 'indeed-data' });
        throw functionError;
      }

      logger.debug('Indeed stats fetched', { recordCount: result?.length || 0, context: 'indeed-data' });
      setData(result || []);
    } catch (err) {
      logger.error('Error in Indeed data hook', err, { context: 'indeed-data' });
      setError(err instanceof Error ? err.message : 'Failed to fetch Indeed data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('Fetching Indeed employers', { context: 'indeed-data' });
      
      const { data: result, error: functionError } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'get_stats',
          employerId: 'all'
        }
      });

      if (functionError) {
        logger.error('Indeed employers fetch failed', functionError, { context: 'indeed-data' });
        throw functionError;
      }

      logger.debug('Indeed employers fetched', { count: result?.length || 0, context: 'indeed-data' });
      return result;
    } catch (err) {
      logger.error('Error fetching Indeed employers', err, { context: 'indeed-data' });
      setError(err instanceof Error ? err.message : 'Failed to fetch employers');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    fetchIndeedStats,
    fetchEmployers
  };
};
