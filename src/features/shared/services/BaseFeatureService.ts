import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/loggerService';
import { FeatureError, ApiResponse, PaginatedResponse, FilterOptions } from '../types/feature.types';

export abstract class BaseFeatureService {
  protected tableName: string;
  protected featureName: string;

  constructor(tableName: string, featureName: string) {
    this.tableName = tableName;
    this.featureName = featureName;
  }

  protected createError(code: string, message: string, context?: Record<string, any>): FeatureError {
    return {
      code,
      message,
      feature: this.featureName,
      context,
      timestamp: new Date()
    };
  }

  protected async handleApiCall<T>(
    operation: () => Promise<any>,
    operationName: string
  ): Promise<ApiResponse<T>> {
    try {
      logger.info(`${this.featureName}: Starting ${operationName}`, { tableName: this.tableName });
      
      const result = await operation();
      
      if (result.error) {
        const error = this.createError(
          'API_ERROR',
          result.error.message,
          { operation: operationName, originalError: result.error }
        );
        
        logger.error(`${this.featureName}: ${operationName} failed`, error);
        return { data: null, error };
      }

      logger.info(`${this.featureName}: ${operationName} succeeded`, { 
        dataLength: Array.isArray(result.data) ? result.data.length : 1 
      });
      
      return { data: result.data, error: null };
    } catch (error) {
      const featureError = this.createError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Unknown network error',
        { operation: operationName }
      );
      
      logger.error(`${this.featureName}: ${operationName} network error`, featureError);
      return { data: null, error: featureError };
    }
  }

  protected async getAll<T>(filters?: FilterOptions): Promise<ApiResponse<PaginatedResponse<T>>> {
    return this.handleApiCall(async () => {
      let query = (supabase as any).from(this.tableName).select('*', { count: 'exact' });

      // Apply filters
      if (filters?.search && filters.search.length > 0) {
        // This is a basic implementation - override in specific services for custom search
        query = query.ilike('name', `%${filters.search}%`);
      }

      // Apply sorting
      if (filters?.sortBy) {
        query = query.order(filters.sortBy, { 
          ascending: filters.sortOrder !== 'desc' 
        });
      }

      // Apply pagination
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query.range(from, to);

      const result = await query;
      
      if (result.error) return result;

      const totalCount = result.count || 0;
      const hasMore = to < totalCount - 1;

      return {
        data: {
          data: result.data,
          totalCount,
          page,
          pageSize,
          hasMore
        },
        error: null
      };
    }, 'getAll');
  }

  protected async getById<T>(id: string): Promise<ApiResponse<T>> {
    return this.handleApiCall(async () => {
      return (supabase as any)
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
    }, `getById(${id})`);
  }

  protected async create<T>(data: Partial<T>): Promise<ApiResponse<T>> {
    return this.handleApiCall(async () => {
      return (supabase as any)
        .from(this.tableName)
        .insert(data)
        .select()
        .single();
    }, 'create');
  }

  protected async update<T>(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.handleApiCall(async () => {
      return (supabase as any)
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
    }, `update(${id})`);
  }

  protected async delete(id: string): Promise<ApiResponse<void>> {
    return this.handleApiCall(async () => {
      const result = await (supabase as any)
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      return { data: undefined, error: result.error };
    }, `delete(${id})`);
  }

  // Hook for custom validation - override in specific services
  protected validate<T>(data: Partial<T>): FeatureError | null {
    return null;
  }

  // Hook for data transformation - override in specific services
  protected transform<T>(data: any): T {
    return data as T;
  }
}