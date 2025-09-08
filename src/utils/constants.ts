/**
 * Standardized Constants
 * All application constants with consistent naming
 */

import { createConstantName } from './naming';

// === API CONSTANTS ===
export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  ORGANIZATIONS: '/organizations', 
  APPLICATIONS: '/applications',
  JOBS: '/jobs',
  PLATFORMS: '/platforms',
  ANALYTICS: '/analytics',
  META_INTEGRATION: '/meta-integration',
  INDEED_INTEGRATION: '/indeed-integration',
  TENSTREET_INTEGRATION: '/tenstreet-integration'
} as const;

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

export const REQUEST_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const;

// === UI CONSTANTS ===
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1400
} as const;

export const Z_INDEX_LAYERS = {
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000
} as const;

// === PAGINATION CONSTANTS ===
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  INITIAL_PAGE: 1,
  MAX_PAGE_SIZE: 100,
  PAGINATION_SIZES: [10, 20, 50, 100]
} as const;

// === VALIDATION CONSTANTS ===
export const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 100,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 254,
  MAX_PHONE_LENGTH: 20,
  MAX_TEXT_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILES_COUNT: 5
} as const;

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
} as const;

// === APPLICATION STATUS ===
export const APPLICATION_STATUSES = {
  NEW: 'new',
  REVIEWING: 'reviewing', 
  INTERVIEWED: 'interviewed',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
} as const;

export const JOB_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
  ARCHIVED: 'archived'
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager', 
  RECRUITER: 'recruiter',
  USER: 'user'
} as const;

// === PLATFORM CONSTANTS ===
export const PLATFORMS = {
  META: 'meta',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram', 
  INDEED: 'indeed',
  GOOGLE_JOBS: 'google_jobs',
  ZIPRECRUITER: 'ziprecruiter',
  TALROO: 'talroo',
  TWITTER: 'twitter'
} as const;

export const INTEGRATION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  PENDING: 'pending'
} as const;

// === NOTIFICATION TYPES ===
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info'
} as const;

export const NOTIFICATION_POSITIONS = {
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  TOP_CENTER: 'top-center',
  BOTTOM_CENTER: 'bottom-center'
} as const;

// === STORAGE KEYS ===
export const STORAGE_KEYS = {
  AUTH_TOKEN: createConstantName('auth_token'),
  USER_PREFERENCES: createConstantName('user_preferences'),
  THEME: createConstantName('ui_theme'),
  LANGUAGE: createConstantName('language'),
  LAST_ROUTE: createConstantName('last_route'),
  DASHBOARD_FILTERS: createConstantName('dashboard_filters'),
  TABLE_SETTINGS: createConstantName('table_settings')
} as const;

// === DATE/TIME CONSTANTS ===
export const DATE_FORMATS = {
  SHORT: 'MMM d',
  MEDIUM: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  FULL: 'EEEE, MMMM d, yyyy',
  TIME: 'h:mm a',
  DATETIME: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
} as const;

export const TIME_INTERVALS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
} as const;

// === FEATURE FLAGS ===
export const FEATURE_FLAGS = {
  ENABLE_AI_ANALYTICS: createConstantName('enable_ai_analytics'),
  ENABLE_VOICE_AGENT: createConstantName('enable_voice_agent'),
  ENABLE_ADVANCED_FILTERS: createConstantName('enable_advanced_filters'),
  ENABLE_BULK_ACTIONS: createConstantName('enable_bulk_actions'),
  ENABLE_REAL_TIME_UPDATES: createConstantName('enable_real_time_updates'),
  ENABLE_PERFORMANCE_MONITORING: createConstantName('enable_performance_monitoring')
} as const;

// === QUERY KEYS (for React Query) ===
export const QUERY_KEYS = {
  APPLICATIONS: 'applications',
  JOBS: 'jobs',
  ORGANIZATIONS: 'organizations',
  PLATFORMS: 'platforms',
  ANALYTICS: 'analytics',
  USER_PROFILE: 'user-profile',
  DASHBOARD_STATS: 'dashboard-stats',
  META_SPEND: 'meta-spend',
  INDEED_DATA: 'indeed-data'
} as const;

// === ERROR CODES ===
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Authorization errors  
  ACCESS_DENIED: 'ACCESS_DENIED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
} as const;

// === FILE TYPES ===
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEETS: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
} as const;

// Type exports for better TypeScript support
export type ApiEndpoint = keyof typeof API_ENDPOINTS;
export type HttpStatusCode = typeof HTTP_STATUS_CODES[keyof typeof HTTP_STATUS_CODES]; 
export type ApplicationStatus = typeof APPLICATION_STATUSES[keyof typeof APPLICATION_STATUSES];
export type JobStatus = typeof JOB_STATUSES[keyof typeof JOB_STATUSES];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS];
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];