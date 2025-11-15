// Hooks barrel export
export { usePlatformAccess } from './usePlatformAccess';

// Security & Audit Hooks
export { 
  useAuditedApplicationAccess,
  AUDIT_REASONS,
  type ApplicationAccessOptions,
  type ApplicationListOptions,
  type ApplicationUpdateOptions
} from './useAuditedApplicationAccess';

export { 
  useSecureApplicationData,
  type BasicApplicationData,
  type SensitiveApplicationData,
  type ApplicationSummary
} from './useSecureApplicationData';