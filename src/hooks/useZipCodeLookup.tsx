import { useState, useEffect } from 'react';
import { lookupZipCode } from '@/utils/zipCodeLookup';

interface UseZipCodeLookupReturn {
  city: string | null;
  state: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useZipCodeLookup = (zipCode: string | null | undefined): UseZipCodeLookupReturn => {
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLookup = async () => {
      if (!zipCode || zipCode.trim() === '') {
        setCity(null);
        setState(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await lookupZipCode(zipCode);
        if (result) {
          setCity(result.city);
          setState(result.stateAbbr);
        } else {
          setCity(null);
          setState(null);
          // Don't set error for 404s, just silently handle invalid zip codes
        }
      } catch (err) {
        setCity(null);
        setState(null);
        setError('Failed to lookup zip code');
      } finally {
        setIsLoading(false);
      }
    };

    performLookup();
  }, [zipCode]);

  return { city, state, isLoading, error };
};