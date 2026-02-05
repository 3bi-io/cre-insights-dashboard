 import { useQuery } from '@tanstack/react-query';
 import { DataQualityService } from '../services/dataQualityService';
 import { useMemo } from 'react';
 
 /**
  * Hook to fetch data quality metrics
  */
 export const useDataQuality = (days: number = 30) => {
   const {
     data: summary,
     isLoading,
     error,
     refetch
   } = useQuery({
     queryKey: ['admin-data-quality', days],
     queryFn: () => DataQualityService.fetchDataQualitySummary(days),
     staleTime: 5 * 60 * 1000, // 5 minutes
   });
 
   const alerts = useMemo(() => {
     if (!summary) return [];
     return DataQualityService.generateAlerts(summary);
   }, [summary]);
 
   return {
     summary,
     alerts,
     isLoading,
     error,
     refetch
   };
 };