import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface IndeedStats {
  employerId: string;
  spend: number;
  clicks: number;
  impressions: number;
  ctr: number;
  cpc: number;
}

export const useIndeedData = () => {
  const [data, setData] = useState<IndeedStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndeedStats = async (employerId?: string, dateRange?: { start: string; end: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: functionError } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'getStats',
          employerId,
          dateRange
        }
      });

      if (functionError) throw functionError;

      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Indeed data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: functionError } = await supabase.functions.invoke('indeed-integration', {
        body: {
          action: 'getEmployers'
        }
      });

      if (functionError) throw functionError;

      return result;
    } catch (err) {
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