/**
 * Performance Optimization Utilities
 * Phase 11: Post-Launch & Scaling
 */

// Debounce function for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll/resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoization helper
export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

// Image lazy loading helper
export const lazyLoadImage = (
  img: HTMLImageElement,
  src: string,
  placeholder?: string
) => {
  if (placeholder) {
    img.src = placeholder;
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });

    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src;
  }
};

// Batch API calls
export class BatchProcessor<T> {
  private queue: T[] = [];
  private processing = false;
  private batchSize: number;
  private delay: number;
  private processor: (batch: T[]) => Promise<void>;

  constructor(
    processor: (batch: T[]) => Promise<void>,
    batchSize = 10,
    delay = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(item: T): void {
    this.queue.push(item);
    this.scheduleBatch();
  }

  private scheduleBatch(): void {
    if (this.processing) return;

    setTimeout(() => {
      this.processBatch();
    }, this.delay);
  }

  private async processBatch(): Promise<void> {
    if (this.queue.length === 0 || this.processing) return;

    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await this.processor(batch);
    } catch (error) {
      console.error('Error processing batch:', error);
      // Re-add failed items to queue
      this.queue.unshift(...batch);
    } finally {
      this.processing = false;

      // Process next batch if queue is not empty
      if (this.queue.length > 0) {
        this.scheduleBatch();
      }
    }
  }
}

// Virtual scrolling helper
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  buffer?: number;
}

export function calculateVisibleRange(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
): { start: number; end: number } {
  const { itemHeight, containerHeight, buffer = 5 } = options;

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + buffer * 2);

  return { start, end };
}

// Request idle callback helper
export function runWhenIdle(callback: () => void, timeout = 1000): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 0);
  }
}

// Web Worker helper
export function createWorker(workerFunction: Function): Worker {
  const blob = new Blob([`(${workerFunction.toString()})()`], {
    type: 'application/javascript',
  });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

// Preload critical resources
export function preloadResource(url: string, as: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
}

// Prefetch next page
export function prefetchPage(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

// Connection quality detection
export function getConnectionQuality(): 'slow' | 'medium' | 'fast' {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;

    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'slow';
    } else if (effectiveType === '3g') {
      return 'medium';
    }
  }

  return 'fast';
}

// Adaptive loading based on connection
export function shouldLoadHighQuality(): boolean {
  const quality = getConnectionQuality();
  return quality === 'fast';
}

// Memory usage tracking
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }

  return null;
}

// Cache management
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxAge: number;

  constructor(maxAge = 5 * 60 * 1000) {
    // Default 5 minutes
    this.maxAge = maxAge;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    const age = Date.now() - cached.timestamp;

    if (age > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton cache instance
export const globalCache = new CacheManager();
