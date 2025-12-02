// Shared feature architecture exports
export * from './types/feature.types';
export * from './services/BaseFeatureService';
export * from './hooks/useFeatureState';
export * from './hooks/useFeatureService';
export * from './components/FeatureProvider';
export * from './utils/featureValidation';

// Admin page layout components
export { default as AdminPageLayout, AdminLoadingSkeleton as AdminPageLoadingSkeleton } from './components/AdminPageLayout';
export { default as RoleGuard } from './components/RoleGuard';
export { default as AdminLoadingSkeleton, TableSkeleton } from './components/AdminLoadingSkeleton';

// Re-export existing components
export { default as PageLayout } from '@/components/PageLayout';
export { FeatureGuard } from '@/components/FeatureGuard';
export { default as Footer } from '@/components/Footer';
export { default as ProtectedRoute } from '@/components/ProtectedRoute';