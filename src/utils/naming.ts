/**
 * Standardized Naming Conventions
 * Provides consistent naming patterns across the application
 */

/**
 * Converts string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * Converts string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
      return word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * Converts string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Converts string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Converts string to CONSTANT_CASE
 */
export function toConstantCase(str: string): string {
  return toSnakeCase(str).toUpperCase();
}

/**
 * Standard prefixes for different types of variables/functions
 */
export const PREFIXES = {
  // Boolean variables
  BOOLEAN: ['is', 'has', 'can', 'should', 'will', 'did'],
  
  // Event handlers
  HANDLERS: ['handle', 'on'],
  
  // Async functions
  ASYNC: ['fetch', 'load', 'save', 'create', 'update', 'delete', 'get', 'post', 'put', 'patch'],
  
  // Hook names
  HOOKS: ['use'],
  
  // Component names (should be PascalCase)
  COMPONENTS: [],
  
  // Constants
  CONSTANTS: []
} as const;

/**
 * Creates a standardized boolean variable name
 */
export function createBooleanName(baseName: string, prefix: 'is' | 'has' | 'can' | 'should' | 'will' | 'did' = 'is'): string {
  const camelCaseBase = toCamelCase(baseName);
  return `${prefix}${toPascalCase(camelCaseBase)}`;
}

/**
 * Creates a standardized handler function name
 */
export function createHandlerName(eventOrAction: string, prefix: 'handle' | 'on' = 'handle'): string {
  const camelCaseBase = toCamelCase(eventOrAction);
  return `${prefix}${toPascalCase(camelCaseBase)}`;
}

/**
 * Creates a standardized async function name
 */
export function createAsyncName(action: string, resource: string): string {
  const actionCamel = toCamelCase(action);
  const resourceCamel = toCamelCase(resource);
  return `${actionCamel}${toPascalCase(resourceCamel)}`;
}

/**
 * Creates a standardized hook name
 */
export function createHookName(functionality: string): string {
  const functionalityCamel = toCamelCase(functionality);
  return `use${toPascalCase(functionalityCamel)}`;
}

/**
 * Creates a standardized component name
 */
export function createComponentName(name: string): string {
  return toPascalCase(name);
}

/**
 * Creates a standardized constant name
 */
export function createConstantName(name: string): string {
  return toConstantCase(name);
}

/**
 * Standard naming patterns for different file types
 */
export const FILE_NAMING = {
  // Component files (PascalCase)
  COMPONENT: (name: string) => `${toPascalCase(name)}.tsx`,
  
  // Hook files (camelCase starting with 'use')
  HOOK: (name: string) => `${createHookName(name)}.tsx`,
  
  // Utility files (camelCase)
  UTIL: (name: string) => `${toCamelCase(name)}.ts`,
  
  // Type definition files (camelCase)
  TYPES: (name: string) => `${toCamelCase(name)}.types.ts`,
  
  // Test files
  TEST: (name: string) => `${toCamelCase(name)}.test.ts`,
  
  // Story files (for Storybook)
  STORY: (name: string) => `${toPascalCase(name)}.stories.tsx`,
  
  // Page files (PascalCase)
  PAGE: (name: string) => `${toPascalCase(name)}Page.tsx`,
  
  // API route files (kebab-case)
  API: (name: string) => `${toKebabCase(name)}.ts`,
  
  // Style files (kebab-case)
  STYLE: (name: string) => `${toKebabCase(name)}.css`
} as const;

/**
 * Standard directory naming patterns
 */
export const DIRECTORY_NAMING = {
  // Component directories (kebab-case)
  COMPONENTS: (name: string) => toKebabCase(name),
  
  // Feature directories (kebab-case)
  FEATURES: (name: string) => toKebabCase(name),
  
  // Page directories (kebab-case)
  PAGES: (name: string) => toKebabCase(name),
  
  // Hook directories (camelCase)
  HOOKS: (name: string) => toCamelCase(name),
  
  // Utility directories (camelCase)
  UTILS: (name: string) => toCamelCase(name)
} as const;

/**
 * Standard CSS class naming (BEM methodology)
 */
export const CSS_NAMING = {
  // Block class
  BLOCK: (block: string) => toKebabCase(block),
  
  // Element class
  ELEMENT: (block: string, element: string) => 
    `${toKebabCase(block)}__${toKebabCase(element)}`,
  
  // Modifier class
  MODIFIER: (block: string, modifier: string) => 
    `${toKebabCase(block)}--${toKebabCase(modifier)}`,
  
  // Element with modifier
  ELEMENT_MODIFIER: (block: string, element: string, modifier: string) =>
    `${toKebabCase(block)}__${toKebabCase(element)}--${toKebabCase(modifier)}`
} as const;

/**
 * Standard API naming patterns
 */
export const API_NAMING = {
  // Endpoint names (kebab-case)
  ENDPOINT: (resource: string, action?: string) => {
    const resourceKebab = toKebabCase(resource);
    return action ? `${resourceKebab}/${toKebabCase(action)}` : resourceKebab;
  },
  
  // Query parameter names (snake_case for consistency with databases)
  QUERY_PARAM: (name: string) => toSnakeCase(name),
  
  // HTTP header names (kebab-case)
  HEADER: (name: string) => toKebabCase(name)
} as const;

/**
 * Standard database naming patterns
 */
export const DATABASE_NAMING = {
  // Table names (snake_case)
  TABLE: (name: string) => toSnakeCase(name),
  
  // Column names (snake_case)
  COLUMN: (name: string) => toSnakeCase(name),
  
  // Index names
  INDEX: (table: string, columns: string[]) => 
    `idx_${toSnakeCase(table)}_${columns.map(toSnakeCase).join('_')}`,
  
  // Foreign key names
  FOREIGN_KEY: (fromTable: string, toTable: string) =>
    `fk_${toSnakeCase(fromTable)}_${toSnakeCase(toTable)}`,
  
  // Constraint names
  CONSTRAINT: (table: string, type: string, columns: string[]) =>
    `${type}_${toSnakeCase(table)}_${columns.map(toSnakeCase).join('_')}`
} as const;

/**
 * Validates if a name follows the correct convention
 */
export const VALIDATORS = {
  isCamelCase: (str: string): boolean => /^[a-z][a-zA-Z0-9]*$/.test(str),
  isPascalCase: (str: string): boolean => /^[A-Z][a-zA-Z0-9]*$/.test(str),
  isKebabCase: (str: string): boolean => /^[a-z]+(?:-[a-z0-9]+)*$/.test(str),
  isSnakeCase: (str: string): boolean => /^[a-z]+(?:_[a-z0-9]+)*$/.test(str),
  isConstantCase: (str: string): boolean => /^[A-Z]+(?:_[A-Z0-9]+)*$/.test(str),
  
  // Component-specific validators
  isValidComponentName: (str: string): boolean => VALIDATORS.isPascalCase(str),
  isValidHookName: (str: string): boolean => /^use[A-Z][a-zA-Z0-9]*$/.test(str),
  isValidHandlerName: (str: string): boolean => /^(handle|on)[A-Z][a-zA-Z0-9]*$/.test(str),
  isValidBooleanName: (str: string): boolean => /^(is|has|can|should|will|did)[A-Z][a-zA-Z0-9]*$/.test(str)
} as const;