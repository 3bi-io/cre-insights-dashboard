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
  // Early return for priority + instant images - skip all lazy loading complexity
  if (priority && instant) {
    return (
      <img
        {...props}
        src={src}
        alt={alt}
        loading="eager"
        decoding="sync"
        className={className}
        style={style}
        onError={(e) => {
          e.currentTarget.src = fallback;
        }}
      />
    );
  }

  const [isLoaded, setIsLoaded] = useState(priority);
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

  // Use src directly for local images, skip quality optimization for external
  const optimizedSrc = useMemo(() => {
    if (!shouldLoad) return '';
    return src;
  }, [src, shouldLoad]);

  // Determine what to display
  const imageSrc = isError ? fallback : optimizedSrc;
  const showSkeleton = skeleton && !isLoaded && shouldLoad;
  const showImage = instant || isLoaded;
  
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
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            ${className || ''}
            ${instant ? '' : 'motion-safe:transition-opacity motion-safe:duration-300'}
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