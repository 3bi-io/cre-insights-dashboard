/**
 * Meta Client Alias System (for CR England)
 * 
 * This system maps Meta ad account IDs to CR England client identifiers
 * for display purposes while using the actual account ID for API calls.
 * 
 * Note: The Meta API uses "account_id" as their field name - this is
 * third-party API terminology and does not refer to CR England "Clients".
 */

// Client alias mapping (Meta account IDs)
const ACCOUNT_ALIASES = {
  // Display ID -> Actual Data ID  
  '897639563274136': '1686173129171496'
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
 * Meta account data interface
 */
interface MetaAccountData {
  account_id: string;
  account_name?: string;
  [key: string]: unknown;
}

/**
 * Transform account data to use display IDs
 */
export const transformAccountDataForDisplay = <T extends MetaAccountData>(account: T): T => {
  if (!account) return account;
  
  return {
    ...account,
    account_id: getDisplayAccountId(account.account_id),
    // Update display name if it's the CR England account
    account_name: account.account_id === '1686173129171496' 
      ? 'cre-25-0801' 
      : account.account_name
  };
};

/**
 * Transform display data back to actual IDs for API calls
 */
export const transformAccountDataForAPI = <T extends MetaAccountData>(account: T): T => {
  if (!account) return account;
  
  return {
    ...account,
    account_id: getActualAccountId(account.account_id)
  };
};