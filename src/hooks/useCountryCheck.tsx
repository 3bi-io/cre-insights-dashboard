import { useState, useEffect } from 'react';

const BLOCKED_COUNTRIES = ['RU', 'CN', 'UA'];
const COUNTRY_CHECK_KEY = 'country_check_result';

interface CountryCheckResult {
  isBlocked: boolean;
  countryCode: string | null;
  checked: boolean;
}

export const useCountryCheck = (): CountryCheckResult => {
  const [result, setResult] = useState<CountryCheckResult>({
    isBlocked: false,
    countryCode: null,
    checked: false,
  });

  useEffect(() => {
    const checkCountry = async () => {
      // Check sessionStorage first to avoid repeated API calls
      const cached = sessionStorage.getItem(COUNTRY_CHECK_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setResult({ ...parsed, checked: true });
        return;
      }

      try {
        // Use ipapi.co for country detection (free, no API key needed)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code || null;
        const isBlocked = countryCode ? BLOCKED_COUNTRIES.includes(countryCode) : false;

        const checkResult = { isBlocked, countryCode, checked: true };
        sessionStorage.setItem(COUNTRY_CHECK_KEY, JSON.stringify(checkResult));
        setResult(checkResult);
      } catch (error) {
        console.error('Country check failed:', error);
        // On error, allow access (fail open)
        const checkResult = { isBlocked: false, countryCode: null, checked: true };
        setResult(checkResult);
      }
    };

    checkCountry();
  }, []);

  return result;
};
