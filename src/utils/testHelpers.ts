/**
 * Testing Utilities & Helpers
 * Provides utilities for testing components, mocking services, and test data generation
 */

import { faker } from '@faker-js/faker';

/**
 * Mock data generators for testing
 */
export class MockDataGenerator {
  /**
   * Generate mock user data
   */
  static generateUser(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      phone: faker.phone.number(),
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate mock job data
   */
  static generateJob(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      organization_id: faker.string.uuid(),
      title: faker.person.jobTitle(),
      description: faker.lorem.paragraphs(3),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      salary_min: faker.number.int({ min: 40000, max: 80000 }),
      salary_max: faker.number.int({ min: 80000, max: 150000 }),
      employment_type: faker.helpers.arrayElement(['full_time', 'part_time', 'contract', 'temporary']),
      status: faker.helpers.arrayElement(['active', 'inactive', 'pending', 'archived']),
      requirements: faker.helpers.arrayElements([
        'Valid driver\'s license',
        'Clean driving record',
        'CDL certification',
        '2+ years experience',
        'Physical fitness'
      ], { min: 2, max: 4 }),
      benefits: faker.helpers.arrayElements([
        'Health insurance',
        '401k matching',
        'Paid time off',
        'Dental coverage',
        'Vision coverage'
      ], { min: 2, max: 5 }),
      remote_allowed: faker.datatype.boolean(),
      experience_level: faker.helpers.arrayElement(['entry', 'mid', 'senior', 'executive']),
      posted_at: faker.date.past().toISOString(),
      expires_at: faker.date.future().toISOString(),
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate mock application data
   */
  static generateApplication(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      organization_id: faker.string.uuid(),
      job_id: faker.string.uuid(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip_code: faker.location.zipCode(),
      experience_years: faker.number.int({ min: 0, max: 20 }),
      cdl_license: faker.datatype.boolean(),
      veteran_status: faker.datatype.boolean(),
      resume_url: faker.internet.url(),
      cover_letter: faker.lorem.paragraphs(2),
      status: faker.helpers.arrayElement(['pending', 'reviewed', 'interviewing', 'hired', 'rejected']),
      applied_at: faker.date.past().toISOString(),
      reviewed_at: faker.helpers.maybe(() => faker.date.recent().toISOString(), { probability: 0.6 }),
      notes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.4 }),
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate mock organization data
   */
  static generateOrganization(overrides?: Partial<any>) {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      slug: faker.helpers.slugify(faker.company.name()),
      description: faker.company.catchPhrase(),
      website: faker.internet.url(),
      logo_url: faker.image.avatar(),
      industry: faker.helpers.arrayElement(['Transportation', 'Logistics', 'Manufacturing', 'Retail']),
      size: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate a list of mock data
   */
  static generateList<T>(
    generator: () => T,
    count: number = 10,
    uniqueField?: keyof T
  ): T[] {
    const items: T[] = [];
    const seen = new Set();

    while (items.length < count) {
      const item = generator();
      
      if (uniqueField) {
        const fieldValue = item[uniqueField];
        if (seen.has(fieldValue)) continue;
        seen.add(fieldValue);
      }
      
      items.push(item);
    }
    
    return items;
  }
}

/**
 * Service mocking utilities
 */
export class MockService {
  private static responses = new Map<string, any>();
  private static delays = new Map<string, number>();

  /**
   * Mock a service method with specific response
   */
  static mockMethod(serviceName: string, methodName: string, response: any, delay = 0) {
    const key = `${serviceName}.${methodName}`;
    this.responses.set(key, response);
    this.delays.set(key, delay);
  }

  /**
   * Get mocked response for a service method
   */
  static async getMockedResponse(serviceName: string, methodName: string, ...args: any[]) {
    const key = `${serviceName}.${methodName}`;
    const response = this.responses.get(key);
    const delay = this.delays.get(key) || 0;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (response instanceof Function) {
      return response(...args);
    }

    return response;
  }

  /**
   * Clear all mocked responses
   */
  static clearAll() {
    this.responses.clear();
    this.delays.clear();
  }

  /**
   * Create a mock API error
   */
  static createApiError(message: string, code = 'API_ERROR', status = 400) {
    return {
      data: null,
      error: {
        code,
        message,
        feature: 'test',
        context: { status },
        timestamp: new Date()
      }
    };
  }

  /**
   * Create a successful API response
   */
  static createApiSuccess<T>(data: T) {
    return {
      data,
      error: null
    };
  }
}

/**
 * Component testing utilities
 */
export class ComponentTestHelper {
  /**
   * Generate props for testing a component
   */
  static generateProps<T extends Record<string, any>>(
    requiredProps: Partial<T>,
    optionalProps?: Partial<T>
  ): T {
    return {
      ...optionalProps,
      ...requiredProps
    } as T;
  }

  /**
   * Create mock event handlers
   */
  static createMockHandlers(handlerNames: string[]) {
    return handlerNames.reduce((handlers, name) => {
      // Create mock function based on available test framework
      if (typeof globalThis !== 'undefined') {
        const global = globalThis as any;
        if (global.jest && global.jest.fn) {
          handlers[name] = global.jest.fn();
        } else if (global.vi && global.vi.fn) {
          handlers[name] = global.vi.fn();
        } else {
          // Fallback mock function
          handlers[name] = () => {};
        }
      } else {
        handlers[name] = () => {};
      }
      return handlers;
    }, {} as Record<string, any>);
  }

  /**
   * Simulate user interactions
   */
  static async simulateUserInteraction(
    element: HTMLElement,
    interaction: 'click' | 'input' | 'focus' | 'blur',
    value?: string
  ) {
    switch (interaction) {
      case 'click':
        element.click();
        break;
      case 'input':
        if (element instanceof HTMLInputElement && value !== undefined) {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        break;
      case 'focus':
        element.focus();
        break;
      case 'blur':
        element.blur();
        break;
    }

    // Wait for any async updates
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Wait for condition to be met
   */
  static async waitForCondition(
    condition: () => boolean,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (!condition() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestHelper {
  /**
   * Measure render time of a component
   */
  static async measureRenderTime(renderFn: () => void): Promise<number> {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    return endTime - startTime;
  }

  /**
   * Run performance benchmark
   */
  static async benchmark(
    fn: () => void | Promise<void>,
    iterations = 100
  ): Promise<{
    average: number;
    min: number;
    max: number;
    median: number;
    times: number[];
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    times.sort((a, b) => a - b);
    
    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: times[0],
      max: times[times.length - 1],
      median: times[Math.floor(times.length / 2)],
      times
    };
  }

  /**
   * Simulate slow network conditions
   */
  static async simulateSlowNetwork<T>(
    fn: () => Promise<T>,
    delayMs = 1000
  ): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return fn();
  }
}

/**
 * Test data presets
 */
export const TestDataPresets = {
  // Realistic test scenarios
  scenarios: {
    newUser: () => MockDataGenerator.generateUser({ created_at: new Date().toISOString() }),
    activeJob: () => MockDataGenerator.generateJob({ status: 'active' }),
    pendingApplication: () => MockDataGenerator.generateApplication({ status: 'pending' }),
    rejectedApplication: () => MockDataGenerator.generateApplication({ status: 'rejected' }),
    
    // Edge cases
    longJobTitle: () => MockDataGenerator.generateJob({ 
      title: 'Senior Executive Vice President of Advanced Transportation Solutions and Logistics Management' 
    }),
    emptyRequirements: () => MockDataGenerator.generateJob({ requirements: [] }),
    maxSalaryRange: () => MockDataGenerator.generateJob({ 
      salary_min: 200000, 
      salary_max: 500000 
    })
  },

  // Common test data sets
  dataSets: {
    smallJobList: () => MockDataGenerator.generateList(() => MockDataGenerator.generateJob(), 5),
    largeJobList: () => MockDataGenerator.generateList(() => MockDataGenerator.generateJob(), 100),
    mixedStatusApplications: () => [
      MockDataGenerator.generateApplication({ status: 'pending' }),
      MockDataGenerator.generateApplication({ status: 'reviewed' }),
      MockDataGenerator.generateApplication({ status: 'interviewing' }),
      MockDataGenerator.generateApplication({ status: 'hired' }),
      MockDataGenerator.generateApplication({ status: 'rejected' })
    ]
  }
};

// Export faker for direct use in tests
export { faker };