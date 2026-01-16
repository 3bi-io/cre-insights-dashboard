/**
 * Performance Optimization Utilities
 * Phase 11: Post-Launch & Scaling
 */

import { logger } from '@/lib/logger';

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

// Lazy loading helper for components
export function lazyLoad<T>(
  factory: () => Promise<{ default: T }>,
  delay: number = 0
): () => Promise<{ default: T }> {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        factory().then(resolve);
      }, delay);
    });
}

// Request idle callback polyfill
export const requestIdleCallbackPolyfill =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);

// Cancel idle callback polyfill
export const cancelIdleCallbackPolyfill =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);

// Batch processor for efficient bulk operations
export class BatchProcessor<T> {
  private queue: T[] = [];
  private processing = false;
  private batchSize: number;
  private delay: number;
  private processor: (items: T[]) => Promise<void>;

  constructor(
    processor: (items: T[]) => Promise<void>,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(item: T): void {
    this.queue.push(item);
    this.scheduleBatch();
  }

  addMany(items: T[]): void {
    this.queue.push(...items);
    this.scheduleBatch();
  }

  private scheduleBatch(): void {
    if (this.processing) return;
    setTimeout(() => this.processBatch(), this.delay);
  }

  private async processBatch(): Promise<void> {
    if (this.queue.length === 0 || this.processing) return;

    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await this.processor(batch);
    } catch (error) {
      logger.error('Error processing batch', error);
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
  overscan?: number;
}

export function calculateVisibleRange(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
): { start: number; end: number; offset: number } {
  const { itemHeight, containerHeight, overscan = 3 } = options;

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + 2 * overscan);

  return {
    start,
    end,
    offset: start * itemHeight,
  };
}

// Resource preloading
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}

// Connection-aware loading
export function getConnectionQuality(): 'slow' | 'medium' | 'fast' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'medium';
  }

  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType;

  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'slow';
    case '3g':
      return 'medium';
    case '4g':
    default:
      return 'fast';
  }
}

// Memory-efficient data processing
export function* chunkedIterator<T>(
  array: T[],
  chunkSize: number
): Generator<T[], void, unknown> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number | null {
    const start = this.marks.get(startMark);
    if (start === undefined) return null;

    const duration = performance.now() - start;
    logger.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}

// Intersection observer helper
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// Resize observer helper
export function createResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void
): ResizeObserver | null {
  if (typeof ResizeObserver === 'undefined') {
    return null;
  }

  return new ResizeObserver(callback);
}

// Animation frame helper
export function scheduleAnimation(callback: () => void): number {
  return requestAnimationFrame(callback);
}

export function cancelAnimation(id: number): void {
  cancelAnimationFrame(id);
}

// Efficient DOM updates
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

// Memory cleanup helper
export function cleanupResources(
  observers: (IntersectionObserver | ResizeObserver | null)[],
  timeouts: (NodeJS.Timeout | null)[],
  intervals: (NodeJS.Timeout | null)[]
): void {
  observers.forEach((observer) => observer?.disconnect());
  timeouts.forEach((timeout) => timeout && clearTimeout(timeout));
  intervals.forEach((interval) => interval && clearInterval(interval));
}
