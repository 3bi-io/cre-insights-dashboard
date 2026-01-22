/**
 * @deprecated This file is deprecated. Import from cors-config.ts instead.
 * 
 * This file re-exports from cors-config.ts for backwards compatibility.
 * All edge functions should migrate to importing from cors-config.ts directly.
 */

export { 
  getCorsHeaders, 
  corsHeaders,
  ALLOWED_ORIGINS,
  isLovablePreview,
  isOriginAllowed,
  createPreflightResponse,
  handleCorsPreflightIfNeeded
} from './cors-config.ts';
