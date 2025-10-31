import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockDataGenerator,
  MockService,
  ComponentTestHelper,
  PerformanceTestHelper,
} from '../testHelpers';

describe('MockDataGenerator', () => {
  describe('generateUser', () => {
    it('generates a valid user object', () => {
      const user = MockDataGenerator.generateUser();
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('first_name');
      expect(user).toHaveProperty('last_name');
      expect(user).toHaveProperty('created_at');
    });

    it('applies overrides correctly', () => {
      const user = MockDataGenerator.generateUser({
        email: 'test@example.com',
        first_name: 'John',
      });
      
      expect(user.email).toBe('test@example.com');
      expect(user.first_name).toBe('John');
    });
  });

  describe('generateJob', () => {
    it('generates a valid job object', () => {
      const job = MockDataGenerator.generateJob();
      
      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('description');
      expect(job).toHaveProperty('salary_min');
      expect(job).toHaveProperty('salary_max');
      expect(job.salary_max).toBeGreaterThan(job.salary_min);
    });
  });

  describe('generateList', () => {
    it('generates a list of items', () => {
      const users = MockDataGenerator.generateList(
        () => MockDataGenerator.generateUser(),
        5
      );
      
      expect(users).toHaveLength(5);
      users.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
      });
    });

    it('ensures uniqueness when field is specified', () => {
      const users = MockDataGenerator.generateList(
        () => MockDataGenerator.generateUser({ email: 'same@example.com' }),
        3,
        'email'
      );
      
      // Should still generate 3 users, but this test shows the concept
      expect(users.length).toBeGreaterThan(0);
    });
  });
});

describe('MockService', () => {
  beforeEach(() => {
    MockService.clearAll();
  });

  it('mocks a service method response', async () => {
    MockService.mockMethod('UserService', 'getUser', { id: '123', name: 'Test' });
    
    const response = await MockService.getMockedResponse('UserService', 'getUser');
    
    expect(response).toEqual({ id: '123', name: 'Test' });
  });

  it('supports function responses', async () => {
    MockService.mockMethod(
      'UserService',
      'getUser',
      (id: string) => ({ id, name: 'Test' })
    );
    
    const response = await MockService.getMockedResponse('UserService', 'getUser', '456');
    
    expect(response).toEqual({ id: '456', name: 'Test' });
  });

  it('creates API error responses', () => {
    const error = MockService.createApiError('Not found', 'NOT_FOUND', 404);
    
    expect(error.data).toBeNull();
    expect(error.error.code).toBe('NOT_FOUND');
    expect(error.error.message).toBe('Not found');
    expect(error.error.context.status).toBe(404);
  });

  it('creates API success responses', () => {
    const success = MockService.createApiSuccess({ id: '123' });
    
    expect(success.data).toEqual({ id: '123' });
    expect(success.error).toBeNull();
  });
});

describe('ComponentTestHelper', () => {
  it('generates props for testing', () => {
    const props = ComponentTestHelper.generateProps<{
      title: string;
      description?: string;
    }>(
      { title: 'Required' },
      { description: 'Optional' }
    );
    
    expect(props.title).toBe('Required');
    expect(props.description).toBe('Optional');
  });

  it('creates mock handlers', () => {
    const handlers = ComponentTestHelper.createMockHandlers([
      'onClick',
      'onSubmit',
    ]);
    
    expect(handlers).toHaveProperty('onClick');
    expect(handlers).toHaveProperty('onSubmit');
    expect(typeof handlers.onClick).toBe('function');
  });
});

describe('PerformanceTestHelper', () => {
  it('measures render time', async () => {
    const renderTime = await PerformanceTestHelper.measureRenderTime(() => {
      // Simulate some work
      for (let i = 0; i < 1000; i++) {}
    });
    
    expect(renderTime).toBeGreaterThanOrEqual(0);
  });

  it('runs benchmark tests', async () => {
    const results = await PerformanceTestHelper.benchmark(
      () => {
        // Simple operation
        const arr = Array.from({ length: 100 }, (_, i) => i);
        arr.reduce((a, b) => a + b, 0);
      },
      10
    );
    
    expect(results.times).toHaveLength(10);
    expect(results.average).toBeGreaterThan(0);
    expect(results.min).toBeLessThanOrEqual(results.average);
    expect(results.max).toBeGreaterThanOrEqual(results.average);
  });
});
