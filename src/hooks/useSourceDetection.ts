import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const META_UTM_SOURCES = ['facebook', 'instagram', 'meta', 'fb', 'ig'];
const META_REFERRER_DOMAINS = ['facebook.com', 'instagram.com', 'l.facebook.com', 'm.facebook.com', 'lm.facebook.com'];

const X_UTM_SOURCES = ['x', 'twitter'];
const X_REFERRER_DOMAINS = ['x.com', 'twitter.com', 't.co'];

const LINKEDIN_UTM_SOURCES = ['linkedin', 'in'];
const LINKEDIN_REFERRER_DOMAINS = ['linkedin.com', 'lnkd.in'];

const TIKTOK_UTM_SOURCES = ['tiktok'];
const TIKTOK_REFERRER_DOMAINS = ['tiktok.com'];

const ALL_SOCIAL_UTM_SOURCES = [...META_UTM_SOURCES, ...X_UTM_SOURCES, ...LINKEDIN_UTM_SOURCES, ...TIKTOK_UTM_SOURCES];
const ALL_SOCIAL_REFERRER_DOMAINS = [...META_REFERRER_DOMAINS, ...X_REFERRER_DOMAINS, ...LINKEDIN_REFERRER_DOMAINS, ...TIKTOK_REFERRER_DOMAINS];

interface SourceDetection {
  isMetaTraffic: boolean;
  isXTraffic: boolean;
  isSocialTraffic: boolean;
  source: 'facebook' | 'instagram' | 'meta' | 'x' | 'linkedin' | 'tiktok' | 'organic' | string;
}

export const useSourceDetection = (): SourceDetection => {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const fbclid = searchParams.get('fbclid');
    const utmSource = (searchParams.get('utm_source') || searchParams.get('utmSource') || searchParams.get('source') || '').toLowerCase();
    const referrer = typeof document !== 'undefined' ? document.referrer.toLowerCase() : '';

    // Check fbclid first (strongest Meta signal)
    if (fbclid) {
      const source = (utmSource === 'instagram' || utmSource === 'ig') ? 'instagram' : 'facebook';
      return { isMetaTraffic: true, isXTraffic: false, isSocialTraffic: true, source };
    }

    // Check utm_source against all social platforms
    if (META_UTM_SOURCES.includes(utmSource)) {
      const source = (utmSource === 'ig' || utmSource === 'instagram') ? 'instagram' :
                     (utmSource === 'meta') ? 'meta' : 'facebook';
      return { isMetaTraffic: true, isXTraffic: false, isSocialTraffic: true, source };
    }

    if (X_UTM_SOURCES.includes(utmSource)) {
      return { isMetaTraffic: false, isXTraffic: true, isSocialTraffic: true, source: 'x' };
    }

    if (LINKEDIN_UTM_SOURCES.includes(utmSource)) {
      return { isMetaTraffic: false, isXTraffic: false, isSocialTraffic: true, source: 'linkedin' };
    }

    if (TIKTOK_UTM_SOURCES.includes(utmSource)) {
      return { isMetaTraffic: false, isXTraffic: false, isSocialTraffic: true, source: 'tiktok' };
    }

    // Check referrer domains
    if (META_REFERRER_DOMAINS.some(d => referrer.includes(d))) {
      const source = referrer.includes('instagram') ? 'instagram' : 'facebook';
      return { isMetaTraffic: true, isXTraffic: false, isSocialTraffic: true, source };
    }

    if (X_REFERRER_DOMAINS.some(d => referrer.includes(d))) {
      return { isMetaTraffic: false, isXTraffic: true, isSocialTraffic: true, source: 'x' };
    }

    if (LINKEDIN_REFERRER_DOMAINS.some(d => referrer.includes(d))) {
      return { isMetaTraffic: false, isXTraffic: false, isSocialTraffic: true, source: 'linkedin' };
    }

    if (TIKTOK_REFERRER_DOMAINS.some(d => referrer.includes(d))) {
      return { isMetaTraffic: false, isXTraffic: false, isSocialTraffic: true, source: 'tiktok' };
    }

    return { isMetaTraffic: false, isXTraffic: false, isSocialTraffic: false, source: 'organic' };
  }, [searchParams]);
};
