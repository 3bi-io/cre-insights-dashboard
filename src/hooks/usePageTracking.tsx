import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { trackPageView as gaTrackPageView } from '@/utils/analytics';
import { logger } from '@/lib/logger';

// Generate or retrieve visitor ID from localStorage
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// Generate or retrieve session ID from sessionStorage
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
    sessionStorage.setItem('session_start', Date.now().toString());
  }
  return sessionId;
};

// Detect device type from user agent
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  // Check for in-app browsers first (Instagram, Facebook, etc.)
  if (/Instagram|FBAN|FBAV|musical_ly|BytedanceWebview|TikTok/i.test(ua)) {
    return 'mobile';
  }
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Extract UTM params with first-touch session persistence
const getUtmParams = (): Record<string, string | null> => {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
  const result: Record<string, string | null> = {};

  for (const key of keys) {
    const value = params.get(key);
    if (value) {
      sessionStorage.setItem(`_track_${key}`, value);
      result[key] = value;
    } else {
      result[key] = sessionStorage.getItem(`_track_${key}`);
    }
  }
  return result;
};

// Track page view in Supabase
const trackPageView = async (
  path: string,
  title: string,
  organizationId: string | undefined
) => {
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const deviceType = getDeviceType();
  const referrer = document.referrer || '';
  const utmParams = getUtmParams();

  try {
    // Insert page view
    const { error: pageViewError } = await supabase
      .from('page_views')
      .insert({
        visitor_id: visitorId,
        session_id: sessionId,
        organization_id: organizationId || null,
        page_path: path,
        page_title: title,
        referrer: referrer,
        user_agent: navigator.userAgent,
        device_type: deviceType,
        country: 'US',
        utm_source: utmParams.utm_source || null,
        utm_medium: utmParams.utm_medium || null,
        utm_campaign: utmParams.utm_campaign || null,
      } as any);

    if (pageViewError) {
      logger.error('Error tracking page view', pageViewError, { context: 'page-tracking' });
      return;
    }

    // Update or create session
    const sessionStart = sessionStorage.getItem('session_start');
    const durationSeconds = sessionStart 
      ? Math.floor((Date.now() - parseInt(sessionStart)) / 1000)
      : 0;

    // Get current page count for session
    const { count } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    const pageCount = (count || 0) + 1;
    const bounced = pageCount === 1 && durationSeconds < 30; // Consider bounced if only 1 page and less than 30 seconds

    // Classify source from referrer
    const classifySource = (ref: string): string => {
      if (!ref) return 'Direct';
      if (ref.includes('google') || ref.includes('bing') || ref.includes('yahoo')) return 'Search';
      if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('linkedin') || ref.includes('instagram') || ref.includes('tiktok') || ref.includes('x.com') || ref.includes('t.co')) return 'Social';
      if (ref.includes('mail')) return 'Email';
      return 'Referral';
    };

    const source = classifySource(referrer);

    // Upsert session
    const { error: sessionError } = await supabase
      .from('visitor_sessions')
      .upsert({
        session_id: sessionId,
        visitor_id: visitorId,
        organization_id: organizationId || null,
        started_at: new Date(parseInt(sessionStart || Date.now().toString())).toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        page_count: pageCount,
        source: source,
        device_type: deviceType,
        country: 'US',
        bounced: bounced
      }, {
        onConflict: 'session_id'
      });

    if (sessionError) {
      logger.error('Error tracking session', sessionError, { context: 'page-tracking' });
    }
  } catch (error) {
    logger.error('Error in page tracking', error, { context: 'page-tracking' });
  }
};

/**
 * Hook to track page views and visitor sessions
 */
export const usePageTracking = (overrideOrganizationId?: string) => {
  const location = useLocation();
  const { organization } = useAuth();
  const lastTrackedPath = useRef<string>('');

  // Use override org ID (e.g. from apply page context) or fall back to auth org
  const effectiveOrgId = overrideOrganizationId || organization?.id;

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Only track if path has changed
    if (currentPath !== lastTrackedPath.current) {
      lastTrackedPath.current = currentPath;
      
      // Track the page view
      const pageTitle = document.title;
      trackPageView(currentPath, pageTitle, effectiveOrgId);
      
      // Also track in Google Analytics
      gaTrackPageView(currentPath, pageTitle);
    }
  }, [location.pathname, effectiveOrgId]);

  // Track session end on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const sessionId = sessionStorage.getItem('session_id');
      const sessionStart = sessionStorage.getItem('session_start');
      
      if (sessionId && sessionStart) {
        const durationSeconds = Math.floor((Date.now() - parseInt(sessionStart)) / 1000);
        
        try {
          // Update session on unload using supabase client
          await supabase
            .from('visitor_sessions')
            .update({
              ended_at: new Date().toISOString(),
              duration_seconds: durationSeconds
            })
            .eq('session_id', sessionId);
        } catch (error) {
          logger.error('Error tracking session end', error, { context: 'page-tracking' });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
};
