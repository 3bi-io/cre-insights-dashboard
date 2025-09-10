/**
 * Meta Account ID Alias System
 * 
 * This system allows displaying an alias account ID to users while
 * using the actual account ID for data fetching behind the scenes.
 */

// Account alias mapping
const ACCOUNT_ALIASES = {
  // Display ID -> Actual Data ID  
  '897639563274136': '435031743763874'
} as const;

// Reverse mapping for lookups
const REVERSE_ALIASES = Object.fromEntries(
  Object.entries(ACCOUNT_ALIASES).map(([alias, actual]) => [actual, alias])
);

/**
 * Get the actual account ID to use for API calls
 */
export const getActualAccountId = (displayAccountId: string): string => {
  return ACCOUNT_ALIASES[displayAccountId as keyof typeof ACCOUNT_ALIASES] || displayAccountId;
};

/**
 * Get the display account ID to show in the UI
 */
export const getDisplayAccountId = (actualAccountId: string): string => {
  return REVERSE_ALIASES[actualAccountId] || actualAccountId;
};

/**
 * Check if an account ID is an alias
 */
export const isAliasAccount = (accountId: string): boolean => {
  return accountId in ACCOUNT_ALIASES;
};

/**
 * Transform account data to use display IDs
 */
export const transformAccountDataForDisplay = (account: any): any => {
  if (!account) return account;
  
  return {
    ...account,
    account_id: getDisplayAccountId(account.account_id),
    // Update display name if it's the CR England account
    account_name: account.account_id === '435031743763874' 
      ? 'cre-25-0601' 
      : account.account_name
  };
};

/**
 * Transform display data back to actual IDs for API calls
 */
export const transformAccountDataForAPI = (account: any): any => {
  if (!account) return account;
  
  return {
    ...account,
    account_id: getActualAccountId(account.account_id)
  };
};