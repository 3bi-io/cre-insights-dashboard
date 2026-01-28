// Social Engagement Feature Module

// Pages
export * from './pages/SocialEngagementDashboard';
export * from './pages/SuperAdminSocialBeacons';

// User-facing components
export * from './components/InteractionQueue';
export * from './components/PlatformConnectionCard';
export * from './components/SocialOAuthDialog';
export * from './components/EngagementMetrics';
export * from './components/RealTimeFeed';
export * from './components/ResponseTemplates';
export * from './components/QuickStats';
export * from './components/PlatformOverview';

// Admin components
export * from './components/admin/PlatformCredentialsManager';
export * from './components/admin/PlatformCredentialCard';
export * from './components/admin/AdCreativeStudio';
export * from './components/admin/AdPreviewCard';
export * from './components/admin/BenefitToggle';
export * from './components/admin/GlobalSettingsPanel';
export * from './components/admin/OAuthConfigPanel';
export * from './components/admin/SocialAnalyticsPanel';

// Hooks
export * from './hooks/useSocialInteractions';
export * from './hooks/useSocialConnections';
export * from './hooks/useSocialOAuth';
export * from './hooks/useSocialBeaconConfig';
export * from './hooks/useSocialBeaconSettings';
export * from './hooks/useAdCreative';

// Config & Types
export * from './config/socialBeacons.config';
export * from './types/adCreative.types';
