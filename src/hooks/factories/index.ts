/**
 * Hook Factories
 * Generic, reusable hook creation utilities
 */

export {
  createQueryHook,
  createOrgScopedQueryHook,
  createAuthQueryHook,
  type QueryConfig,
} from './useGenericQuery';

export {
  createMutationHook,
  createCRUDMutations,
  createOptimisticMutationHook,
  type MutationConfig,
} from './useGenericMutation';
