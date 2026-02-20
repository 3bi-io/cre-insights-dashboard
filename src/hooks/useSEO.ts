/**
 * SEO Hook
 * Programmatic SEO updates and utilities
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { shouldIndexUrl } from '@/utils/seoUtils';

interface UseSEOOptions {
  onRouteChange?: (path: string) => void;
}

/**
 * Hook for SEO management
 */
export function useSEO(options: UseSEOOptions = {}) {
  const location = useLocation();

  useEffect(() => {
    // Update canonical link on route change
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', `https://apply.jobs${location.pathname}`);
    }

    // Check if page should be indexed
    const shouldIndex = shouldIndexUrl(location.pathname);
    const robotsMeta = document.querySelector('meta[name="robots"]');
    
    if (!shouldIndex) {
      if (!robotsMeta) {
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow';
        document.head.appendChild(meta);
      }
    } else if (robotsMeta) {
      robotsMeta.remove();
    }

    // Call custom handler
    options.onRouteChange?.(location.pathname);
  }, [location.pathname, options]);

  return {
    currentPath: location.pathname,
    shouldIndex: shouldIndexUrl(location.pathname),
  };
}

/**
 * Hook for preloading critical resources
 */
export function usePreloadResources(resources: Array<{ href: string; as: string; type?: string }>) {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];

    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) {
        link.type = resource.type;
      }
      document.head.appendChild(link);
      links.push(link);
    });

    return () => {
      links.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [resources]);
}
