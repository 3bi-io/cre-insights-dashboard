import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const META_UTM_SOURCES = ['facebook', 'instagram', 'meta', 'fb', 'ig'];
const META_REFERRER_DOMAINS = ['facebook.com', 'instagram.com', 'l.facebook.com', 'm.facebook.com', 'lm.facebook.com'];

interface SourceDetection {
  isMetaTraffic: boolean;
  isSocialTraffic: boolean;
  source: 'facebook' | 'instagram' | 'meta' | 'organic' | string;
}

export const useSourceDetection = (): SourceDetection => {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const fbclid = searchParams.get('fbclid');
    const utmSource = (searchParams.get('utm_source') || searchParams.get('utmSource') || searchParams.get('source') || '').toLowerCase();
    const referrer = typeof document !== 'undefined' ? document.referrer.toLowerCase() : '';

    // Check fbclid first (strongest signal)
    if (fbclid) {
      // Try to distinguish FB vs IG from utm_source
      if (utmSource === 'instagram' || utmSource === 'ig') {
        return { isMetaTraffic: true, isSocialTraffic: true, source: 'instagram' };
      }
      return { isMetaTraffic: true, isSocialTraffic: true, source: 'facebook' };
    }

    // Check utm_source
    if (META_UTM_SOURCES.includes(utmSource)) {
      const source = (utmSource === 'ig' || utmSource === 'instagram') ? 'instagram' : 
                     (utmSource === 'meta') ? 'meta' : 'facebook';
      return { isMetaTraffic: true, isSocialTraffic: true, source };
    }

    // Check referrer
    const isMetaReferrer = META_REFERRER_DOMAINS.some(domain => referrer.includes(domain));
    if (isMetaReferrer) {
      const source = referrer.includes('instagram') ? 'instagram' : 'facebook';
      return { isMetaTraffic: true, isSocialTraffic: true, source };
    }

    return { isMetaTraffic: false, isSocialTraffic: false, source: 'organic' };
  }, [searchParams]);
};
