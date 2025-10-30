/**
 * Standardized React Query Keys
 * 
 * BEST PRACTICE: Centralize query keys to prevent cache inconsistencies
 * and make invalidation easier.
 * 
 * Usage:
 *   import { queryKeys } from '@/lib/queryKeys';
 *   
 *   useQuery({
 *     queryKey: queryKeys.organizations.detail(orgId),
 *     queryFn: () => fetchOrganization(orgId)
 *   });
 */

export const queryKeys = {
  // Organizations
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.organizations.lists(), filters] as const,
    details: () => [...queryKeys.organizations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizations.details(), id] as const,
    stats: (id: string) => [...queryKeys.organizations.all, 'stats', id] as const,
    platformAccess: (id: string) => [...queryKeys.organizations.all, 'platform-access', id] as const,
    features: (id: string) => [...queryKeys.organizations.all, 'features', id] as const,
    growth: () => [...queryKeys.organizations.all, 'growth'] as const,
    applications: (id: string, filters?: Record<string, any>) => 
      [...queryKeys.organizations.all, 'applications', id, filters] as const,
  },

  // Applications
  applications: {
    all: ['applications'] as const,
    lists: () => [...queryKeys.applications.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.applications.lists(), filters] as const,
    details: () => [...queryKeys.applications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.applications.details(), id] as const,
    basicData: (id: string) => [...queryKeys.applications.all, 'basic', id] as const,
    sensitiveData: (id: string) => [...queryKeys.applications.all, 'sensitive', id] as const,
    summary: (id: string) => [...queryKeys.applications.all, 'summary', id] as const,
    documents: (id: string) => [...queryKeys.applications.all, 'documents', id] as const,
    screeningRequests: (id: string) => [...queryKeys.applications.all, 'screening', id] as const,
    smsConversations: (id: string) => [...queryKeys.applications.all, 'sms', id] as const,
  },

  // Job Listings
  jobs: {
    all: ['jobs'] as const,
    lists: () => [...queryKeys.jobs.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.jobs.lists(), filters] as const,
    details: () => [...queryKeys.jobs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    analytics: (id: string) => [...queryKeys.jobs.all, 'analytics', id] as const,
    performance: () => [...queryKeys.jobs.all, 'performance'] as const,
  },

  // Users & Profiles
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    profile: (id: string) => [...queryKeys.users.all, 'profile', id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
  },

  // Platforms
  platforms: {
    all: ['platforms'] as const,
    lists: () => [...queryKeys.platforms.all, 'list'] as const,
    list: () => [...queryKeys.platforms.lists()] as const,
    details: () => [...queryKeys.platforms.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.platforms.details(), id] as const,
    analytics: (name: string) => [...queryKeys.platforms.all, 'analytics', name] as const,
    credentials: (name: string) => [...queryKeys.platforms.all, 'credentials', name] as const,
  },

  // Meta Platform
  meta: {
    all: ['meta'] as const,
    accounts: () => [...queryKeys.meta.all, 'accounts'] as const,
    campaigns: (accountId?: string) => [...queryKeys.meta.all, 'campaigns', accountId] as const,
    leads: (filters?: Record<string, any>) => [...queryKeys.meta.all, 'leads', filters] as const,
    spend: (filters?: Record<string, any>) => [...queryKeys.meta.all, 'spend', filters] as const,
    adSets: (campaignId: string) => [...queryKeys.meta.all, 'adsets', campaignId] as const,
  },

  // Tenstreet
  tenstreet: {
    all: ['tenstreet'] as const,
    credentials: () => [...queryKeys.tenstreet.all, 'credentials'] as const,
    mappings: () => [...queryKeys.tenstreet.all, 'mappings'] as const,
    sync: (applicationId: string) => [...queryKeys.tenstreet.all, 'sync', applicationId] as const,
  },

  // Analytics & Dashboard
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    metrics: () => [...queryKeys.analytics.all, 'metrics'] as const,
    spend: (filters?: Record<string, any>) => [...queryKeys.analytics.all, 'spend', filters] as const,
    platformBreakdown: () => [...queryKeys.analytics.all, 'platform-breakdown'] as const,
    funnel: () => [...queryKeys.analytics.all, 'funnel'] as const,
    teamActivity: () => [...queryKeys.analytics.all, 'team-activity'] as const,
  },

  // Webhooks
  webhooks: {
    all: ['webhooks'] as const,
    lists: () => [...queryKeys.webhooks.all, 'list'] as const,
    list: () => [...queryKeys.webhooks.lists()] as const,
    details: () => [...queryKeys.webhooks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.webhooks.details(), id] as const,
    logs: (id: string) => [...queryKeys.webhooks.all, 'logs', id] as const,
  },

  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: () => [...queryKeys.clients.lists()] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },

  // Recruiters
  recruiters: {
    all: ['recruiters'] as const,
    lists: () => [...queryKeys.recruiters.all, 'list'] as const,
    list: () => [...queryKeys.recruiters.lists()] as const,
    details: () => [...queryKeys.recruiters.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.recruiters.details(), id] as const,
  },

  // Chat
  chat: {
    all: ['chat'] as const,
    sessions: () => [...queryKeys.chat.all, 'sessions'] as const,
    session: (id: string) => [...queryKeys.chat.all, 'session', id] as const,
    messages: (sessionId: string) => [...queryKeys.chat.all, 'messages', sessionId] as const,
  },

  // System
  system: {
    all: ['system'] as const,
    health: () => [...queryKeys.system.all, 'health'] as const,
    activity: () => [...queryKeys.system.all, 'activity'] as const,
  },
} as const;

export default queryKeys;
