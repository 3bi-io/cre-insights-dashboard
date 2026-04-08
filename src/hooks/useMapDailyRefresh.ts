/**
 * useMapDailyRefresh
 * Client-side once-per-day background refresh for /map job data
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'map-last-refresh';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

function getLastRefresh(): number | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val) return parseInt(val, 10);
  } catch { /* ignore */ }
  return null;
}

function setLastRefresh(ts: number) {
  try {
    localStorage.setItem(STORAGE_KEY, ts.toString());
  } catch { /* ignore */ }
}

export function useMapDailyRefresh() {
  const queryClient = useQueryClient();
  const checkedRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(() => getLastRefresh());

  const doRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['map-jobs'] });
      const now = Date.now();
      setLastRefresh(now);
      setLastRefreshTime(now);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const last = getLastRefresh();
    const now = Date.now();

    if (!last || now - last > TWENTY_FOUR_HOURS) {
      // Delay slightly so it doesn't block initial render
      const timer = setTimeout(() => doRefresh(), 2000);
      return () => clearTimeout(timer);
    }
  }, [doRefresh]);

  return { isRefreshing, lastRefreshTime };
}
