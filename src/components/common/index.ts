/**
 * Standardized Common Components
 * Export all reusable, standardized components from here
 */

// Base components with consistent patterns
export { StandardButton, standardButtonVariants } from './StandardButton';
export type { StandardButtonProps } from './StandardButton';

export {
  StandardCard,
  StandardCardHeader,
  StandardCardTitle,
  StandardCardDescription, 
  StandardCardContent,
  StandardCardFooter,
  standardCardVariants
} from './StandardCard';
export type { StandardCardProps } from './StandardCard';

// New reusable components
export { Brand } from './Brand';
export { Header } from './Header';

// Re-export optimized components for convenience
export { OptimizedDataTable } from '../optimized/OptimizedDataTable';
export { LazyImage } from '../optimized/LazyImage';
export { MemoizedCard } from '../optimized/MemoizedCard';