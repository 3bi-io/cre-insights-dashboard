import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, AlertCircle, BarChart3, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
const MetaSpendMetrics: React.FC = () => {
  const {
    data: adsetsData,
    isLoading: adsetsLoading,
    error: adsetsError
  } = useQuery({
    queryKey: ['meta_ad_sets'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('meta_ad_sets').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      if (error) throw error;
      return data;
    }
  });
  const {
    data: adsData,
    isLoading: adsLoading,
    error: adsError
  } = useQuery({
    queryKey: ['meta_ads'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('meta_ads').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      if (error) throw error;
      return data;
    }
  });
  const isLoading = adsetsLoading || adsLoading;
  const error = adsetsError || adsError;
  if (isLoading) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>;
  }
  if (error) {
    return <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading Meta data: {error.message}
        </AlertDescription>
      </Alert>;
  }
  const adsetsCount = adsetsData?.length || 0;
  const adsCount = adsData?.length || 0;
  return;
};
export default MetaSpendMetrics;