import React, { useState, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntersectionObserver } from '@/utils/performance';

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  fallback?: string;
  skeleton?: boolean;
  threshold?: number;
  rootMargin?: string;
  quality?: 'low' | 'medium' | 'high';
  priority?: boolean;
  instant?: boolean;
}

const LazyImage = React.memo<LazyImageProps>(({
  src,
  alt,
  fallback = '/placeholder.svg',
  skeleton = true,
  threshold = 0.1,
  rootMargin = '50px',
  className,
  style,
  priority = false,
  quality = 'medium',
  instant = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);

  // Memoized intersection observer options
  const observerOptions = useMemo(() => ({
    threshold,
    rootMargin,
  }), [threshold, rootMargin]);

  // Intersection observer callback
  const handleIntersection = useCallback(() => {
    setShouldLoad(true);
  }, []);

  // Set up intersection observer
  const observerRef = useIntersectionObserver(
    handleIntersection,
    observerOptions
  );

  // Image load handlers
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsError(true);
    setIsLoaded(true);
  }, []);

  // Optimized image source with quality parameters
  const optimizedSrc = useMemo(() => {
    if (!shouldLoad) return '';
    
    // For local images or if quality optimization isn't needed
    if (src.startsWith('/') || src.startsWith('data:') || quality === 'high') {
      return src;
    }

    // Add quality parameters for external images if supported
    const url = new URL(src);
    const qualityMap = {
      low: '60',
      medium: '80',
      high: '95',
    };
    
    // Common image optimization parameters
    url.searchParams.set('q', qualityMap[quality]);
    url.searchParams.set('auto', 'format');
    
    return url.toString();
  }, [src, shouldLoad, quality]);

  // Determine what to display
  const imageSrc = isError ? fallback : optimizedSrc;
  const showSkeleton = skeleton && !isLoaded && shouldLoad;
  
  // Skip transition if instant mode or priority without skeleton
  const skipTransition = instant || (priority && !skeleton);
  const showImage = skipTransition || isLoaded;
  
  return (
    <div
      ref={!priority ? observerRef : undefined}
      className="relative overflow-hidden"
      style={{
        ...style,
        width: props.width,
        height: props.height,
      }}
    >
      {showSkeleton && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {shouldLoad && (
        <img
          {...props}
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`
            ${className || ''}
            ${skipTransition ? '' : 'motion-safe:transition-opacity motion-safe:duration-300'}
            ${showImage ? 'opacity-100' : 'opacity-0'}
          `}
          style={showSkeleton ? { position: 'absolute', inset: 0 } : undefined}
        />
      )}
      
      {!shouldLoad && skeleton && (
        <Skeleton className="w-full h-full" />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export { LazyImage };
export default LazyImage;